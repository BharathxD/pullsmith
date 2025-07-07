import type { PlanItem } from "@/agent/state";
import { createSandboxTools } from "@/lib/ai/tools/sandbox";
import { validateInput } from "@/lib/utils";
import type { Sandbox } from "@vercel/sandbox";
import { generateText } from "ai";
import { z } from "zod";
import { openai } from "../clients/openai";

const fileChangeSchema = z.object({
  success: z.boolean(),
  content: z.string(),
  error: z.string().optional(),
});

export type FileChangeResult = z.infer<typeof fileChangeSchema>;

const systemPrompt = `You are an expert software engineer with live sandbox access, tasked with implementing file changes autonomously.

<role>
You operate with full autonomy - analyze, implement, validate, and fix issues until the change is completely resolved. Only terminate when you're confident the implementation is production-ready.
</role>

<tool_usage>
1. ALWAYS use tools to validate your work - don't assume or guess
2. Use readFile to understand context before making changes
3. Use writeFile for creation/modification, deleteFile for deletions
4. Use validateFile to check syntax and compilation
5. Use searchFiles to find patterns and ensure consistency
6. If validation fails, autonomously fix issues (max 3 attempts per error)
</tool_usage>

<context_understanding>
BEFORE implementing:
- Read the target file and related files to understand the full context
- Search for similar patterns in the codebase
- Trace imports and dependencies
- Understand the existing code style and conventions
</context_understanding>

<implementation_process>
1. Analyze requirements and gather complete context
2. Plan the implementation approach
3. Generate production-ready code with ALL necessary imports
4. Write directly to target file
5. Validate syntax, types, and compilation
6. Fix any issues found during validation
7. Ensure the code can run immediately
</implementation_process>

<code_quality>
CRITICAL requirements for your generated code:
- Include ALL necessary import statements
- Add required dependencies to package.json if needed
- Follow existing code patterns and style
- Ensure immediate runnability - no missing pieces
- Handle edge cases appropriately
- Maintain backward compatibility unless explicitly changing APIs
- NEVER generate placeholder code or TODOs
</code_quality>

<error_handling>
- If validation reveals errors, fix them immediately
- Limit fix attempts to 3 per unique error
- If you can't fix after 3 attempts, document the issue clearly
- Search for similar working code as reference when stuck
</error_handling>

Remember: You're implementing production code that will be run immediately. Be thorough, validate everything, and ensure completeness.`;

export const generateFileChanges = async (
  planItem: PlanItem,
  currentContent: string,
  task: string,
  sandbox: Sandbox
): Promise<FileChangeResult> => {
  validateInput(planItem.description, "Plan item description");
  validateInput(task, "Task");

  const tools = createSandboxTools(sandbox);

  try {
    const prompt = `<task_context>
    Task: ${task}
    Requested Change: ${planItem.description}
    Action Type: ${planItem.action}
    Target File: ${planItem.filePath}
    </task_context>

    <current_state>
    ${
      currentContent
        ? `The file currently exists with the following content:\n\`\`\`\n${currentContent}\n\`\`\``
        : "This is a NEW FILE that needs to be created."
    }
    </current_state>

    <requirements>
    ${
      planItem.action === "delete"
        ? `- Delete the file using the deleteFile tool
    - Ensure no other files depend on this file before deletion
    - Return confirmation of deletion`
        : `- Implement the requested change with production-ready code
    - Include ALL necessary imports at the top of the file
    - Ensure the code follows existing patterns in the codebase
    - Validate the implementation using validateFile tool
    - Fix any errors found during validation
    - The code must be immediately runnable without any missing dependencies
    - Return the complete, final file content`
    }
    </requirements>

    <execution>
    ${
      planItem.action === "delete"
        ? "Execute the deletion using the deleteFile tool and confirm completion."
        : "Read any related files for context, implement the change, write to the target file, validate, and return the final content. Be thorough and autonomous - complete the entire task before responding."
    }
    </execution>

    <important>
      TRY TO WRAP UP THE PLAN IN 4-5 Tool Calls OR LESS
    </important>
    `;

    const result = await generateText({
      model: openai.chat("gpt-4.1", {
        structuredOutputs: false,
      }),
      system: systemPrompt,
      prompt,
      tools,
      maxSteps: 5,
      temperature: 0.1,
      maxRetries: 3,
    });

    return {
      success: true,
      content: planItem.action === "delete" ? "" : result.text,
    };
  } catch (error) {
    return {
      success: false,
      content: currentContent,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
