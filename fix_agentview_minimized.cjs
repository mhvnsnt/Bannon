const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// I might have replaced the wrong useState in fix_all
if (!content.includes('const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);')) {
  // Let's just find the first useState and insert it after
  const firstUseState = "const [aiMode, setAiMode] = useState<AiMode>('standard');";
  content = content.replace(
    firstUseState,
    firstUseState + "\n  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);"
  );
}

// And the imports
if (!content.includes('Maximize2')) {
  content = content.replace("import {\n  Play,", "import {\n  Play,\n  Maximize2,\n  Minimize2,\n  X,");
}
// and on one line
if (!content.includes('Maximize2')) {
    content = content.replace("import { Play", "import { Play, Maximize2, Minimize2, X");
}
fs.writeFileSync('src/components/AgentView.tsx', content);
