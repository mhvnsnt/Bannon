const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

content = content.replace(
    "  setActiveProjectId,\n  onOpenAgentTools?: () => void;",
    "  setActiveProjectId?: (id: string | null) => void;\n  onOpenAgentTools?: () => void;"
);

content = content.replace(
    "export default function AgentView({ hardwareCheck, activeProjectId, setActiveProjectId }: AgentViewProps = {}) {",
    "export default function AgentView({ hardwareCheck, activeProjectId, setActiveProjectId, onOpenAgentTools }: AgentViewProps = {}) {"
);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Fixed AgentView props again");
