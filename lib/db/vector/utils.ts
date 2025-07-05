import client from "@/lib/db/vector/qdrant";
import type { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "node:crypto";
import type { CodeChunk } from "../../utils/chunk";

const COLLECTION_NAME = "pullsmith_codebase";
const VECTOR_SIZE = 1536;
const BATCH_SIZE = 100;

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
      await Promise.all([
        client.createCollection(COLLECTION_NAME, {
          vectors: {
            size: VECTOR_SIZE,
            distance: "Cosine",
          },
        }),
        client.createPayloadIndex(COLLECTION_NAME, {
          field_name: "repositoryId",
          field_schema: {
            type: "keyword",
            is_tenant: true,
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
  chunks: CodeChunk[]
): Promise<void> => {
  if (embeddings.length !== chunks.length) {
    throw new Error(
      `Embeddings count (${embeddings.length}) must match chunks count (${chunks.length})`
    );
  }

  if (embeddings.length === 0) return;

  await ensureCollectionExists(client);

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
        lineStart: chunk.lineStart,
        lineEnd: chunk.lineEnd,
        type: chunk.type,
        metadata: chunk.metadata,
        timestamp: new Date().toISOString(),
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
  limit = 10
) => {
  const results = await client.search(COLLECTION_NAME, {
    vector: queryVector,
    limit,
    filter: {
      must: [
        {
          key: "repositoryId",
          match: { value: repositoryId },
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
  deletedFilePaths: string[]
): Promise<void> => {
  if (deletedFilePaths.length === 0) return;

  await Promise.all(
    deletedFilePaths.map((filePath) =>
      client.delete(COLLECTION_NAME, {
        filter: {
          must: [
            {
              key: "repositoryId",
              match: { value: repositoryId },
            },
            {
              key: "filePath",
              match: { value: filePath },
            },
          ],
        },
      })
    )
  );
};
