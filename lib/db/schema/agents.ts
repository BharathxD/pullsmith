import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./utils";
import { repositories } from "./repositories";
import { sandboxInstances } from "./sandbox";

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    repositoryId: varchar("repository_id", { length: 255 })
      .notNull()
      .references(() => repositories.id),
    task: text("task").notNull(),
    runId: varchar("run_id", { length: 255 }).notNull(),
    assistantId: varchar("assistant_id", { length: 255 }).notNull(),
    threadId: varchar("thread_id", { length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("idx_repository_agent_run").on(table.repositoryId),
    index("idx_agent_runs_thread_id").on(table.threadId),
  ]
);

export const planItems = pgTable(
  "plan_items",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    description: text("description"),
    priority: integer("priority").default(0),
    status: varchar("status", { length: 20 }).default("pending"),
    executedAt: timestamp("executed_at"),
    ...timestamps,
  },
  (table) => [
    index("idx_plan_agent_run").on(table.agentRunId),
    index("idx_plan_status").on(table.status),
  ]
);

export const editedFiles = pgTable(
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

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    prNumber: integer("pr_number"),
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

export const agentErrors = pgTable(
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

export const indexedFiles = pgTable(
  "indexed_files",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    fileHash: varchar("file_hash", { length: 64 }).notNull(),
    chunkCount: integer("chunk_count").default(0),
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

export const semanticSearches = pgTable(
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

export const agentRunsRelations = relations(agentRuns, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [agentRuns.repositoryId],
    references: [repositories.id],
  }),
  planItems: many(planItems),
  editedFiles: many(editedFiles),
  pullRequests: many(pullRequests),
  agentErrors: many(agentErrors),
  indexedFiles: many(indexedFiles),
  semanticSearches: many(semanticSearches),
  sandboxInstances: many(sandboxInstances),
}));

export const planItemsRelations = relations(planItems, ({ one, many }) => ({
  agentRun: one(agentRuns, {
    fields: [planItems.agentRunId],
    references: [agentRuns.id],
  }),
  editedFiles: many(editedFiles),
}));

export const editedFilesRelations = relations(editedFiles, ({ one }) => ({
  agentRun: one(agentRuns, {
    fields: [editedFiles.agentRunId],
    references: [agentRuns.id],
  }),
  planItem: one(planItems, {
    fields: [editedFiles.planItemId],
    references: [planItems.id],
  }),
}));

export const pullRequestsRelations = relations(pullRequests, ({ one }) => ({
  agentRun: one(agentRuns, {
    fields: [pullRequests.agentRunId],
    references: [agentRuns.id],
  }),
}));

export const agentErrorsRelations = relations(agentErrors, ({ one }) => ({
  agentRun: one(agentRuns, {
    fields: [agentErrors.agentRunId],
    references: [agentRuns.id],
  }),
}));

export const indexedFilesRelations = relations(indexedFiles, ({ one }) => ({
  agentRun: one(agentRuns, {
    fields: [indexedFiles.agentRunId],
    references: [agentRuns.id],
  }),
}));

export const semanticSearchesRelations = relations(
  semanticSearches,
  ({ one }) => ({
    agentRun: one(agentRuns, {
      fields: [semanticSearches.agentRunId],
      references: [agentRuns.id],
    }),
  })
);
