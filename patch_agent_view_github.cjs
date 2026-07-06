const fs = require('fs');
let file = 'src/components/AgentView.tsx';
let content = fs.readFileSync(file, 'utf8');

const importStr = "import { GitHubIntegration } from './GitHubIntegration';";
content = content.replace("import GitHubActions from './GitHubActions';", "import GitHubActions from './GitHubActions';\n" + importStr);

const renderStr = `
        {/* Actions Menu for Mobile & Desktop */}
        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-3 lg:mt-0">
          <div className="flex items-center gap-2 w-full lg:w-auto">
`;
const newRenderStr = `
        {/* Actions Menu for Mobile & Desktop */}
        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-3 lg:mt-0">
          <button onClick={() => setShowAgentTools(!showAgentTools)} className="px-3 py-1.5 text-xs font-bold rounded bg-slate-100 border border-slate-200">Agent Tools</button>
          <div className="flex items-center gap-2 w-full lg:w-auto">
`;

// wait we need to add the state for showAgentTools
content = content.replace("const [isHistoryOpen, setIsHistoryOpen] = useState(true);", "const [isHistoryOpen, setIsHistoryOpen] = useState(true);\n  const [showAgentTools, setShowAgentTools] = useState(false);");

content = content.replace(renderStr, newRenderStr);

const toolsRenderStr = `
      <div className="flex-1 flex overflow-hidden">
`;
const newToolsRenderStr = `
      {showAgentTools && (
        <div className="w-full bg-slate-900 border-b border-slate-800 p-4 flex justify-center">
          <GitHubIntegration userId="local-user-id" />
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
`;

content = content.replace(toolsRenderStr, newToolsRenderStr);

fs.writeFileSync(file, content);
console.log("Patched AgentView.tsx");
