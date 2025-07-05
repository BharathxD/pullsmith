import { env } from "@/env";
import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import { account } from "@/lib/db/schema/auth";
import db from "@/lib/db";
import { eq } from "drizzle-orm";

export class GitHubService {
  private readonly app: App;

  constructor() {
    this.app = new App({
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_APP_PRIVATE_KEY,
    });
  }

  async getOctokitForUser(userId: string) {
    const [userAccount] = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId))
      .limit(1);

    if (!userAccount?.accessToken) {
      throw new Error("No GitHub account found for user");
    }

    return new Octokit({
      auth: userAccount.accessToken,
    });
  }

  async getUserInstallations(userId: string) {
    const octokit = await this.getOctokitForUser(userId);

    try {
      const response =
        await octokit.rest.apps.listInstallationsForAuthenticatedUser({
          per_page: 100,
        });

      return response.data.installations.map((installation) => ({
        id: installation.id,
        account: {
          id: installation.account?.id,
          login:
            installation.account && "login" in installation.account
              ? installation.account.login
              : installation.account?.name ?? "Unknown",
          avatar_url: installation.account?.avatar_url,
          type:
            installation.account && "type" in installation.account
              ? installation.account.type
              : "Organization",
        },
        repository_selection: installation.repository_selection,
      }));
    } catch (error) {
      console.error("Error fetching installations:", error);
      throw new Error("Failed to fetch GitHub installations");
    }
  }

  async getInstallationRepositories(userId: string, installationId: number) {
    const octokit = await this.getOctokitForUser(userId);

    try {
      const response =
        await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
          installation_id: installationId,
          per_page: 100,
        });

      return response.data.repositories.map(
        ({
          id,
          name,
          full_name,
          description,
          private: isPrivate,
          html_url,
          clone_url,
          default_branch,
          updated_at,
          language,
          stargazers_count,
          forks_count,
        }) => ({
          id,
          name,
          full_name,
          description,
          private: isPrivate,
          html_url,
          clone_url,
          default_branch,
          updated_at,
          language,
          stargazers_count,
          forks_count,
        })
      );
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw new Error("Failed to fetch repositories");
    }
  }

  async getRepositoryContents(
    userId: string,
    owner: string,
    repo: string,
    path = ""
  ) {
    const octokit = await this.getOctokitForUser(userId);

    try {
      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(response.data)) {
        return response.data.map(
          ({ name, path, type, size, sha, download_url, html_url }) => ({
            name,
            path,
            type,
            size,
            sha,
            download_url,
            html_url,
          })
        );
      }

      // Single file - check if it has content
      const file = response.data;
      const baseFileData = {
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
        sha: file.sha,
        download_url: file.download_url,
        html_url: file.html_url,
      };

      if (file.type === "file" && "content" in file) {
        return {
          ...baseFileData,
          content: file.content,
          encoding: file.encoding,
        };
      }

      return baseFileData;
    } catch (error) {
      console.error("Error fetching repository contents:", error);
      throw new Error("Failed to fetch repository contents");
    }
  }

  async getFileContent(
    userId: string,
    owner: string,
    repo: string,
    path: string
  ) {
    const octokit = await this.getOctokitForUser(userId);

    try {
      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(response.data)) {
        throw new Error("Path is a directory, not a file");
      }

      const file = response.data;
      if (file.type !== "file" || !("content" in file)) {
        throw new Error("Path is not a file or content is not available");
      }

      return {
        name: file.name,
        path: file.path,
        content: Buffer.from(
          file.content,
          file.encoding as BufferEncoding
        ).toString("utf-8"),
        sha: file.sha,
        size: file.size,
        html_url: file.html_url,
      };
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw new Error("Failed to fetch file content");
    }
  }

  async getRepositoryTree(
    userId: string,
    owner: string,
    repo: string,
    recursive = false
  ) {
    const octokit = await this.getOctokitForUser(userId);

    try {
      const response = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: "HEAD",
        recursive: recursive ? "1" : undefined,
      });

      return response.data.tree.map(({ path, mode, type, sha, size, url }) => ({
        path,
        mode,
        type,
        sha,
        size,
        url,
      }));
    } catch (error) {
      console.error("Error fetching repository tree:", error);
      throw new Error("Failed to fetch repository tree");
    }
  }

  async getAllUserRepositories(userId: string) {
    try {
      // Get all installations for the user
      const installations = await this.getUserInstallations(userId);
      
      // Get repositories from all installations
      const allRepositories = await Promise.all(
        installations.map(async (installation) => {
          try {
            const repos = await this.getInstallationRepositories(userId, installation.id);
            return repos.map(repo => ({
              ...repo,
              installation_id: installation.id,
              account: installation.account,
            }));
          } catch (error) {
            console.error(`Error fetching repos for installation ${installation.id}:`, error);
            return [];
          }
        })
      );

      // Flatten the array and sort by updated_at
      return allRepositories
        .flat()
        .sort((a, b) => {
          const dateA = new Date(a.updated_at || 0);
          const dateB = new Date(b.updated_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
    } catch (error) {
      console.error("Error fetching all repositories:", error);
      throw new Error("Failed to fetch all repositories");
    }
  }

  async getRepositoryDetails(userId: string, owner: string, repo: string) {
    const octokit = await this.getOctokitForUser(userId);

    try {
      const [repoResponse, commitsResponse] = await Promise.all([
        octokit.rest.repos.get({ owner, repo }),
        octokit.rest.repos.listCommits({ 
          owner, 
          repo, 
          per_page: 5 
        })
      ]);

      const repository = repoResponse.data;
      const commits = commitsResponse.data;

      return {
        id: repository.id,
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description,
        private: repository.private,
        html_url: repository.html_url,
        clone_url: repository.clone_url,
        default_branch: repository.default_branch,
        updated_at: repository.updated_at,
        pushed_at: repository.pushed_at,
        language: repository.language,
        stargazers_count: repository.stargazers_count,
        forks_count: repository.forks_count,
        watchers_count: repository.watchers_count,
        size: repository.size,
        open_issues_count: repository.open_issues_count,
        topics: repository.topics,
        license: repository.license,
        owner: {
          login: repository.owner.login,
          avatar_url: repository.owner.avatar_url,
          type: repository.owner.type,
        },
        recent_commits: commits.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: {
            name: commit.commit.author?.name,
            email: commit.commit.author?.email,
            date: commit.commit.author?.date,
          },
          committer: {
            name: commit.commit.committer?.name,
            email: commit.commit.committer?.email,
            date: commit.commit.committer?.date,
          },
          html_url: commit.html_url,
        }))
      };
    } catch (error) {
      console.error("Error fetching repository details:", error);
      throw new Error("Failed to fetch repository details");
    }
  }
}

export const githubService = new GitHubService();
