import React, { useState } from 'react';
import { Bug, Camera, ChevronRight, Activity } from 'lucide-react';
import { cn } from '../App';

interface Snapshot {
  id: string;
  timestamp: string;
  personality: string;
  prompt: string;
  response: string;
  metrics: {
    tokens: number;
    latency: number;
    satisfaction: number;
  };
}

const MOCK_SNAPSHOTS: Snapshot[] = [
  {
    id: 'snap-1',
    timestamp: '2026-07-04T10:23:41Z',
    personality: 'Socratic',
    prompt: 'How do I center a div?',
    response: 'What properties control alignment in CSS flexbox?',
    metrics: { tokens: 142, latency: 450, satisfaction: 80 }
  },
  {
    id: 'snap-2',
    timestamp: '2026-07-04T11:05:12Z',
    personality: 'Concise',
    prompt: 'Center a div',
    response: 'display: flex; justify-content: center; align-items: center;',
    metrics: { tokens: 45, latency: 200, satisfaction: 95 }
  }
];

export function AgentLogicProfiler() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(MOCK_SNAPSHOTS);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_SNAPSHOTS[0]?.id || null);

  const selected = snapshots.find(s => s.id === selectedId);

  return (
    <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-indigo-500" />
            Agent Logic Profiler
          </h2>
          <p className="text-sm text-slate-500">Debug personality-specific behavior and tune instructions.</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
          <Camera className="w-4 h-4" />
          Capture Snapshot
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 flex flex-col gap-2 h-80 overflow-y-auto pr-2">
          {snapshots.map(snap => (
            <button
              key={snap.id}
              onClick={() => setSelectedId(snap.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group",
                selectedId === snap.id
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                  : "bg-white dark:bg-slate-900 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10"
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                    snap.personality === 'Socratic' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : snap.personality === 'Concise' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  )}>
                    {snap.personality}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(snap.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate w-40">
                  {snap.prompt}
                </div>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 transition-colors",
                selectedId === snap.id ? "text-indigo-500" : "text-slate-300 dark:text-slate-600 group-hover:text-slate-400"
              )} />
            </button>
          ))}
        </div>

        <div className="lg:w-2/3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-black/5 dark:border-white/5 p-4 h-80 flex flex-col">
          {selected ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex gap-4 mb-4 shrink-0 overflow-x-auto pb-2">
                <div className="bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 shrink-0">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{selected.metrics.tokens} tokens</span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 shrink-0">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{selected.metrics.latency}ms latency</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">User Prompt</h4>
                  <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200">
                    {selected.prompt}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Agent Logic / Response</h4>
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 font-mono">
                    {selected.response}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Select a snapshot to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
