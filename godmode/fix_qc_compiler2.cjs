const fs = require('fs');
const file = 'src/components/QuantumChat.tsx';
let content = fs.readFileSync(file, 'utf8');

const compilerComponent = `
const AppletCompilerState = () => {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1500); // Linting
    const t2 = setTimeout(() => setStage(2), 3000); // Preview Ready
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="mt-2 p-2 bg-[#050505] border border-[#222] rounded flex items-center gap-3 text-[10px] font-mono text-gray-400">
      <div className="flex items-center gap-1.5">
        <div className={\`w-2 h-2 rounded-full \${stage >= 0 ? 'bg-cyan-500 shadow-[0_0_5px_#06b6d4] animate-pulse' : 'bg-gray-700'}\`}></div>
        <span className={stage === 0 ? 'text-cyan-400' : ''}>Compiling</span>
      </div>
      <div className="w-4 h-px bg-[#333]"></div>
      <div className="flex items-center gap-1.5">
        <div className={\`w-2 h-2 rounded-full \${stage >= 1 ? (stage === 1 ? 'bg-yellow-500 shadow-[0_0_5px_#eab308] animate-pulse' : 'bg-yellow-500') : 'bg-gray-700'}\`}></div>
        <span className={stage === 1 ? 'text-yellow-400' : ''}>Linting</span>
      </div>
      <div className="w-4 h-px bg-[#333]"></div>
      <div className="flex items-center gap-1.5">
        <div className={\`w-2 h-2 rounded-full \${stage >= 2 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-gray-700'}\`}></div>
        <span className={stage === 2 ? 'text-emerald-400 font-bold' : ''}>Preview Ready</span>
      </div>
    </div>
  );
};
`;

if (!content.includes('AppletCompilerState = () =>')) {
  content = content.replace('export default function QuantumChat', compilerComponent + '\nexport default function QuantumChat');
}

fs.writeFileSync(file, content);
console.log('AppletCompilerState function added');
