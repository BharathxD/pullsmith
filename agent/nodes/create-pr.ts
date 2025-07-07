import type { GraphState } from "../state";
import { Sandbox } from "@vercel/sandbox";
import { githubService } from "@/lib/github/service";
import { generatePrSummary } from "@/lib/ai/agents";
import { Octokit } from "@octokit/rest";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

export const createPr = async (
  state: GraphState,
  config: LangGraphRunnableConfig
): Promise<Partial<GraphState>> => {
  let sandbox: Sandbox | undefined;
  try {
    sandbox = await Sandbox.get({ sandboxId: state.sandboxId });
    const [installationToken, prSummary] = await Promise.all([
      githubService.getInstallationAccessToken(state.repoUrl),
      generatePrSummary(state.task, state.editedFiles),
    ]);

    const branchName = `pullsmith/${state.baseBranch}-${Date.now()}`;
    const { owner, repo } = parseRepositoryUrl(state.repoUrl);

    const hasChanges = await checkForChanges(sandbox);
    if (!hasChanges) {
      throw new Error("No changes detected in the repository");
    }

    await runGitCommand(sandbox, ["checkout", "-b", branchName]);
    await runGitCommand(sandbox, ["add", "-A"]);

    const commitStatus = await runGitCommand(sandbox, [
      "status",
      "--porcelain",
    ]);
    const statusOutput = await commitStatus.stdout();
    if (!statusOutput.trim()) {
      throw new Error("No staged changes found for commit");
    }

    await runGitCommand(sandbox, [
      "commit",
      "-m",
      prSummary.title,
      "-m",
      prSummary.summary,
    ]);

    const commitHash = await getCommitHash(sandbox);
    const authenticatedUrl = `https://x-access-token:${installationToken}@github.com/${owner}/${repo}.git`;

    await runGitCommand(sandbox, [
      "remote",
      "set-url",
      "origin",
      authenticatedUrl,
    ]);
    await runGitCommand(sandbox, ["push", "-u", "origin", branchName]);

    const octokit = new Octokit({ auth: installationToken });
    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: prSummary.title,
      body: prSummary.body,
      head: branchName,
      base: state.baseBranch,
    });

    return {
      branchName,
      commitHash,
      prUrl: pr.html_url,
      currentStep: "pr_created",
    };
  } catch (error) {
    console.error("❌ PR creation failed:", error);
    return {
      errors: [
        ...(state.errors || []),
        `PR creation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      currentStep: "pr_failed",
    };
  } finally {
    if (sandbox) {
      await sandbox.stop();
    }
  }
};

function parseRepositoryUrl(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Invalid repository URL: ${repoUrl}`);
  }
  return { owner: match[1], repo: match[2] };
}

async function checkForChanges(sandbox: Sandbox): Promise<boolean> {
  const result = await sandbox.runCommand({
    cmd: "git",
    args: ["status", "--porcelain"],
  });
  const stdout = await result.stdout();
  return stdout.trim().length > 0;
}

async function runGitCommand(sandbox: Sandbox, args: string[]) {
  const result = await sandbox.runCommand({
    cmd: "git",
    args,
  });
  if (result.exitCode !== 0) {
    const stderr = await result.stderr();
    throw new Error(`Git command failed: ${stderr}`);
  }
  return result;
}

async function getCommitHash(sandbox: Sandbox): Promise<string> {
  const result = await runGitCommand(sandbox, ["rev-parse", "HEAD"]);
  const stdout = await result.stdout();
  return stdout.trim();
}
