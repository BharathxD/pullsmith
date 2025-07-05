import {
  boolean,
  index,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { timestamps } from "./utils";
import { repositories } from "./repositories";

export const agentRuns = mysqlTable(
  "agent_runs",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    repositoryId: varchar("repository_id", { length: 255 })
      .notNull()
      .references(() => repositories.id),
    task: text("task").notNull(),
    currentStep: varchar("current_step", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).default("running"),
    merkleRoot: varchar("merkle_root", { length: 64 }),
    sandboxId: varchar("sandbox_id", { length: 100 }),
    branchName: varchar("branch_name", { length: 255 }),
    prUrl: varchar("pr_url", { length: 512 }),
    commitHash: varchar("commit_hash", { length: 40 }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    ...timestamps,
  },
  (table) => [
    index("idx_repository_status").on(table.repositoryId, table.status),
    index("idx_agent_runs_started_at").on(table.startedAt),
    index("idx_agent_runs_completed_at").on(table.completedAt),
  ]
);

export const planItems = mysqlTable(
  "plan_items",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    description: text("description"),
    priority: int("priority").default(0),
    status: varchar("status", { length: 20 }).default("pending"),
    executedAt: timestamp("executed_at"),
    ...timestamps,
  },
  (table) => [
    index("idx_plan_agent_run").on(table.agentRunId),
    index("idx_plan_status").on(table.status),
  ]
);

export const editedFiles = mysqlTable(
  "edited_files",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    planItemId: varchar("plan_item_id", { length: 255 }).references(
      () => planItems.id
    ),
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    originalContent: text("original_content"),
    newContent: text("new_content"),
    contentHash: varchar("content_hash", { length: 64 }),
    editedAt: timestamp("edited_at").notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index("idx_edited_agent_run").on(table.agentRunId),
    index("idx_edited_plan_item").on(table.planItemId),
  ]
);

export const pullRequests = mysqlTable(
  "pull_requests",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    prNumber: int("pr_number"),
    prUrl: varchar("pr_url", { length: 512 }),
    title: varchar("title", { length: 255 }),
    body: text("body"),
    baseBranch: varchar("base_branch", { length: 100 }),
    headBranch: varchar("head_branch", { length: 100 }),
    status: varchar("status", { length: 20 }).default("open"),
    mergedAt: timestamp("merged_at"),
    ...timestamps,
  },
  (table) => [
    index("idx_pr_agent_run").on(table.agentRunId),
    index("idx_pr_status").on(table.status),
  ]
);

export const agentErrors = mysqlTable(
  "agent_errors",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    step: varchar("step", { length: 50 }).notNull(),
    errorType: varchar("error_type", { length: 100 }),
    errorMessage: text("error_message").notNull(),
    errorDetails: json("error_details"),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index("idx_error_agent_run").on(table.agentRunId),
    index("idx_error_step").on(table.step),
    index("idx_error_occurred_at").on(table.occurredAt),
  ]
);

export const indexedFiles = mysqlTable(
  "indexed_files",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    fileHash: varchar("file_hash", { length: 64 }).notNull(),
    chunkCount: int("chunk_count").default(0),
    embeddingStored: boolean("embedding_stored").default(false),
    indexedAt: timestamp("indexed_at").notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index("idx_indexed_agent_run").on(table.agentRunId),
    index("idx_indexed_file_hash").on(table.fileHash),
    index("idx_indexed_files_embedding").on(table.embeddingStored),
  ]
);

export const semanticSearches = mysqlTable(
  "semantic_searches",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    queryText: text("query_text").notNull(),
    relevantFiles: json("relevant_files"), // Array of file paths
    similarityScores: json("similarity_scores"), // Qdrant results
    searchedAt: timestamp("searched_at").notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [index("idx_semantic_agent_run").on(table.agentRunId)]
);
