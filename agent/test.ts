import { runAgent } from "./agent";

async function testAgent() {
  const task = "Add a brief description about the repository to the README.md";
  const repoUrl = "https://github.com/BharathxD/pullsmith";
  const baseBranch = "main";

  console.log("🧪 Testing Pullsmith Agent");
  console.log("=".repeat(51));

  try {
    const result = await runAgent(task, repoUrl, baseBranch);

    console.log("\n📋 Test Results:");
    console.log("=".repeat(51));
    console.log("Final State:");
    console.log(`- Current Step: ${result.currentStep}`);
    console.log(`- Merkle Root: ${result.merkleRoot}`);
    console.log(`- Indexed Files: ${result.indexedFiles.length}`);
    console.log(`- Changed Files: ${result.changedFiles.length}`);
    console.log(`- Relevant Files: ${result.relevantFiles.length}`);
    console.log(`- Plan Items: ${result.plan.length}`);
    console.log(`- Edited Files: ${result.editedFiles.length}`);
    console.log(`- Sandbox ID: ${result.sandboxId}`);
    console.log(`- Branch Name: ${result.branchName}`);
    console.log(`- PR URL: ${result.prUrl}`);
    console.log(`- Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors:");
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testAgent();
