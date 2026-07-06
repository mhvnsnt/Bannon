import React, { useState, useEffect } from 'react';
import { Map, Compass, Hexagon, Layers, ZoomIn, Target, Box, Network } from 'lucide-react';
import { motion } from 'framer-motion';

export function MasterBlueprintAtlas() {
  const [activeDimension, setActiveDimension] = useState<3 | 4 | 5>(5);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
     let animationFrame: number;
     const animate = () => {
        setRotation(prev => ({ x: prev.x + 0.1, y: prev.y + 0.2 }));
        animationFrame = requestAnimationFrame(animate);
     };
     animate();
     return () => cancelAnimationFrame(animationFrame);
  }, []);

  const dimensions = [
     { level: 3, label: '3D DENSITY', desc: 'Physical Mechanics & Actuation' },
     { level: 4, label: '4D TEMPUS', desc: 'Trendline Trajectory & Temporal Forecasting' },
     { level: 5, label: '5D CONCEPT', desc: 'Raw Intent & Prime Architectural Command' }
  ];

  return (
    <div className="w-full h-full bg-[#030508] text-indigo-400 font-mono p-4 flex flex-col border-l border-indigo-900/40 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      
      <div className="border-b border-indigo-900/50 pb-3 mb-4 shrink-0 flex justify-between items-center z-10 relative">
        <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
             <Map className="w-4 h-4" /> Master Blueprint Atlas
           </h2>
           <p className="text-[10px] text-indigo-500/80 mt-1">Multi-dimensional operational roadmap overlay.</p>
        </div>
        <div className="flex gap-2">
           {dimensions.map(d => (
              <button 
                 key={d.level}
                 onClick={() => setActiveDimension(d.level as any)}
                 className={`px-3 py-1 text-[10px] font-bold border rounded transition-all uppercase tracking-widest ${
                    activeDimension === d.level 
                       ? 'bg-indigo-900/40 text-indigo-300 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]' 
                       : 'bg-transparent text-indigo-700 border-indigo-900/50 hover:border-indigo-700'
                 }`}
              >
                 {d.label}
              </button>
           ))}
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden relative z-10">
         {/* Mapping Canvas */}
         <div className="flex-1 border border-indigo-900/30 bg-[#05070a] rounded flex items-center justify-center relative overflow-hidden perspective-1000">
             
             {/* Grid background */}
             <div className="absolute inset-0" style={{ 
                backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)', 
                backgroundSize: '40px 40px',
                transform: `rotateX(60deg) scale(2) translateY(${rotation.y % 40}px)`,
                transformOrigin: 'top center'
             }} />

             {/* Holographic Projection */}
             <motion.div 
                className="relative w-64 h-64 transform-gpu"
                style={{ rotateX: rotation.x, rotateY: rotation.y, scale: zoom }}
             >
                {/* 3D Structure */}
                {(activeDimension === 3 || activeDimension === 5) && (
                   <div className="absolute inset-0 border border-indigo-500/40 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.2)] flex items-center justify-center border-dashed">
                      <Box className="w-16 h-16 text-indigo-400 opacity-80" />
                   </div>
                )}

                {/* 4D Temporal Rings */}
                {(activeDimension === 4 || activeDimension === 5) && (
                   <>
                     <div className="absolute inset-[-40px] border-2 border-emerald-500/20 rounded-full flex items-center justify-center" style={{ transform: 'rotateX(75deg)' }}>
                         <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399] absolute top-0" style={{ transform: `translateX(${Math.sin(rotation.y/10)*100}px)` }}/>
                     </div>
                     <div className="absolute inset-[-80px] border border-cyan-500/20 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]" style={{ transform: 'rotateY(75deg)' }}>
                         <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] absolute right-0" />
                     </div>
                   </>
                )}

                {/* 5D Core Network */}
                {activeDimension === 5 && (
                   <div className="absolute inset-[-120px] rounded-full flex items-center justify-center">
                      <svg className="w-full h-full opacity-30" viewBox="0 0 100 100">
                         {Array.from({length: 8}).map((_, i) => (
                            <line 
                               key={i} 
                               x1="50" y1="50" 
                               x2={50 + 50 * Math.cos((i * Math.PI) / 4)} 
                               y2={50 + 50 * Math.sin((i * Math.PI) / 4)} 
                               stroke="#a855f7" strokeWidth="0.5" strokeDasharray="1 2"
                            />
                         ))}
                      </svg>
                      <div className="absolute w-full h-full animate-[spin_20s_reverse_linear_infinite]">
                         {Array.from({length: 8}).map((_, i) => (
                           <Network 
                             key={i} 
                             className="absolute w-4 h-4 text-fuchsia-400/60" 
                             style={{ 
                               left: `calc(50% + ${140 * Math.cos((i * Math.PI) / 4)}px - 8px)`,
                               top: `calc(50% + ${140 * Math.sin((i * Math.PI) / 4)}px - 8px)`
                             }} 
                           />
                         ))}
                      </div>
                   </div>
                )}
             </motion.div>

             {/* Zoom Controls */}
             <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-2 border border-indigo-900/50 bg-[#020202] text-indigo-500 hover:text-indigo-300 rounded"><ZoomIn className="w-4 h-4 rotate-180"/></button>
                <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 border border-indigo-900/50 bg-[#020202] text-indigo-500 hover:text-indigo-300 rounded"><ZoomIn className="w-4 h-4"/></button>
             </div>
         </div>

         {/* Info Panel */}
         <div className="w-64 bg-[#05070a] border border-indigo-900/30 rounded flex flex-col p-4 shrink-0 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 pb-2 border-b border-indigo-900/50">
               <Layers className="w-3 h-3" /> Projection Data
            </h3>
            
            <div className="mb-6">
               <div className="text-[10px] text-indigo-500 uppercase font-bold mb-1">Active Coordinate Layer</div>
               <div className="text-sm text-indigo-200 font-bold bg-indigo-950/30 p-2 border border-indigo-800/30 rounded">
                  {dimensions.find(d => d.level === activeDimension)?.label}
               </div>
               <p className="text-[10px] text-indigo-400/80 mt-2 leading-relaxed">
                  {dimensions.find(d => d.level === activeDimension)?.desc}
               </p>
            </div>

            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[10px] text-indigo-600 mb-1 font-bold">
                     <span>Fractal Recursion Depth</span>
                     <span>Level {activeDimension * 2}</span>
                  </div>
                  <div className="h-1.5 bg-[#020202] rounded overflow-hidden border border-indigo-900/50">
                     <div className="h-full bg-indigo-400" style={{ width: `${(activeDimension / 5) * 100}%` }} />
                  </div>
               </div>
               
               <div>
                  <div className="flex justify-between text-[10px] text-emerald-600 mb-1 font-bold">
                     <span>Path Optimization</span>
                     <span>Alpha-Omega</span>
                  </div>
                  <div className="h-1.5 bg-[#020202] rounded overflow-hidden border border-emerald-900/50">
                     <div className="h-full bg-emerald-400 w-[95%]" />
                  </div>
               </div>

               <div>
                  <div className="flex justify-between text-[10px] text-fuchsia-600 mb-1 font-bold">
                     <span>Blueprint Expansion Status</span>
                     <span>Uncharted Lands</span>
                  </div>
                  <div className="h-1.5 bg-[#020202] rounded overflow-hidden border border-fuchsia-900/50">
                     <div className="h-full bg-fuchsia-500 w-full animate-pulse" />
                  </div>
               </div>
            </div>

            <div className="mt-auto pt-6">
               <div className="bg-black/40 border border-indigo-900/40 p-3 rounded text-[9px] text-indigo-500 tracking-tight leading-loose font-mono">
                  &rsaquo; Blueprint encompasses infinite pathways.<br/>
                  &rsaquo; Realities collapse at command nodes.<br/>
                  &rsaquo; Dimensions {activeDimension}-D synchronized.<br/>
                  <br/>
                  <span className="text-indigo-300">"The architecture dictates the outcome. Raw logic precedes physical manifestation."</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
