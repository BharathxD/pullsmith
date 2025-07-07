import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";
import { env } from "@/env";

const checkpointerPool = new Pool({
  connectionString: env.DATABASE_URI.replace("main", "pullsmith_checkpointer"),
});

const checkpointer = new PostgresSaver(checkpointerPool);

export const setupCheckpointer = async () => {
  try {
    await checkpointer.setup();
    console.log("✅ LangGraph checkpointer tables created successfully");
  } catch (error) {
    console.error("❌ Failed to setup checkpointer:", error);
    throw error;
  }
};

export { checkpointer };
