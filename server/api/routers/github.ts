import { githubService } from "@/lib/github/service";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { z } from "zod";

export const githubRouter = router({
  getInstallations: protectedProcedure.query(async ({ ctx }) => {
    return await githubService.getUserInstallations(ctx.user.id);
  }),

  getAllRepositories: protectedProcedure.query(async ({ ctx }) => {
    return await githubService.getAllUserRepositories(ctx.user.id);
  }),

  getRepositories: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await githubService.getInstallationRepositories(
        ctx.user.id,
        input.installationId
      );
    }),

  getRepositoryContents: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string().optional().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      return await githubService.getRepositoryContents(
        ctx.user.id,
        input.owner,
        input.repo,
        input.path
      );
    }),

  getFileContent: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await githubService.getFileContent(
        ctx.user.id,
        input.owner,
        input.repo,
        input.path
      );
    }),

  getRepositoryTree: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        recursive: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      return await githubService.getRepositoryTree(
        ctx.user.id,
        input.owner,
        input.repo,
        input.recursive
      );
    }),

  getRepositoryDetails: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const details = await githubService.getRepositoryDetails(
        ctx.user.id,
        input.owner,
        input.repo
      );
      return {
        ...details,
        recent_commits: details.recent_commits.map((commit) => ({
          ...commit,
          url: commit.html_url,
        })),
      };
    }),
});

export type GitHubRouter = typeof githubRouter;
