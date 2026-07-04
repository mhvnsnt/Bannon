import React, { useState, useEffect } from 'react';
import { Settings, Cpu, Activity, Battery, Triangle, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmbodiedRoboticsInterface() {
  const [joints, setJoints] = useState({ shoulder: 0, elbow: 90, wrist: 0, grip: 50 });
  const [log, setLog] = useState<string[]>([]);
  const [power, setPower] = useState(85);

  const writeLog = (msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 5));
  };

  useEffect(() => {
    const cycle = setInterval(() => {
       if (Math.random() > 0.7) {
           setJoints(prev => ({
               ...prev,
               shoulder: prev.shoulder + (Math.random() * 2 - 1),
               elbow: prev.elbow + (Math.random() * 4 - 2),
           }));
           writeLog(`[KINETIC] Micro-adjusting servos. T: ${Date.now()}`);
       }
    }, 1500);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0a0a] text-cyan-500 font-mono p-4 flex flex-col border-l border-cyan-900/40 overflow-hidden">
      <div className="border-b border-cyan-900/50 pb-3 mb-4 shrink-0 flex justify-between items-center">
        <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
             <Cpu className="w-4 h-4" /> Embodied Physical AI
           </h2>
           <p className="text-[10px] text-cyan-700 mt-1">Forcing digital authority into kinetic robotics. Zero latency.</p>
        </div>
        <div className="flex gap-4 items-center">
           <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
             <Battery className="w-3 h-3" /> {power}% PWR
           </div>
           <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
             <Activity className="w-3 h-3" /> 1.2ms LATENCY
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 pb-4">
         <div className="bg-[#111] border border-cyan-900/40 rounded p-4 flex flex-col gap-4">
            <h3 className="text-xs uppercase font-bold text-cyan-500 flex items-center gap-2">
              <Settings className="w-3 h-3" /> Servo Articulation
            </h3>
            
            <div className="space-y-4">
               {Object.entries(joints).map(([name, val]) => (
                  <div key={name}>
                     <div className="flex justify-between text-[10px] uppercase text-cyan-600 mb-1">
                        <span>{name}</span>
                        <span>{(val as number).toFixed(1)}°</span>
                     </div>
                     <input 
                        type="range" min="0" max={name==='grip'?100:180} value={val as number}
                        onChange={e => setJoints({...joints, [name]: parseFloat(e.target.value)})}
                        className="w-full accent-cyan-500"
                     />
                  </div>
               ))}
            </div>
            <button 
               onClick={() => writeLog('[CMD] Executing primary sweep pattern.')}
               className="mt-auto py-2 bg-cyan-900/20 border border-cyan-500/50 rounded text-cyan-400 hover:bg-cyan-900/40 text-xs font-bold uppercase tracking-widest transition-colors"
            >
               Execute Routine
            </button>
         </div>

         <div className="bg-[#111] border border-cyan-900/40 rounded p-4 flex flex-col relative overflow-hidden">
            <h3 className="text-xs uppercase font-bold text-cyan-500 flex items-center gap-2 mb-4">
              <Triangle className="w-3 h-3" /> Kinetic Feed
            </h3>
            <div className="flex-1 border border-cyan-900/30 rounded bg-black relative flex items-center justify-center p-4">
                {/* Visualizer for the arm */}
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-80" preserveAspectRatio="xMidYMid meet">
                   <circle cx="50" cy="90" r="4" fill="#06b6d4" />
                   <g style={{ transformOrigin: '50px 90px', transform: `rotate(${joints.shoulder - 90}deg)` }} className="transition-transform duration-75">
                      <line x1="50" y1="90" x2="50" y2="50" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" />
                      <circle cx="50" cy="50" r="3" fill="#22d3ee" />
                      
                      <g style={{ transformOrigin: '50px 50px', transform: `rotate(${joints.elbow - 90}deg)` }} className="transition-transform duration-75">
                         <line x1="50" y1="50" x2="50" y2="25" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
                         <circle cx="50" cy="25" r="2" fill="#67e8f9" />
                         
                         <g style={{ transformOrigin: '50px 25px', transform: `rotate(${joints.wrist}deg)` }} className="transition-transform duration-75">
                            <line x1="50" y1="25" x2="45" y2="15" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
                            <line x1="50" y1="25" x2="55" y2="15" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
                         </g>
                      </g>
                   </g>
                </svg>
            </div>
         </div>
      </div>

      <div className="h-32 shrink-0 bg-black border border-cyan-900/40 rounded p-3 overflow-y-auto custom-scrollbar flex flex-col gap-1">
         <h3 className="text-[10px] uppercase font-bold text-cyan-600 mb-2 flex items-center gap-2">
            <Terminal className="w-3 h-3" /> Terminal Output
         </h3>
         {log.map((l, i) => (
             <div key={i} className="text-[10px] text-cyan-400/80 font-mono">{l}</div>
         ))}
         {log.length === 0 && <div className="text-[10px] text-cyan-800 italic">No instructions executed.</div>}
      </div>
    </div>
  );
}
