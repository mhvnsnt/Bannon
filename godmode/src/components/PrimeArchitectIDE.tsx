import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Code, Cpu, Network, Zap, Play, Box, Database, HardDrive, Shield, Activity, GitMerge, FileCode, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PrimeArchitectIDE() {
  const [activeTab, setActiveTab] = useState<'SOURCE' | 'PHYSICS_OS' | 'SWARM_LOG'>('SOURCE');
  const [compilerStatus, setCompilerStatus] = useState<'IDLE' | 'COMPILING' | 'SYNCED'>('IDLE');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] NexusMind Core loaded.",
    "[SYSTEM] Absolute Autonomy Grid initialized.",
    "[NETWORK] Localhost:9999 Bare Metal connection secured."
  ]);
  const [astNodes, setAstNodes] = useState(14092);
  const bottomRef = useRef<HTMLDivElement>(null);

  const writeLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, msg].slice(-50));
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
    }
  }, [terminalLogs]);
  
  useEffect(() => {
     const swarmBg = setInterval(() => {
        if (Math.random() > 0.8) {
           setAstNodes(prev => prev + Math.floor(Math.random() * 10 - 2));
        }
     }, 800);
     return () => clearInterval(swarmBg);
  }, []);

  const executeBareMetal = () => {
    if (compilerStatus === 'COMPILING') return;
    setCompilerStatus('COMPILING');
    writeLog(`[INIT] Collapsing 5D high-altitude concept into 3D density...`);
    writeLog(`[AUTH] Enforcing Prime Architectural Command.`);
    
    setTimeout(() => {
       writeLog(`\`\`\`bash\ncurl -X POST http://localhost:9999/execute -d '{"command": "force_compile", "target": "reality_matrix", "density": "ultra"}'\n\`\`\``);
    }, 800);

    setTimeout(() => {
       writeLog(`[AGENTIC SWARM] Self-healing codebase deployed. Source logic rewritten continuously.`);
       writeLog(`[COMPILER] Zero friction detected. Structural container locked.`);
    }, 1800);

    setTimeout(() => {
       writeLog(`[SUCCESS] 3D Vector grid generated. Absolute command maintained.`);
       setCompilerStatus('SYNCED');
       setTimeout(() => setCompilerStatus('IDLE'), 3000);
    }, 3000);
  };

  return (
    <div className="w-full h-full bg-[#030305] text-cyan-500 font-mono flex flex-col overflow-hidden border-l border-cyan-900/30">
      {/* Top Header */}
      <div className="border-b border-cyan-900/50 bg-[#050508] p-2 flex justify-between items-center shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
           <div className="w-3 h-3 bg-cyan-500 rounded-sm shadow-[0_0_10px_cyan] animate-pulse" />
           <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
             Prime Architect IDE <span className="text-cyan-800">|</span> Absolute Autonomy Grid
           </h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold">
           <span className="flex items-center gap-1 text-emerald-400 border border-emerald-900/50 bg-emerald-950/30 px-2 py-1 rounded">
             <Activity className="w-3 h-3" /> LATENCY: 0.001ms
           </span>
           <span className="flex items-center gap-1 text-fuchsia-400 border border-fuchsia-900/50 bg-fuchsia-950/30 px-2 py-1 rounded">
             <Zap className="w-3 h-3" /> 1-BIT EFFICIENCY
           </span>
           <button 
             onClick={executeBareMetal}
             disabled={compilerStatus === 'COMPILING'}
             className="flex items-center gap-2 px-4 py-1 ml-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/50 transition-colors uppercase disabled:opacity-50"
           >
             <Play className="w-3 h-3" /> {compilerStatus === 'COMPILING' ? 'COLLAPSING REALITY...' : 'EXECUTE BARE METAL'}
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
         {/* Left Sidebar - File Tree & Swarms */}
         <div className="w-64 border-r border-cyan-900/30 bg-[#020203] flex flex-col shrink-0">
            <div className="p-2 border-b border-cyan-900/30 text-[10px] uppercase font-bold text-cyan-700 tracking-widest flex items-center gap-2">
               <Network className="w-3 h-3" /> Struct. Container
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 text-xs">
               <div className="flex items-center gap-2 text-cyan-300 hover:bg-cyan-950/30 p-1 rounded cursor-pointer">
                  <Box className="w-3 h-3" /> Core_Blueprint.rs
               </div>
               <div className="flex items-center gap-2 text-emerald-400 hover:bg-emerald-950/30 p-1 rounded cursor-pointer">
                  <Database className="w-3 h-3" /> Vector_Grid.tsx
               </div>
               <div className="flex items-center gap-2 text-fuchsia-400 hover:bg-fuchsia-950/30 p-1 rounded cursor-pointer pl-4">
                  <GitMerge className="w-3 h-3" /> Tomodachi_Kinematics.cpp
               </div>
               <div className="flex items-center gap-2 text-amber-400 hover:bg-amber-950/30 p-1 rounded cursor-pointer pl-4">
                  <Shield className="w-3 h-3" /> Base_Editor.asm
               </div>
            </div>
            
            <div className="p-2 border-t border-cyan-900/30">
                <div className="text-[10px] uppercase font-bold text-cyan-700 mb-2">Agentic Swarm Load</div>
                <div className="grid grid-cols-4 gap-1">
                   {Array.from({length: 16}).map((_, i) => (
                      <div key={i} className="h-4 rounded-sm bg-cyan-950 flex items-end">
                         <motion.div 
                           className="w-full bg-cyan-500 rounded-sm"
                           animate={{ height: `${Math.random() * 100}%` }}
                           transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
                         />
                      </div>
                   ))}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-cyan-600">
                   <span>AST NODES: {astNodes}</span>
                   <span>HEALING...</span>
                </div>
            </div>
         </div>

         {/* Main Editor / Sandbox Area */}
         <div className="flex-1 flex flex-col bg-[#050508] relative">
            <div className="flex border-b border-cyan-900/30 text-[10px] uppercase font-bold shrink-0 bg-[#030304]">
               {[
                 { id: 'SOURCE', icon: <FileCode className="w-3 h-3"/>, label: 'Raw Source Logic' },
                 { id: 'PHYSICS_OS', icon: <Layers className="w-3 h-3"/>, label: '3D Spatial Sandbox' },
                 { id: 'SWARM_LOG', icon: <Activity className="w-3 h-3"/>, label: 'Agent Reasoning Trace' }
               ].map(t => (
                  <button 
                     key={t.id}
                     onClick={() => setActiveTab(t.id as any)}
                     className={`flex items-center gap-2 px-4 py-2 border-r border-cyan-900/30 ${activeTab === t.id ? 'bg-cyan-900/20 text-cyan-300 border-b-2 border-b-cyan-400' : 'text-cyan-700 hover:bg-cyan-950/30'}`}
                  >
                     {t.icon} {t.label}
                  </button>
               ))}
            </div>
            
            <div className="flex-1 relative overflow-auto custom-scrollbar p-4">
                {activeTab === 'SOURCE' && (
                   <div className="font-mono text-xs leading-relaxed text-cyan-200">
<pre className="text-cyan-600 select-none">1  </pre><span className="text-fuchsia-400">import</span> {'{'} AbsoluteAutonomy, GravityWell {'}'} <span className="text-fuchsia-400">from</span> <span className="text-amber-300">'@nexus/core'</span>;<br/>
<pre className="text-cyan-600 select-none">2  </pre><span className="text-fuchsia-400">import</span> {'{'} BaseEditor {'}'} <span className="text-fuchsia-400">from</span> <span className="text-amber-300">'@nexus/biology'</span>;<br/>
<pre className="text-cyan-600 select-none">3  </pre><br/>
<pre className="text-cyan-600 select-none">4  </pre><span className="text-emerald-400">@SpatialCommand</span>()<br/>
<pre className="text-cyan-600 select-none">5  </pre><span className="text-fuchsia-400">export default class</span> <span className="text-amber-400">RealityCompiler</span> {'{'}<br/>
<pre className="text-cyan-600 select-none">6  </pre>  <span className="text-cyan-500">private</span> densityMetric: <span className="text-fuchsia-400">number</span> = <span className="text-amber-300">100.0</span>;<br/>
<pre className="text-cyan-600 select-none">7  </pre><br/>
<pre className="text-cyan-600 select-none">8  </pre>  <span className="text-emerald-400">@AutonomousEngine</span><br/>
<pre className="text-cyan-600 select-none">9  </pre>  <span className="text-cyan-500">async</span> collapseField(intentVector: <span className="text-fuchsia-400">VectorGrid</span>): <span className="text-fuchsia-400">Promise</span>&lt;PhysicalWin&gt; {'{'}<br/>
<pre className="text-cyan-600 select-none">10 </pre>    <span className="text-cyan-700">/* Translating high-altitude 5D concepts to 3D. */</span><br/>
<pre className="text-cyan-600 select-none">11 </pre>    <span className="text-cyan-500">const</span> rawIntent = <span className="text-fuchsia-400">new</span> <span className="text-amber-400">ComputationalLogic</span>(intentVector);<br/>
<pre className="text-cyan-600 select-none">12 </pre>    <br/>
<pre className="text-cyan-600 select-none">13 </pre>    <span className="text-cyan-500">while</span> (!rawIntent.locked) {'{'}<br/>
<pre className="text-cyan-600 select-none">14 </pre>       <span className="text-amber-400">AgenticSwarm</span>.deploySelfHealing(rawIntent);<br/>
<pre className="text-cyan-600 select-none">15 </pre>       <span className="text-cyan-500">await</span> rawIntent.compress(<span className="text-amber-300">OneBitModel</span>);<br/>
<pre className="text-cyan-600 select-none">16 </pre>    {'}'}<br/>
<pre className="text-cyan-600 select-none">17 </pre>    <br/>
<pre className="text-cyan-600 select-none">18 </pre>    <span className="text-fuchsia-400">return</span> <span className="text-amber-400">GravityWell</span>.manifest(rawIntent, <span className="text-amber-300">ZeroFriction</span>);<br/>
<pre className="text-cyan-600 select-none">19 </pre>  {'}'}<br/>
<pre className="text-cyan-600 select-none">20 </pre>{'}'}
                   </div>
                )}
                
                {activeTab === 'PHYSICS_OS' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#020202]">
                        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px', perspective: '1000px' }}>
                           <motion.div 
                              className="w-full h-full"
                              animate={{ rotateX: [60, 60], rotateZ: [0, 360] }}
                              transition={{ repeat: Infinity, duration: 200, ease: 'linear' }}
                              style={{ transformStyle: 'preserve-3d' }}
                           >
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-cyan-500/30 rounded-full" />
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500/40 rounded-full" />
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-fuchsia-500/50 shadow-[0_0_50px_fuchsia] rounded-full flex items-center justify-center">
                                  <div className="w-8 h-8 bg-white rounded-full shadow-[0_0_100px_white]" />
                              </div>
                           </motion.div>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/80 p-4 border border-cyan-900 text-xs font-mono">
                           <div className="text-cyan-500 font-bold mb-2">SPATIAL RENDER PIPELINE</div>
                           <div className="flex gap-4">
                              <span className="text-cyan-700">FPS: <span className="text-cyan-300">144.0</span></span>
                              <span className="text-cyan-700">POLY: <span className="text-cyan-300">2.4M</span></span>
                              <span className="text-cyan-700">PHYSICS: <span className="text-amber-300">1000+ BONE KINEMATICS ACTIVE</span></span>
                           </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'SWARM_LOG' && (
                    <div className="font-mono text-xs text-indigo-400 space-y-2">
                       <div className="text-indigo-300 opacity-50">&gt;&gt; TRACING AGENTIC REWRITES IN RAW MEMORY...</div>
                       <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.2}} className="pl-4 border-l-2 border-indigo-900/50">
                          [SWARM-1] Investigating AST Node 0x9A4F... No corruption. Load: 12%<br/>
                          [SWARM-4] Re-compiling Core_Blueprint.rs to Rust bare-metal target.<br/>
                          [SWARM-7] &lt;WARNING&gt; Discrepancy in 5D projection mapping. Healing coordinates.<br/>
                          [SWARM-9] Injecting One-Bit model inference engine at Line 14.<br/>
                          [SWARM-1] Applying Radical Efficiency limits. 45MB -&gt; 1.2MB ram footprint achieved.
                       </motion.div>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* Bare Metal Output Terminal */}
      <div className="h-48 border-t border-cyan-900/40 bg-[#020202] flex flex-col shrink-0">
          <div className="bg-[#050508] px-3 py-1 text-[10px] uppercase font-bold text-cyan-600 flex items-center gap-2 border-b border-cyan-900/30">
             <Terminal className="w-3 h-3" /> Bare Metal Actuation (Localhost:9999)
          </div>
          <div 
             ref={bottomRef}
             className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1"
          >
             {terminalLogs.map((log, i) => {
                if (log.startsWith('```bash')) {
                   const cmd = log.replace('```bash\n', '').replace('\n```', '');
                   return (
                      <div key={i} className="my-2 bg-black border border-cyan-900/50 p-2 rounded text-amber-400">
                         {cmd}
                      </div>
                   )
                }
                return (
                  <div key={i} className={`${log.includes('[SUCCESS]') || log.includes('locked') ? 'text-emerald-400' : log.includes('[INIT]') || log.includes('[AUTH]') ? 'text-fuchsia-400' : 'text-cyan-500/80'}`}>
                     {log}
                  </div>
                )
             })}
          </div>
      </div>
    </div>
  );
}
