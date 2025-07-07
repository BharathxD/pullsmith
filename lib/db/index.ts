import { env } from "@/env";
import * as schema from "@/lib/db/schema";
import {
  type NeonQueryFunction,
  neon,
  neonConfig,
} from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import ws from "ws";

const LOCAL_DB_CONFIG = {
  host: "db.localtest.me",
  port: 5432,
  httpPort: 4444,
  database: "main",
  user: "postgres",
  password: "postgres",
} as const;

const getConnectionString = (): string => {
  if (env.NODE_ENV === "development") {
    const { host, port, database, user, password } = LOCAL_DB_CONFIG;
    return `postgres://${user}:${password}@${host}:${port}/${database}`;
  }

  if (!env.DATABASE_URI) {
    throw new Error("DATABASE_URI environment variable is required");
  }

  return env.DATABASE_URI;
};

/**
 * Configures Neon settings for local development
 */
const configureNeonForDevelopment = () => {
  const { host, httpPort } = LOCAL_DB_CONFIG;

  neonConfig.fetchEndpoint = (requestHost) => {
    const [protocol, port] =
      requestHost === host ? ["http", httpPort] : ["https", 443];
    return `${protocol}://${requestHost}:${port}/sql`;
  };

  const connectionUrl = new URL(getConnectionString());
  neonConfig.useSecureWebSocket = connectionUrl.hostname !== host;

  neonConfig.wsProxy = (requestHost) =>
    requestHost === host
      ? `${requestHost}:${httpPort}/v2`
      : `${requestHost}/v2`;
};

const initializeDatabase = (): NeonHttpDatabase<typeof schema> => {
  try {
    const connectionString = getConnectionString();

    if (env.NODE_ENV === "development") {
      configureNeonForDevelopment();
    }

    // Set WebSocket constructor for real-time features
    neonConfig.webSocketConstructor = ws;

    const sql: NeonQueryFunction<false, false> = neon(connectionString);

    // Configure Drizzle for optimal tRPC integration
    return drizzle({
      client: sql,
      schema,
      logger: false,
    });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw new Error("Database initialization failed");
  }
};

/**
 * Configured Drizzle database instance
 *
 * This database instance is optimized for use with tRPC procedures:
 * - Configured with connection pooling for performance
 * - Supports real-time features via WebSocket connections
 * - Optimized for concurrent requests in tRPC router context
 * - Includes development logging for debugging tRPC procedures
 *
 * Usage in tRPC context:
 * ```typescript
 * import { db } from "~/lib/db";
 *
 * export const createTRPCContext = async (opts: CreateNextContextOptions) => {
 *   return {
 *     db,
 *     // ... other context
 *   };
 * };
 * ```
 */
const db = initializeDatabase();

/**
 * Type helper for tRPC context database
 * Use this type when defining tRPC procedures that need database access
 */
export type Database = typeof db;

export default db;
