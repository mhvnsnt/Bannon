const fs = require('fs');

// AgentView.tsx
let agentView = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// I need to properly add the state and imports. The previous script didn't match.
if (!agentView.includes('const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);')) {
  // Just inject it after the first useState
  agentView = agentView.replace(
    /const \[aiMode, setAiMode\] = useState<AiMode>\('standard'\);/,
    "const [aiMode, setAiMode] = useState<AiMode>('standard');\n  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);"
  );
}

// And imports
if (!agentView.includes('Maximize2')) {
  agentView = agentView.replace(
    /import \{\s*AlertCircle,/,
    "import {\n  Maximize2,\n  Minimize2,\n  X,\n  AlertCircle,"
  );
}

fs.writeFileSync('src/components/AgentView.tsx', agentView);

// GitHubActions.tsx
let ghActions = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');
if (!ghActions.includes('RefreshCw,')) {
    ghActions = ghActions.replace(
        /import \{\s*Download,/,
        "import {\n  RefreshCw,\n  Download,"
    );
}
fs.writeFileSync('src/components/GitHubActions.tsx', ghActions);
