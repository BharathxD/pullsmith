import {
  index,
  int,
  json,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { timestamps } from "./utils";
import { agentRuns } from "./agents";

export const sandboxInstances = mysqlTable(
  "sandbox_instances",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    sandboxId: varchar("sandbox_id", { length: 100 }).notNull(),
    runtime: varchar("runtime", { length: 50 }),
    vcpus: int("vcpus").default(1),
    memoryMb: int("memory_mb"),
    timeoutMinutes: int("timeout_minutes").default(5),
    status: varchar("status", { length: 20 }).default("initializing"),
    domain: varchar("domain", { length: 255 }),
    ports: json("ports"), // Array of exposed ports
    stoppedAt: timestamp("stopped_at"),
    ...timestamps,
  },
  (table) => [
    index("idx_sandbox_agent_run").on(table.agentRunId),
    index("idx_sandbox_id").on(table.sandboxId),
  ]
);
