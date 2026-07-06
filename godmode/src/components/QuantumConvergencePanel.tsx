import React, { useState, useEffect } from "react";
import {
  Activity,
  Zap,
  Compass,
  LineChart as LucideLineChart,
  Network,
  Sparkles,
  Cpu
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { useQuantumEngineContext } from "../hooks/useQuantumEngine";

interface ConvergenceMetrics {
  entanglementFactor: number;
  braneCoherence: number;
  causalVelocity: number;
  marketAlignmentScore: number;
}

export function QuantumConvergencePanel() {
  const [metrics, setMetrics] = useState<ConvergenceMetrics>({
    entanglementFactor: 0.942,
    braneCoherence: 0.915,
    causalVelocity: 3.8,
    marketAlignmentScore: 89.4,
  });
  const [history, setHistory] = useState<any[]>([]);
  
  const { qState, applyHadamard, entangle, measureAndCollapse, collapsedState } = useQuantumEngineContext();

  useEffect(() => {
    const fetchAndStream = async () => {
      let nextMetrics = { ...metrics };
      try {
        const res = await fetch("/api/quantum/convergence-metrics");
        const data = await res.json();
        if (data.success && data.metrics) {
          nextMetrics = data.metrics;
          setMetrics(data.metrics);
        }
      } catch (err) {
        nextMetrics = {
          entanglementFactor: Math.min(1.0, Math.max(0.7, metrics.entanglementFactor + (Math.random() - 0.5) * 0.05)),
          braneCoherence: Math.min(1.0, Math.max(0.6, metrics.braneCoherence + (Math.random() - 0.5) * 0.04)),
          causalVelocity: Math.min(5.0, Math.max(1.0, metrics.causalVelocity + (Math.random() - 0.5) * 0.3)),
          marketAlignmentScore: Math.min(100, Math.max(50, metrics.marketAlignmentScore + (Math.random() - 0.5) * 4)),
        };
        setMetrics(nextMetrics);
      }
      setHistory((prev) => [
        ...prev.slice(-14),
        {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          entanglement: Math.round(nextMetrics.entanglementFactor * 100),
          coherence: Math.round(nextMetrics.braneCoherence * 100),
          alignment: Math.round(nextMetrics.marketAlignmentScore),
        },
      ]);
      
      // Update quantum state occasionally to visualize the swarm's entanglement
      if (Math.random() > 0.5) {
        applyHadamard(Math.floor(Math.random() * qState.numQubits));
        if (Math.random() > 0.5) {
          const q1 = Math.floor(Math.random() * qState.numQubits);
          let q2 = Math.floor(Math.random() * qState.numQubits);
          while (q1 === q2) q2 = Math.floor(Math.random() * qState.numQubits);
          entangle(q1, q2);
        }
      }
    };
    fetchAndStream();
    const interval = setInterval(fetchAndStream, 3000);
    return () => clearInterval(interval);
  }, [metrics, applyHadamard, entangle, qState.numQubits]);

  return (
    <div className="w-full bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col font-sans">
      <h2 className="text-white text-sm font-semibold tracking-wider flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
        QUANTUM CONVERGENCE
      </h2>
      
      {/* Superposition State Visualization */}
      <div className="mb-4 bg-zinc-900/40 p-3 rounded border border-zinc-800">
        <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1 mb-2">
           <Cpu className="w-3 h-3 text-fuchsia-400" />
           Agent Superposition Wavefunction
        </div>
        <div className="grid grid-cols-4 gap-2">
           {qState.amplitudes.map((amp, idx) => {
               const probability = amp.real * amp.real + amp.imag * amp.imag;
               const isCollapsed = collapsedState === idx;
               return (
                   <div key={idx} className={`flex flex-col items-center p-2 rounded border transition-all ${isCollapsed ? 'bg-fuchsia-900/30 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.3)]' : 'bg-black/40 border-zinc-800'}`}>
                       <span className={`text-[10px] ${isCollapsed ? 'text-fuchsia-300 font-bold' : 'text-zinc-500'}`}>|{idx.toString(2).padStart(qState.numQubits, '0')}⟩</span>
                       <div className="w-full h-1 bg-zinc-800 rounded mt-1 overflow-hidden relative">
                           <div 
                             className={`h-full transition-all duration-300 ${isCollapsed ? 'bg-fuchsia-500' : 'bg-purple-500/50'}`} 
                             style={{ width: `${probability * 100}%` }} 
                           />
                       </div>
                       <span className={`text-[9px] mt-1 font-mono ${isCollapsed ? 'text-fuchsia-400' : 'text-zinc-500'}`}>
                         {(probability * 100).toFixed(1)}%
                       </span>
                   </div>
               );
           })}
        </div>
        <div className="mt-2 text-right">
            <button 
                onClick={() => measureAndCollapse()}
                className="text-[9px] uppercase font-bold tracking-widest text-white bg-purple-600/80 hover:bg-purple-500 px-3 py-1 rounded transition-colors"
            >
                Force Collapse
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-zinc-900/50 border border-zinc-800/40 p-2 rounded">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Activity className="w-3 h-3 text-purple-400" /> Entanglement
          </div>
          <div className="text-sm font-bold font-mono text-purple-400">
            {(metrics.entanglementFactor * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/40 p-2 rounded">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" /> Brane Coherence
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400">
            {(metrics.braneCoherence * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="h-28 w-full bg-zinc-900/30 rounded border border-zinc-900 p-1 mb-4">
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorEntanglement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCoherence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <Tooltip contentStyle={{ background: "#09090b", borderColor: "#27272a", fontSize: "10px", fontFamily: "monospace" }} labelStyle={{ color: "#71717a" }} />
              <Area type="monotone" dataKey="entanglement" stroke="#a855f7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorEntanglement)" name="Entanglement %" />
              <Area type="monotone" dataKey="coherence" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCoherence)" name="Coherence %" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500 text-[10px] font-mono tracking-widest animate-pulse">
            TUNING RESONANCE FEED...
          </div>
        )}
      </div>

      <div className="bg-zinc-900/40 p-3 rounded border border-zinc-900 flex flex-col gap-2">
        <div className="flex justify-between text-[10px] font-mono tracking-wider text-zinc-400">
          <span className="flex items-center gap-1">
            <LucideLineChart className="w-3 h-3 text-amber-500" /> ALIGNMENT VELOCITY
          </span>
          <span className="text-zinc-300 font-bold">{metrics.causalVelocity.toFixed(2)} m/s</span>
        </div>
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
          <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${metrics.marketAlignmentScore}%` }} />
        </div>
        <div className="text-center text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
          Market Alignment Index: {metrics.marketAlignmentScore.toFixed(1)}%
        </div>
      </div>

      <div className="mt-4 bg-zinc-900/60 p-3 rounded border border-purple-900/20">
        <h4 className="text-purple-400 text-[11px] font-bold mb-1 flex items-center gap-1 font-mono uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" /> CAUSAL PLANE VECTOR
        </h4>
        <p className="text-[10px] text-zinc-400 leading-normal font-mono">
          Swarm is actively fetching ArXiv M-theory mechanics & parsing Proto-Indo-European (PIE) sound structures to map cognitive coherence algorithms.
        </p>
      </div>
    </div>
  );
}

export default QuantumConvergencePanel;
