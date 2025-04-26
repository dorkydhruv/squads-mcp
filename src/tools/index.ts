import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sqdsTools } from "./sqds";
import { configTools } from "./config";

export function registerTools(server: McpServer) {
  // Register all tools here
  // Example: registerTool('toolName', toolFunction);

  // Config and Wallet tools
  configTools.map((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.run);
  });

  // Main sqds tools
  sqdsTools.map((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.run);
  });
}
