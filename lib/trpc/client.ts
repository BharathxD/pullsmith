import type { AppRouter } from "@/server/api/root";
import { type CreateTRPCReact, createTRPCReact } from "@trpc/react-query";

export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();
