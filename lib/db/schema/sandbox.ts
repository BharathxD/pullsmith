import {
  index,
  integer,
  json,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./utils";
import { agentRuns } from "./agents";

export const sandboxInstances = pgTable(
  "sandbox_instances",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    agentRunId: varchar("agent_run_id", { length: 255 })
      .notNull()
      .references(() => agentRuns.id),
    sandboxId: varchar("sandbox_id", { length: 100 }).notNull(),
    runtime: varchar("runtime", { length: 50 }),
    vcpus: integer("vcpus").default(1),
    memoryMb: integer("memory_mb"),
    timeoutMinutes: integer("timeout_minutes").default(5),
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

export const sandboxInstancesRelations = relations(sandboxInstances, ({ one }) => ({
  agentRun: one(agentRuns, {
    fields: [sandboxInstances.agentRunId],
    references: [agentRuns.id],
  }),
}));
