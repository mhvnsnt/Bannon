import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Cpu, Zap, Database, Heart, RefreshCw, Terminal, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { cn } from '../App';

export function AgentResourceMonitor() {
  const [metrics, setMetrics] = useState<{
    cpu: number;
    mem: number;
    activeJobs: number;
    status: string;
  } | null>(null);

  const [telegramOk, setTelegramOk] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTelemetry = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch live metrics
      const mRes = await fetch('/api/system/metrics');
      if (mRes.ok) {
        const mData = await mRes.ok ? await mRes.json() : null;
        if (mData) {
          setMetrics({
            cpu: mData.current.cpu_load,
            mem: mData.current.memory_usage,
            activeJobs: mData.current.active_jobs,
            status: mData.status
          });
          setTelegramOk(mData.telegramHeartbeat);
        }
      }

      // 2. Fetch live logs
      const lRes = await fetch('/api/system/logs');
      if (lRes.ok) {
        const lData = await lRes.json();
        setLogs(lData.slice(0, 8)); // Grab latest 8 events
      }
    } catch (err) {
      console.warn("⚠️ Failed to update diagnostic telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <Draggable handle=".handle">
      <div className={cn(
        "fixed top-24 right-6 z-[99] border rounded-xl shadow-2xl p-4 font-mono select-none transition-all duration-300",
        metrics?.status === 'CRITICAL'
          ? "bg-red-950/95 border-red-500 text-red-200 w-80"
          : "bg-slate-900/95 border-slate-800 text-slate-100 w-72"
      )}>
        {/* Header Drag Bar */}
        <div className="handle flex items-center justify-between mb-3 border-b border-slate-800 pb-2 cursor-move">
          <div className="flex items-center gap-1.5">
            <Cpu className={cn("w-3.5 h-3.5", metrics?.status === 'CRITICAL' ? "text-red-400 animate-spin" : "text-indigo-400")} />
            <span className="text-[10px] font-black uppercase tracking-wider">AGENT DIAGNOSTICS</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-500" />}
            <span className={cn(
              "w-2 h-2 rounded-full",
              metrics?.status === 'CRITICAL'
                ? "bg-red-500 animate-ping"
                : metrics?.status === 'STRESSED'
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500"
            )} />
          </div>
        </div>

        {/* System Heartbeat & Memory & Obscura statistics */}
        <div className="space-y-2.5 text-[10px]">
          {/* CPU / Scraper Load */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">OBSCURA CPU LOAD</span>
              <span className="font-bold text-slate-300">{metrics ? `${metrics.cpu}%` : 'PROBING...'}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  metrics?.status === 'CRITICAL' ? "bg-red-500" : "bg-emerald-400"
                )}
                style={{ width: metrics ? `${metrics.cpu}%` : '0%' }}
              />
            </div>
          </div>

          {/* Sandbox Heap Memory */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">WASM MICROVMHEAP</span>
              <span className="font-bold text-slate-300">{metrics ? `${metrics.mem} MB` : 'PROBING...'}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 transition-all duration-500"
                style={{ width: metrics ? `${Math.min(100, (metrics.mem / 512) * 100)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Concurrency Slots & Heartbeats */}
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
            <span className="text-slate-500 flex items-center gap-1 uppercase">
              <Zap className="w-3 h-3 text-amber-400" /> ACTIVE JOBS
            </span>
            <span className="font-bold text-slate-200">
              {metrics ? `${metrics.activeJobs} Threads` : '0 Threads'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1 uppercase">
              <MessageSquare className="w-3 h-3 text-indigo-400" /> TELEGRAM LINK
            </span>
            <span className={cn(
              "px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
              telegramOk ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            )}>
              {telegramOk ? "OK" : "NO_LINK"}
            </span>
          </div>
        </div>

        {/* Expandable SQLite Logs View */}
        <div className="mt-3 border-t border-slate-800 pt-2.5">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center justify-between w-full text-slate-400 hover:text-slate-200 transition-colors text-[9px] uppercase tracking-wider font-bold cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3" /> PERSISTENT SYSTEM LOGS
            </span>
            {showLogs ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>

          {showLogs && (
            <div className="mt-2.5 max-h-36 overflow-y-auto space-y-2 text-[8px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic py-1">No historical metrics logged yet...</div>
              ) : (
                logs.map((l, index) => (
                  <div key={l.id || index} className="border-b border-slate-800/40 pb-1.5 last:border-none">
                    <div className="flex justify-between text-slate-500">
                      <span>[{l.log_level}] {l.module}</span>
                      <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 font-mono select-text break-all">{l.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
}
