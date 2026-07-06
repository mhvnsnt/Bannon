const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
if (!app.includes("import { AgentToolsModal }")) {
  app = app.replace("import { NavMascot } from './components/NavMascot';", "import { NavMascot } from './components/NavMascot';\nimport { AgentToolsModal } from './components/AgentToolsModal';");
}
fs.writeFileSync('src/App.tsx', app);
