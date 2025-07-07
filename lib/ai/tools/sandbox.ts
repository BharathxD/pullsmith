import { tool } from "ai";
import { z } from "zod";
import type { Sandbox } from "@vercel/sandbox";

const executeCommand = async (
  sandbox: Sandbox,
  cmd: string,
  args: string[] = []
) => {
  try {
    const result = await sandbox.runCommand({ cmd, args });
    const stdout = await result.stdout();
    const stderr = await result.stderr();

    return {
      success: result.exitCode === 0,
      content: String(stdout || ""),
      error: result.exitCode !== 0 ? String(stderr || "") : "",
      exitCode: result.exitCode,
    };
  } catch (error) {
    return {
      success: false,
      content: "",
      error: error instanceof Error ? error.message : String(error),
      exitCode: -1,
    };
  }
};

const truncateResults = (
  content: string,
  maxLines: number
): { content: string; truncated: boolean } => {
  const lines = content.split("\n").filter((line) => line.trim());
  return {
    content: lines.slice(0, maxLines).join("\n"),
    truncated: lines.length > maxLines,
  };
};

export const createSandboxTools = (sandbox: Sandbox) => ({
  readFile: tool({
    description: "Read the contents of a file in the sandbox",
    parameters: z.object({
      filePath: z.string().describe("The path to the file to read"),
    }),
    execute: async ({ filePath }) => {
      let safeFilePath = filePath;
      if (
        !safeFilePath.startsWith("/") &&
        !safeFilePath.startsWith("./") &&
        !safeFilePath.startsWith("../")
      ) {
        safeFilePath = `./${safeFilePath}`;
      }
      const result = await executeCommand(sandbox, "cat", [safeFilePath]);
      return {
        success: result.success,
        content: result.content,
        error: result.success ? "" : `Failed to read file: ${result.error}`,
      };
    },
  }),

  writeFile: tool({
    description: "Write content to a file in the sandbox",
    parameters: z.object({
      filePath: z.string(),
      content: z.string(),
    }),
    execute: async ({ filePath, content }) => {
      console.log("Writing file:", filePath);
      const result = await executeCommand(sandbox, "bash", [
        "-c",
        `cat > "${filePath}" << 'EOF'\n${content}\nEOF`,
      ]);

      if (!result.success) {
        console.error("Failed to write file:", result.error);
      }
      console.info("File written successfully to sandbox");

      return {
        success: result.success,
        content: result.success ? `Written: ${filePath}` : "",
        error: result.success ? "" : result.error,
      };
    },
  }),

  deleteFile: tool({
    description: "Delete a file from the sandbox",
    parameters: z.object({
      filePath: z.string(),
    }),
    execute: async ({ filePath }) => {
      const result = await executeCommand(sandbox, "rm", ["-f", filePath]);
      return {
        success: result.success,
        content: result.success ? `Deleted: ${filePath}` : "",
        error: result.success ? "" : result.error,
      };
    },
  }),

  validateFile: tool({
    description: "Validate file syntax and compilation",
    parameters: z.object({
      filePath: z.string(),
      language: z
        .enum(["typescript", "javascript", "python", "go", "rust", "auto"])
        .optional()
        .default("auto"),
    }),
    execute: async ({ filePath, language = "auto" }) => {
      const ext = filePath.split(".").pop()?.toLowerCase();
      const lang =
        language === "auto"
          ? ext === "ts" || ext === "tsx"
            ? "typescript"
            : ext === "js" || ext === "jsx"
            ? "javascript"
            : ext === "py"
            ? "python"
            : ext === "go"
            ? "go"
            : ext === "rs"
            ? "rust"
            : "unknown"
          : language;

      const commands = {
        typescript: ["node", "--check", filePath],
        javascript: ["node", "--check", filePath],
        python: ["python", "-m", "py_compile", filePath],
        go: ["go", "build", "-o", "/dev/null", filePath],
        rust: ["rustc", "--emit=dep-info", filePath],
      };

      const command = commands[lang as keyof typeof commands];
      if (!command) {
        return {
          success: false,
          content: "",
          error: `Unsupported language: ${lang}`,
        };
      }

      const result = await executeCommand(
        sandbox,
        command[0],
        command.slice(1)
      );
      return {
        success: result.success,
        content: result.success ? `Valid: ${filePath}` : "",
        error: result.success ? "" : result.error,
      };
    },
  }),

  listDirectory: tool({
    description: "List contents of a directory in the sandbox",
    parameters: z.object({
      path: z.string().describe("The directory path to list").optional(),
    }),
    execute: async ({ path }) => {
      const targetPath = path || ".";
      const result = await executeCommand(sandbox, "ls", ["-la", targetPath]);
      return {
        success: result.success,
        content: result.content,
        error: result.success
          ? ""
          : `Failed to list directory: ${result.error}`,
      };
    },
  }),

  findFiles: tool({
    description: "Find files matching a pattern in the sandbox",
    parameters: z.object({
      pattern: z.string().describe("The file pattern to search for"),
      directory: z
        .string()
        .describe("The directory to search in")
        .optional()
        .default("."),
      maxResults: z
        .number()
        .describe("Maximum number of results to return")
        .optional()
        .default(100),
    }),
    execute: async ({ pattern, directory = ".", maxResults = 100 }) => {
      const result = await executeCommand(sandbox, "find", [
        directory,
        "-name",
        pattern,
        "-type",
        "f",
      ]);

      if (!result.success) {
        return {
          success: false,
          content: "",
          error: `Find failed: ${result.error}`,
        };
      }

      const { content, truncated } = truncateResults(
        result.content,
        maxResults
      );
      return {
        success: true,
        content,
        error: truncated ? `Results truncated to ${maxResults} items` : "",
      };
    },
  }),

  searchInFiles: tool({
    description: "Search for text patterns within files using grep",
    parameters: z.object({
      pattern: z.string().describe("The text pattern to search for"),
      filePattern: z
        .string()
        .describe("File pattern to include in search")
        .optional()
        .default("*"),
      directory: z
        .string()
        .describe("Directory to search in")
        .optional()
        .default("."),
      maxResults: z
        .number()
        .describe("Maximum number of results")
        .optional()
        .default(50),
    }),
    execute: async ({
      pattern,
      filePattern = "*",
      directory = ".",
      maxResults = 50,
    }) => {
      const args = [
        "-n",
        "--color=never",
        "-r",
        "-i",
        `--include=${filePattern}`,
        "--exclude-dir=node_modules",
        "--exclude-dir=.git",
        "--exclude-dir=target",
        pattern,
        directory,
      ];

      const result = await executeCommand(sandbox, "grep", args);

      if (result.exitCode !== 0 && result.exitCode !== 1) {
        return {
          success: false,
          content: "",
          error: `Search failed: ${result.error}`,
        };
      }

      const { content, truncated } = truncateResults(
        result.content,
        maxResults
      );
      return {
        success: true,
        content,
        error: truncated ? `Results truncated to ${maxResults} items` : "",
      };
    },
  }),

  runCommand: tool({
    description: "Run a command in the sandbox",
    parameters: z.object({
      command: z.string().describe("Command to run"),
      args: z
        .array(z.string())
        .describe("Command arguments")
        .optional()
        .default([]),
    }),
    execute: async ({ command, args = [] }) => {
      const result = await executeCommand(sandbox, command, args);
      return {
        success: result.success,
        content: result.content,
        error: result.error,
      };
    },
  }),

  checkDependencies: tool({
    description: "Check project dependencies and configuration files",
    parameters: z.object({
      type: z.enum(["node", "python", "go", "rust", "all"]),
    }),
    execute: async ({ type }) => {
      const configs = {
        node: [
          "package.json",
          "package-lock.json",
          "yarn.lock",
          "pnpm-lock.yaml",
        ],
        python: ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile"],
        go: ["go.mod", "go.sum"],
        rust: ["Cargo.toml", "Cargo.lock"],
      };

      const filesToCheck =
        type === "all"
          ? Object.values(configs).flat()
          : configs[type as keyof typeof configs] || [];

      const results = await Promise.all(
        filesToCheck.map(async (file) => {
          const result = await executeCommand(sandbox, "cat", [file]);
          return result.exitCode === 0
            ? `=== ${file} ===\n${result.content}`
            : null;
        })
      );

      const content = results.filter(Boolean).join("\n\n");
      return {
        success: true,
        content: content || "No configuration files found",
        error: "",
      };
    },
  }),

  getProjectStructure: tool({
    description: "Get a tree view of the project structure",
    parameters: z.object({
      depth: z
        .number()
        .describe("Maximum depth to traverse")
        .optional()
        .default(3),
    }),
    execute: async ({ depth = 3 }) => {
      const result = await executeCommand(sandbox, "find", [
        ".",
        "-type",
        "f",
        "-maxdepth",
        depth.toString(),
        "-not",
        "-path",
        "*/node_modules/*",
        "-not",
        "-path",
        "*/target/*",
        "-not",
        "-path",
        "*/.git/*",
      ]);

      return {
        success: result.success,
        content: result.content,
        error: result.success ? "" : `Structure scan failed: ${result.error}`,
      };
    },
  }),

  readMultipleFiles: tool({
    description: "Read multiple files efficiently to understand patterns",
    parameters: z.object({
      filePaths: z.array(z.string()).describe("Array of file paths to read"),
      maxLines: z
        .number()
        .describe("Maximum lines to read per file")
        .optional()
        .default(100),
    }),
    execute: async ({ filePaths, maxLines = 100 }) => {
      const maxFiles = 10;
      const files = filePaths.slice(0, maxFiles);

      const results = await Promise.all(
        files.map(async (filePath) => {
          const checkResult = await executeCommand(sandbox, "test", [
            "-f",
            filePath,
          ]);
          if (checkResult.exitCode !== 0) {
            return `=== ${filePath} ===\nError: File not found`;
          }

          const result = await executeCommand(sandbox, "head", [
            "-n",
            maxLines.toString(),
            filePath,
          ]);
          return `=== ${filePath} ===\n${
            result.exitCode === 0 ? result.content : `Error: ${result.error}`
          }`;
        })
      );

      return {
        success: true,
        content: results.join("\n\n"),
        error:
          filePaths.length > maxFiles ? `Limited to ${maxFiles} files` : "",
      };
    },
  }),

  getCurrentDirectory: tool({
    description: "Get the current working directory in the sandbox",
    parameters: z.object({}),
    execute: async () => {
      const result = await executeCommand(sandbox, "pwd");
      return {
        success: result.success,
        content: result.content.trim(),
        error: result.error,
      };
    },
  }),

  getGitInfo: tool({
    description: "Get git information about the repository",
    parameters: z.object({
      type: z
        .enum(["status", "recent-commits", "branches", "files-changed", "log"])
        .describe("Type of git information to retrieve"),
      limit: z
        .number()
        .describe("Limit for results that support it")
        .optional()
        .default(10),
    }),
    execute: async ({ type, limit = 10 }) => {
      const commands = {
        status: ["status", "--porcelain"],
        "recent-commits": ["log", "--oneline", `-${limit}`],
        branches: ["branch", "-a"],
        "files-changed": ["diff", "--name-only", "HEAD~1", "HEAD"],
        log: ["log", "--oneline", "--graph", `-${limit}`],
      };

      const args = commands[type];
      const result = await executeCommand(sandbox, "git", args);

      return {
        success: result.success,
        content: result.content,
        error: result.success ? "" : `Git command failed: ${result.error}`,
      };
    },
  }),
});
