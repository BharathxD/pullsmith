import {
  bigint,
  index,
  int,
  json,
  mysqlTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { timestamps } from "./utils";

export const repositories = mysqlTable(
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

export const merkleTrees = mysqlTable(
  "merkle_trees",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    repositoryId: varchar("repository_id", { length: 255 })
      .notNull()
      .references(() => repositories.id),
    rootHash: varchar("root_hash", { length: 64 }).notNull(),
    treeStructure: json("tree_structure"),
    fileCount: int("file_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("idx_repo_root").on(table.repositoryId, table.rootHash),
    index("idx_merkle_trees_created_at").on(table.createdAt),
  ]
);

export const fileHashes = mysqlTable(
  "file_hashes",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    merkleTreeId: varchar("merkle_tree_id", { length: 255 })
      .notNull()
      .references(() => merkleTrees.id),
    filePath: varchar("file_path", { length: 1024 }).notNull(),
    fileHash: varchar("file_hash", { length: 64 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }),
    lastModified: timestamp("last_modified"),
    ...timestamps,
  },
  (table) => [
    index("idx_merkle_tree").on(table.merkleTreeId),
    // File paths can still be searched via file_hash which is more reliable
    index("idx_file_hashes_hash").on(table.fileHash),
    // Use file_hash instead of file_path for uniqueness - it's shorter and still ensures uniqueness
    unique("unique_merkle_tree_file").on(table.merkleTreeId, table.fileHash),
  ]
);
