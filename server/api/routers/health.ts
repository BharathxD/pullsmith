import db from "@/lib/db";
import { redis } from "@/lib/db/redis";
import { publicProcedure, router } from "@/lib/trpc/server";
import { sql } from "drizzle-orm";

type ServiceStatus = {
  status: "ok" | "error";
  latency: number;
  error: string | null;
};

type HealthResponse = {
  status: "ok" | "error";
  timestamp: string;
  services: {
    redis: ServiceStatus;
    mysql: ServiceStatus;
  };
};

const testService = async (
  name: string,
  testFn: () => Promise<unknown>
): Promise<ServiceStatus> => {
  const start = Date.now();
  try {
    await testFn();
    return {
      status: "ok",
      latency: Date.now() - start,
      error: null,
    };
  } catch (error) {
    return {
      status: "error",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : `Unknown ${name} error`,
    };
  }
};

export const healthRouter = router({
  health: publicProcedure.query(async (): Promise<HealthResponse> => {
    const [redisStatus, mysqlStatus] = await Promise.all([
      testService("Redis", () => redis.ping()),
      testService("MySQL", () => db.execute(sql`SELECT 1`)),
    ]);

    const hasErrors =
      redisStatus.status === "error" || mysqlStatus.status === "error";

    return {
      status: hasErrors ? "error" : "ok",
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus,
        mysql: mysqlStatus,
      },
    };
  }),
});

export type HealthRouter = typeof healthRouter;
