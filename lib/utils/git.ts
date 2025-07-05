import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { simpleGit, type SimpleGit } from "simple-git";
import { nanoid } from "../db/schema/utils";

export const cloneRepository = async (
  repoUrl: string,
  baseBranch: string
): Promise<{ git: SimpleGit; repoPath: string }> => {
  if (!repoUrl?.trim() || !baseBranch?.trim()) {
    throw new Error("Repository URL and base branch are required");
  }

  const tempDir = join(process.cwd(), ".tmp", "repos", nanoid());

  try {
    await mkdir(tempDir, { recursive: true });

    const git = simpleGit();
    await git.clone(repoUrl, tempDir, [
      "--depth",
      "1",
      "--branch",
      baseBranch,
      "--single-branch",
      "--no-tags",
    ]);

    return { git: simpleGit(tempDir), repoPath: tempDir };
  } catch (error) {
    throw new Error(
      `Failed to clone repository: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
