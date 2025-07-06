import { githubService } from "@/lib/github/service";
import { generateSandboxConfig } from "@/lib/ai/agents";
import { Sandbox } from "@vercel/sandbox";
import type { CreateSandboxParams } from "@vercel/sandbox/dist/sandbox";
import ms from "ms";
import type { AgentState } from "../state";

/**
 * SETUP SANDBOX NODE
 *
 * Creates isolated Vercel Sandbox environment with Git-enabled repository access
 */
export const setupSandbox = async (
  state: AgentState
): Promise<Partial<AgentState>> => {
  try {
    const [aiConfig, githubToken] = await Promise.all([
      generateSandboxConfig(state.indexedFiles, state.task),
      githubService.getInstallationAccessToken(state.repoUrl),
    ]);

    const sandboxConfig: CreateSandboxParams = {
      source: {
        url: state.repoUrl,
        type: "git" as const,
        username: "x-access-token",
        password: githubToken,
      },
      resources: { vcpus: aiConfig.vcpus },
      timeout: ms(`${aiConfig.timeoutMinutes}m`),
      ports: aiConfig.ports,
      runtime: aiConfig.runtime,
    };

    const sandbox = await Sandbox.create(sandboxConfig);
    const branchName = `pullsmith/${state.baseBranch}-${Date.now()}`;

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

    await sandbox.runCommand({
      cmd: "git",
      args: ["checkout", "-b", branchName, state.baseBranch],
    });

    return {
      sandboxId: sandbox.sandboxId,
      isSandboxReady: true,
      currentStep: "sandbox_ready",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      errors: [
        ...(state.errors || []),
        `Sandbox setup failed: ${errorMessage}`,
      ],
      currentStep: "sandbox_failed",
    };
  }
};
