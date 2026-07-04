import React, { useState, useEffect } from 'react';
import { Globe, Wind, Droplet, Zap, Activity, ShieldAlert, Cpu } from 'lucide-react';

export function EnvironmentalTechGrid() {
  const [co2Extracted, setCo2Extracted] = useState(140.5);
  const [earthGridSync, setEarthGridSync] = useState(98.2);
  const [climateShift, setClimateShift] = useState(0.004);

  useEffect(() => {
    const tick = setInterval(() => {
       setCo2Extracted(prev => prev + (Math.random() * 0.1));
       setEarthGridSync(prev => {
          const sync = prev + (Math.random() * 0.4 - 0.2);
          return Math.min(100, Math.max(90, sync));
       });
       setClimateShift(prev => prev + (Math.random() * 0.001 - 0.0005));
    }, 1500);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="w-full h-full bg-[#020604] text-emerald-500 font-mono p-4 flex flex-col border-l border-emerald-900/40 overflow-hidden">
      <div className="border-b border-emerald-900/50 pb-3 mb-4 shrink-0 flex justify-between items-center z-10 relative">
        <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
             <Globe className="w-4 h-4" /> Environmental Tech Command
           </h2>
           <p className="text-[10px] text-emerald-700 mt-1">Carbon Mineralization • Earth Observation Grids • Quantum Climate.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded text-[10px] uppercase font-bold text-emerald-400">
           <Activity className="w-3 h-3 animate-pulse" /> Grid Online
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4 pb-4">
          
          {/* Carbon Mineralization */}
          <div className="col-span-1 bg-[#040a06] border border-emerald-900/30 rounded p-4 flex flex-col relative overflow-hidden">
             <div className="absolute -right-10 -bottom-10 opacity-5">
                <HexagonPattern size={200} />
             </div>
             <h3 className="text-xs uppercase font-bold text-emerald-500 flex items-center gap-2 mb-4">
               <Droplet className="w-4 h-4" /> Carbon Mineralization
             </h3>
             <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-4xl font-light text-emerald-300 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                   {co2Extracted.toFixed(2)}<span className="text-sm text-emerald-600 ml-1">MT</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-emerald-600 mt-2 text-center">
                   Atmospheric Mass Extracted & Mineralized
                </div>
             </div>
             <div className="mt-auto space-y-2">
                <div className="flex justify-between text-[9px] uppercase text-emerald-700">
                   <span>Calcification Protocol</span>
                   <span className="text-emerald-400">ACTIVE</span>
                </div>
                <div className="flex justify-between text-[9px] uppercase text-emerald-700">
                   <span>Geological Storage Vol</span>
                   <span className="text-emerald-400">14.2 km³</span>
                </div>
             </div>
          </div>

          {/* Earth Observation Synthesis */}
          <div className="col-span-1 bg-[#040a06] border border-emerald-900/30 rounded p-4 flex flex-col">
             <h3 className="text-xs uppercase font-bold text-emerald-500 flex items-center gap-2 mb-4">
               <Cpu className="w-4 h-4" /> AI Earth Observation
             </h3>
             
             <div className="flex-1 relative flex items-center justify-center border border-emerald-900/20 bg-black/40 rounded overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Equirectangular_projection_SW.jpg')] bg-cover opacity-20 sepia hue-rotate-140 brightness-50 mix-blend-screen" />
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                
                {/* Scanning line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400/50 shadow-[0_0_10px_#34d399] animate-[scan_3s_linear_infinite]" />

                <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase font-bold text-emerald-100 bg-emerald-900/20 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity p-4 text-center">
                   Real-time satellite feed synchronized. Topographical matrices updated across 4,000 sectors.
                </div>
             </div>

             <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-2 bg-emerald-950 rounded overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${earthGridSync}%` }} />
                </div>
                <div className="text-[10px] font-bold text-emerald-400 w-12 text-right">{earthGridSync.toFixed(1)}%</div>
             </div>
          </div>

          {/* Quantum Climate Prediction */}
          <div className="col-span-1 bg-[#040a06] border border-emerald-900/30 rounded p-4 flex flex-col">
             <h3 className="text-xs uppercase font-bold text-emerald-500 flex items-center gap-2 mb-4">
               <Wind className="w-4 h-4" /> Quantum Climate Matrix
             </h3>
             
             <div className="flex-1 space-y-4">
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded flex items-center justify-between">
                   <span className="text-[10px] uppercase text-emerald-600">Global Delta Shift</span>
                   <span className={`text-xs font-bold ${climateShift > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {climateShift > 0 ? '+' : ''}{climateShift.toFixed(5)} °C
                   </span>
                </div>

                <div className="space-y-2">
                   {['Troposphere Drift', 'Oceanic Salinity', 'Jet Stream Torque'].map((v, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-emerald-900/20 pb-1">
                         <span className="text-[10px] uppercase text-emerald-700">{v}</span>
                         <span className="text-[10px] font-mono text-emerald-400">
                           {Array.from({length: 8}).map(() => Math.random() > 0.5 ? '1' : '0').join('')}
                         </span>
                      </div>
                   ))}
                </div>
                
                <div className="text-[9px] text-emerald-600/60 leading-relaxed uppercase mt-4">
                  Predictive trendlines mapped 10 years forward. Environmental tech commands atmospheric realities to collapse into local vector grids.
                </div>
             </div>
          </div>

      </div>
    </div>
  );
}

const HexagonPattern = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="text-emerald-500">
    <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M50 20 L76.6 35 L76.6 65 L50 80 L23.4 65 L23.4 35 Z" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
