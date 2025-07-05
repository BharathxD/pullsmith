export type FileAction = "modify" | "create" | "delete";

export type Step =
  | "indexing_complete"
  | "indexing_failed"
  | "sandbox_ready"
  | "sandbox_failed"
  | "planning_complete"
  | "planning_failed"
  | "editing_complete"
  | "editing_failed"
  | "pr_created"
  | "pr_failed";

export interface FileChunk {
  content: string;
  metadata: Record<string, unknown>;
}

export interface IndexedFile {
  filePath: string;
  content: string;
  embeddingId: string;
  chunks: FileChunk[];
}

export interface PlanItem {
  action: FileAction;
  filePath: string;
  description: string;
  priority: number;
}

export interface EditedFile {
  filePath: string;
  originalContent: string;
  newContent: string;
}

export interface SemanticMatch {
  content: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  score: number;
  metadata: Record<string, unknown>;
}

export interface AgentState {
  // Input
  task: string;
  repoUrl: string;
  baseBranch: string;

  // Indexing stage
  indexedFiles: IndexedFile[];
  isVectorDatabaseReady: boolean;
  merkleRoot: string;
  previousMerkleRoot?: string;
  changedFiles: string[];

  // Planning stage
  relevantFiles: string[];
  plan: PlanItem[];
  semanticMatches: SemanticMatch[];

  // Sandbox stage
  sandboxId: string;
  isSandboxReady: boolean;
  sandboxInstance?: unknown; // Vercel Sandbox SDK instance

  // Editing stage
  editedFiles: EditedFile[];
  isEditingComplete: boolean;

  // Git operations
  branchName: string;
  commitHash: string;
  prUrl: string;

  // Error handling
  errors: string[];
  currentStep: Step;
}
