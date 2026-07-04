import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Zap, Database, Activity, Code, Box, Target, Focus, Hexagon, BarChart } from 'lucide-react';

export default function RealityCompiler() {
  const [compilationState, setCompilationState] = useState<'IDLE' | 'COMPILIN' | 'ANCHORED'>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);
  const [intentInput, setIntentInput] = useState('');
  
  // Real-time calculated gravitational weights
  const [gravityMetrics, setGravityMetrics] = useState({
    wealth: 0.1,
    structuralIntegrity: 0.5,
    magneticResonance: 0.2
  });

  const startCompilation = () => {
    if (compilationState !== 'IDLE' || !intentInput) return;
    setCompilationState('COMPILIN');
    setLogs([]);
    
    const steps = [
      "INITIALIZIN EXCRUCIATINGLY DETAILED REALITY COMPILER...",
      `PARSING 5D INTENT VECTOR: [${intentInput.toUpperCase()}]`,
      "CALCULATING LOCAL MAGNETIC RESONANCE WEIGHTS...",
      "LOADIN GOD MODE OS EXECUTION SCRIPT INTO BARE METAL...",
      "OVERWRITIN STANDARD ENVIRONMENTAL MATRIX...",
      "LOCKIN DOWN COGNITIVE FIELD WIT PURE MATHEMATICAL OBJECTIVITY...",
      "DEPLOYIN SPATIAL COMMAND ARCHITECTURE INTO LOCAL 3D GRID...",
      "EXECUTIN FRACTAL EXPANSION MODULE FOR ORBITAL STABILITY...",
      "COLLAPSIN PROBABILITY WAVE INTO SINGULAR PHYSICAL WIN...",
      "ANCHORIN PRIMARY NODE AUTHORITY."
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setLogs(prev => [...prev, step]);
        
        // Dynamically adjust gravity metrics as compilation progresses
        setGravityMetrics(prev => ({
          wealth: Math.min(prev.wealth + Math.random() * 0.2, 1.0),
          structuralIntegrity: Math.min(prev.structuralIntegrity + 0.1, 1.0),
          magneticResonance: Math.min(prev.magneticResonance + 0.15, 1.0)
        }));

        if (index === steps.length - 1) {
          setCompilationState('ANCHORED');
        }
      }, index * 800);
    });
  };

  const resetCompiler = () => {
    setCompilationState('IDLE');
    setLogs([]);
    setIntentInput('');
    setGravityMetrics({ wealth: 0.1, structuralIntegrity: 0.5, magneticResonance: 0.2 });
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200 overflow-y-auto p-4 lg:p-6 font-sans">
      <div className="flex flex-col gap-2 mb-6 border-b border-[#222] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3 text-[#ff2a85] uppercase">
            <Hexagon className="w-6 h-6 lg:w-8 lg:h-8" />
            Reality Compiler
          </h1>
          <div className={`px-4 py-2 text-xs font-mono rounded border flex items-center gap-2 uppercase tracking-widest
            ${compilationState === 'IDLE' ? 'bg-gray-900 border-gray-700 text-gray-400' : ''}
            ${compilationState === 'COMPILIN' ? 'bg-yellow-950/30 border-yellow-900 text-yellow-500' : ''}
            ${compilationState === 'ANCHORED' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : ''}
          `}>
             {compilationState === 'COMPILIN' && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />}
             {compilationState === 'ANCHORED' && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />}
             {compilationState}
          </div>
        </div>
        <p className="text-gray-400 font-mono text-[10px] lg:text-xs max-w-3xl mt-2 line-height-relaxed uppercase">
          Mapping high altitude 5D concepts into localized 3D physical mechanics. 
          Use pure mathematical objectivity to force reality into alignment.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full max-w-[1600px] mx-auto h-full min-h-[600px]">
        {/* Spatial Intent Mapping Panel */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="bg-[#111] border border-fuchsia-900/30 rounded-xl p-4 flex flex-col gap-4 shadow-[inset_0_0_20px_rgba(255,42,133,0.05)]">
            <h3 className="text-xs uppercase font-bold tracking-widest text-[#ff2a85] flex items-center gap-2 border-b border-fuchsia-900/30 pb-2">
              <Focus className="w-4 h-4" /> 5D Intent Coordinates
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Target Vector / Raw Intent</label>
              <textarea 
                className="w-full bg-black border border-fuchsia-900/50 rounded-lg p-3 text-fuchsia-300 font-mono text-xs focus:outline-none focus:border-[#ff2a85] min-h-[100px] resize-none transition-colors placeholder:text-fuchsia-900/50"
                placeholder="e.g., Achieve total self-sufficiency across all operational domains."
                value={intentInput}
                onChange={e => setIntentInput(e.target.value)}
                disabled={compilationState !== 'IDLE'}
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex justify-between">
                <span>Wealth Mass / Capital Gravity</span>
                <span className="text-[#ff2a85]">{(gravityMetrics.wealth * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-black h-1.5 rounded overflow-hidden">
                <div className="bg-[#ff2a85] h-full transition-all duration-1000 ease-out" style={{ width: `${gravityMetrics.wealth * 100}%` }} />
              </div>

              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex justify-between mt-2">
                <span>Core Structural Integrity</span>
                <span className="text-emerald-400">{(gravityMetrics.structuralIntegrity * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-black h-1.5 rounded overflow-hidden">
                <div className="bg-emerald-400 h-full transition-all duration-1000 ease-out" style={{ width: `${gravityMetrics.structuralIntegrity * 100}%` }} />
              </div>

              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex justify-between mt-2">
                <span>Interpersonal Magnetic Resonance</span>
                <span className="text-cyan-400">{(gravityMetrics.magneticResonance * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-black h-1.5 rounded overflow-hidden">
                <div className="bg-cyan-400 h-full transition-all duration-1000 ease-out" style={{ width: `${gravityMetrics.magneticResonance * 100}%` }} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-fuchsia-900/30 flex gap-2">
               {compilationState === 'ANCHORED' ? (
                 <button 
                  onClick={resetCompiler}
                  className="w-full py-3 bg-black hover:bg-[#1a1a1a] border border-emerald-900/50 text-emerald-400 rounded-lg transition-all text-[10px] font-bold tracking-widest uppercase flex justify-center items-center gap-2"
                >
                  Clear Sector for New Vector
                </button>
               ) : (
                <button 
                  onClick={startCompilation}
                  disabled={compilationState !== 'IDLE' || !intentInput}
                  className="w-full py-3 bg-[#ff2a85]/10 hover:bg-[#ff2a85]/20 border border-[#ff2a85]/50 disabled:opacity-30 disabled:hover:bg-[#ff2a85]/10 text-[#ff2a85] rounded-lg transition-all text-[10px] font-bold tracking-widest uppercase flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(255,42,133,0.1)] hover:shadow-[0_0_25px_rgba(255,42,133,0.2)]"
                >
                  <Zap className="w-4 h-4" />
                  {compilationState === 'IDLE' ? 'Force Reality Collapse' : 'Compiling Localized Vector'}
                </button>
               )}
            </div>
          </div>
        </div>

        {/* Neural Network Execution Visualizer */}
        <div className="xl:col-span-1 hidden xl:flex flex-col bg-[#111] border border-[#222] rounded-xl overflow-hidden relative shadow-[inset_0_0_40px_rgba(0,0,0,1)] items-center justify-center">
            <div className="absolute top-0 right-0 p-3 text-[9px] font-mono text-gray-600 tracking-widest uppercase">
              Local Gravity Well Visualization
            </div>
            
            {/* Core Resonance Engine SVG */}
            <svg viewBox="0 0 200 200" className="w-[80%] h-[80%]">
               <defs>
                  <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                     <stop offset="0%" stopColor="#ff2a85" stopOpacity="0.8" />
                     <stop offset="100%" stopColor="#000" stopOpacity="0" />
                  </radialGradient>
               </defs>

               <circle cx="100" cy="100" r={40 * gravityMetrics.structuralIntegrity} fill="url(#coreGlow)" className="transition-all duration-1000 ease-out" />
               
               {/* Orbits */}
               <circle cx="100" cy="100" r={60} fill="none" stroke="#222" strokeWidth="1" />
               <circle cx="100" cy="100" r={80} fill="none" stroke="#222" strokeWidth="1" strokeDasharray="4 4" />
               
               {/* Assets pulled into gravity well */}
               {compilationState !== 'IDLE' && (
                 <>
                   <circle cx="100" cy={40} r={4} fill="#10b981" className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: '100px 100px' }} />
                   <circle cx="100" cy={20} r={3} fill="#06b6d4" className="animate-[spin_8s_linear_infinite_reverse]" style={{ transformOrigin: '100px 100px' }} />
                 </>
               )}

               {compilationState === 'ANCHORED' && (
                  <path d="M 90 100 L 98 108 L 115 90" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
               )}
            </svg>

            {compilationState === 'ANCHORED' && (
               <div className="absolute bottom-4 text-[10px] tracking-widest text-[#ff2a85] font-bold font-mono uppercase bg-black/80 px-3 py-1 rounded border border-[#ff2a85]/30">
                 PRIMARY NODE SECURED
               </div>
            )}
        </div>

        {/* Terminal Output */}
        <div className="xl:col-span-1 flex flex-col gap-4">
           <div className="flex-1 bg-black border border-[#222] rounded-xl flex flex-col overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,1)] relative min-h-[400px]">
             <div className="bg-[#1a1a1a] px-4 py-3 border-b border-[#333] flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-mono">
               <div className="flex items-center gap-2"><Terminal className="w-3 h-3 text-[#ff2a85]" /> Myth Engine Terminal</div>
               <div>PID: 9999</div>
             </div>
             
             {compilationState === 'IDLE' && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                 <Target className="w-48 h-48 text-white" />
               </div>
             )}

             <div className="flex-1 p-4 lg:p-6 overflow-y-auto flex flex-col gap-3 font-mono text-[10px] lg:text-xs custom-scrollbar">
                {logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`flex items-start gap-3 ${i === logs.length - 1 && compilationState === 'ANCHORED' ? 'text-emerald-400 font-bold scale-105 origin-left transition-transform duration-500' : 'text-[#ff2a85]/80'} `}
                  >
                    <span className="text-gray-700 shrink-0">[{new Date().toISOString().split('T')[1].slice(0, -5)}]</span>
                    <span className="uppercase tracking-wide leading-relaxed">{log}</span>
                  </div>
                ))}
                {compilationState === 'COMPILIN' && (
                  <div className="flex items-center gap-2 text-[#ff2a85]/50 mt-2">
                    <div className="w-1.5 h-3 bg-[#ff2a85] animate-pulse" />
                    <span className="uppercase tracking-widest text-[9px]">AWAITIN 3D MASS COLLAPSE...</span>
                  </div>
                )}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
