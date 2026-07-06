const fs = require('fs');

// AgentView.tsx
let agentView = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

if (!agentView.includes('const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);')) {
  // Try another useState
  agentView = agentView.replace(
    /const \[showAgentTools, setShowAgentTools\] = useState\(false\);/,
    "const [showAgentTools, setShowAgentTools] = useState(false);\n  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);"
  );
}

// Add imports
if (!agentView.includes('Maximize2')) {
  agentView = agentView.replace(
    "import { Send,",
    "import { Send, Maximize2, Minimize2, X,"
  );
}
fs.writeFileSync('src/components/AgentView.tsx', agentView);

// GitHubActions.tsx
let ghActions = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');
if (!ghActions.includes('RefreshCw')) {
    ghActions = ghActions.replace(
        "import { Github,",
        "import { Github, RefreshCw,"
    );
}
fs.writeFileSync('src/components/GitHubActions.tsx', ghActions);

console.log("Fixed final 3!");
