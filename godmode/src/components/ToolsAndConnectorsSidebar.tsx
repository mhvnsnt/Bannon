import React, { useState, useEffect } from "react";

// The master registry of available MCP tools
const universalConnectors = [
  { id: "github", name: "GitHub Repo Control", category: "Code and DevOps" },
  { id: "postgres", name: "PostgreSQL Engine", category: "Code and DevOps" },
  { id: "sentry", name: "Sentry Error Traces", category: "Code and DevOps" },
  { id: "linear", name: "Linear Issue Tracker", category: "Code and DevOps" },
  { id: "playwright", name: "Playwright Automation", category: "Execution" },
  { id: "figma", name: "Figma UI Parser", category: "Execution" },
  { id: "segment", name: "Segment Analytics", category: "Data Strategy" },
  { id: "brave", name: "Brave Web Search", category: "Utilities" },
  { id: "gemini", name: "Gemini Context Bridge", category: "Utilities" },
];

export function ToolsAndConnectorsSidebar() {
  const [activeTools, setActiveTools] = useState<string[]>(() => {
    const saved = localStorage.getItem("mcpActiveTools");
    return saved ? JSON.parse(saved) : ["github", "brave"];
  });

  useEffect(() => {
    localStorage.setItem("mcpActiveTools", JSON.stringify(activeTools));
  }, [activeTools]);

  const handleToggleTool = async (toolId: string) => {
    const isCurrentlyActive = activeTools.includes(toolId);

    // Optimistic UI state update for instant visual feedback
    if (isCurrentlyActive) {
      setActiveTools(activeTools.filter((id) => id !== toolId));
    } else {
      setActiveTools([...activeTools, toolId]);
    }

    // Ping the backend to physically mount or unmount the MCP server connection
    try {
      await fetch("/api/mcp/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolId, state: !isCurrentlyActive }),
      });
    } catch (error) {
      console.error("Failed to sync tool state with swarm container");
    }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col overflow-y-auto">
      <h2 className="text-white text-lg font-bold mb-6 tracking-wide">
        Tools and Connectors
      </h2>

      {/* Group tools by category dynamically */}
      {["Code and DevOps", "Execution", "Data Strategy", "Utilities"].map(
        (category) => (
          <div key={category} className="mb-6">
            <h3 className="text-gray-400 text-xs uppercase font-semibold mb-3 tracking-wider">
              {category}
            </h3>
            <div className="flex flex-col gap-3">
              {universalConnectors
                .filter((tool) => tool.category === category)
                .map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-200">{tool.name}</span>

                    {/* Modern aesthetic toggle switch */}
                    <button
                      onClick={() => handleToggleTool(tool.id)}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none ${
                        activeTools.includes(tool.id)
                          ? "bg-purple-600"
                          : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`block w-3 h-3 bg-white rounded-full absolute top-1 transition-transform duration-200 ${
                          activeTools.includes(tool.id)
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export default ToolsAndConnectorsSidebar;
