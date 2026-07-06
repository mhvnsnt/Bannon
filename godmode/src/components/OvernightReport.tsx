import React, { useState, useEffect } from 'react';
import { 
  Moon, CheckCircle, RefreshCw, AlertTriangle, Play, Sparkles, Check, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface OvernightTask {
  id: string;
  timestamp: string;
  task: string;
  result: string;
  before_metric: string;
  after_metric: string;
  pending_review: number;
}

export function OvernightReport() {
  const [logs, setLogs] = useState<OvernightTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/armada/overnight/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/armada/overnight/approve/${id}`, {
        method: 'POST'
      });
      if (res.ok) {
        // Optimistically update
        setLogs(prev => prev.map(l => l.id === id ? { ...l, pending_review: 0 } : l));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceTrigger = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/armada/overnight/trigger', {
        method: 'POST'
      });
      if (res.ok) {
        await fetchLogs();
      } else {
        const err = await res.json();
        alert("Governor Blocked: " + (err.error || "Execution failed."));
      }
    } catch (e) {
      console.error(e);
      alert("Error invoking overnight sweep.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-zinc-500 font-mono text-xs">
        <RefreshCw className="w-5 h-5 text-[#8b5cf6] animate-spin mr-2" /> Synstry-linking deep-mind logs...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto text-gray-200 p-1 font-mono">
      
      {/* Overview Card */}
      <div className="bg-[#111] border border-violet-950/40 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 blur-3xl rounded-full" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-violet-950/30 rounded-xl border border-violet-900/50">
            <Moon className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Autonomous Overnight Subconscience</h3>
            <p className="text-xs text-violet-400">Sleep cycle optimizations running 22:00-08:00 (Nine Protocol Aligned)</p>
          </div>
        </div>
        <button 
          onClick={handleForceTrigger}
          disabled={isProcessing}
          className="bg-violet-950/40 hover:bg-violet-900/40 border border-violet-800/80 text-violet-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 z-10 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Compiling...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Force Subconscious Sweep
            </>
          )}
        </button>
      </div>

      {/* Logs Tree */}
      <div className="flex flex-col gap-3">
        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest px-1">Compiled Optimization Transits</h3>
        
        {logs.length === 0 ? (
          <div className="bg-[#111] border border-[#222] rounded-xl py-12 px-6 text-center text-gray-500 text-xs">
            No sleep transits found. Click 'Force Subconscious Sweep' to dream.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <div 
                  key={log.id} 
                  className={`bg-[#0a0a0a] border rounded-xl overflow-hidden transition-all duration-300 ${
                    log.pending_review === 1 
                      ? 'border-violet-900/40 hover:border-violet-700/50' 
                      : 'border-zinc-805/60'
                  }`}
                >
                  
                  {/* Header/Summary Card */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-lg border ${
                        log.pending_review === 1 
                          ? 'bg-violet-950/20 border-violet-900/50 text-violet-400' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{log.task}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString() || "22:00:14 PM"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Metric Pills */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5 p-1 px-2.5 rounded bg-red-950/20 border border-red-900/40 text-[10px] text-red-400 font-sans">
                        {log.before_metric.split(':')[1]?.trim() || log.before_metric}
                      </div>
                      <ArrowRight className="w-3 h-3 text-zinc-500" />
                      <div className="flex items-center gap-1.5 p-1 px-2.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-[10px] text-emerald-400 font-sans">
                        {log.after_metric.split(':')[1]?.trim() || log.after_metric}
                      </div>

                      {log.pending_review === 1 ? (
                        <span className="text-[9px] bg-violet-950/40 border border-violet-800/80 text-violet-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider scale-95">
                          PENDING
                        </span>
                      ) : (
                        <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider scale-95">
                          APPROVED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expandable Details Frame */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-[#0c0c0c] border-t border-[#111]"
                      >
                        <div className="p-4 text-xs text-gray-400 flex flex-col gap-4">
                          <div>
                            <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1.5">Actionable Synthesis</div>
                            <p className="leading-relaxed bg-black/40 border border-[#222] rounded-lg p-3 text-gray-300">
                              {log.result}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-red-950/10 border border-red-900/20 rounded-lg p-3">
                              <span className="text-[10px] text-red-400 font-bold block mb-1">TRANSIT START METRIC</span>
                              <span className="text-sm font-bold text-red-300 font-mono">{log.before_metric}</span>
                            </div>
                            <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-lg p-3">
                              <span className="text-[10px] text-emerald-400 font-bold block mb-1">STABILIZED END TARGET</span>
                              <span className="text-sm font-bold text-emerald-300 font-mono">{log.after_metric}</span>
                            </div>
                          </div>

                          {log.pending_review === 1 ? (
                            <div className="flex justify-end gap-2 border-t border-[#222] pt-3 mt-1">
                              <div className="text-zinc-500 text-[10px] self-center mr-auto flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                Requires Host Validation to integrate sandbox patches permanently.
                              </div>
                              <button 
                                onClick={() => handleApprove(log.id)}
                                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve & Commit Patch
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 border-t border-[#222] pt-3 mt-1 text-[10px] text-zinc-500">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Patch permanently committed to production kernel during morning alignment transits.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
