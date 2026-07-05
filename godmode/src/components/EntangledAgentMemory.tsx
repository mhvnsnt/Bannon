import React, { useEffect } from 'react';
import { useQuantumEngine } from '../hooks/useQuantumEngine';
import { Activity, Network, Zap } from 'lucide-react';

export function EntangledAgentMemory() {
  const { qState, applyHadamard, entangle, measureAndCollapse, collapsedState } = useQuantumEngine(3);

  useEffect(() => {
    const iv = setInterval(() => {
      applyHadamard(0);
      entangle(0, 1);
      entangle(1, 2);
      measureAndCollapse();
    }, 4000);
    return () => clearInterval(iv);
  }, [applyHadamard, entangle, measureAndCollapse]);

  return (
    <div className="w-full bg-[#0a0a0a] border border-cyan-900/30 rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between mb-4 border-b border-cyan-900/50 pb-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h3 className="text-cyan-400 font-bold text-xs tracking-widest">ENTANGLED AGENT MEMORY MATRIX</h3>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span className="text-emerald-500 text-[10px]">SYNC ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-gray-500 mb-2">STATE VECTOR (AMPLITUDES)</div>
          <div className="space-y-1 h-32 overflow-y-auto custom-scrollbar pr-2">
            {qState.amplitudes.map((amp, idx) => {
              const prob = (amp.real * amp.real + amp.imag * amp.imag) * 100;
              return (
                <div key={idx} className={`flex items-center justify-between text-[10px] p-1 rounded ${collapsedState === idx ? 'bg-cyan-900/40 text-cyan-300' : 'text-gray-400'}`}>
                  <span>|{idx.toString(2).padStart(3, '0')}⟩</span>
                  <div className="flex-1 mx-2 h-1 bg-[#111] rounded overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-cyan-500" style={{ width: `${prob}%` }}></div>
                  </div>
                  <span className="w-8 text-right">{prob.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-l border-cyan-900/30 pl-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500 text-[10px] font-bold">LATEST COLLAPSE EVENT</span>
          </div>
          {collapsedState !== null ? (
            <div className="bg-[#111] border border-cyan-900/50 p-3 rounded text-center">
              <div className="text-[10px] text-gray-500 mb-1">DECISION PATH</div>
              <div className="text-xl text-cyan-400 font-bold">|{collapsedState.toString(2).padStart(3, '0')}⟩</div>
              <div className="text-[10px] text-emerald-500 mt-2">SWARM SYNCED</div>
            </div>
          ) : (
            <div className="text-gray-600 text-xs italic text-center">Awaiting quantum coherence...</div>
          )}
        </div>
      </div>
    </div>
  );
}
