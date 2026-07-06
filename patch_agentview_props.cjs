const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// Add prop
content = content.replace(
  "setActiveProjectId?: (id: string | null) => void;",
  "setActiveProjectId?: (id: string | null) => void;\n  onOpenAgentTools?: () => void;"
);

// Add to component args
content = content.replace(
  "setActiveProjectId",
  "setActiveProjectId,\n  onOpenAgentTools"
);

// Replace button onClick
content = content.replace(
  "onClick={() => setShowAgentTools(!showAgentTools)}",
  "onClick={() => onOpenAgentTools ? onOpenAgentTools() : setShowAgentTools(!showAgentTools)}"
);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Patched AgentView props");
