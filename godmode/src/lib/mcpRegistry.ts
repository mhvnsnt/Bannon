import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Initialize the MCP Client to talk to standard Claude Connectors
export const mcpClient = new Client(
  { name: "god-mode-mcp-bridge", version: "1.0.0" },
  { capabilities: {} }
);

const activeTransports = new Map<string, StdioClientTransport>();

export async function syncMCPConnectors(activeTools: string[]) {
  console.log(`[MCP REGISTRY] Syncing connectors for: ${activeTools.join(', ')}`);
  
  // Clean up removed tools
  for (const [tool, transport] of activeTransports.entries()) {
    if (!activeTools.includes(tool)) {
      console.log(`[MCP REGISTRY] Severing ${tool} from the network matrix`);
      // Optionally close the transport if the SDK supports it:
      try {
        await transport.close();
      } catch (e) {
        // Ignore errors on close
      }
      activeTransports.delete(tool);
    }
  }

  // Add new tools
  for (const tool of activeTools) {
    if (!activeTransports.has(tool)) {
      console.log(`[MCP REGISTRY] Initializing @modelcontextprotocol/server-${tool}`);
      try {
        const transport = new StdioClientTransport({
          command: "npx",
          args: ["-y", `@modelcontextprotocol/server-${tool}`]
        });
        await mcpClient.connect(transport);
        activeTransports.set(tool, transport);
        console.log(`[MCP REGISTRY] Successfully bound @modelcontextprotocol/server-${tool} to active swarm`);
      } catch (error: any) {
        console.error(`[MCP REGISTRY] Failed to bind ${tool}`, error.message);
      }
    }
  }
}
