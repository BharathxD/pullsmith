import { generateSandboxConfig } from "@/lib/ai/agents";
import { githubService } from "@/lib/github/service";
import { Sandbox } from "@vercel/sandbox";
import ms from "ms";
import type { GraphState } from "../state";

export const setupSandbox = async (
  state: GraphState
): Promise<Partial<GraphState>> => {
  try {
    const [aiConfig, githubToken] = await Promise.all([
      generateSandboxConfig(state.indexedFiles, state.task),
      githubService.getInstallationAccessToken(state.repoUrl),
    ]);

    const sandbox = await Sandbox.create({
      source: {
        url: state.repoUrl,
        type: "git",
        username: "x-access-token",
        password: githubToken,
      },
      resources: { vcpus: aiConfig.vcpus },
      timeout: ms(`${aiConfig.timeoutMinutes}m`),
      ports: aiConfig.ports,
      runtime: aiConfig.runtime,
    });

    await Promise.all([
      sandbox.runCommand({
        cmd: "git",
        args: ["config", "user.name", "Pullsmith[bot]"],
      }),
      sandbox.runCommand({
        cmd: "git",
        args: [
          "config",
          "user.email",
          "pullsmith[bot]@users.noreply.github.com",
        ],
      }),
    ]);

    return {
      sandboxId: sandbox.sandboxId,
      isSandboxReady: true,
      currentStep: "sandbox_ready",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error({ error });
    console.error("❌ Sandbox setup failed:", errorMessage);
    return {
      errors: [
        ...(state.errors || []),
        `Sandbox setup failed: ${errorMessage}`,
      ],
      currentStep: "sandbox_failed",
    };
  }
};
