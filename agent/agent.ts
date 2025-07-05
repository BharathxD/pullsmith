import {
  indexCodebase,
  setupSandbox,
  planChanges,
  editFiles,
  createPr,
} from "./nodes";
import type { AgentState } from "./state";

// Helper function to run the agent
export async function runAgent(
  task: string,
  repoUrl: string,
  baseBranch = "main",
  previousMerkleRoot?: string
): Promise<AgentState> {
  let state = {
    task,
    repoUrl,
    baseBranch,
    previousMerkleRoot,
    indexedFiles: [],
    isVectorDatabaseReady: false,
    merkleRoot: "",
    changedFiles: [],
    relevantFiles: [],
    plan: [],
    semanticMatches: [],
    sandboxId: "",
    isSandboxReady: false,
    editedFiles: [],
    isEditingComplete: false,
    branchName: "",
    commitHash: "",
    prUrl: "",
    errors: [],
    currentStep: "indexing_complete", // This will be overridden by the first node
  } as AgentState;

  console.log("🤖 Starting Pullsmith Agent");
  console.log(`📝 Task: ${task}`);
  console.log(`📂 Repository: ${repoUrl}`);
  console.log(`🌿 Base Branch: ${baseBranch}`);
  console.log(`${"=".repeat(51)}`);

  try {
    // Step 1: Index Codebase
    console.log("\n🔍 Step 1: Indexing Codebase");
    const indexResult = await indexCodebase(state);
    state = { ...state, ...indexResult };

    console.log({ ...indexResult });

    if (state.currentStep === "indexing_failed") {
      console.log("❌ Indexing failed, stopping execution");
      return state;
    }

    // Step 2: Setup Sandbox
    console.log("\n🚀 Step 2: Setting up Sandbox");
    const sandboxResult = await setupSandbox(state);
    state = { ...state, ...sandboxResult };

    if (state.currentStep === "sandbox_failed") {
      console.log("❌ Sandbox setup failed, stopping execution");
      return state;
    }

    // Step 3: Plan Changes
    console.log("\n📋 Step 3: Planning Changes");
    const planResult = await planChanges(state);
    state = { ...state, ...planResult };

    if (state.currentStep === "planning_failed") {
      console.log("❌ Planning failed, stopping execution");
      return state;
    }

    // Step 4: Edit Files
    console.log("\n✏️  Step 4: Editing Files");
    const editResult = await editFiles(state);
    state = { ...state, ...editResult };

    if (state.currentStep === "editing_failed") {
      console.log("❌ Editing failed, stopping execution");
      return state;
    }

    // Step 5: Create PR
    console.log("\n📤 Step 5: Creating Pull Request");
    const prResult = await createPr(state);
    state = { ...state, ...prResult };

    console.log(`${"=".repeat(51)}`);
    console.log("🏁 Agent execution completed");
    console.log(`📊 Final Step: ${state.currentStep}`);

    if (state.errors && state.errors.length > 0) {
      console.log("❌ Errors encountered:");
      state.errors.forEach((error: string, index: number) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    return state;
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    state.errors.push(
      `Unexpected error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return state;
  }
}

// Simple export for the agent function
export const agent = { invoke: runAgent };
