import { generatePlan } from "@/lib/ai/agents";
import type { GraphState } from "../state";
import { Sandbox } from "@vercel/sandbox";
import { semanticSearch } from "@/lib/db/vector/utils";
import { getRepositoryId } from "@/lib/db/indexing";

/**
 * PLAN CHANGES NODE
 *
 * Analyzes task and creates implementation plan using semantic search
 */
export const planChanges = async (
  state: GraphState
): Promise<Partial<GraphState>> => {
  try {
    const sandbox = await Sandbox.get({ sandboxId: state.sandboxId });

    if (!state.isVectorDatabaseReady) {
      throw new Error("Vector database is not ready for planning");
    }

    const repositoryId = await getRepositoryId(state.repoUrl, state.baseBranch);
    if (!repositoryId) {
      throw new Error("Repository not found in database");
    }

    const semanticMatches = await semanticSearch(
      state.task,
      repositoryId,
      state.baseBranch,
      10
    );

    const formattedSemanticMatches = semanticMatches
      .filter(
        (match): match is typeof match & { payload: Record<string, unknown> } =>
          match.payload !== null &&
          match.payload !== undefined &&
          typeof match.payload === "object"
      )
      .map((match) => {
        const payload = match.payload;
        return {
          content: String(payload.content || ""),
          filePath: String(payload.filePath || ""),
          lineStart: Number(payload.lineStart || 0),
          lineEnd: Number(payload.lineEnd || 0),
          score: match.score,
          metadata: (payload.metadata as Record<string, unknown>) || {},
        };
      });

    const planResult = await generatePlan(
      state.task,
      formattedSemanticMatches,
      sandbox
    );

    return {
      relevantFiles: planResult.relevantFiles,
      plan: planResult.items,
      semanticMatches: formattedSemanticMatches,
      currentStep: "planning_complete",
    };
  } catch (error) {
    return {
      errors: [
        ...(state.errors || []),
        `Planning failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      currentStep: "planning_failed",
    };
  }
};
