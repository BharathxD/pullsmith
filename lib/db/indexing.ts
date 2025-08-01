import { eq, and } from "drizzle-orm";
import db from "./index";
import { fileHashes, merkleTrees, repositories } from "./schema";
import { nanoid } from "./schema/utils";
import { deleteFromVectorDatabase } from "./vector/utils";
import type { FileHashEntry, MerkleNode } from "../utils/crypto";

export const compareWithPreviousTree = async (
  repoUrl: string,
  baseBranch: string,
  previousMerkleRoot: string | undefined,
  currentMerkleRoot: string,
  fileEntries: FileHashEntry[]
): Promise<{
  repositoryRecord: { id: string };
  shouldIndex: boolean;
  changedFiles: string[];
  deletedFiles: string[];
}> => {
  try {
    let repositoryRecord = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.url, repoUrl),
        eq(repositories.baseBranch, baseBranch)
      ),
    });

    if (!repositoryRecord) {
      const newRepo = {
        id: nanoid(),
        url: repoUrl,
        name: `${repoUrl.split("/").pop() || "unknown"}-${baseBranch}`,
        baseBranch: baseBranch,
        currentMerkleRoot: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(repositories).values(newRepo);
      repositoryRecord = newRepo;
    }

    if (
      previousMerkleRoot === currentMerkleRoot ||
      repositoryRecord.currentMerkleRoot === currentMerkleRoot
    ) {
      return {
        repositoryRecord,
        shouldIndex: false,
        changedFiles: [],
        deletedFiles: [],
      };
    }

    const changedFiles: string[] = [];
    const deletedFiles: string[] = [];

    if (repositoryRecord.currentMerkleRoot) {
      const previousMerkleTree = await db.query.merkleTrees.findFirst({
        where: eq(merkleTrees.rootHash, repositoryRecord.currentMerkleRoot),
      });

      const previousFileHashes = previousMerkleTree
        ? await db.query.fileHashes.findMany({
            where: eq(fileHashes.merkleTreeId, previousMerkleTree.id),
          })
        : [];

      if (previousMerkleTree && previousFileHashes.length > 0) {
        const previousHashMap = new Map(
          previousFileHashes.map((fh) => [fh.filePath, fh.fileHash])
        );
        const currentFilePathSet = new Set(fileEntries.map((e) => e.filePath));

        for (const entry of fileEntries) {
          const previousHash = previousHashMap.get(entry.filePath);
          if (!previousHash || previousHash !== entry.fileHash) {
            changedFiles.push(entry.filePath);
          }
        }

        for (const previousFilePath of previousHashMap.keys()) {
          if (!currentFilePathSet.has(previousFilePath)) {
            deletedFiles.push(previousFilePath);
          }
        }

        if (deletedFiles.length > 0) {
          await deleteFromVectorDatabase(
            repositoryRecord.id,
            baseBranch,
            deletedFiles
          );
        }
      } else {
        changedFiles.push(...fileEntries.map((e) => e.filePath));
      }
    } else {
      changedFiles.push(...fileEntries.map((e) => e.filePath));
    }

    return {
      repositoryRecord,
      shouldIndex: changedFiles.length > 0 || deletedFiles.length > 0,
      changedFiles,
      deletedFiles,
    };
  } catch (error) {
    throw new Error(
      `Failed to compare with previous tree: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const updateDatabase = async (
  repositoryId: string,
  merkleRoot: string,
  merkleTree: MerkleNode,
  fileEntries: FileHashEntry[]
): Promise<void> => {
  try {
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

    if (fileEntries.length > 0) {
      const BATCH_SIZE = 100;

      for (let i = 0; i < fileEntries.length; i += BATCH_SIZE) {
        const batch = fileEntries.slice(i, i + BATCH_SIZE);

        await db.insert(fileHashes).values(
          batch.map((entry) => ({
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
    }

    await db
      .update(repositories)
      .set({
        currentMerkleRoot: merkleRoot,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));
  } catch (error) {
    console.error({ error });
    throw new Error(
      `Failed to update database: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const getRepositoryId = async (
  repoUrl: string,
  baseBranch: string
): Promise<string | null> => {
  try {
    const repositoryRecord = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.url, repoUrl),
        eq(repositories.baseBranch, baseBranch)
      ),
    });

    return repositoryRecord?.id || null;
  } catch (error) {
    throw new Error(
      `Failed to get repository ID: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const getOrCreateRepository = async (
  repoUrl: string,
  baseBranch: string
): Promise<{ id: string; previousMerkleRoot: string | null }> => {
  try {
    let repositoryRecord = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.url, repoUrl),
        eq(repositories.baseBranch, baseBranch)
      ),
    });

    if (!repositoryRecord) {
      const newRepo = {
        id: nanoid(),
        url: repoUrl,
        name: `${repoUrl.split("/").pop() || "unknown"}-${baseBranch}`,
        baseBranch: baseBranch,
        currentMerkleRoot: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(repositories).values(newRepo);
      repositoryRecord = newRepo;
    }

    return {
      id: repositoryRecord.id,
      previousMerkleRoot: repositoryRecord.currentMerkleRoot,
    };
  } catch (error) {
    throw new Error(
      `Failed to get or create repository: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
