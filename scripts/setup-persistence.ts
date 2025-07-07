import { setupCheckpointer } from "../lib/db/checkpointer";

/**
 * Setup script for LangGraph persistence
 *
 * Run this once to initialize the PostgreSQL checkpointer tables
 */
export const setupPersistence = async () => {
  console.log("🚀 Setting up LangGraph persistence...");

  try {
    await setupCheckpointer();

    console.log("✅ LangGraph persistence setup completed successfully!");
    console.log("📝 Next steps:");
    console.log(
      "1. Ensure DATABASE_URI is set to your Neon Postgres connection string"
    );
    console.log(
      "2. Use executeAgentWithPersistence() or streamAgentWithPersistence() for agent runs"
    );
    console.log(
      "3. Monitor threads using getThreadState() and getThreadHistory()"
    );
  } catch (error) {
    console.error("❌ Failed to setup persistence:", error);
    throw error;
  }
};

if (require.main === module) {
  setupPersistence()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
