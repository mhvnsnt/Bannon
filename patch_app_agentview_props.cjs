const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "<AgentView \n                    hardwareCheck={hardwareCheck} \n                    activeProjectId={activeProjectId} \n                    setActiveProjectId={setActiveProjectId} \n                  />",
  "<AgentView \n                    hardwareCheck={hardwareCheck} \n                    activeProjectId={activeProjectId} \n                    setActiveProjectId={setActiveProjectId} \n                    onOpenAgentTools={() => setIsAgentToolsOpen(true)} \n                  />"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx AgentView props");
