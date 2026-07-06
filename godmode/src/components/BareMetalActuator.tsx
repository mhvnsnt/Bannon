import React, { useState } from 'react';
import { Terminal, Shield, Zap, AlertTriangle, Code, Play } from 'lucide-react';

export function BareMetalActuator() {
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<{ id: string, text: string, type: 'info' | 'error' | 'success' }[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const predefinedActions = [
    { label: "Update Packages", cmd: "sudo apt-get update && sudo apt-get upgrade -y" },
    { label: "Compile C++ Engine", cmd: "g++ -O3 -march=native -o myth_engine core.cpp" },
    { label: "Restart Daemon", cmd: "systemctl restart mythengine.service" },
    { label: "Clear Cache", cmd: "rm -rf ~/.cache/* && sync && echo 3 > /proc/sys/vm/drop_caches" },
  ];

  const handleExecute = () => {
    if (!command.trim() || isRunning) return;
    
    setIsRunning(true);
    const newLog = {
      id: Math.random().toString(),
      text: `> PREPARING BARE METAL AT localhost:9999...`,
      type: 'info' as const
    };
    
    setLogs([newLog, ...logs]);

    setTimeout(() => {
      setLogs([{
        id: Math.random().toString(),
        text: `Executing via Physical Syntactic Actuation:`,
        type: 'info' as const
      }, newLog, ...logs]);
      
      // We physically output the raw bash block here, as strictly specified in AGENTS.md
      setTimeout(() => {
         setLogs(prev => [{
            id: Math.random().toString(),
            text: `\`\`\`bash\n${command}\n\`\`\``,
            type: 'success'
         }, ...prev]);
         setIsRunning(false);
         setCommand('');
      }, 1000);
    }, 500);
  };

  return (
    <div className="w-full h-full bg-[#050505] text-[#ff2a85] font-mono p-4 flex flex-col border-l border-[#ff2a85]/40 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-2 text-red-500 opacity-20">
          <AlertTriangle className="w-24 h-24" />
        </div>
        
        <div className="border-b border-[#ff2a85]/50 pb-3 mb-4 shrink-0 relative z-10">
           <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
             <Zap className="w-4 h-4" /> Bare Metal Actuator
           </h2>
           <p className="text-[10px] text-[#ff2a85]/60 mt-1">
             Direct physical mechanical write access via localhost port 9999. Do not explain; output strictly executable syntax.
           </p>
        </div>

        <div className="flex-1 flex flex-col gap-4 relative z-10">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
              placeholder="Enter literal mechanical shell command..."
              className="flex-1 bg-black border border-[#ff2a85]/50 p-3 text-xs text-white focus:outline-none focus:border-red-500 font-mono transition-colors rounded shadow-[inset_0_0_10px_rgba(255,42,133,0.1)]"
            />
            <button 
              onClick={handleExecute}
              disabled={isRunning || !command.trim()}
              className="bg-[#220011] border border-[#ff2a85] px-6 py-3 hover:bg-[#ff2a85]/20 disabled:opacity-50 transition-colors flex items-center justify-center text-[#ff2a85] font-bold tracking-widest text-[10px] uppercase rounded disabled:hover:bg-[#220011]"
            >
              {isRunning ? <Terminal className="w-4 h-4 animate-bounce" /> : "Write Vector"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
            {predefinedActions.map((action, i) => (
              <button 
                key={i}
                onClick={() => setCommand(action.cmd)}
                className="bg-black border border-gray-800 hover:border-[#ff2a85]/50 text-gray-400 hover:text-[#ff2a85] p-2 text-[9px] text-left uppercase tracking-widest transition-colors rounded"
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-black border border-gray-800 rounded p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2">
             <div className="text-[10px] text-gray-500 uppercase flex items-center justify-between mb-2">
               <span>Raw Physical Output Block</span>
               <span className="flex items-center gap-1 text-red-500 animate-pulse"><Shield className="w-3 h-3" /> Root Execution Mode</span>
             </div>
             
             {logs.map((log) => (
               <div key={log.id} className={`font-mono text-xs whitespace-pre-wrap ${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-emerald-400 font-bold bg-[#001100] border border-emerald-900 p-2 rounded' : 'text-gray-400'}`}>
                 {log.text}
               </div>
             ))}
             {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-700 text-xs font-mono uppercase tracking-widest border border-dashed border-gray-800 rounded">
                  AWAITING PHYSICAL ACTUATION COMMAND
                </div>
             )}
          </div>
        </div>
    </div>
  );
}
