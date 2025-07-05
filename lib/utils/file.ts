import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export const IGNORED_PATTERNS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".vercel",
  "dist",
  "build",
  "coverage",
  ".nyc_output",
  ".cache",
  ".tmp",
  ".temp",
  "__pycache__",
  ".pytest_cache",
  "venv",
  ".venv",
  "env",
  ".env",
  "target",
  "bin",
  "obj",
  ".gradle",
  ".DS_Store",
  "Thumbs.db",
]);

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BINARY_SAMPLE_SIZE = 8192;

type ShouldProcessFileResult = {
  shouldProcess: boolean;
  reason?: string;
};

export const getAllFiles = async (repoPath: string): Promise<string[]> => {
  const files: string[] = [];

  const walkDirectory = async (
    dir: string,
    relativePath = ""
  ): Promise<void> => {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = join(relativePath, entry.name);

        if (entry.isDirectory()) {
          if (IGNORED_PATTERNS.has(entry.name) || entry.name.startsWith(".")) {
            continue;
          }
          await walkDirectory(fullPath, relPath);
        } else if (entry.isFile()) {
          files.push(relPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  };

  await walkDirectory(repoPath);
  return files;
};

export const isBinaryContent = (buffer: Buffer): boolean => {
  const sampleSize = Math.min(buffer.length, BINARY_SAMPLE_SIZE);
  let controlByteCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];

    if (byte === 0) {
      controlByteCount++;
    } else if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      controlByteCount++;
    }
  }

  return controlByteCount / sampleSize > 0.01;
};

export const shouldProcessFile = async (
  fullPath: string
): Promise<ShouldProcessFileResult> => {
  try {
    const stats = await stat(fullPath);

    if (stats.size > MAX_FILE_SIZE) {
      return {
        shouldProcess: false,
        reason: `File too large: ${stats.size} bytes`,
      };
    }

    if (stats.size === 0) {
      return {
        shouldProcess: false,
        reason: "Empty file",
      };
    }

    const buffer = await readFile(fullPath);

    if (isBinaryContent(buffer)) {
      return {
        shouldProcess: false,
        reason: "Binary content detected",
      };
    }

    return { shouldProcess: true };
  } catch (error) {
    return {
      shouldProcess: false,
      reason: `Error reading file: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};
