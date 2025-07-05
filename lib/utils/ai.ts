import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { prepareChunkForEmbedding, type CodeChunk } from "./chunk";
import { searchVectorDatabase } from "@/lib/db/vector/utils";
import { env } from "@/env";

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

export const semanticSearch = async (
  query: string,
  repositoryId: string,
  limit = 10
) => {
  if (!query?.trim()) {
    throw new Error("Query cannot be empty");
  }

  if (!repositoryId?.trim()) {
    throw new Error("Repository ID cannot be empty");
  }

  const queryEmbedding = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: [query.trim()],
  });

  return await searchVectorDatabase(
    queryEmbedding.embeddings[0],
    repositoryId,
    limit
  );
};
