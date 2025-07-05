import { createOpenAI } from "@ai-sdk/openai";
import { embedMany, generateObject } from "ai";
import { prepareChunkForEmbedding, type CodeChunk } from "./chunk";
import { searchVectorDatabase } from "@/lib/db/vector/utils";
import { env } from "@/env";
import { z } from "zod";
import type { IndexedFile } from "@/agent/state";

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 50;

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const sandboxConfigSchema = z.object({
  runtime: z.enum(["node22", "python3.13"]),
  vcpus: z.number().min(0.5).max(8),
  ports: z.array(z.number()),
  timeoutMinutes: z.number().min(5).max(45),
});

export type SandboxConfig = z.infer<typeof sandboxConfigSchema>;

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

const validateInput = (value: string, name: string) => {
  if (!value?.trim()) {
    throw new Error(`${name} cannot be empty`);
  }
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

export const generateSandboxConfig = async (
  indexedFiles: IndexedFile[],
  task: string
): Promise<SandboxConfig> => {
  const projectFiles = indexedFiles
    .filter(
      (f) =>
        f.filePath.includes("package.json") ||
        f.filePath.includes("requirements.txt") ||
        f.filePath.includes("pyproject.toml") ||
        f.filePath.includes("go.mod") ||
        f.filePath.includes("Dockerfile")
    )
    .map((f) => ({ path: f.filePath, content: f.content.slice(0, 2000) }));

  try {
    const result = await generateObject({
      model: openai.chat("gpt-4.1-mini"),
      system: "Analyze the project and determine optimal Vercel Sandbox configuration.",
      prompt: `Project files: ${JSON.stringify(projectFiles, null, 2)}
      
      Task: ${task}

      Determine sandbox configuration for this project.`,
      schema: sandboxConfigSchema,
    });

    return result.object;
  } catch {
    return {
      runtime: "node22",
      vcpus: 1,
      ports: [3000],
      timeoutMinutes: 10,
    };
  }
};
