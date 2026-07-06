const fs = require('fs');

// App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("Search, Mic", "Search, Zap, Mic");
if (!app.includes("import { AgentToolsModal }")) {
  app = app.replace("import { TerminalEmulator } from './components/TerminalEmulator';", "import { TerminalEmulator } from './components/TerminalEmulator';\nimport { AgentToolsModal } from './components/AgentToolsModal';");
}
fs.writeFileSync('src/App.tsx', app);

// AgentToolsModal.tsx
let agentTools = fs.readFileSync('src/components/AgentToolsModal.tsx', 'utf8');
agentTools = agentTools.replace("import { cn } from '../lib/utils'; // assuming cn is here or just omit", "");
agentTools = agentTools.replace("import { cn } from '../utils/cn'; // wait, cn might be in a different path. It's usually imported from lib/utils.ts or from App.tsx. I'll just copy it or import from App.tsx.", "");
fs.writeFileSync('src/components/AgentToolsModal.tsx', agentTools);

// AgentView.tsx
let agentView = fs.readFileSync('src/components/AgentView.tsx', 'utf8');
if (!agentView.includes("isSettingsMinimized")) {
    agentView = agentView.replace(
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);",
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);"
    );
}
if (!agentView.includes("Maximize2")) {
    agentView = agentView.replace(
        "import { AlertCircle,",
        "import { AlertCircle, Maximize2, Minimize2, X,"
    );
}
// if the replace above failed because AlertCircle, was formatted differently
if (!agentView.includes("Maximize2")) {
    agentView = agentView.replace(
        "import {\n  Play,",
        "import {\n  Play,\n  Maximize2,\n  Minimize2,\n  X,"
    );
}
fs.writeFileSync('src/components/AgentView.tsx', agentView);

// GitHubActions.tsx
let ghActions = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');
if (!ghActions.includes("RefreshCw")) {
    ghActions = ghActions.replace("import { Download,", "import { Download, RefreshCw,");
}
fs.writeFileSync('src/components/GitHubActions.tsx', ghActions);

console.log("Fixed all!");
