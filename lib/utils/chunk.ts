import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { shouldProcessFile } from "./file";

export interface CodeChunk {
  content: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  type: "module";
  metadata: Record<string, unknown>;
}

export const chunkFile = (content: string, filePath: string): CodeChunk[] => {
  if (!content || !filePath) return [];

  const lines = content.split("\n");
  const totalLines = lines.length;
  const maxLinesPerChunk = 100;
  const chunks: CodeChunk[] = [];
  const fileExtension = extname(filePath);

  for (let i = 0; i < totalLines; i += maxLinesPerChunk) {
    const endIndex = Math.min(i + maxLinesPerChunk, totalLines);
    const chunkLines = lines.slice(i, endIndex);
    const chunkContent = chunkLines.join("\n");

    if (chunkContent.trim()) {
      chunks.push({
        content: chunkContent,
        filePath,
        lineStart: i + 1,
        lineEnd: endIndex,
        type: "module",
        metadata: {
          chunkIndex: Math.floor(i / maxLinesPerChunk),
          fileExtension,
          totalLines,
        },
      });
    }
  }

  return chunks;
};

export const prepareChunkForEmbedding = (chunk: CodeChunk): string => {
  if (!chunk?.content || !chunk?.filePath) return "";

  const prefix = `File: ${chunk.filePath}\n`;
  const metadataEntries = Object.entries(chunk.metadata);
  const metadataStr =
    metadataEntries.length > 0
      ? `Metadata: ${metadataEntries
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")}\n`
      : "";

  return prefix + metadataStr + chunk.content;
};

export const chunkFiles = async (
  repoPath: string,
  filePaths: string[]
): Promise<CodeChunk[]> => {
  // Process all files in parallel
  const chunkArrays = await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const fullPath = join(repoPath, filePath);
        const processResult = await shouldProcessFile(fullPath);

        if (!processResult.shouldProcess) {
          console.warn(
            `⚠️ Skipping file: ${filePath} - ${processResult.reason}`
          );
          return [];
        }

        const content = await readFile(fullPath, "utf-8");

        // Use simple line-based chunking for all files
        return chunkFile(content, filePath);
      } catch (error) {
        console.warn(`⚠️ Failed to chunk ${filePath}:`, error);
        return [];
      }
    })
  );

  return chunkArrays.flat();
};
