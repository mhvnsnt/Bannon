import React, { useState, useEffect } from 'react';
import { Activity, Play, Square, Settings, Database, Eye, Droplets, Target, Shield, Heart } from 'lucide-react';

export function AnatomicalPhysicsRig() {
  const [activeRig, setActiveRig] = useState('DAZ_GENESIS_1000_BONE');
  const [facs, setFacs] = useState({ AU1: 0, AU2: 0, AU4: 0, AU12: 0, AU23: 0, AU24: 0 });
  const [physics, setPhysics] = useState({ 
    gravity: 9.8, 
    tissueTension: 50, 
    dampening: 20, 
    tearingThreshold: 120, // Megapascals
    elasticityYield: 85,
    hydrostaticPressure: 15
  });
  const [fluidSim, setFluidSim] = useState<{ active: boolean, viscosity: number, volume: number }>({
    active: false,
    viscosity: 10,
    volume: 50,
  });
  const [cellularDamage, setCellularDamage] = useState(0);
  
  // Simulated biological engine running
  useEffect(() => {
    let interval: any;
    if (physics.tissueTension > physics.tearingThreshold) {
      interval = setInterval(() => {
        setCellularDamage(prev => Math.min(prev + (physics.tissueTension - physics.tearingThreshold) * 0.1, 100));
      }, 100);
    } else {
      interval = setInterval(() => {
        setCellularDamage(prev => Math.max(prev - 0.5, 0));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [physics.tissueTension, physics.tearingThreshold]);

  return (
    <div className="w-full h-full bg-[#050505] text-fuchsia-500 font-mono p-4 flex flex-col border-l border-fuchsia-900/40 overflow-hidden">
        <div className="border-b border-fuchsia-900/50 pb-3 mb-4 shrink-0 flex justify-between items-end">
           <div>
             <h2 className="text-sm font-bold uppercase tracking-widest text-[#ff2a85] flex items-center gap-2">
               <Database className="w-4 h-4" /> Tomodachi Anatomical Sandbox
             </h2>
             <p className="text-[10px] text-fuchsia-700 mt-1">1000+ Bone DAZ Genesis Kinematics, Advanced Cellular FACS, Arousal Mapping & Tissue Yield Physics.</p>
           </div>
           <div className="text-[10px] text-red-500 font-bold border border-red-900/50 px-2 py-1 bg-red-950/20">
             CELLULAR INTEGRITY: {(100 - cellularDamage).toFixed(1)}%
           </div>
        </div>

        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4 overflow-y-auto custom-scrollbar">
            {/* Morph Targets Engine */}
            <div className="col-span-1 bg-[#0a0a0a] border border-fuchsia-900/30 rounded p-4 flex flex-col gap-4">
                <h3 className="text-xs uppercase font-bold text-fuchsia-400 flex items-center gap-2">
                  <Eye className="w-3 h-3" /> Micro-FACS Matrix
                </h3>
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                   {Object.entries(facs).map(([au, val]) => (
                      <div key={au}>
                         <div className="flex justify-between text-[10px] uppercase text-fuchsia-600 mb-1">
                            <span>{au} {au === 'AU1' ? '(Inner Brow)' : au === 'AU2' ? '(Outer Brow)' : au === 'AU4' ? '(Brow Lowerer)' : au === 'AU12' ? '(Lip Corner Pull)' : au === 'AU23' ? '(Lip Tightener)' : '(Lip Presser)'}</span>
                            <span>{((val as number) * 100).toFixed(0)}%</span>
                         </div>
                         <input 
                            type="range" min="0" max="1" step="0.01" value={val as number}
                            onChange={e => setFacs({...facs, [au as keyof typeof facs]: parseFloat(e.target.value)})}
                            className="w-full accent-[#ff2a85] h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                         />
                      </div>
                   ))}
                </div>
            </div>

            {/* Tissue and Tearing Engine */}
            <div className="col-span-1 bg-[#0a0a0a] border border-fuchsia-900/30 rounded p-4 flex flex-col gap-4">
                <h3 className="text-xs uppercase font-bold text-red-400 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Tissue Mechanics & Yield
                </h3>
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                   {Object.entries(physics).map(([prop, val]) => (
                      <div key={prop}>
                         <div className="flex justify-between text-[10px] uppercase text-red-600 mb-1">
                            <span>{prop.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span>{(val as number).toFixed(1)} {prop.includes('Threshold') || prop.includes('Tension') ? 'MPa' : ''}</span>
                         </div>
                         <input 
                            type="range" min="0" max={prop === 'gravity' ? 20 : 200} step="0.1" value={val as number}
                            onChange={e => setPhysics({...physics, [prop as keyof typeof physics]: parseFloat(e.target.value)})}
                            className={`w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer ${prop === 'tissueTension' && (val as number) > physics.tearingThreshold ? 'accent-red-500' : 'accent-red-400'}`}
                         />
                      </div>
                   ))}
                </div>
            </div>

            {/* Arousal & Biological Fluids Simulation */}
            <div className="col-span-1 lg:col-span-1 col-span-2 bg-[#0a0a0a] border border-fuchsia-900/30 rounded p-4 flex flex-col gap-4">
                <h3 className="text-xs uppercase font-bold text-cyan-400 flex items-center gap-2">
                  <Droplets className="w-3 h-3" /> Autonomous Biological Fluids
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] text-cyan-500 uppercase mt-2">
                     <input type="checkbox" checked={fluidSim.active} onChange={e => setFluidSim({...fluidSim, active: e.target.checked})} className="accent-cyan-500" />
                     Enable Scientific Fluid Dynamics
                  </label>
                  
                  {fluidSim.active && (
                    <>
                      <div>
                         <div className="flex justify-between text-[10px] uppercase text-cyan-600 mb-1">
                            <span>Viscosity (cSt)</span>
                            <span>{fluidSim.viscosity.toFixed(1)}</span>
                         </div>
                         <input 
                            type="range" min="1" max="100" step="0.1" value={fluidSim.viscosity}
                            onChange={e => setFluidSim({...fluidSim, viscosity: parseFloat(e.target.value)})}
                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                         />
                      </div>
                      <div>
                         <div className="flex justify-between text-[10px] uppercase text-cyan-600 mb-1">
                            <span>Secretory Volume (mL)</span>
                            <span>{fluidSim.volume.toFixed(1)}</span>
                         </div>
                         <input 
                            type="range" min="0" max="500" step="1" value={fluidSim.volume}
                            onChange={e => setFluidSim({...fluidSim, volume: parseFloat(e.target.value)})}
                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                         />
                      </div>
                    </>
                  )}
                </div>
            </div>
            
            {/* Central Holographic Rig View */}
            <div className="col-span-2 lg:col-span-3 bg-[#050505] border border-[#ff2a85]/30 rounded p-4 h-[400px] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff2a85]/10 via-[#050505] to-[#050505]" />
                <div className="absolute inset-0 bg-black z-0" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 42, 133, 0.1) 25%, rgba(255, 42, 133, 0.1) 26%, transparent 27%, transparent 74%, rgba(255, 42, 133, 0.1) 75%, rgba(255, 42, 133, 0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 42, 133, 0.1) 25%, rgba(255, 42, 133, 0.1) 26%, transparent 27%, transparent 74%, rgba(255, 42, 133, 0.1) 75%, rgba(255, 42, 133, 0.1) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }} />
                
                {/* 3D Abstract Representation of Rig */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                   <svg viewBox="0 0 200 200" className="w-[80%] h-[80%] opacity-90 drop-shadow-[0_0_15px_#ff2a85]" style={{ transform: `scale(${1 + facs.AU1 * 0.05})` }}>
                      {/* Spine / Core Structure */}
                      <path d="M 100 20 L 100 180" stroke="#ff2a85" strokeWidth="2" strokeDasharray="4 4" className="animate-[pulse_2s_ease-in-out_infinite]" />
                      
                      {/* Thoracic / Biological yield mesh */}
                      <path d={`M 50 60 Q ${100} ${50 + physics.tissueTension * 0.2} 150 60`} fill="none" stroke={physics.tissueTension > physics.tearingThreshold ? "#ef4444" : "#ff2a85"} strokeWidth={physics.tissueTension > physics.tearingThreshold ? 4 : 2} className="transition-all" />
                      <path d={`M 40 90 Q ${100} ${100 + (physics.tissueTension - physics.tearingThreshold)*0.5} 160 90`} fill="none" stroke={physics.tissueTension > physics.tearingThreshold ? "#ef4444" : "#e879f9"} strokeWidth="1.5" />
                      
                      {/* Facial Nodes */}
                      <circle cx="85" cy="40" r={2 + facs.AU1 * 4} fill="#ff2a85" />
                      <circle cx="115" cy="40" r={2 + facs.AU1 * 4} fill="#ff2a85" />
                      <path d={`M 80 ${55 + facs.AU12 * 5 - facs.AU24 * 3} Q 100 ${60 + facs.AU23 * 5} 120 ${55 + facs.AU12 * 5 - facs.AU24 * 3}`} fill="none" stroke="#ff2a85" strokeWidth="2" />
                      
                      {/* Tearing/Stress Particles (Visible if threshold exceeded) */}
                      {physics.tissueTension > physics.tearingThreshold && (
                        <g className="animate-ping opacity-80" stroke="#ef4444" strokeWidth="1">
                           <line x1="90" y1="80" x2="80" y2="70" />
                           <line x1="110" y1="80" x2="120" y2="70" />
                           <circle cx="100" cy="90" r="10" fill="none" />
                        </g>
                      )}

                      {/* Fluid Dynamics Mesh Overlay */}
                      {fluidSim.active && (
                         <g className="animate-[pulse_1.5s_infinite]">
                            {Array.from({length: Math.min(10, Math.floor(fluidSim.volume / 50))}).map((_, i) => (
                              <ellipse 
                                key={i} 
                                cx={100 + Math.sin(i * Math.PI/4) * 20} 
                                cy={130 + Math.cos(i * Math.PI/4) * 20 + physics.gravity * (i * 0.1)} 
                                rx={4 + fluidSim.viscosity * 0.1} 
                                ry={6 + physics.gravity * 0.5} 
                                fill="#06b6d4" 
                                className="opacity-50 blur-[2px]" 
                              />
                            ))}
                         </g>
                      )}
                   </svg>
                </div>
                
                <div className="absolute bottom-3 left-3 text-[10px] text-fuchsia-700 font-bold bg-[#050505]/80 p-2 border border-[#ff2a85]/30 rounded backdrop-blur-sm z-20">
                   <div>ENGINE: {activeRig} V.9.0.1</div>
                   <div className={physics.tissueTension > physics.tearingThreshold ? "text-red-500 animate-pulse" : "text-[#ff2a85]"}>
                     MAX YIELD: {Math.max(0, physics.tissueTension - physics.tearingThreshold).toFixed(1)} MPa OVERLOAD
                   </div>
                </div>

                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-20">
                  <div className="flex items-center gap-1 text-[10px] text-fuchsia-400 bg-black/50 px-2 py-1 rounded">
                    <Target className="w-3 h-3" /> KINEMATIC CHAIN STABLE
                  </div>
                  {fluidSim.active && (
                    <div className="flex items-center gap-1 text-[10px] text-cyan-400 bg-black/50 px-2 py-1 rounded animate-pulse">
                      <Droplets className="w-3 h-3" /> SECRETORY PATHWAYS ACTIVE
                    </div>
                  )}
                </div>
            </div>
        </div>
    </div>
  );
}
