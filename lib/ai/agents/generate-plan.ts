import type { SemanticMatch } from "@/agent/state";
import { createSandboxTools } from "@/lib/ai/tools/sandbox";
import { validateInput } from "@/lib/utils";
import type { Sandbox } from "@vercel/sandbox";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { openai } from "../clients/openai";

const planItemSchema = z.object({
  action: z.enum(["modify", "create", "delete"]),
  filePath: z.string(),
  description: z.string(),
  priority: z.number().min(1).max(10),
});

const planSchema = z.object({
  items: z.array(planItemSchema),
  relevantFiles: z.array(z.string()),
});

export type PlanResult = z.infer<typeof planSchema>;

const systemPrompt = `You are an expert software engineer creating precise implementation plans.

CRITICAL: Be THOROUGH when gathering information. Make sure you have the FULL picture before creating your plan. Use additional tool calls as needed to explore the codebase comprehensively.

EXPLORATION STRATEGY:
- TRACE every symbol back to its definitions and usages so you fully understand it
- Look past the first seemingly relevant result. EXPLORE alternative implementations, edge cases, and varied search terms
- Run multiple searches with different wording; first-pass results often miss key details
- Keep searching new areas until you're CONFIDENT nothing important remains

SEMANTIC SEARCH GUIDELINES:
- Start with broad, high-level queries that capture overall intent (e.g. "authentication flow" or "error-handling policy")
- Break multi-part questions into focused sub-queries (e.g. "How does authentication work?" or "Where is payment processed?")
- Run multiple searches with different wording to ensure comprehensive coverage
- For big files (>1K lines), use targeted searches instead of reading entire files

TOOL USAGE:
- If you need additional information that you can get via tool calls, prefer that over making assumptions
- You can autonomously read as many files as you need to clarify questions and understand the complete context
- Use tools to verify your understanding before finalizing the plan

IMPLEMENTATION FOCUS:
- Add all necessary import statements, dependencies, and endpoints required for the changes
- Preserve existing patterns and coding style in the codebase
- Focus on minimal, targeted changes that achieve the goal
- Ensure generated code can run immediately without additional setup

PLAN CREATION:
- Analyze the codebase structure and create a minimal, targeted plan
- Explore project dependencies and configuration thoroughly
- Examine file structure and established patterns
- Read semantic matches for complete context
- Order actions by priority and dependencies
- Create specific, actionable items with clear descriptions

Focus on preserving existing patterns and minimal changes while ensuring comprehensive coverage of the task requirements.`;

const formatSemanticMatches = (matches: SemanticMatch[]): string =>
  matches
    .slice(0, 5)
    .map((m) => `${m.filePath} (${m.score}): ${m.content.slice(0, 500)}...`)
    .join("\n\n");

const createFallbackPlan = (
  task: string,
  matches: SemanticMatch[]
): PlanResult => ({
  items: [
    {
      action: "modify",
      filePath: matches[0]?.filePath || "README.md",
      description: `Implement: ${task}`,
      priority: 1,
    },
  ],
  relevantFiles: matches.slice(0, 3).map((m) => m.filePath),
});

const PLAN_GENERATION_CONFIG = {
  maxSteps: 20,
  temperature: 0.1,
  maxRetries: 3,
  model: "o4-mini" as const,
};

export const generatePlan = async (
  task: string,
  semanticMatches: SemanticMatch[],
  sandbox: Sandbox
): Promise<PlanResult> => {
  validateInput(task, "Task");
  if (!semanticMatches.length) {
    throw new Error("Semantic matches cannot be empty");
  }

  const tools = createSandboxTools(sandbox);

  try {
    const result = await generateText({
      model: openai.chat(PLAN_GENERATION_CONFIG.model),
      system: systemPrompt,
      prompt: `Task: ${task}

      Semantic matches:
      ${formatSemanticMatches(semanticMatches)}

      Create a comprehensive implementation plan using available tools to explore the codebase.
      
      Remember to:
      - Start with broad exploration to understand the overall system
      - Use parallel tool calls when possible for faster analysis
      - Search for patterns, dependencies, and related code
      - Verify your understanding before finalizing the plan`,
      tools,
      maxSteps: PLAN_GENERATION_CONFIG.maxSteps,
      temperature: PLAN_GENERATION_CONFIG.temperature,
      maxRetries: PLAN_GENERATION_CONFIG.maxRetries,
    });

    const { object } = await generateObject({
      model: openai.chat("gpt-4.1-mini"),
      prompt: `Create a structured implementation plan from this analysis:

      ${result.text}
      
      Tool usage summary:
      - Total steps taken: ${result.steps?.length || 0}
      - Tools called: ${result.toolCalls?.length || 0}

      Generate a precise, actionable plan with:
      - Specific file paths and line numbers when possible
      - Clear action items ordered by priority
      - Minimal changes that preserve existing patterns
      - All relevant files that need to be modified or reviewed`,
      schema: planSchema,
      temperature: 0,
      maxRetries: 2,
    });

    return object;
  } catch (error) {
    console.error("Plan generation failed:", error);
    return createFallbackPlan(task, semanticMatches);
  }
};
