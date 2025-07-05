import { eq } from "drizzle-orm";
import db from "./index";
import { fileHashes, merkleTrees, repositories } from "./schema";
import { nanoid } from "./schema/utils";
import type { FileHashEntry, MerkleNode } from "../utils/crypto";

export const compareWithPreviousTree = async (
  repoUrl: string,
  previousMerkleRoot: string | undefined,
  currentMerkleRoot: string,
  fileEntries: FileHashEntry[]
): Promise<{
  repositoryRecord: { id: string };
  shouldIndex: boolean;
  changedFiles: string[];
}> => {
  // Get or create repository record
  let repositoryRecord = await db.query.repositories.findFirst({
    where: eq(repositories.url, repoUrl),
  });

  if (!repositoryRecord) {
    repositoryRecord = {
      id: nanoid(),
      url: repoUrl,
      name: repoUrl.split("/").pop() || "unknown",
      baseBranch: "main",
      currentMerkleRoot: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(repositories).values(repositoryRecord);
  }

  // Check if we need to index
  if (
    previousMerkleRoot === currentMerkleRoot ||
    repositoryRecord.currentMerkleRoot === currentMerkleRoot
  ) {
    return {
      repositoryRecord,
      shouldIndex: false,
      changedFiles: [],
    };
  }

  // Get changed files by comparing with previous file hashes
  const changedFiles: string[] = [];

  if (repositoryRecord.currentMerkleRoot) {
    // Get previous merkle tree
    const previousMerkleTree = await db.query.merkleTrees.findFirst({
      where: eq(merkleTrees.rootHash, repositoryRecord.currentMerkleRoot),
    });

    if (previousMerkleTree) {
      // Get file hashes for the previous merkle tree
      const previousFileHashes = await db.query.fileHashes.findMany({
        where: eq(fileHashes.merkleTreeId, previousMerkleTree.id),
      });

      const previousHashMap = new Map(
        previousFileHashes.map((fh) => [fh.filePath, fh.fileHash])
      );

      // Find changed or new files
      for (const entry of fileEntries) {
        const previousHash = previousHashMap.get(entry.filePath);
        if (!previousHash || previousHash !== entry.fileHash) {
          changedFiles.push(entry.filePath);
        }
      }
    } else {
      // No previous tree, index all files
      changedFiles.push(...fileEntries.map((e) => e.filePath));
    }
  } else {
    // No previous indexing, index all files
    changedFiles.push(...fileEntries.map((e) => e.filePath));
  }

  return {
    repositoryRecord,
    shouldIndex: changedFiles.length > 0,
    changedFiles,
  };
};

export const updateDatabase = async (
  repositoryId: string,
  merkleRoot: string,
  merkleTree: MerkleNode,
  fileEntries: FileHashEntry[]
): Promise<void> => {
  console.log("💾 Updating database with new Merkle tree");

  // Create new Merkle tree record
  const merkleTreeId = nanoid();
  await db.insert(merkleTrees).values({
    id: merkleTreeId,
    repositoryId,
    rootHash: merkleRoot,
    treeStructure: merkleTree,
    fileCount: fileEntries.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Insert file hashes
  if (fileEntries.length > 0) {
    await db.insert(fileHashes).values(
      fileEntries.map((entry) => ({
        id: nanoid(),
        merkleTreeId,
        filePath: entry.filePath,
        fileHash: entry.fileHash,
        fileSize: entry.fileSize,
        lastModified: entry.lastModified,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }

  // Update repository with new Merkle root
  await db
    .update(repositories)
    .set({
      currentMerkleRoot: merkleRoot,
      updatedAt: new Date(),
    })
    .where(eq(repositories.id, repositoryId));
}; 