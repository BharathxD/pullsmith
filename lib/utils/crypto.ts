import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { getAllFiles } from "./file";

export interface FileHashEntry {
  filePath: string;
  fileHash: string;
  fileSize: number;
  lastModified: Date;
}

export interface MerkleNode {
  hash: string;
  children?: MerkleNode[];
  filePath?: string;
}

export const buildMerkleTreeFromEntries = (
  fileEntries: FileHashEntry[]
): MerkleNode => {
  if (!fileEntries?.length) {
    return { hash: createHash("sha256").update("").digest("hex") };
  }

  if (fileEntries.length === 1) {
    return {
      hash: fileEntries[0].fileHash,
      filePath: fileEntries[0].filePath,
    };
  }

  const sortedEntries = fileEntries
    .slice()
    .sort((a, b) => a.filePath.localeCompare(b.filePath));

  let nodes: MerkleNode[] = sortedEntries.map((entry) => ({
    hash: entry.fileHash,
    filePath: entry.filePath,
  }));

  while (nodes.length > 1) {
    const nextLevel: MerkleNode[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1];

      if (right) {
        const leftHash = Buffer.from(left.hash, "hex");
        const rightHash = Buffer.from(right.hash, "hex");
        const combinedHash = createHash("sha256")
          .update(Buffer.concat([leftHash, rightHash]))
          .digest("hex");

        nextLevel.push({
          hash: combinedHash,
          children: [left, right],
        });
      } else {
        nextLevel.push(left);
      }
    }

    nodes = nextLevel;
  }

  return nodes[0];
};

export const createContentHash = (content: Buffer | string): string =>
  createHash("sha256")
    .update(content || "")
    .digest("hex");

export const createFileHashEntry = (
  filePath: string,
  content: Buffer,
  stats: { size: number; mtime: Date }
): FileHashEntry => {
  if (!filePath || !content || !stats) {
    throw new Error("Invalid parameters for file hash entry");
  }

  return {
    filePath,
    fileHash: createContentHash(content),
    fileSize: stats.size,
    lastModified: stats.mtime,
  };
};

export const buildMerkleTree = async (
  repoPath: string
): Promise<{
  fileEntries: FileHashEntry[];
  currentMerkleRoot: string;
  merkleTree: MerkleNode;
}> => {
  // Get all files (language-agnostic)
  const files = await getAllFiles(repoPath);

  // Process all files in parallel
  const fileEntries = await Promise.all(
    files.map(async (filePath) => {
      const fullPath = join(repoPath, filePath);
      const [content, stats] = await Promise.all([
        readFile(fullPath),
        stat(fullPath),
      ]);

      return createFileHashEntry(filePath, content, stats);
    })
  );

  // Sort for consistent tree construction
  fileEntries.sort((a, b) => a.filePath.localeCompare(b.filePath));

  // Build Merkle tree
  const merkleTree = buildMerkleTreeFromEntries(fileEntries);
  const currentMerkleRoot = merkleTree.hash;

  return { fileEntries, currentMerkleRoot, merkleTree };
};
