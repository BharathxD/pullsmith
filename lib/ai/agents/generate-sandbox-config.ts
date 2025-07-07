import type { IndexedFile } from "@/agent/state";
import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "../clients/openai";

const sandboxConfigSchema = z.object({
  runtime: z.enum(["node22", "python3.13"]),
  vcpus: z.number().int().min(2).max(8),
  ports: z.array(z.number().int().positive()),
  timeoutMinutes: z.number().int().min(15).max(45),
});

export type SandboxConfig = z.infer<typeof sandboxConfigSchema>;

const CONFIG_FILES = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "Dockerfile",
];

const DEFAULT_CONFIG: SandboxConfig = {
  runtime: "node22",
  vcpus: 2,
  ports: [3000],
  timeoutMinutes: 10,
};

export const generateSandboxConfig = async (
  indexedFiles: IndexedFile[],
  task: string
): Promise<SandboxConfig> => {
  const projectFiles = indexedFiles
    .filter((f) => CONFIG_FILES.some((config) => f.filePath.includes(config)))
    .map((f) => ({ path: f.filePath, content: f.content.slice(0, 2000) }));

  try {
    const result = await generateObject({
      model: openai.chat("gpt-4.1-mini"),
      system: `You are a DevOps expert analyzing project configurations to determine optimal Vercel Sandbox settings. 
      
      Consider the following factors:
      - Project type and runtime requirements (Node.js, Python, etc.)
      - Resource needs based on project complexity
      - Port requirements for web servers, APIs, databases
      - Task complexity and estimated execution time
      
      Provide integer values only - no decimals allowed for vcpus, ports, and timeoutMinutes.
      
      VERCEL SANDBOX LIMITS:
      - Maximum 8 vCPUs per sandbox (2 GB memory per vCPU)
      - Maximum 45 minutes runtime duration
      - Supports Node.js and Python runtimes`,
      prompt: `Analyze this project configuration and task to determine optimal sandbox settings:

      PROJECT FILES:
      ${JSON.stringify(projectFiles, null, 2)}

      TASK TO EXECUTE:
      ${task}

      CONFIGURATION GUIDELINES:
      - Runtime: Choose "node22" for JavaScript/TypeScript projects, "python3.13" for Python projects
      - vCPUs: 2 for simple tasks, 3-4 for medium complexity, 5-8 for compute-intensive tasks (min 2, max 8 vCPUs)
      - Ports: Include common ports like 3000 for Next.js, 8000 for Python web servers, plus any specific ports needed
      - Timeout: 5-10 minutes for simple tasks, 15-30 for medium complexity, 30-45 for complex builds/deployments (max 45 minutes)

      Consider the project structure, dependencies, and task complexity to make optimal choices within Vercel's resource limits.`,
      schema: sandboxConfigSchema,
    });

    return result.object;
  } catch {
    return DEFAULT_CONFIG;
  }
};
