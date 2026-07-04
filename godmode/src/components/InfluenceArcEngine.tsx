import { useState } from 'react';
import { Orbit, Activity, Users, ShieldAlert, Cpu, Terminal, Disc, Crosshair, Network } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InfluenceArcEngine() {
  const [activeVector, setActiveVector] = useState<'simulation' | 'gravimetric' | 'emergent' | 'terminal'>('simulation');

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-4">
      <div className="flex items-center gap-2 mb-4 border-b border-[#222] pb-3">
        <Orbit className="w-5 h-5 text-indigo-400" />
        <h2 className="font-semibold text-gray-200">Influence Arc Engine: Dooly County Sector Matrix</h2>
      </div>

      <p className="text-xs text-gray-500 mb-6 border border-[#222] bg-[#111] p-3 rounded-lg">
        <span className="text-indigo-400 font-bold block mb-1">[PRIME ARCHITECT CLEARANCE]</span>
        High-level strategic simulation toolkit for local area impact. Modulates social and economic gravity vectors 
        to synthesize autonomous architectural dominance.
      </p>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveVector('simulation')}
          className={`flex-1 min-w-[120px] flex justify-center items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeVector === 'simulation' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-[#111] text-gray-400 border border-[#222] hover:bg-[#222]'}`}
        >
          <Activity className="w-4 h-4" /> Gravity Map
        </button>
        <button 
          onClick={() => setActiveVector('gravimetric')}
          className={`flex-1 min-w-[120px] flex justify-center items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeVector === 'gravimetric' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#111] text-gray-400 border border-[#222] hover:bg-[#222]'}`}
        >
           <Network className="w-4 h-4" /> Orchestration
        </button>
        <button 
          onClick={() => setActiveVector('emergent')}
          className={`flex-1 min-w-[120px] flex justify-center items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeVector === 'emergent' ? 'bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-[#111] text-gray-400 border border-[#222] hover:bg-[#222]'}`}
        >
           <Cpu className="w-4 h-4" /> Architecture
        </button>
        <button 
          onClick={() => setActiveVector('terminal')}
          className={`flex-1 min-w-[120px] flex justify-center items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeVector === 'terminal' ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-[#111] text-gray-400 border border-[#222] hover:bg-[#222]'}`}
        >
           <Terminal className="w-4 h-4" /> Terminal
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-8 pr-2 no-scrollbar">
        {activeVector === 'simulation' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
               <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                  <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-3">
                     <Activity className="w-4 h-4" /> Dooly County Social Topography
                  </h3>
                  <div className="aspect-video w-full border border-[#333] bg-[#0a0a0a] rounded-lg relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-black to-black" />
                     {/* Placeholder for future Three.js / D3 graph integration */}
                     <Orbit className="w-16 h-16 text-blue-500/30 animate-[spin_10s_linear_infinite]" />
                     <div className="absolute inset-x-0 bottom-4 text-center font-mono text-[10px] text-blue-500/60 uppercase tracking-widest">
                        Awaiting mathematical graph ingestion...
                     </div>
                  </div>
               </div>

               <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-4">
                     <Users className="w-4 h-4 text-emerald-400" /> Active Vector Nodes
                  </h3>
                  <div className="flex flex-col gap-2">
                     <NodeItem name="Commercial Manufacturing Block" status="Malleable" mass="High" polarity="Neutral" />
                     <NodeItem name="Local Artistic Grid (Rivals)" status="Entropic" mass="Low" polarity="Negative" />
                     <NodeItem name="Financial Arteries (Banks)" status="Rigid" mass="Absolute" polarity="Positive" />
                  </div>
               </div>
           </motion.div>
        )}

        {activeVector === 'gravimetric' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
               <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <h3 className="text-sm font-bold text-emerald-400 mb-2">Gravimetric Field Manipulation</h3>
                  <p className="text-xs text-emerald-500/80 mb-4">
                     Adjust internal psychological tension and external auditory resonance to warp local perception fields.
                  </p>
                  
                  <div className="flex flex-col gap-4">
                     <Slider label="Social Tension Synthesis" color="emerald" defaultVal={60} />
                     <Slider label="Auditory Pressure (Decibels)" color="fuchsia" defaultVal={80} />
                     <Slider label="Economic Void Creation" color="indigo" defaultVal={35} />
                  </div>
               </div>
               
               <div className="bg-[#111] border border-[#222] p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-gray-300">Trajectory Orchestration</h3>
                     <button className="bg-[#0a0a0a] border border-[#333] hover:bg-emerald-600 hover:border-emerald-500 hover:text-white text-gray-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                        <Crosshair className="w-3 h-3" /> Commit Strike
                     </button>
                  </div>
                  <textarea 
                     className="w-full h-32 bg-[#0a0a0a] border border-[#333] rounded-lg p-3 text-sm font-mono text-gray-300 resize-none focus:outline-none focus:border-emerald-500"
                     placeholder="Define desired vector alignment or outcome..."
                  />
               </div>
           </motion.div>
        )}
        
        {activeVector === 'emergent' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
               <div className="bg-[#111] border border-[#222] p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                     <Disc className="w-4 h-4 text-fuchsia-400" /> Auditory Resonance Mapping
                  </h3>
                  
                  <div className="h-32 w-full border border-fuchsia-500/20 rounded-lg flex items-end justify-between p-2 gap-[2px]">
                      {/* Fake Audio Eq visualizer */}
                      {[...Array(40)].map((_, i) => (
                         <div key={i} className="w-full bg-fuchsia-500/50 rounded-t" style={{ height: `${Math.random() * 100}%` }} />
                      ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center font-mono uppercase">
                     Base frequencies synchronized with Dooly County grid oscillations.
                  </div>
               </div>
           </motion.div>
        )}
        
        {activeVector === 'terminal' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
               <div className="bg-[#0a0a0a] border border-red-500/30 p-4 rounded-xl min-h-[400px] flex flex-col font-mono relative overflow-hidden">
                   <div className="flex items-center gap-2 mb-4 border-b border-[#222] pb-2">
                      <Terminal className="w-5 h-5 text-red-500" />
                      <span className="text-xs font-bold text-red-500 tracking-widest">PREDICTIVE align TERMINAL</span>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto flex flex-col gap-2 text-xs">
                      <TerminalLine label="SYS" msg="Ingesting causal loops..." />
                      <TerminalLine label="MATH" msg="Calculating entropic decay of competing local frameworks..." color="text-yellow-500" />
                      <TerminalLine label="SIM" msg="Running Monte Carlo scenarios for upcoming networking event." color="text-indigo-400" />
                      <TerminalLine label="WARN" msg="Friction point detected in sector 4. Recalibrating resonance." color="text-amber-500" />
                      <TerminalLine label="EXEC" msg="Locking timeline vector. Executing." color="text-emerald-500" />
                   </div>
                   
                   <div className="mt-4 flex items-center gap-2 pt-2 border-t border-[#222]">
                      <span className="text-red-500 font-bold">{'>'}</span>
                      <input type="text" className="flex-1 bg-transparent outline-none text-red-400 text-xs placeholder:text-red-900" placeholder="Awaiting architect command..." />
                   </div>
               </div>
           </motion.div>
        )}
      </div>
    </div>
  );
}

