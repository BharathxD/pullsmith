import type { QdrantClient } from "@qdrant/js-client-rest";
import type { CodeChunk } from "../../utils/chunk";
import client from "@/lib/db/vector/qdrant";
import { randomUUID } from "node:crypto";

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
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
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
    throw new Error("Embeddings and chunks arrays must have the same length");
  }

  if (embeddings.length === 0) {
    return;
  }

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
        lineStart: chunk.lineStart,
        lineEnd: chunk.lineEnd,
        type: chunk.type,
        metadata: chunk.metadata,
        timestamp: new Date().toISOString(),
      },
    };
  });

  const upsertPromises = [];
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    upsertPromises.push(client.upsert(COLLECTION_NAME, { points: batch }));
  }

  await Promise.all(upsertPromises);
};
