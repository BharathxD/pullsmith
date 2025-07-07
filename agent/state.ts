import { Annotation } from "@langchain/langgraph";

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
export const StateAnnotation = Annotation.Root({
  // Input
  task: Annotation<string>,
  repoUrl: Annotation<string>,
  baseBranch: Annotation<string>,

  // Indexing stage
  indexedFiles: Annotation<IndexedFile[]>({
    value: (current, update) => update ?? current,
    default: () => [],
  }),
  isVectorDatabaseReady: Annotation<boolean>({
    value: (current, update) => update ?? current,
    default: () => false,
  }),
  merkleRoot: Annotation<string>({
    value: (current, update) => update ?? current,
    default: () => "",
  }),
  previousMerkleRoot: Annotation<string | undefined>,
  changedFiles: Annotation<string[]>({
    value: (current, update) => update ?? current,
    default: () => [],
  }),

  // Planning stage
  relevantFiles: Annotation<string[]>({
    value: (current, update) => update ?? current,
    default: () => [],
  }),
  plan: Annotation<PlanItem[]>({
    value: (current, update) => update ?? current,
    default: () => [],
  }),
  semanticMatches: Annotation<SemanticMatch[]>({
    value: (current, update) => update ?? current,
    default: () => [],
  }),

  // Sandbox stage
  sandboxId: Annotation<string>({
    value: (current, update) => update ?? current,
    default: () => "",
  }),
  isSandboxReady: Annotation<boolean>({
    value: (current, update) => update ?? current,
    default: () => false,
  }),

  // Editing stage
  editedFiles: Annotation<EditedFile[]>({
    value: (current, update) => update ?? current,
    default: () => [],
  }),
  isEditingComplete: Annotation<boolean>({
    value: (current, update) => update ?? current,
    default: () => false,
  }),

  // Git operations
  branchName: Annotation<string>({
    value: (current, update) => update ?? current,
    default: () => "",
  }),
  commitHash: Annotation<string>({
    value: (current, update) => update ?? current,
    default: () => "",
  }),
  prUrl: Annotation<string>({
    value: (current, update) => update ?? current,
    default: () => "",
  }),

  // Error handling
  errors: Annotation<string[]>({
    value: (current, update) => update ?? current,
    default: () => [],
  }),
  currentStep: Annotation<Step>({
    value: (current, update) => update ?? current,
    default: () => "indexing_complete" as Step,
  }),
});

export type GraphState = typeof StateAnnotation.State;
