const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

content = content.replace(
    '<button onClick={() => setShowAgentTools(!showAgentTools)} className="px-3 py-1.5 text-xs font-bold rounded bg-slate-100 border border-slate-200">Agent Tools</button>',
    '<button onClick={() => setShowAgentTools(!showAgentTools)} className="w-full lg:w-auto px-4 py-2 text-sm font-bold rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2 shadow-sm"><Zap className="w-4 h-4" /> Agent Tools</button>'
);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Patched AgentView.tsx Agent Tools Button");
