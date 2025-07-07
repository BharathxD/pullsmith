import { nanoid } from "../db/schema/utils";
import type { CodeChunk } from "./chunk";
import type { GraphState } from "../../agent/state";

export const buildIndexedFilesResult = async (
  changedFiles: string[],
  chunks: CodeChunk[],
  embeddings: number[][]
): Promise<GraphState["indexedFiles"]> => {
  if (chunks.length !== embeddings.length) {
    throw new Error("Chunks and embeddings arrays must have the same length");
  }

  if (changedFiles.length === 0 || chunks.length === 0) {
    return [];
  }

  const changedFilesSet = new Set(changedFiles);
  const fileDataMap = new Map<
    string,
    { chunks: CodeChunk[]; embeddings: number[][] }
  >();

  chunks.forEach((chunk, index) => {
    if (!changedFilesSet.has(chunk.filePath)) return;

    const existing = fileDataMap.get(chunk.filePath);
    if (existing) {
      existing.chunks.push(chunk);
      existing.embeddings.push(embeddings[index]);
    } else {
      fileDataMap.set(chunk.filePath, {
        chunks: [chunk],
        embeddings: [embeddings[index]],
      });
    }
  });

  const indexedFiles: GraphState["indexedFiles"] = [];

  for (const [filePath, fileData] of fileDataMap) {
    const fileChunks = fileData.chunks.map((chunk, index) => ({
      content: chunk.content,
      metadata: {
        ...chunk.metadata,
        lineStart: chunk.lineStart,
        lineEnd: chunk.lineEnd,
        type: chunk.type,
        embedding: fileData.embeddings[index],
      },
    }));

    indexedFiles.push({
      filePath,
      content: fileData.chunks.map((c) => c.content).join("\n\n"),
      embeddingId: nanoid(),
      chunks: fileChunks,
    });
  }

  return indexedFiles;
};
