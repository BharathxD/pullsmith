import { compareWithPreviousTree, updateDatabase } from "@/lib/db/indexing";
import { generateEmbeddings } from "@/lib/utils/ai";
import { chunkFiles } from "@/lib/utils/chunk";
import { buildMerkleTree } from "@/lib/utils/crypto";
import { cloneRepository } from "@/lib/utils/git";
import { buildIndexedFilesResult } from "@/lib/utils/indexing";
import { storeInVectorDatabase, deleteFromVectorDatabase } from "@/lib/db/vector/utils";
import type { AgentState } from "../state";

/**
 * INDEX CODEBASE NODE
 *
 * Clones repository, builds Merkle tree for incremental indexing,
 * chunks files using simple line-based approach, generates embeddings, and stores in vector database.
 * Language-agnostic: processes all text files the same way.
 */
export const indexCodebase = async (
  state: AgentState
): Promise<Partial<AgentState>> => {
  console.log(`🔍 Starting codebase indexing for ${state.repoUrl}`);

  try {
    // Step 1: Clone repository
    const { repoPath } = await cloneRepository(state.repoUrl, state.baseBranch);

    // Step 2: Build current Merkle tree
    const { fileEntries, currentMerkleRoot, merkleTree } =
      await buildMerkleTree(repoPath);

    // Step 3: Compare with previous tree
    const { repositoryRecord, shouldIndex, changedFiles, deletedFiles } =
      await compareWithPreviousTree(
        state.repoUrl,
        state.previousMerkleRoot,
        currentMerkleRoot,
        fileEntries
      );

    if (!shouldIndex) {
      console.log("✅ Codebase unchanged, skipping indexing");
      return {
        merkleRoot: currentMerkleRoot,
        changedFiles: [],
        deletedFiles: [],
        isVectorDatabaseReady: true,
        currentStep: "indexing_complete",
      };
    }

    console.log(`📝 Found ${changedFiles.length} changed files to index`);
    if (deletedFiles.length > 0) {
      console.log(`🗑️  Found ${deletedFiles.length} deleted files to remove`);
    }

    // Step 4: Clean up deleted files from vector database
    if (deletedFiles.length > 0) {
      await deleteFromVectorDatabase(deletedFiles);
    }

    // Step 5: Chunk changed files
    const chunks = await chunkFiles(repoPath, changedFiles);

    // Step 6: Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // Step 7: Store in vector database
    await storeInVectorDatabase(embeddings, chunks);

    // Step 8: Update database with new Merkle tree
    await updateDatabase(
      repositoryRecord.id,
      currentMerkleRoot,
      merkleTree,
      fileEntries
    );

    // Step 9: Build indexed files result
    const indexedFiles = await buildIndexedFilesResult(
      changedFiles,
      chunks,
      embeddings
    );

    console.log(`✅ Successfully indexed ${indexedFiles.length} files`);
    if (deletedFiles.length > 0) {
      console.log(`✅ Successfully removed ${deletedFiles.length} deleted files`);
    }

    return {
      indexedFiles,
      merkleRoot: currentMerkleRoot,
      changedFiles,
      deletedFiles,
      isVectorDatabaseReady: true,
      currentStep: "indexing_complete",
    };
  } catch (error) {
    console.error("❌ Indexing failed:", error);
    return {
      errors: [
        ...(state.errors || []),
        `Indexing failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      currentStep: "indexing_failed",
    };
  }
};
