import {
  bigint,
  index,
  integer,
  json,
  pgTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./utils";
import { agentRuns } from "./agents";

export const repositories = pgTable(
  "repositories",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    url: varchar("url", { length: 512 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    baseBranch: varchar("base_branch", { length: 100 }).default("main"),
    currentMerkleRoot: varchar("current_merkle_root", { length: 64 }),
    ...timestamps,
  },
  (table) => [
    unique("unique_url_branch").on(table.url, table.baseBranch),
    index("idx_repositories_updated_at").on(table.updatedAt),
  ]
);

export const merkleTrees = pgTable(
  "merkle_trees",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    repositoryId: varchar("repository_id", { length: 255 })
      .notNull()
      .references(() => repositories.id),
    rootHash: varchar("root_hash", { length: 64 }).notNull(),
    treeStructure: json("tree_structure"),
    fileCount: integer("file_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("idx_repo_root").on(table.repositoryId, table.rootHash),
    index("idx_merkle_trees_created_at").on(table.createdAt),
  ]
);

export const fileHashes = pgTable(
  "file_hashes",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    merkleTreeId: varchar("merkle_tree_id", { length: 255 })
      .notNull()
      .references(() => merkleTrees.id),
    filePath: varchar("file_path", { length: 512 }).notNull(),
    fileHash: varchar("file_hash", { length: 64 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }),
    lastModified: timestamp("last_modified"),
    ...timestamps,
  },
  (table) => [
    index("idx_merkle_tree").on(table.merkleTreeId),
    // File paths can still be searched via file_hash which is more reliable
    index("idx_file_hashes_hash").on(table.fileHash),
    // Use file_path instead of file_hash for uniqueness - allows multiple files with same content
    unique("unique_merkle_tree_file").on(table.merkleTreeId, table.filePath),
  ]
);

export const repositoriesRelations = relations(repositories, ({ many }) => ({
  merkleTrees: many(merkleTrees),
  agentRuns: many(agentRuns),
}));

export const merkleTreesRelations = relations(merkleTrees, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [merkleTrees.repositoryId],
    references: [repositories.id],
  }),
  fileHashes: many(fileHashes),
}));

export const fileHashesRelations = relations(fileHashes, ({ one }) => ({
  merkleTree: one(merkleTrees, {
    fields: [fileHashes.merkleTreeId],
    references: [merkleTrees.id],
  }),
}));
