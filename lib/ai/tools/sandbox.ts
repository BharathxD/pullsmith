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
    return {
      success: result.exitCode === 0,
      content: String(result.stdout || ""),
      error: result.exitCode !== 0 ? `${result.stderr}` : "",
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
      const result = await executeCommand(sandbox, "cat", [filePath]);
      return {
        success: result.success,
        content: result.content,
        error: result.success ? "" : `Failed to read file: ${result.error}`,
      };
    },
  }),

  listDirectory: tool({
    description: "List contents of a directory in the sandbox",
    parameters: z.object({
      path: z.string().describe("The directory path to list"),
    }),
    execute: async ({ path }) => {
      const result = await executeCommand(sandbox, "ls", ["-la", path]);
      return {
        success: result.success,
        content: result.content,
        error: result.success
          ? ""
          : `Failed to list directory: ${result.error}`,
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

  findFiles: tool({
    description: "Find files matching a pattern in the sandbox",
    parameters: z.object({
      pattern: z.string().describe("The file pattern to search for"),
      directory: z.string().optional().default("."),
      maxResults: z.number().optional().default(100),
    }),
    execute: async ({ pattern, directory, maxResults }) => {
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
      depth: z.number().optional().default(3),
      showHidden: z.boolean().optional().default(false),
    }),
    execute: async ({ depth, showHidden }) => {
      const args = [
        ".",
        "-type",
        "d",
        "-maxdepth",
        depth.toString(),
        "-not",
        "-path",
        "*/node_modules*",
        "-not",
        "-path",
        "*/target*",
        "-not",
        "-path",
        "*/.git*",
      ];

      if (!showHidden) {
        args.push("-not", "-path", "*/.*");
      }

      const result = await executeCommand(sandbox, "find", args);
      return {
        success: result.success,
        content: result.content,
        error: result.success ? "" : `Structure scan failed: ${result.error}`,
      };
    },
  }),

  searchInFiles: tool({
    description: "Search for text patterns within files using grep",
    parameters: z.object({
      pattern: z.string(),
      filePattern: z.string().optional().default("*"),
      directory: z.string().optional().default("."),
      recursive: z.boolean().optional().default(true),
      maxResults: z.number().optional().default(50),
      caseSensitive: z.boolean().optional().default(false),
    }),
    execute: async ({
      pattern,
      filePattern,
      directory,
      recursive,
      maxResults,
      caseSensitive,
    }) => {
      const args = [
        "-n",
        "--color=never",
        ...(recursive ? ["-r"] : []),
        ...(!caseSensitive ? ["-i"] : []),
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

  findSymbolDefinitions: tool({
    description:
      "Find where symbols (functions, classes, variables) are defined using advanced patterns",
    parameters: z.object({
      symbol: z.string(),
      fileTypes: z
        .array(z.string())
        .optional()
        .default(["js", "ts", "py", "go", "rs"]),
      language: z
        .enum(["javascript", "typescript", "python", "go", "rust", "all"])
        .optional()
        .default("all"),
    }),
    execute: async ({ symbol, fileTypes, language }) => {
      const patterns = {
        javascript: [
          `function\\s+${symbol}\\s*\\(`,
          `const\\s+${symbol}\\s*=`,
          `let\\s+${symbol}\\s*=`,
          `var\\s+${symbol}\\s*=`,
          `class\\s+${symbol}\\s*{`,
          `${symbol}\\s*:\\s*function`,
          `${symbol}\\s*:\\s*\\(`,
        ],
        typescript: [
          `function\\s+${symbol}\\s*\\(`,
          `const\\s+${symbol}\\s*=`,
          `let\\s+${symbol}\\s*=`,
          `interface\\s+${symbol}\\s*{`,
          `type\\s+${symbol}\\s*=`,
          `class\\s+${symbol}\\s*{`,
          `enum\\s+${symbol}\\s*{`,
        ],
        python: [
          `def\\s+${symbol}\\s*\\(`,
          `class\\s+${symbol}\\s*\\(`,
          `class\\s+${symbol}\\s*:`,
          `${symbol}\\s*=`,
        ],
        go: [
          `func\\s+${symbol}\\s*\\(`,
          `type\\s+${symbol}\\s+struct`,
          `type\\s+${symbol}\\s+interface`,
          `var\\s+${symbol}\\s`,
        ],
        rust: [
          `fn\\s+${symbol}\\s*\\(`,
          `struct\\s+${symbol}\\s*{`,
          `enum\\s+${symbol}\\s*{`,
          `trait\\s+${symbol}\\s*{`,
          `let\\s+${symbol}\\s*=`,
        ],
      };

      const searchPatterns =
        language === "all"
          ? Object.values(patterns).flat()
          : patterns[language as keyof typeof patterns] || [];

      const results = await Promise.all(
        searchPatterns.map(async (pattern) => {
          const args = [
            "-n",
            "--color=never",
            "-r",
            "-E",
            ...fileTypes.map((ext) => `--include=*.${ext}`),
            "--exclude-dir=node_modules",
            "--exclude-dir=.git",
            pattern,
            ".",
          ];

          const result = await executeCommand(sandbox, "grep", args);
          return result.exitCode === 0 && result.content
            ? `Pattern: ${pattern}\n${result.content}`
            : null;
        })
      );

      const content = results.filter(Boolean).join("\n---\n");
      return {
        success: true,
        content: content || "No symbol definitions found",
        error: "",
      };
    },
  }),

  findSymbolUsages: tool({
    description: "Find where symbols are used/imported across the codebase",
    parameters: z.object({
      symbol: z.string(),
      fileTypes: z
        .array(z.string())
        .optional()
        .default(["js", "ts", "py", "go", "rs"]),
      excludeDefinitions: z.boolean().optional().default(false),
      maxResults: z.number().optional().default(100),
    }),
    execute: async ({ symbol, fileTypes, excludeDefinitions, maxResults }) => {
      const args = [
        "-n",
        "--color=never",
        "-r",
        ...fileTypes.map((ext) => `--include=*.${ext}`),
        "--exclude-dir=node_modules",
        "--exclude-dir=.git",
        "--exclude-dir=target",
      ];

      if (excludeDefinitions) {
        args.push(
          "-v",
          "-E",
          `(function\\s+${symbol}\\s*\\(|const\\s+${symbol}\\s*=|class\\s+${symbol}\\s*\\{|def\\s+${symbol}\\s*\\()`
        );
      }

      args.push(symbol, ".");

      const result = await executeCommand(sandbox, "grep", args);

      if (result.exitCode !== 0 && result.exitCode !== 1) {
        return {
          success: false,
          content: "",
          error: `Symbol search failed: ${result.error}`,
        };
      }

      const { content, truncated } = truncateResults(
        result.content,
        maxResults
      );
      return {
        success: true,
        content: content || "No symbol usages found",
        error: truncated ? `Results truncated to ${maxResults} items` : "",
      };
    },
  }),

  analyzeImports: tool({
    description: "Analyze import/export patterns in the codebase",
    parameters: z.object({
      fileTypes: z.array(z.string()).optional().default(["js", "ts"]),
      includeExports: z.boolean().optional().default(true),
      maxResults: z.number().optional().default(50),
    }),
    execute: async ({ fileTypes, includeExports, maxResults }) => {
      const importPatterns = [
        "^import\\s+.*\\s+from",
        "^import\\s*\\{.*\\}\\s+from",
        "^import\\s+\\*\\s+as.*from",
        "^import\\s*\\(.*\\)",
        "^const\\s+.*=\\s*require\\s*\\(",
        "^const\\s+\\{.*\\}\\s*=\\s*require\\s*\\(",
      ];

      const exportPatterns = [
        "^export\\s+.*\\s+from",
        "^export\\s*\\{.*\\}",
        "^export\\s+default",
        "^export\\s+const",
        "^export\\s+function",
        "^export\\s+class",
        "^module\\.exports",
      ];

      const patterns = includeExports
        ? [...importPatterns, ...exportPatterns]
        : importPatterns;

      const results = await Promise.all(
        patterns.map(async (pattern) => {
          const args = [
            "-n",
            "--color=never",
            "-r",
            "-E",
            ...fileTypes.map((ext) => `--include=*.${ext}`),
            "--exclude-dir=node_modules",
            "--exclude-dir=.git",
            "--exclude-dir=target",
            pattern,
            ".",
          ];

          const result = await executeCommand(sandbox, "grep", args);
          if (result.exitCode === 0 && result.content) {
            const { content } = truncateResults(result.content, maxResults);
            return `Pattern: ${pattern}\n${content}`;
          }
          return null;
        })
      );

      const content = results.filter(Boolean).join("\n---\n");
      return {
        success: true,
        content: content || "No import/export patterns found",
        error: "",
      };
    },
  }),

  readMultipleFiles: tool({
    description: "Read multiple files efficiently to understand patterns",
    parameters: z.object({
      filePaths: z.array(z.string()),
      maxLines: z.number().optional().default(100),
      includeLineNumbers: z.boolean().optional().default(false),
    }),
    execute: async ({ filePaths, maxLines, includeLineNumbers }) => {
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

          const args = ["-n", maxLines.toString()];
          if (includeLineNumbers) {
            args.push("-n");
          }
          args.push(filePath);

          const result = await executeCommand(sandbox, "head", args);
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

  getGitInfo: tool({
    description: "Get git information about the repository",
    parameters: z.object({
      type: z.enum([
        "status",
        "recent-commits",
        "branches",
        "files-changed",
        "log",
      ]),
      limit: z.number().optional().default(10),
    }),
    execute: async ({ type, limit }) => {
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

  checkCommandAvailability: tool({
    description: "Check if specific commands are available in the sandbox",
    parameters: z.object({
      commands: z.array(z.string()),
    }),
    execute: async ({ commands }) => {
      const results = await Promise.all(
        commands.map(async (command) => {
          const result = await executeCommand(sandbox, "which", [command]);
          return result.exitCode === 0
            ? `${command}: Available at ${result.content.trim()}`
            : `${command}: Not available`;
        })
      );

      return {
        success: true,
        content: results.join("\n"),
        error: "",
      };
    },
  }),
});
