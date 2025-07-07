import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "../clients/openai";
import type { EditedFile } from "@/agent/state";

const prSummarySchema = z.object({
  title: z.string().describe("Concise PR title describing the changes"),
  body: z
    .string()
    .describe("Detailed PR description with bullet points of changes"),
  summary: z.string().describe("One-line summary of what was accomplished"),
});

export const generatePrSummary = async (
  task: string,
  editedFiles: EditedFile[]
) => {
  const fileChanges = editedFiles
    .map(
      (file) =>
        `File: ${file.filePath}\nOriginal length: ${file.originalContent.length} chars\nNew length: ${file.newContent.length} chars`
    )
    .join("\n\n");

  const prompt = `Task: ${task}
    Files changed:
    ${fileChanges}

    Generate a pull request title and description that clearly explains what was done.`;

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: prSummarySchema,
    prompt,
  });

  return object;
};