function NodeItem({ name, status, mass, polarity }: { name: string, status: string, mass: string, polarity: string }) {
    return (
        <div className="flex flex-col bg-[#0a0a0a] border border-[#222] rounded-lg p-3 w-full">
            <span className="text-[13px] font-bold text-gray-200 mb-2 truncate">{name}</span>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase">
                <span className="text-gray-500">Status: <span className="text-emerald-400">{status}</span></span>
                <span className="text-gray-500">Mass: <span className="text-white">{mass}</span></span>
                <span className="text-gray-500">Pole: <span className={polarity === 'Negative' ? 'text-red-400' : 'text-blue-400'}>{polarity}</span></span>
            </div>
        </div>
    );
}

function Slider({ label, color, defaultVal }: { label: string, color: 'emerald' | 'fuchsia' | 'indigo', defaultVal: number }) {
    const colorMap = {
        emerald: 'text-emerald-400 accent-emerald-500',
        fuchsia: 'text-fuchsia-400 accent-fuchsia-500',
        indigo: 'text-indigo-400 accent-indigo-500'
    };
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs font-mono mb-2 uppercase tracking-wider">
               <span className="text-gray-400">{label}</span>
               <span className={colorMap[color].split(' ')[0]}>{defaultVal}%</span>
            </div>
            <input type="range" className={`w-full ${colorMap[color]}`} defaultValue={defaultVal} />
        </div>
    );
}

function TerminalLine({ label, msg, color = 'text-gray-400' }: { label: string, msg: string, color?: string }) {
   return (
       <div className="flex items-start gap-3">
           <span className={`font-bold ${label === 'SYS' ? 'text-red-500' : 'text-gray-600'} w-8`}>[{label}]</span>
           <span className={`${color}`}>{msg}</span>
       </div>
   )
}
