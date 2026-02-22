import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = import.meta.url.endsWith(".ts")
  ? path.join(__dirname, "dist")
  : __dirname;

const MathQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string(),
});

const DisplayMathQuizInputSchema = z.object({
  questions: z.array(MathQuestionSchema),
});

export type MathQuestion = z.infer<typeof MathQuestionSchema>;

/**
 * Creates a new MCP server instance with the display_math_quiz tool and UI resource.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Math Quiz MCP App",
    version: "1.0.0",
  });

  const resourceUri = "ui://math-quiz/mcp-app.html";

  registerAppTool(
    server,
    "display_math_quiz",
    {
      title: "Display Math Quiz",
      description: `Display an interactive math quiz for 6th grade students. You must generate the questions yourself and call this tool with them. Do NOT show raw JSON to the user - this tool renders an interactive quiz UI.

When the user asks for a math quiz (e.g., "Give my son 10 6th grade math questions"), generate the questions and call this tool. Each question must have:
- id: number (1-based index)
- question: string (the math problem)
- options: array of exactly 4 strings (A, B, C, D choices)
- correctIndex: number 0-3 (which option is correct)
- explanation: string (brief explanation of the correct answer)`,
      inputSchema: {
        questions: z.array(
          z.object({
            id: z.number(),
            question: z.string(),
            options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
            correctIndex: z.number().min(0).max(3),
            explanation: z.string(),
          })
        ),
      },
      _meta: { ui: { resourceUri } },
    },
    async (args): Promise<CallToolResult> => {
      const parsed = DisplayMathQuizInputSchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid questions format: ${parsed.error.message}. Each question needs: id, question, options (4 strings), correctIndex (0-3), explanation.`,
            },
          ],
          isError: true,
        };
      }
      const { questions } = parsed.data;
      return {
        content: [
          {
            type: "text",
            text: `Math quiz displayed with ${questions.length} questions. The student can select answers and see feedback inline.`,
          },
        ],
      };
    }
  );

  registerAppResource(
    server,
    "Math Quiz UI",
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const htmlPath = path.join(DIST_DIR, "mcp-app.html");
      const html = await fs.readFile(htmlPath, "utf-8");
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    }
  );

  return server;
}
