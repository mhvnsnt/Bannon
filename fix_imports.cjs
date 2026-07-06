const fs = require('fs');

// Fix AgentToolsModal
let agentTools = fs.readFileSync('src/components/AgentToolsModal.tsx', 'utf8');
agentTools = agentTools.replace("import { cn } from '../utils/cn';", "import { cn } from '../lib/utils'; // assuming cn is here or just omit");
// Wait, I didn't even use `cn` in AgentToolsModal. Let me just remove it.
agentTools = agentTools.replace("import { cn } from '../utils/cn';", "");
fs.writeFileSync('src/components/AgentToolsModal.tsx', agentTools);

// Fix App.tsx missing Zap
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import { Search,", "import { Search, Zap,");
fs.writeFileSync('src/App.tsx', app);

// Fix AgentView missing states and imports
let agentView = fs.readFileSync('src/components/AgentView.tsx', 'utf8');
agentView = agentView.replace("import { AlertCircle,", "import { AlertCircle, Maximize2, Minimize2, X,");
agentView = agentView.replace("onOpenAgentTools?: () => void;\n  onOpenAgentTools?: () => void;", "onOpenAgentTools?: () => void;");

// check if isSettingsMinimized is defined
if (!agentView.includes('const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);')) {
    agentView = agentView.replace(
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);",
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);"
    );
}
fs.writeFileSync('src/components/AgentView.tsx', agentView);

// Fix GitHubActions missing RefreshCw
let ghActions = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');
if (!ghActions.includes("RefreshCw")) {
    ghActions = ghActions.replace("import { Download,", "import { Download, RefreshCw,");
}
fs.writeFileSync('src/components/GitHubActions.tsx', ghActions);

console.log("Fixed missing imports");
