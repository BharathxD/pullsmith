import type { IndexedFile } from "@/agent/state";
import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "../clients/openai";

const sandboxConfigSchema = z.object({
  runtime: z.enum(["node22", "python3.13"]),
  vcpus: z.number().min(0.5).max(8),
  ports: z.array(z.number()),
  timeoutMinutes: z.number().min(5).max(45),
});

export type SandboxConfig = z.infer<typeof sandboxConfigSchema>;

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
      system:
        "Analyze the project and determine optimal Vercel Sandbox configuration.",
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
