import db from "@/lib/db";
import { getOrCreateRepository } from "@/lib/db/indexing";
import { agentRuns, nanoid } from "@/lib/db/schema";
import { client } from "@/lib/langgraph/client";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createTaskInput = z.object({
  task: z.string().min(1),
  repoUrl: z.string().url(),
  baseBranch: z.string().default("main"),
});

const streamTaskInput = z.object({
  taskId: z.string(),
});

export const agentRouter = router({
  createTask: protectedProcedure
    .input(createTaskInput)
    .mutation(async ({ input }) => {
      try {
        const repository = await getOrCreateRepository(
          input.repoUrl,
          input.baseBranch
        );

        // Create thread first
        const thread = await client.threads.create();

        const run = await client.runs.create(thread.thread_id, "agent", {
          input: {
            task: input.task,
            repoUrl: input.repoUrl,
            baseBranch: input.baseBranch,
            previousMerkleRoot: repository.previousMerkleRoot,
          },
        });
        const taskId = nanoid();
        await db.insert(agentRuns).values({
          id: taskId,
          runId: run.run_id,
          repositoryId: repository.id,
          task: input.task,
          assistantId: "agent",
          threadId: thread.thread_id,
        });
        return {
          taskId: taskId,
          threadId: thread.thread_id,
          runId: run.run_id,
          status: run.status,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create task",
        });
      }
    }),

  streamTask: protectedProcedure
    .input(streamTaskInput)
    .subscription(async function* (opts) {
      try {
        const agentRun = await db.query.agentRuns.findFirst({
          where: eq(agentRuns.id, opts.input.taskId),
        });

        if (!agentRun) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        const run = await client.runs.get(agentRun.threadId, agentRun.runId);
        
        // Handle completed runs
        if (run.status === "success") {
          const thread = await client.threads.get(agentRun.threadId);
          
          // Yield the final completion event with all data
          yield {
            event: "task_completed",
            data: {
              ...thread.values,
              status: "completed",
              runId: run.run_id,
              threadId: agentRun.threadId,
              taskId: opts.input.taskId,
            },
          };
          return;
        }

        // Handle failed runs
        if (run.status === "error") {
          yield {
            event: "task_failed", 
            data: {
              status: "failed",
              error: "Task execution failed",
              runId: run.run_id,
              threadId: agentRun.threadId,
              taskId: opts.input.taskId,
            },
          };
          return;
        }

        // Handle interrupted/cancelled runs
        if (run.status === "interrupted") {
          yield {
            event: "task_cancelled",
            data: {
              status: "cancelled", 
              runId: run.run_id,
              threadId: agentRun.threadId,
              taskId: opts.input.taskId,
            },
          };
          return;
        }

        // For running tasks, stream the data
        const stream = client.runs.joinStream(
          agentRun.threadId,
          agentRun.runId,
          opts.signal
            ? {
                signal: opts.signal,
              }
            : undefined
        );

        for await (const chunk of stream) {
          if (opts.signal?.aborted) break;

          yield {
            event: chunk.event,
            data: chunk.data,
          };
        }
      } catch (error) {
        if (opts.signal?.aborted) return;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Stream failed",
        });
      }
    }),

  stopTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const agentRun = await db.query.agentRuns.findFirst({
          where: eq(agentRuns.id, input.taskId),
        });

        if (!agentRun) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // Get runs from LangGraph to check status
        const runs = await client.runs.list(agentRun.threadId);
        const latestRun = runs[0];

        if (
          latestRun &&
          (latestRun.status === "success" || latestRun.status === "error")
        ) {
          return {
            taskId: input.taskId,
            status: latestRun.status,
            message: "Task already completed",
          };
        }

        const targetRun =
          runs.find((run) => run.run_id === input.taskId) || runs[0];

        if (targetRun) {
          await client.runs.cancel(agentRun.threadId, targetRun.run_id);
        }

        return {
          taskId: input.taskId,
          status: "cancelled",
          message: "Task stopped successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to stop task",
        });
      }
    }),
});

export type AgentRouter = typeof agentRouter;
