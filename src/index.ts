#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMemoryTools } from "./tools/memory-tools.js";
import { registerSessionTools } from "./tools/session-tools.js";

const server = new McpServer({
  name: "claude-memory-mcp",
  version: "0.4.0",
});

registerMemoryTools(server);
registerSessionTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
