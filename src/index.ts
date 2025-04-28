import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { registerTools } from "./tools";
dotenv.config();

const server = new McpServer({
  name: "squads-mcp",
  version: "0.0.1",
});

registerTools(server);

const transport = new StdioServerTransport();
server.connect(transport);
