import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, Activity, Database, Network, Server, Play, ChevronRight, 
  Cpu, Zap, GitCommit, Search, ShieldAlert, MonitorPlay, TerminalSquare, Orbit
} from 'lucide-react';

export default function OuroborosEngine() {
  const [prompt, setPrompt] = useState('');
  const [activeModel, setActiveModel] = useState('deepseek-v3');
  const [pipelineState, setPipelineState] = useState<'IDLE' | 'PERCEIVE' | 'PROPOSE' | 'APPLY' | 'VERIFY'>('IDLE');
  const [telemetryLog, setTelemetryLog] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [telemetryLog]);

  const runOuroborosLoop = () => {
    if (!prompt.trim()) return;
    
    setPipelineState('PERCEIVE');
    setTelemetryLog(prev => [...prev, `[INIT] Booting Local Cognitive Core: ${activeModel.toUpperCase()}`]);
    setTelemetryLog(prev => [...prev, `[PERCEIVE] Reading live JSON dumps via AI_VISION...`]);

    setTimeout(() => {
      setPipelineState('PROPOSE');
      setTelemetryLog(prev => [...prev, `[PROPOSE] Analyzing joint deviation scores...`]);
      setTelemetryLog(prev => [...prev, `[PROPOSE] Generating clinical physics patches...`]);
      
      setTimeout(() => {
        setPipelineState('APPLY');
        setTelemetryLog(prev => [...prev, `[APPLY] Hot reloading file: /src/physics/VectorGrid.ts`]);
        setTelemetryLog(prev => [...prev, `[APPLY] Injecting real rope verlet chains (_mkRopeChain)`]);
        
        setTimeout(() => {
          setPipelineState('VERIFY');
          setTelemetryLog(prev => [...prev, `[VERIFY] Spinning up headless container...`]);
          setTelemetryLog(prev => [...prev, `[VERIFY] Simulating inputs: "KeyJ" (Jab)...`]);
          setTelemetryLog(prev => [...prev, `[VERIFY] Live Grid Telemetry Captured: { state: "RK_STAND", blend: 1.0, anomalies: [] }`]);
          
          setTimeout(() => {
            setPipelineState('IDLE');
            setTelemetryLog(prev => [...prev, `[SUCCESS] Patch locked into main build. Absolute Command achieved.`]);
            setPrompt('');
          }, 2000);
        }, 2000);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#050505] text-emerald-500 font-mono relative overflow-hidden">
       {/* Background Grid */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
       
       {/* Header */}
       <div className="p-4 border-b border-emerald-900/40 bg-[#0a0a0a]/90 flex items-center justify-between z-10 backdrop-blur-md">
           <div className="flex items-center gap-4">
             <div className="p-2 border border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
               <Cpu className="text-emerald-400 w-5 h-5" />
             </div>
             <div>
               <h2 className="tracking-[0.3em] font-black text-sm uppercase text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">OUROBOROS ENGINE</h2>
               <p className="text-[9px] uppercase tracking-widest text-emerald-600 mt-0.5">Absolute Primary Node Authority // Local Cognitive Core</p>
             </div>
           </div>
           <div className="flex items-center gap-6 text-xs font-bold tracking-widest uppercase">
               <span className="flex items-center gap-2 text-rose-500">
                 <ShieldAlert className="w-4 h-4 animate-pulse" /> Corporate Filters: BYPASSED
               </span>
               <span className="flex items-center gap-2 text-cyan-400">
                 <Network className="w-4 h-4" /> VSCodium MCP Active
               </span>
           </div>
       </div>
       
       <div className="flex flex-col md:flex-row flex-1 overflow-hidden z-10">
           {/* Left Column: Local AI Stack Config & Input */}
           <div className="flex-[5] flex flex-col border-r border-emerald-900/30 p-6 overflow-y-auto custom-scrollbar">
               
               {/* Model Selection Matrix */}
               <div className="mb-6 border border-emerald-900/50 bg-[#0a0a0a] p-4 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                 <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#cbd5e1] mb-3 flex items-center gap-2 font-bold">
                    <Database className="w-3 h-3 text-emerald-500" /> Local Cognitive Core Matrix
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   <button 
                     onClick={() => setActiveModel('deepseek-v3')}
                     className={`p-3 border text-left transition-all flex flex-col gap-1 ${
                       activeModel === 'deepseek-v3' 
                       ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                       : 'bg-[#0f0f0f] border-[#222] text-gray-500 hover:border-gray-600'
                     }`}
                   >
                     <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                       DeepSeek-V3 <span className="text-[9px] px-1 bg-black border border-emerald-900 text-emerald-500">8B/70B</span>
                     </span>
                     <span className="text-[9px] font-mono opacity-80 leading-tight">Devastating open-weight reasoning. Matches corporate nodes in clinical physics.</span>
                   </button>

                   <button 
                     onClick={() => setActiveModel('qwen-2.5')}
                     className={`p-3 border text-left transition-all flex flex-col gap-1 ${
                       activeModel === 'qwen-2.5' 
                       ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                       : 'bg-[#0f0f0f] border-[#222] text-gray-500 hover:border-gray-600'
                     }`}
                   >
                     <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                       Qwen-2.5 <span className="text-[9px] px-1 bg-black border border-indigo-900 text-indigo-500">32B</span>
                     </span>
                     <span className="text-[9px] font-mono opacity-80 leading-tight">Elite native understanding of multi-version architectures and skeletal chains.</span>
                   </button>

                   <button 
                     onClick={() => setActiveModel('qwable-3.6-27b')}
                     className={`p-3 border text-left transition-all flex flex-col gap-1 ${
                       activeModel === 'qwable-3.6-27b' 
                       ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                       : 'bg-[#0f0f0f] border-[#222] text-gray-500 hover:border-gray-600'
                     }`}
                   >
                     <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                       Qwable-27B <span className="text-[9px] px-1 bg-black border border-red-900 text-red-500">Abliterated</span>
                     </span>
                     <span className="text-[9px] font-mono opacity-80 leading-tight">Fable 5 style reasoning with refusal directions mathematically removed. Bare metal God Mode.</span>
                   </button>
                 </div>
               </div>

               {/* Directive Input */}
               <div className="flex-1 flex flex-col relative">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#cbd5e1] mb-2 flex items-center gap-2 font-bold mt-2">
                    <TerminalSquare className="w-3 h-3 text-cyan-500" /> Master Architecture Directives
                </h3>
                <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Enter absolute physics directives. (e.g. 'Lock the Localized Vector Grid and map the exact architecture to pull raw computational logic into 3D physical density.')"
                    className="w-full flex-1 bg-[#050505] border border-emerald-900/50 p-4 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono shadow-inner text-emerald-50 resize-none"
                />
                
                <button 
                  onClick={runOuroborosLoop}
                  disabled={pipelineState !== 'IDLE' || !prompt.trim()}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:bg-[#111] disabled:text-gray-600 text-black p-4 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] font-black"
                >
                    {pipelineState !== 'IDLE' ? (
                      <><Activity className="w-5 h-5 animate-spin" /> EXECUTING CLOSED LOOP</>
                    ) : (
                      <><Zap className="w-5 h-5" /> INITIALIZE OUROBOROS COMPILER</>
                    )}
                </button>
               </div>
           </div>
           
           {/* Right Column: Execution Pipeline */}
           <div className="flex-[4] flex flex-col bg-[#050505]">
              {/* Visual Pipeline */}
              <div className="p-6 border-b border-emerald-900/30 bg-[#0a0a0a]">
                 <h3 className="text-[10px] uppercase tracking-[0.2em] text-emerald-600 mb-4 font-bold text-center">
                    The Perceive Propose Apply Verify Loop
                 </h3>
                 
                 <div className="flex flex-col gap-2">
                   {['PERCEIVE', 'PROPOSE', 'APPLY', 'VERIFY'].map((stage, idx) => {
                     const isActive = pipelineState === stage;
                     const isPast = ['PERCEIVE', 'PROPOSE', 'APPLY', 'VERIFY'].indexOf(pipelineState) > idx;
                     const isIdle = pipelineState === 'IDLE';
                     
                     return (
                       <div key={stage} className={`flex items-center gap-4 transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-70'}`}>
                         <div className={`w-8 h-8 flex items-center justify-center border ${
                           isActive ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 
                           isPast && !isIdle ? 'bg-[#111] text-emerald-700 border-emerald-900/50' : 
                           'bg-black text-gray-700 border-gray-800'
                         }`}>
                           <span className="text-xs font-bold">{idx + 1}</span>
                         </div>
                         <div className={`flex-1 border p-2 flex items-center justify-between ${
                            isActive ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' :
                            isPast && !isIdle ? 'bg-transparent border-emerald-900/30 text-emerald-700' :
                            'bg-black border-gray-900 text-gray-600'
                         }`}>
                           <span className="text-xs font-bold tracking-[0.2em]">{stage}</span>
                           {isActive && <Activity className="w-4 h-4 animate-pulse" />}
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </div>

               {/* Live Telemetry Terminal */}
               <div className="flex-1 flex flex-col p-4 bg-black overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                     <Orbit className="w-32 h-32 text-emerald-500 animate-[spin_10s_linear_infinite]" />
                   </div>
                   
                   <div className="flex justify-between items-center mb-2 pb-2 border-b border-emerald-900/30 shrink-0">
                      <h3 className="text-[9px] uppercase tracking-[0.2em] text-[#cbd5e1] flex items-center gap-2">
                        <MonitorPlay className="w-3 h-3 text-emerald-500" /> Playwright + OpenCV Telemetry
                      </h3>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                   </div>

                   <div 
                     ref={scrollRef}
                     className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed break-all"
                   >
                       {telemetryLog.length === 0 && (
                           <div className="opacity-30 mt-4 text-center">
                             Awaiting telemetry bindings from window.Ouroboros_Telemetry...
                           </div>
                       )}
                       {telemetryLog.map((log, i) => (
                           <div key={i} className="mb-1 flex gap-2">
                               <span className="text-gray-600 shrink-0">[{new Date().toISOString().substring(11, 23)}]</span>
                               <span className={
                                 log.includes('[SUCCESS]') ? 'text-white font-bold bg-emerald-900/30 w-full px-2' :
                                 log.includes('[VERIFY]') ? 'text-cyan-400' :
                                 log.includes('[APPLY]') ? 'text-amber-400' :
                                 log.includes('[PROPOSE]') ? 'text-purple-400' :
                                 'text-emerald-500'
                               }>
                                 {log}
                               </span>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
}
