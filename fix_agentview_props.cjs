const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

content = content.replace("onOpenAgentTools?: (id: string | null) => void;\n  onOpenAgentTools?: () => void;", "onOpenAgentTools?: () => void;");

// Also check the function args
content = content.replace("export default function AgentView({ \n  hardwareCheckStatus, \n  hardwareCheck, \n  activeProjectId, \n  setActiveProjectId,\n  onOpenAgentTools\n}: AgentViewProps) {", 
"export default function AgentView({ hardwareCheckStatus, hardwareCheck, activeProjectId, setActiveProjectId, onOpenAgentTools }: AgentViewProps) {");
fs.writeFileSync('src/components/AgentView.tsx', content);
