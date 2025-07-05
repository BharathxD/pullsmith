import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { prepareChunkForEmbedding, type CodeChunk } from "./chunk";
import { env } from "@/env";

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 50;

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const generateEmbeddings = async (
  chunks: CodeChunk[]
): Promise<number[][]> => {
  if (chunks.length === 0) return [];

  const contents = chunks.map(prepareChunkForEmbedding);
  const embeddings: number[][] = [];

  for (let i = 0; i < contents.length; i += BATCH_SIZE) {
    const batch = contents.slice(i, i + BATCH_SIZE);

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
      throw new Error(
        `Failed to generate embeddings for batch ${
          Math.floor(i / BATCH_SIZE) + 1
        }: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return embeddings;
};
