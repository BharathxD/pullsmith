import { drizzle } from "drizzle-orm/planetscale-serverless";
import { env } from "@/env";

const db = drizzle(env.DATABASE_URL);

export default db;
