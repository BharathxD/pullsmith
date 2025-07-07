import { END, START, StateGraph } from "@langchain/langgraph";
import {
  createPr,
  editFiles,
  indexCodebase,
  planChanges,
  setupSandbox,
} from "./nodes";
import { StateAnnotation } from "./state";
import { checkpointer } from "@/lib/db/checkpointer";

const workflow = new StateGraph(StateAnnotation)
  .addNode("indexCodebase", indexCodebase)
  .addNode("setupSandbox", setupSandbox)
  .addNode("planChanges", planChanges)
  .addNode("editFiles", editFiles)
  .addNode("createPr", createPr)
  .addEdge(START, "indexCodebase")
  .addConditionalEdges("indexCodebase", (state) =>
    state.currentStep === "indexing_complete" ? "setupSandbox" : END
  )
  .addConditionalEdges("setupSandbox", (state) =>
    state.currentStep === "sandbox_ready" ? "planChanges" : END
  )
  .addConditionalEdges("planChanges", (state) =>
    state.currentStep === "planning_complete" ? "editFiles" : END
  )
  .addConditionalEdges("editFiles", (state) =>
    state.currentStep === "editing_complete" ? "createPr" : END
  )
  .addEdge("createPr", END);

export const graph = workflow.compile({ checkpointer });

export { checkpointer };
