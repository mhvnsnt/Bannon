import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, Cpu, Network, Zap, GitCommit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SwarmNode {
  id: string;
  status: 'ACTIVE' | 'REPAIRING' | 'UPGRADING';
  load: number;
}

export function AgenticSwarmMatrix() {
  const [nodes, setNodes] = useState<SwarmNode[]>(
    Array.from({ length: 12 }, (_, i) => ({ id: `SWARM-N${i}`, status: 'ACTIVE', load: Math.random() * 100 }))
  );
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(p => [msg, ...p].slice(0, 10));

  useEffect(() => {
    const cycle = setInterval(() => {
       setNodes(prev => prev.map(n => {
          if (n.status === 'REPAIRING') {
             if (Math.random() > 0.8) {
                addLog(`[HEALING] Core logic rewritten successfully on ${n.id}`);
                return { ...n, status: 'ACTIVE', load: 10 };
             }
             return n;
          }
          let newLoad = n.load + (Math.random() * 10 - 5);
          newLoad = Math.max(0, Math.min(100, newLoad));
          
          if (newLoad > 95 && n.status === 'ACTIVE') {
             addLog(`[ALERT] Corruption detected on ${n.id}. Initiating self-healing rewrite.`);
             return { ...n, status: 'REPAIRING', load: 100 };
          }
          
          return { ...n, load: newLoad };
       }));
    }, 1500);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="w-full h-full bg-[#050508] text-indigo-500 font-mono p-4 flex flex-col border-l border-indigo-900/40 overflow-hidden">
      <div className="border-b border-indigo-900/50 pb-3 mb-4 shrink-0 flex justify-between items-center">
        <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
             <Network className="w-4 h-4" /> Autonomous Agentic Swarms
           </h2>
           <p className="text-[10px] text-indigo-700 mt-1">Deploying self-healing codebases. Rewriting raw source logic on the fly.</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
           </span>
           <span className="text-[10px] font-bold text-indigo-400">SWARM ACTIVE</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 pb-4">
         <div className="bg-[#0a0a1a] border border-indigo-900/30 rounded p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            <h3 className="text-xs uppercase font-bold text-indigo-500 flex items-center gap-2 shrink-0">
               <Cpu className="w-3 h-3" /> Distributed Nodes
            </h3>
            <div className="grid grid-cols-2 gap-2">
               {nodes.map(node => (
                  <div key={node.id} className={`p-2 rounded border text-[10px] ${
                     node.status === 'ACTIVE' ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-400' :
                     'bg-amber-950/20 border-amber-900/30 text-amber-400 animate-pulse'
                  }`}>
                     <div className="flex justify-between mb-1">
                        <span className="font-bold">{node.id}</span>
                        <span>{node.status}</span>
                     </div>
                     <div className="w-full h-1 bg-black rounded overflow-hidden">
                        <div className={`h-full ${node.status === 'ACTIVE' ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${node.load}%` }} />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="flex flex-col gap-4">
             <div className="flex-1 bg-[#0a0a1a] border border-indigo-900/30 rounded p-4 flex flex-col">
                 <h3 className="text-xs uppercase font-bold text-indigo-500 flex items-center gap-2 mb-3 shrink-0">
                    <GitCommit className="w-3 h-3" /> Live Mutations
                 </h3>
                 <div className="flex-1 bg-black border border-indigo-900/20 rounded p-2 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                    <AnimatePresence>
                       {logs.map((log, i) => (
                           <motion.div 
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             key={`${i}-${log}`} 
                             className={`text-[9px] font-mono leading-tight ${log.includes('[ALERT]') ? 'text-amber-500' : 'text-indigo-400/80'}`}
                           >
                             {log}
                           </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
}
