import { generatePlan } from "@/lib/ai/agents";
import type { AgentState } from "../state";
import { Sandbox } from "@vercel/sandbox";
import { semanticSearch } from "@/lib/db/vector/utils";

/**
 * PLAN CHANGES NODE
 *
 * Analyzes task and creates implementation plan using semantic search
 */
export const planChanges = async (
  state: AgentState
): Promise<Partial<AgentState>> => {
  try {
    const sandbox = await Sandbox.get({ sandboxId: state.sandboxId });

    if (!state.indexedFiles?.length) {
      throw new Error("No indexed files available for planning");
    }

    const repositoryId = state.indexedFiles[0].chunks?.[0]?.metadata
      ?.repositoryId as string;
    if (!repositoryId) {
      throw new Error("No repository ID found in indexed files");
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
