import { generateFileChanges } from "@/lib/ai/agents";
import { Sandbox } from "@vercel/sandbox";
import type { GraphState } from "../state";

/**
 * EDIT FILES NODE
 *
 * Executes planned changes to code files in Vercel Sandbox
 */
export const editFiles = async (
  state: GraphState
): Promise<Partial<GraphState>> => {
  console.log(`✏️  Editing ${state.plan.length} files`);

  try {
    const sandbox = await Sandbox.get({ sandboxId: state.sandboxId });
    const sortedPlan = [...state.plan].sort((a, b) => a.priority - b.priority);
    const editedFiles = [];

    for (const planItem of sortedPlan) {
      const originalContent =
        planItem.action === "create"
          ? ""
          : await readFileContent(sandbox, planItem.filePath);

      const changeResult = await generateFileChanges(
        planItem,
        originalContent,
        state.task,
        sandbox
      );

      if (!changeResult.success) {
        throw new Error(
          `Failed to generate changes for ${planItem.filePath}: ${changeResult.error}`
        );
      }

      editedFiles.push({
        filePath: planItem.filePath,
        originalContent,
        newContent: changeResult.content,
      });
    }

    return {
      editedFiles,
      isEditingComplete: true,
      currentStep: "editing_complete",
    };
  } catch (error) {
    console.error("❌ File editing failed:", error);
    return {
      errors: [
        ...(state.errors || []),
        `File editing failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      currentStep: "editing_failed",
    };
  }
};

const readFileContent = async (
  sandbox: Sandbox,
  filePath: string
): Promise<string> => {
  const result = await sandbox.runCommand({ cmd: "cat", args: [filePath] });
  return result.exitCode === 0 ? await result.stdout() : "";
};
