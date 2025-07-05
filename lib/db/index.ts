import { drizzle } from "drizzle-orm/planetscale-serverless";
import { env } from "@/env";
import * as schema from "./schema";

const db = drizzle(env.DATABASE_URL, { schema });

export default db;
