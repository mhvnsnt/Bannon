const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// Add import
if (!content.includes("import { AgentToolsModal }")) {
    content = content.replace("import { GitHubIntegration } from './GitHubIntegration';", "import { GitHubIntegration } from './GitHubIntegration';\nimport { AgentToolsModal } from './AgentToolsModal';");
}

// Remove old GitHubIntegration block
content = content.replace(
    /\{\s*showAgentTools\s*&&\s*\(\s*<div className="w-full bg-slate-900 border-b border-slate-800 p-4 flex justify-center">\s*<GitHubIntegration userId="local-user-id" \/>\s*<\/div>\s*\)\s*\}/g,
    ""
);

// Add the AgentToolsModal
content = content.replace(
    "<AgentResourceMonitor />",
    "<AgentResourceMonitor />\n      <AgentToolsModal isOpen={showAgentTools} onClose={() => setShowAgentTools(false)} userId=\"local-user-id\" />"
);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Patched AgentView to use AgentToolsModal");
