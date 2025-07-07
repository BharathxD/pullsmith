import { router } from "@/lib/trpc/server";
import { healthRouter } from "./routers/health";
import { githubRouter } from "./routers/github";
import { agentRouter } from "./routers/agent";

export const appRouter = router({
  health: healthRouter,
  github: githubRouter,
  agent: agentRouter,
});

export type AppRouter = typeof appRouter;
