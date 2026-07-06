import React, { useState } from 'react';
import { GitCompare, Check, X, FileCode } from 'lucide-react';

export function PredictiveDiffView() {
  const [hasDiff, setHasDiff] = useState(true);

  if (!hasDiff) return null;

  return (
    <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden mb-12">
      <div className="bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <GitCompare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-black uppercase tracking-widest">Predictive Diff Preview</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setHasDiff(false)}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded text-xs font-bold transition-colors border border-red-500/20"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>
          <button 
            onClick={() => setHasDiff(false)}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 rounded text-xs font-bold transition-colors border border-emerald-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            Accept Changes
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-black/5 text-xs font-mono text-slate-500">
        <FileCode className="w-3.5 h-3.5" />
        <span>src/components/UserAnalytics.tsx</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-black/5 font-mono text-[11px] leading-relaxed overflow-x-auto">
        {/* Left Side: Original */}
        <div className="bg-slate-50/50 p-4">
          <div className="text-slate-400 mb-2 font-bold uppercase tracking-widest text-[9px]">Original Code</div>
          <pre className="text-slate-600 space-y-1">
            <code>{'  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">'}{'\n'}</code>
            <code>{'    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">'}{'\n'}</code>
            <code>{'      <h2 className="text-sm font-black uppercase text-slate-800 mb-4">Agent Profiler</h2>'}{'\n'}</code>
            <code className="bg-red-100 text-red-800 px-1 -mx-1 block">{'      <div className="text-[10px] text-slate-500">No recent snapshots to analyze.</div>'}{'\n'}</code>
            <code>{'    </div>'}{'\n'}</code>
            <code>{'  </div>'}{'\n'}</code>
          </pre>
        </div>
        
        {/* Right Side: Agent Proposed */}
        <div className="bg-white p-4">
          <div className="text-indigo-400 mb-2 font-bold uppercase tracking-widest text-[9px]">Agent Proposed</div>
          <pre className="text-slate-800 space-y-1">
            <code>{'  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">'}{'\n'}</code>
            <code>{'    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">'}{'\n'}</code>
            <code>{'      <h2 className="text-sm font-black uppercase text-slate-800 mb-4">Agent Profiler</h2>'}{'\n'}</code>
            <code className="bg-emerald-100 text-emerald-800 px-1 -mx-1 block">{'      <AgentLogicProfiler />'}{'\n'}</code>
            <code>{'    </div>'}{'\n'}</code>
            <code>{'  </div>'}{'\n'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
