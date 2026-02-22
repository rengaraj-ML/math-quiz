/**
 * Entry point for the Math Quiz MCP server.
 * Run with: npx math-quiz-mcp  (HTTP mode for Claude.ai)
 * Or: npx math-quiz-mcp --stdio  (stdio mode for Claude Desktop)
 */

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { createServer } from "./server.js";

async function startStreamableHTTPServer(
  createServerFn: () => McpServer
): Promise<void> {
  const port = parseInt(process.env.PORT ?? "3001", 10);

  const app = createMcpExpressApp({ host: "0.0.0.0" });
  app.use(cors());
  app.use(express.json());

  // MCP Streamable HTTP requires Accept: text/event-stream (and application/json for POST).
  // Some clients (e.g. Claude.ai connector) may not send it; inject if missing.
  app.use("/mcp", (req: Request, _res: Response, next: () => void) => {
    const accept = req.headers["accept"] ?? "";
    if (!accept.includes("text/event-stream")) {
      req.headers["accept"] = accept ? `${accept}, text/event-stream` : "application/json, text/event-stream";
    }
    if (!accept.includes("application/json") && req.method === "POST") {
      req.headers["accept"] = (req.headers["accept"] ?? "") + ", application/json";
    }
    next();
  });

  app.all("/mcp", async (req: Request, res: Response) => {
    const server = createServerFn();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const httpServer = app.listen(port, (err?: Error) => {
    if (err) {
      console.error("Failed to start server:", err);
      process.exit(1);
    }
    console.log(`Math Quiz MCP server listening on http://localhost:${port}/mcp`);
  });

  const shutdown = () => {
    console.log("\nShutting down...");
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function startStdioServer(createServerFn: () => McpServer): Promise<void> {
  await createServerFn().connect(new StdioServerTransport());
}

async function main() {
  if (process.argv.includes("--stdio")) {
    await startStdioServer(createServer);
  } else {
    await startStreamableHTTPServer(createServer);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
