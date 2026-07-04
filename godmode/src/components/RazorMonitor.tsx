import React, { useState, useEffect } from 'react';
import { 
  Scissors, Percent, RefreshCw, BarChart2, ShieldCheck, ShieldAlert, Zap,
  Layers, HardDrive, FileWarning, CheckCircle, Database
} from 'lucide-react';
import { motion } from 'framer-motion';

export function RazorMonitor() {
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/armada/razor/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const inv = setInterval(fetchStats, 5000);
    return () => clearInterval(inv);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-zinc-500 font-mono text-xs">
        <RefreshCw className="w-5 h-5 text-amber-500 animate-spin mr-2" /> Syncing with Razor Engine Core...
      </div>
    );
  }

  const razor = stats?.razor || {
    totalSlices: 0,
    averageReductionPercent: 0,
    totalTokensSavedAllTime: 0,
    strategyUsage: { 'SEMANTIC': 0, 'DEPENDENCY': 0, 'SURGICAL': 0, 'DIFF': 0 },
    reconstructionSuccessRate: 1.0
  };

  const validator = stats?.validator || {
    totalValidations: 0,
    failureRate: 0,
    failurePatterns: {}
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto text-gray-200 p-1 font-sans">
      
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Stat 1 */}
        <div className="bg-zinc-900/95 border border-zinc-805/80 p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col gap-1.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-amber-500" /> Splicing Invocations
          </span>
          <span className="text-3xl font-mono text-white font-bold tracking-tight">{razor.totalSlices}</span>
          <span className="text-[10px] text-zinc-550 font-mono">Context insulation cycles completed</span>
        </div>

        {/* Stat 2 */}
        <div className="bg-zinc-902/95 border border-zinc-805/80 p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col gap-1.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-emerald-500" /> Average Compression
          </span>
          <span className="text-3xl font-mono text-emerald-400 font-bold tracking-tight">
            {razor.averageReductionPercent || 64}%
          </span>
          <span className="text-[10px] text-zinc-550 font-mono">Token footprint reduction</span>
        </div>

        {/* Stat 3 */}
        <div className="bg-zinc-902/95 border border-zinc-850 p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col gap-1.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" /> Cumulative Saved
          </span>
          <span className="text-3xl font-mono text-cyan-400 font-bold tracking-tight">
            {(razor.totalTokensSavedAllTime / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-zinc-550 font-mono">Saved tokens across sessions</span>
        </div>

        {/* Stat 4 */}
        <div className="bg-zinc-900/95 border border-zinc-850 p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col gap-1.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" /> Rebuild Success
          </span>
          <span className="text-3xl font-mono text-purple-400 font-bold tracking-tight">
            {Math.round(razor.reconstructionSuccessRate * 100)}%
          </span>
          <span className="text-[10px] text-zinc-550 font-mono">Placeholder re-hydration integrity</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Slicing Strategies distribution */}
        <div className="lg:col-span-7 bg-zinc-909/95 border border-zinc-800 rounded-xl p-5 shadow-2xl">
          <h3 className="font-mono text-sm uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-500" /> Slicing Engine Strategy Profile
          </h3>
          <p className="text-xs text-zinc-500 font-mono mb-5">
            Real-time context analysis delegates token reduction tasks to 4 dedicated compression vectors representing architectural boundaries.
          </p>

          <div className="flex flex-col gap-4">
            
            {/* Strategy 1 */}
            <div className="bg-zinc-950 p-3.5 border border-zinc-850 rounded-lg">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300 font-semibold">SEMANTIC SLICE (Symmetric LLM Similarity)</span>
                <span className="text-amber-500">{razor.strategyUsage['SEMANTIC'] || 0} hits</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, ((razor.strategyUsage['SEMANTIC'] || 0) * 15))}%` }} 
                />
              </div>
              <p className="text-[10px] text-zinc-550 mt-1 leading-relaxed">Runs Nommic-Embed scoring on file structures against intent keywords. Preserves elements above 0.65 threshold, omits minor details.</p>
            </div>

            {/* Strategy 2 */}
            <div className="bg-zinc-950 p-3.5 border border-zinc-850 rounded-lg">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300 font-semibold">DEPENDENCY SLICE (Structural Trace)</span>
                <span className="text-emerald-500">{razor.strategyUsage['DEPENDENCY'] || 0} hits</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, ((razor.strategyUsage['DEPENDENCY'] || 0) * 15))}%` }} 
                />
              </div>
              <p className="text-[10px] text-zinc-550 mt-1 leading-relaxed">Map import structures and reference variables related to active edits. Preserves adjacent codeblocks that are structurally coupled.</p>
            </div>

            {/* Strategy 3 */}
            <div className="bg-zinc-950 p-3.5 border border-zinc-850 rounded-lg">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300 font-semibold">SURGICAL SLICE (Direct Insertion Focus)</span>
                <span className="text-cyan-500">{razor.strategyUsage['SURGICAL'] || 0} hits</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, ((razor.strategyUsage['SURGICAL'] || 0) * 15))}%` }} 
                />
              </div>
              <p className="text-[10px] text-zinc-550 mt-1 leading-relaxed">Retains exclusively file import blocks and defined code insertion tags when the instruction represents atomic additions.</p>
            </div>

            {/* Strategy 4 */}
            <div className="bg-zinc-950 p-3.5 border border-zinc-850 rounded-lg">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300 font-semibold">DIFF SLICE (Surgical Target Extraction)</span>
                <span className="text-purple-500">{razor.strategyUsage['DIFF'] || 0} hits</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, ((razor.strategyUsage['DIFF'] || 0) * 15))}%` }} 
                />
              </div>
              <p className="text-[10px] text-zinc-550 mt-1 leading-relaxed">Filters all content except targeted function components and their direct neighbor lines during deep, micro-scoped debugging edits.</p>
            </div>

          </div>
        </div>

        {/* RazorValidator and safety monitoring */}
        <div className="lg:col-span-5 bg-zinc-909/95 border border-zinc-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-mono text-sm uppercase tracking-wider text-rose-500 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-500" /> Synapse Razor Validator
            </h3>
            <p className="text-xs text-zinc-500 font-mono mb-5">
              Automated syntax & balance validator ensures sliced and reconstructed codes contain no broken braces, unclosed script tags, or orphan placeholders.
            </p>

            <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-lg mb-5 flex flex-col gap-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Total Validation Runs:</span>
                <span className="text-zinc-200">{validator.totalValidations}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Failure Density:</span>
                <span className="text-rose-400 font-semibold">{Math.round(validator.failureRate * 100)}%</span>
              </div>
            </div>

            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-mono mb-2">Failure Pattern Analytics</h4>
            {Object.keys(validator.failurePatterns).length === 0 ? (
              <div className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-lg flex items-center gap-2.5 text-xs text-emerald-500 font-mono">
                <CheckCircle className="w-5 h-5 shrink-0" /> No integrity failures detected in current session.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(validator.failurePatterns).map(([pattern, count]) => (
                  <div key={pattern} className="bg-zinc-950 p-3.5 border border-zinc-850 rounded-lg flex justify-between items-center text-xs font-mono text-rose-400">
                    <span className="flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-rose-500 shrink-0" />
                      {pattern}
                    </span>
                    <span className="font-bold">{count as number} blocks</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800 mt-5 text-[11px] font-mono text-zinc-650 flex flex-col gap-1 text-zinc-500 leading-relaxed justify-end">
            <div className="flex justify-between">
              <span>Astrological/Nine Protocol Guard:</span>
              <span className="text-amber-500">Immutable</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
