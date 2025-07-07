import { compareWithPreviousTree, updateDatabase } from "@/lib/db/indexing";
import {
  generateEmbeddings,
  storeInVectorDatabase,
} from "@/lib/db/vector/utils";
import { chunkFiles } from "@/lib/utils/chunk";
import { buildMerkleTree } from "@/lib/utils/crypto";
import { cloneRepository } from "@/lib/utils/git";
import { buildIndexedFilesResult } from "@/lib/utils/indexing";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { rm } from "node:fs/promises";
import type { GraphState } from "../state";

/**
 * INDEX CODEBASE NODE
 *
 * Clones repository, builds Merkle tree for incremental indexing,
 * chunks files using simple line-based approach, generates embeddings, and stores in vector database.
 * Language-agnostic: processes all text files the same way.
 */
export const indexCodebase = async (
  state: GraphState,
  config: LangGraphRunnableConfig
): Promise<Partial<GraphState>> => {
  let repoPath: string | undefined;

  try {
    const { repoPath: clonedPath } = await cloneRepository(
      state.repoUrl,
      state.baseBranch
    );
    repoPath = clonedPath;

    const { fileEntries, currentMerkleRoot, merkleTree } =
      await buildMerkleTree(repoPath);

    const { repositoryRecord, shouldIndex, changedFiles } =
      await compareWithPreviousTree(
        state.repoUrl,
        state.baseBranch,
        state.previousMerkleRoot,
        currentMerkleRoot,
        fileEntries
      );

    if (!shouldIndex) {
      return {
        merkleRoot: currentMerkleRoot,
        changedFiles: [],
        isVectorDatabaseReady: true,
        currentStep: "indexing_complete",
      };
    }

    const chunks = await chunkFiles(
      repoPath,
      changedFiles,
      repositoryRecord.id,
      state.repoUrl
    );

    const embeddings = await generateEmbeddings(chunks);

    await Promise.all([
      storeInVectorDatabase(embeddings, chunks, state.baseBranch),
      updateDatabase(
        repositoryRecord.id,
        currentMerkleRoot,
        merkleTree,
        fileEntries
      ),
    ]);

    const indexedFiles = await buildIndexedFilesResult(
      changedFiles,
      chunks,
      embeddings
    );

    return {
      indexedFiles,
      merkleRoot: currentMerkleRoot,
      changedFiles,
      isVectorDatabaseReady: true,
      currentStep: "indexing_complete",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      errors: [...(state.errors || []), `Indexing failed: ${errorMessage}`],
      currentStep: "indexing_failed",
    };
  } finally {
    if (repoPath) {
      rm(repoPath, { recursive: true, force: true }).catch((cleanupError) => {
        console.warn(
          `⚠️ Failed to cleanup temporary directory: ${cleanupError}`
        );
      });
    }
  }
};
