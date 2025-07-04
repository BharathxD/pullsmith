import { router } from "@/lib/trpc/server";
import { healthRouter } from "./routers/health";

export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
