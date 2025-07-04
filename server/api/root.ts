import { router } from "@/lib/trpc/server";
import { healthRouter } from "./routers/health";
import { githubRouter } from "./routers/github";

export const appRouter = router({
  health: healthRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;
