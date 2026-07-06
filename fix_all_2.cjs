const fs = require('fs');

// App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
if (!app.includes("import { AgentToolsModal }")) {
  app = app.replace("import { TerminalEmulator } from './components/TerminalEmulator';", "import { TerminalEmulator } from './components/TerminalEmulator';\nimport { AgentToolsModal } from './components/AgentToolsModal';");
}
fs.writeFileSync('src/App.tsx', app);

// AgentView.tsx
let agentView = fs.readFileSync('src/components/AgentView.tsx', 'utf8');
if (!agentView.includes("isSettingsMinimized")) {
    agentView = agentView.replace(
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);",
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);"
    );
}

agentView = agentView.replace(
  "import { AlertCircle,",
  "import { AlertCircle, Maximize2, Minimize2, X,"
);

// Fallback if the first replacement didn't work
if (!agentView.includes("Maximize2")) {
  agentView = agentView.replace(
    "import { Settings2,",
    "import { Settings2, Maximize2, Minimize2, X,"
  );
}
fs.writeFileSync('src/components/AgentView.tsx', agentView);

// GitHubActions.tsx
let ghActions = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');
if (!ghActions.includes("RefreshCw")) {
    ghActions = ghActions.replace("import {\n  Play,", "import {\n  Play,\n  RefreshCw,");
    ghActions = ghActions.replace("import { Download,", "import { Download, RefreshCw,");
}
fs.writeFileSync('src/components/GitHubActions.tsx', ghActions);

console.log("Fixed all 2!");
