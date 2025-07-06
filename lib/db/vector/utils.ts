import { env } from "@/env";
import client from "@/lib/db/vector/qdrant";
import { validateInput } from "@/lib/utils";
import { createOpenAI } from "@ai-sdk/openai";
import type { QdrantClient } from "@qdrant/js-client-rest";
import { embedMany } from "ai";
import { randomUUID } from "node:crypto";
import { prepareChunkForEmbedding, type CodeChunk } from "../../utils/chunk";

const COLLECTION_NAME = "pullsmith_codebase";
const VECTOR_SIZE = 1536;
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 50;

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const generateEmbeddings = async (
  chunks: CodeChunk[]
): Promise<number[][]> => {
  if (!chunks?.length) return [];

  const contents = chunks.map(prepareChunkForEmbedding);
  const embeddings: number[][] = [];

  for (let i = 0; i < contents.length; i += BATCH_SIZE) {
    const batch = contents.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const result = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: batch,
      });

      embeddings.push(...result.embeddings);

      if (i + BATCH_SIZE < contents.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to generate embeddings for batch ${batchNumber}: ${message}`
      );
    }
  }

  return embeddings;
};

export const ensureCollectionExists = async (
  client: QdrantClient
): Promise<void> => {
  try {
    await client.getCollection(COLLECTION_NAME);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404
    ) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });

      await Promise.all([
        client.createPayloadIndex(COLLECTION_NAME, {
          field_name: "repositoryId",
          field_schema: {
            type: "keyword",
            is_tenant: true,
          },
        }),
        client.createPayloadIndex(COLLECTION_NAME, {
          field_name: "baseBranch",
          field_schema: {
            type: "keyword",
          },
        }),
      ]);

      return;
    }
    throw error;
  }
};

export const storeInVectorDatabase = async (
  embeddings: number[][],
  chunks: CodeChunk[],
  baseBranch: string
): Promise<void> => {
  if (embeddings.length !== chunks.length) {
    throw new Error(
      `Embeddings count (${embeddings.length}) must match chunks count (${chunks.length})`
    );
  }

  if (embeddings.length === 0) return;

  await ensureCollectionExists(client);

  const timestamp = new Date().toISOString();
  const points = embeddings.map((embedding, index) => {
    const chunk = chunks[index];
    if (!chunk) {
      throw new Error(`Missing chunk at index ${index}`);
    }

    return {
      id: randomUUID(),
      vector: embedding,
      payload: {
        content: chunk.content,
        filePath: chunk.filePath,
        repositoryId: chunk.repositoryId,
        repositoryUrl: chunk.repositoryUrl,
        baseBranch,
        lineStart: chunk.lineStart,
        lineEnd: chunk.lineEnd,
        type: chunk.type,
        metadata: chunk.metadata,
        timestamp,
      },
    };
  });

  const batches = [];
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    batches.push(points.slice(i, i + BATCH_SIZE));
  }

  await Promise.all(
    batches.map((batch) => client.upsert(COLLECTION_NAME, { points: batch }))
  );
};

export const searchVectorDatabase = async (
  queryVector: number[],
  repositoryId: string,
  baseBranch: string,
  limit = 10
) => {
  if (!queryVector.length || !repositoryId || !baseBranch) {
    throw new Error("Invalid search parameters");
  }

  const results = await client.search(COLLECTION_NAME, {
    vector: queryVector,
    limit,
    filter: {
      must: [
        {
          key: "repositoryId",
          match: { value: repositoryId },
        },
        {
          key: "baseBranch",
          match: { value: baseBranch },
        },
      ],
    },
    with_payload: true,
  });

  return results.map((result) => ({
    id: result.id,
    score: result.score,
    payload: result.payload,
  }));
};

export const deleteFromVectorDatabase = async (
  repositoryId: string,
  baseBranch: string,
  deletedFilePaths: string[]
): Promise<void> => {
  if (!deletedFilePaths.length || !repositoryId || !baseBranch) return;

  const deletePromises = deletedFilePaths.map((filePath) =>
    client.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: "repositoryId",
            match: { value: repositoryId },
          },
          {
            key: "baseBranch",
            match: { value: baseBranch },
          },
          {
            key: "filePath",
            match: { value: filePath },
          },
        ],
      },
    })
  );

  await Promise.all(deletePromises);
};

export const semanticSearch = async (
  query: string,
  repositoryId: string,
  baseBranch: string,
  limit = 10
) => {
  validateInput(query, "Query");
  validateInput(repositoryId, "Repository ID");
  validateInput(baseBranch, "Base branch");

  const queryEmbedding = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: [query.trim()],
  });

  return await searchVectorDatabase(
    queryEmbedding.embeddings[0],
    repositoryId,
    baseBranch,
    limit
  );
};
