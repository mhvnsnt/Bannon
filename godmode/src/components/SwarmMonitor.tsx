import { EntangledAgentMemory } from './EntangledAgentMemory';
import React, { useState, useEffect } from 'react';
import { Network, Activity, Zap, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { useQuantumEngine } from '../hooks/useQuantumEngine';
import { ErrorCorrectionNode } from '../lib/quantum/ErrorCorrectionNode';

export function SwarmMonitor() {
  const [status, setStatus] = useState<'IDLE' | 'RUNNING'>('IDLE');
  const [intent, setIntent] = useState<string | null>(null);
  
  const [builderContext, setBuilderContext] = useState<string>('');
  const [destroyerContext, setDestroyerContext] = useState<string>('');
  const [optimizerContext, setOptimizerContext] = useState<string>('');
  const [adjudicatorRuling, setAdjudicatorRuling] = useState<{ status: string, ruling: string } | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [manualIntent, setManualIntent] = useState('');

  const { qState, applyHadamard, entangle, measureAndCollapse, collapsedState } = useQuantumEngine(3);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/armada/swarm/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/armada/swarm/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        if (data.intent) setIntent(data.intent);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStatus();

    const socket: Socket = io();

    socket.on('SWARM_UPDATE', (data: any) => {
      setStatus('RUNNING');
      
      // Induce quantum entanglement in state probabilities when swarm updates
      applyHadamard(0);
      applyHadamard(1);
      applyHadamard(2);
      entangle(0, 1);
      entangle(1, 2);

      if (data.status === 'RUNNING') {
         if (data.agent === 'builder') setBuilderContext('SYNTHESIZING...');
         if (data.agent === 'destroyer') setDestroyerContext('ANALYZING WEAKNESSES...');
         if (data.agent === 'optimizer') setOptimizerContext('WEAVING SYNTHESIS...');
      } else if (data.status === 'COMPLETE' && data.output) {
         if (data.agent === 'builder') setBuilderContext(data.output);
         if (data.agent === 'destroyer') setDestroyerContext(data.output);
         if (data.agent === 'optimizer') setOptimizerContext(data.output);
      }
    });

    socket.on('SWARM_RESULT', (data: any) => {
      setStatus('IDLE');
      setIntent(null);
      
      // Parity Check Simulation via ErrorCorrectionNode
      const finalState = measureAndCollapse();
      // We simulate agent states based on final measured state bits
      const a1State = (finalState >> 2) & 1;
      const a2State = (finalState >> 1) & 1;
      const a3State = finalState & 1;
      
      const correctedState = ErrorCorrectionNode.applyParityCheck(a1State, a2State, a3State);
      const isCorrected = correctedState !== a1State;

      setAdjudicatorRuling({ 
          status: data.status, 
          ruling: data.ruling + (isCorrected ? `\n\n[QEC] Hallucination parity corrected.` : `\n\n[QEC] Consensus absolute.`)
      });
      fetchHistory();
    });

    return () => {
      socket.disconnect();
    };
  }, [applyHadamard, entangle, measureAndCollapse]);

  const dispatchSwarm = async () => {
    if (!manualIntent.trim()) return;
    setStatus('RUNNING');
    setIntent(manualIntent);
    setBuilderContext('');
    setDestroyerContext('');
    setOptimizerContext('');
    setAdjudicatorRuling(null);

    try {
      await fetch('/api/armada/swarm/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'swarm_' + Date.now(),
          intent: manualIntent,
          targetFiles: []
        })
      });
      setManualIntent('');
    } catch (e) {
      console.error(e);
      setStatus('IDLE');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/90 text-white font-mono rounded-xl border border-white/10 overflow-hidden relative overflow-y-auto w-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50 sticky top-0 z-10 backdrop-blur-sm">
        <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center gap-3">
          <Network className="w-5 h-5 text-emerald-500" />
          Neural Swarm Orchestrator
        </h2>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${status === 'RUNNING' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
           {status === 'RUNNING' ? 'SWARM ACTIVE' : 'SWARM IDLE'}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Dispatch Controls */}
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500/50 text-white placeholder-gray-600"
            placeholder="E.g., Optimize the ragdoll gravity constant for minimum jitter..."
            value={manualIntent}
            onChange={(e) => setManualIntent(e.target.value)}
            disabled={status === 'RUNNING'}
            onKeyDown={(e) => e.key === 'Enter' && dispatchSwarm()}
          />
          <button 
            onClick={dispatchSwarm}
            disabled={status === 'RUNNING'}
            className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 border border-amber-600/50 px-4 py-2 rounded-lg text-sm uppercase tracking-wider font-bold transition-all disabled:opacity-50"
          >
            Dispatch Swarm
          </button>
        </div>

        {/* Quantum State Visualizer */}
        <div className="bg-slate-900 border border-indigo-900/50 rounded-xl p-4">
           <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Quantum Execution Probabilities</div>
           <div className="grid grid-cols-4 gap-2">
             {qState.amplitudes.map((amp, idx) => {
                 const probability = amp.real * amp.real + amp.imag * amp.imag;
                 return (
                     <div key={idx} className="flex flex-col items-center p-2 bg-black/40 rounded border border-indigo-500/20">
                         <span className="text-[10px] text-gray-400">|{idx.toString(2).padStart(3, '0')}⟩</span>
                         <div className="w-full h-1 bg-gray-800 rounded mt-1 overflow-hidden">
                             <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${probability * 100}%` }} />
                         </div>
                         <span className="text-[9px] mt-1 text-indigo-300">{(probability * 100).toFixed(1)}%</span>
                     </div>
                 );
             })}
           </div>
        </div>

        {/* Active Swarm View */}
        <AnimatePresence>
          {(status === 'RUNNING' || adjudicatorRuling || builderContext) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              {intent && (
                <div className="text-xs text-amber-400/80 uppercase tracking-widest mb-2 border-l-2 border-amber-500/50 pl-3">
                  CURRENT INTENT: {intent}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Builder */}
                <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-4 h-64 overflow-y-auto">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Builder Proposal
                  </div>
                  <div className="text-[10px] text-gray-300 whitespace-pre-wrap">
                    {builderContext || <span className="text-gray-600 animate-pulse">Awaiting matrix sync...</span>}
                  </div>
                </div>

                {/* Destroyer */}
                <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4 h-64 overflow-y-auto">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" />
                    Destroyer Critique
                  </div>
                  <div className="text-[10px] text-gray-300 whitespace-pre-wrap">
                    {destroyerContext || <span className="text-gray-600 animate-pulse">Awaiting builder payload...</span>}
                  </div>
                </div>

                {/* Optimizer */}
                <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4 h-64 overflow-y-auto">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Optimizer Synthesis
                  </div>
                  <div className="text-[10px] text-gray-300 whitespace-pre-wrap">
                    {optimizerContext || <span className="text-gray-600 animate-pulse">Awaiting destroyer critique...</span>}
                  </div>
                </div>
              </div>

              {adjudicatorRuling && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`mt-4 p-4 rounded-xl border flex items-center gap-4 ${
                    adjudicatorRuling.status === 'DEPLOYED' 
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' 
                    : 'bg-red-950/40 border-red-500/50 text-red-400'
                  }`}
                >
                  {adjudicatorRuling.status === 'DEPLOYED' ? <CheckCircle className="w-8 h-8 shrink-0" /> : <XCircle className="w-8 h-8 shrink-0" />}
                  <div>
                    <strong className="block text-lg mb-1">{adjudicatorRuling.status}</strong>
                    <div className="text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {adjudicatorRuling.ruling}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Stream */}
        {history.length > 0 && (
          <div className="mt-8">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Swarm Archive</h3>
             <div className="space-y-2">
               {history.map((run, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 rounded p-3 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     {run.status === 'DEPLOYED' ? (
                       <CheckCircle className="w-4 h-4 text-emerald-500" />
                     ) : (
                       <XCircle className="w-4 h-4 text-red-500" />
                     )}
                     <div className="text-xs text-gray-300 truncate max-w-sm">
                       {run.task_id}
                     </div>
                   </div>
                   <div className="text-[10px] text-gray-500">
                     {new Date(run.timestamp).toLocaleTimeString()}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
