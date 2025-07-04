import { semanticSearch } from "@/lib/utils/ai";
import type { AgentState } from "../state";

/**
 * PLAN CHANGES NODE
 *
 * Analyzes task and creates implementation plan using semantic search
 */
export const planChanges = async (
  state: AgentState
): Promise<Partial<AgentState>> => {
  console.log(`📋 Planning changes for task: ${state.task}`);

  try {
    // Extract repository ID from the indexed files
    if (!state.indexedFiles?.length) {
      throw new Error("No indexed files available for planning");
    }
    
    const repositoryId = state.indexedFiles[0].chunks?.[0]?.metadata?.repositoryId as string;
    if (!repositoryId) {
      throw new Error("No repository ID found in indexed files");
    }

    // Perform semantic search with repository and branch filtering
    console.log("🔍 Performing repository and branch-filtered semantic search...");
    const semanticMatches = await semanticSearch(
      state.task,
      repositoryId,
      state.baseBranch,
      10
    );

    console.log(`📊 Found ${semanticMatches.length} relevant code chunks`);

    // Extract relevant files from semantic matches
    const relevantFiles = semanticMatches
      .map(match => match.payload?.filePath)
      .filter((filePath): filePath is string => typeof filePath === 'string');

    // For now, create a mock plan based on the semantic matches
    // In a real implementation, this would use an LLM to generate the plan
    const mockPlan = [
      {
        action: "modify" as const,
        filePath: relevantFiles[0] || "README.md",
        description: `Update based on task: ${state.task}`,
        priority: 1,
      },
    ];

    // Convert semantic matches to the expected format
    const formattedSemanticMatches = semanticMatches
      .filter((match): match is typeof match & { payload: Record<string, unknown> } => 
        match.payload !== null && match.payload !== undefined && typeof match.payload === 'object'
      )
      .map(match => {
        const payload = match.payload;
        return {
          content: String(payload.content || ''),
          filePath: String(payload.filePath || ''),
          lineStart: Number(payload.lineStart || 0),
          lineEnd: Number(payload.lineEnd || 0),
          score: match.score,
          metadata: (payload.metadata as Record<string, unknown>) || {},
        };
      });

    console.log("✅ Planning complete with repository and branch isolation");

    return {
      relevantFiles,
      plan: mockPlan,
      semanticMatches: formattedSemanticMatches,
      currentStep: "planning_complete",
    };
  } catch (error) {
    console.error("❌ Planning failed:", error);
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