import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URI: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_APP_ID: z.string().min(1),
    GITHUB_APP_PRIVATE_KEY: z.string().min(1),
    REDIS_REST_URL: z.string().url(),
    REDIS_REST_TOKEN: z.string().min(1),
    REDIS_URI: z.string().url(),
    QDRANT_API_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1).startsWith("sk-proj-"),
    QDRANT_URL: z.string().url().optional().default("http://localhost:6333"),
    VERCEL_OIDC_TOKEN: z.string().min(1),
    LANGGRAPH_API_URL: z
      .string()
      .url()
      .optional()
      .default("http://localhost:2024"),
    LANGSMITH_API_KEY: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "production"])
      .optional()
      .default("development"),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_APP_URL: z
      .string()
      .url()
      .default("http://localhost:3000")
      .optional(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});
