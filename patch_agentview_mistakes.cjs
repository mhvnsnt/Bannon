const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

if (!content.includes('import { AI_BUILDER_MISTAKES }')) {
    content = content.replace(
        "import OfflineDashboard from './OfflineDashboard';",
        "import OfflineDashboard from './OfflineDashboard';\nimport { AI_BUILDER_MISTAKES } from '../data/ai_mistakes';"
    );
}

// Add state for showing mistakes
if (!content.includes('const [showMistakes, setShowMistakes]')) {
    content = content.replace(
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);",
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const [showMistakes, setShowMistakes] = useState(false);"
    );
}

const exportPersona = `<button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({ personality }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'persona.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded p-1 w-full"
                >
                  Export Persona
                </button>`;

const mistakesUI = `
            </div>
            
            {/* Top 100 AI Builder Mistakes Section */}
            <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-black/5 pb-2 cursor-pointer" onClick={() => setShowMistakes(!showMistakes)}>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Top AI Builder Mistakes</span>
                    <span className="ml-auto text-xs">{showMistakes ? '▲' : '▼'}</span>
                </div>
                {showMistakes && (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    <p className="text-[10px] text-slate-500 italic mb-2">A checklist of architectural and UX mistakes to avoid when building AI apps.</p>
                    {AI_BUILDER_MISTAKES.map((mistake, i) => (
                      <div key={i} className="text-[10px] text-slate-700 font-medium bg-slate-50 p-2 rounded border border-black/5">
                        {mistake}
                      </div>
                    ))}
                    <button className="mt-2 text-[10px] font-bold bg-indigo-600 text-white rounded p-1 w-full opacity-50 cursor-not-allowed">
                      + Add Rule (Coming Soon)
                    </button>
                  </div>
                )}
            </div>
`;

content = content.replace(exportPersona, exportPersona + mistakesUI);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Patched AgentView with AI builder mistakes list");
