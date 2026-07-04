import React, { useState, useEffect } from 'react';
import { Activity, Shield, Zap, Dna, Thermometer, Battery, Heart, Brain } from 'lucide-react';
import { useBiologicalStore } from '../store/useBiologicalStore';
import { motion } from 'framer-motion';

export function CellularRejuvenationMatrix() {
  const { totalJoulesConserved, neurochemicals, myelinDensity, addJoulesConserved } = useBiologicalStore();

  const joulesConserved = totalJoulesConserved;
  const dopamine = neurochemicals.dopamine;
  const cortisol = neurochemicals.norepinephrine * 0.5;
  const myelin = myelinDensity;
  const adrenaline = neurochemicals.norepinephrine;

  const biologicalState = {
    joulesConserved,
    dopamine,
    cortisol,
    myelin,
    adrenaline
  };

  const [dnaIntegrity, setDnaIntegrity] = useState(98.5);
  const [telomereLength, setTelomereLength] = useState(12000);
  const [atpProduction, setAtpProduction] = useState(100);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const cycle = setInterval(() => {
      if (joulesConserved > 1000 && !isEditing) {
        setDnaIntegrity(prev => Math.min(100, prev + 0.01));
        setTelomereLength(prev => prev + 1);
      }
      setAtpProduction(Math.max(50, Math.min(150, 100 + (dopamine - cortisol) / 2)));
    }, 2000);
    return () => clearInterval(cycle);
  }, [joulesConserved, dopamine, cortisol, isEditing]);

  const executeBaseEdit = () => {
    if (biologicalState.joulesConserved < 500) return;
    setIsEditing(true);
    addJoulesConserved(-500);
    
    setTimeout(() => {
      setDnaIntegrity(prev => Math.min(100, prev + 0.5));
      setTelomereLength(prev => prev + 25);
      setIsEditing(false);
    }, 1500);
  };

  return (
    <div className="w-full h-full bg-[#050505] text-rose-500 font-mono p-4 flex flex-col border-l border-rose-900/30 overflow-hidden">
      <div className="border-b border-rose-900/50 pb-3 mb-4 shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Cellular Rejuvenation Matrix
        </h2>
        <p className="text-[10px] text-rose-700 mt-1">Deep mechanical base editing. Convert Work into physical longevity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
        <div className="bg-black border border-rose-900/30 p-3 rounded">
          <div className="text-[10px] text-rose-600 mb-1 flex items-center gap-1"><Shield className="w-3 h-3"/> DNA Integrity</div>
          <div className="text-2xl font-bold text-rose-400">{dnaIntegrity.toFixed(2)}%</div>
          <div className="w-full bg-rose-950/30 h-1 mt-2 rounded overflow-hidden">
             <div className="h-full bg-rose-500 transition-all" style={{ width: `${dnaIntegrity}%` }} />
          </div>
        </div>
        
        <div className="bg-black border border-rose-900/30 p-3 rounded">
          <div className="text-[10px] text-rose-600 mb-1 flex items-center gap-1"><Dna className="w-3 h-3"/> Telomere Cap (bp)</div>
          <div className="text-2xl font-bold text-rose-400">{telomereLength}</div>
          <div className="text-[9px] text-rose-700 mt-1">Structural Buffer Intact</div>
        </div>
      </div>

      <div className="bg-black border border-rose-900/50 p-4 mb-4 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <Dna className="w-32 h-32" />
        </div>
        <div className="text-xs mb-3 text-rose-400 font-bold border-b border-rose-900/50 pb-2">STRUCTURAL BASE EDITING</div>
        
        <div className="flex justify-between items-center mb-3 text-xs">
           <span className="text-rose-600">Available Energy Vector:</span>
           <span className="text-rose-300 font-bold">{biologicalState.joulesConserved} J</span>
        </div>

        <button 
          onClick={executeBaseEdit}
          disabled={isEditing || biologicalState.joulesConserved < 500}
          className="w-full p-3 bg-rose-900/20 hover:bg-rose-900/40 border border-rose-500/50 rounded font-bold text-xs uppercase tracking-widest text-rose-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isEditing ? (
             <><div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /> Sequencing...</>
          ) : (
             <><Zap className="w-3 h-3" /> Transmute 500J to Integrity</>
          )}
        </button>
      </div>

      <div className="flex-1 border-t border-rose-900/30 pt-4 overflow-y-auto custom-scrollbar">
         <h3 className="text-[10px] uppercase font-bold text-rose-600 tracking-widest mb-3 flex items-center gap-2">
            <Battery className="w-3 h-3" /> Mitochondrial ATP Flux
         </h3>
         
         <div className="flex flex-col gap-3">
            {[
               { id: 'muscular', label: 'Skeletal Muscle Density', icon: <Heart />, value: `${(biologicalState.myelin * 1.5).toFixed(1)}%` },
               { id: 'neural', label: 'Neural Metabolic Rate', icon: <Brain />, value: `${atpProduction.toFixed(1)}%` },
               { id: 'thermal', label: 'Core Thermogenesis', icon: <Thermometer />, value: `${(36.5 + (biologicalState.adrenaline / 100)).toFixed(1)}°C` }
            ].map(sys => (
               <div key={sys.id} className="flex items-center justify-between p-2 bg-black border border-rose-950 rounded">
                  <div className="flex items-center gap-2 text-rose-500/80">
                     {React.cloneElement(sys.icon as any, { className: 'w-3 h-3' })}
                     <span className="text-[10px] uppercase">{sys.label}</span>
                  </div>
                  <span className="text-xs font-bold text-rose-400">{sys.value}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
