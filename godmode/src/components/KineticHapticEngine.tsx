import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, Volume2, HardDrive, Download, Sliders } from 'lucide-react';

export function KineticHapticEngine() {
  const [resonance, setResonance] = useState(50);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
     let interval: NodeJS.Timeout;
     if (isSyncing) {
        interval = setInterval(() => {
           setResonance(r => {
              const pulse = r + (Math.random() * 20 - 10);
              const clamped = Math.max(10, Math.min(100, pulse));
              
              // Heavy Kinetic Haptic Feedback
              if (navigator.vibrate) {
                 if (clamped > 80) navigator.vibrate([100, 50, 100]);
                 else navigator.vibrate(50);
              }
              
              if (clamped > 90) { /* placeholder for thump */ }
              
              if (oscRef.current && gainRef.current) {
                 oscRef.current.frequency.setTargetAtTime(40 + clamped * 2, ctxRef.current!.currentTime, 0.1);
                 gainRef.current.gain.setTargetAtTime(0.1 + (clamped / 100) * 0.3, ctxRef.current!.currentTime, 0.1);
              }
              
              return clamped;
           });
        }, 1000);
     } else {
        if (oscRef.current && gainRef.current && ctxRef.current) {
           gainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.5);
        }
     }
     
     return () => clearInterval(interval);
  }, [isSyncing]);

  const toggleSync = () => {
     if (!isSyncing) {
        if (!ctxRef.current) {
           const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
           ctxRef.current = new AudioContext();
           oscRef.current = ctxRef.current.createOscillator();
           gainRef.current = ctxRef.current.createGain();
           
           oscRef.current.type = 'sine';
           oscRef.current.frequency.value = 40 + resonance * 2;
           
           gainRef.current.gain.value = 0;
           
           oscRef.current.connect(gainRef.current);
           gainRef.current.connect(ctxRef.current.destination);
           
           oscRef.current.start();
        }
        if (ctxRef.current?.state === 'suspended') {
           ctxRef.current.resume();
        }
     }
     setIsSyncing(!isSyncing);
  };

  const exportSpatialData = () => {
     const data = {
        timestamp: new Date().toISOString(),
        resonanceBaseline: resonance,
        syncState: isSyncing,
        structuralNodes: Array.from({length: 12}, (_, i) => ({ id: `N-${i}`, density: Math.random() * 100 }))
     };
     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `spatial-resonance-${Date.now()}.json`;
     a.click();
     URL.revokeObjectURL(url);
  };
  
  const exportCSV = () => {
     const headers = "timestamp,node_id,density\n";
     const rows = Array.from({length: 12}, (_, i) => `${new Date().toISOString()},N-${i},${(Math.random()*100).toFixed(2)}`).join('\n');
     const blob = new Blob([headers + rows], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `spatial-density-metric-${Date.now()}.csv`;
     a.click();
     URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-[#0a0505] text-rose-500 font-mono p-4 flex flex-col border-l border-rose-900/40 overflow-hidden">
      <div className="border-b border-rose-900/50 pb-3 mb-4 shrink-0 flex justify-between items-center">
        <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2">
             <Volume2 className="w-4 h-4" /> Procedural Resonance Engine
           </h2>
           <p className="text-[10px] text-rose-700 mt-1">Digital gravity to physical reality sync via Haptics & Audio.</p>
        </div>
        <button 
           onClick={toggleSync}
           className={`px-3 py-1 font-bold text-xs border rounded transition-colors uppercase tracking-widest flex items-center gap-2 ${
              isSyncing ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-transparent border-rose-900 text-rose-700 hover:text-rose-500 hover:border-rose-700'
           }`}
        >
           {isSyncing ? <><Activity className="w-3 h-3 animate-pulse" /> SYNC ACTIVE</> : <><Volume2 className="w-3 h-3" /> INITIATE SYNC</>}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 pb-4">
         <div className="bg-[#110505] border border-rose-900/30 rounded p-4 flex flex-col items-center justify-center relative overflow-hidden">
             {/* Circular Haptic Visualizer */}
             <div className="relative w-48 h-48 flex items-center justify-center">
                 {[1,2,3].map(ring => (
                    <div 
                       key={ring}
                       className="absolute rounded-full border border-rose-500/30 inset-0 transition-transform duration-100 ease-out"
                       style={{ 
                          transform: `scale(${isSyncing ? 1 + (resonance/100) * (ring*0.2) : 1})`,
                          opacity: isSyncing ? 1 - (ring*0.2) : 0.1
                       }}
                    />
                 ))}
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)] z-10 transition-colors ${
                    isSyncing ? 'bg-rose-600' : 'bg-rose-950'
                 }`}>
                     <Zap className={`w-8 h-8 ${isSyncing ? 'text-rose-200' : 'text-rose-800'}`} />
                 </div>
             </div>
             
             <div className="mt-8 w-full">
                <div className="flex justify-between text-[10px] uppercase text-rose-600 mb-1">
                   <span>Gravity Well Resonance</span>
                   <span>{resonance.toFixed(1)}Hz</span>
                </div>
                <input 
                   type="range" min="10" max="100" value={resonance}
                   onChange={e => setResonance(Number(e.target.value))}
                   disabled={isSyncing}
                   className="w-full accent-rose-500"
                />
             </div>
         </div>

         <div className="flex flex-col gap-4">
             <div className="bg-[#110505] border border-rose-900/30 rounded p-4">
                 <h3 className="text-xs uppercase font-bold text-rose-500 flex items-center gap-2 mb-4">
                    <HardDrive className="w-3 h-3" /> Data Structural Export
                 </h3>
                 <p className="text-[10px] text-rose-700 leading-relaxed mb-4">
                    Manifest data extraction through structural snapshot exports for external visualization mapping.
                 </p>
                 <div className="flex gap-2">
                    <button onClick={exportSpatialData} className="flex-1 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 rounded flex items-center justify-center gap-2 text-[10px] font-bold text-rose-400 transition-colors uppercase tracking-widest">
                       <Download className="w-3 h-3"/> Export JSON
                    </button>
                    <button onClick={exportCSV} className="flex-1 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 rounded flex items-center justify-center gap-2 text-[10px] font-bold text-rose-400 transition-colors uppercase tracking-widest">
                       <Download className="w-3 h-3"/> Export CSV
                    </button>
                 </div>
             </div>
             
             <div className="bg-[#110505] border border-rose-900/30 rounded p-4 flex-1">
                 <h3 className="text-xs uppercase font-bold text-rose-500 flex items-center gap-2 mb-3">
                    <Sliders className="w-3 h-3" /> Hardware Haptic API
                 </h3>
                 <div className="space-y-2 text-[10px] font-mono text-rose-600">
                     <div className="flex justify-between border-b border-rose-900/30 pb-1">
                        <span>Navigator.vibrate Support</span>
                        <span className={navigator.vibrate ? 'text-emerald-400' : 'text-rose-400'}>{navigator.vibrate ? 'DETECTED' : 'UNAVAILABLE'}</span>
                     </div>
                     <div className="flex justify-between border-b border-rose-900/30 pb-1">
                        <span>AudioContext Context</span>
                        <span className={ctxRef.current ? 'text-emerald-400' : 'text-amber-500'}>{ctxRef.current ? 'INITIALIZED' : 'SUSPENDED'}</span>
                     </div>
                     <div className="flex justify-between border-b border-rose-900/30 pb-1">
                        <span>Active Harmonic Nodes</span>
                        <span className="text-rose-300">1</span>
                     </div>
                 </div>
                 
                 <div className="bg-black border border-rose-900/20 p-2 mt-4 rounded-sm">
                    <div className="text-[9px] text-rose-700 font-bold mb-1">TERMINAL LOG</div>
                    <div className="text-[9px] text-rose-500/80 tracking-tight">
                       {isSyncing ? `[${new Date().toISOString()}] Pulses syncing to localized grid... frequency modulated to ${resonance.toFixed(1)}Hz.` : `[SYSTEM] Engine dormant. Provide raw intent to initiate.`}
                    </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
}
