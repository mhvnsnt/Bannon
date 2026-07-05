import React, { useState } from 'react';
import { Zap, Play, CheckCircle, Clock, Database, Lock, Terminal } from 'lucide-react';

export default function AutonomousWorkflowsPanel() {
  const [workflows] = useState([
    {
      id: "wf-1",
      name: "Stripe Micro-Collections",
      description: "Nightly sweep of pending invoices and automated collections.",
      status: "active",
      lastRun: "2 hours ago",
      yield: "+$140.00"
    },
    {
      id: "wf-2",
      name: "Coinbase Liquidity Sweep",
      description: "Transfer generated Web3 yields to primary cold storage.",
      status: "active",
      lastRun: "12 hours ago",
      yield: "+0.045 ETH"
    },
    {
      id: "wf-3",
      name: "Competitor Intel Spider",
      description: "Scrapes competitor APIs and flags structural weaknesses.",
      status: "idle",
      lastRun: "1 day ago",
      yield: "3 new vectors"
    },
    {
      id: "wf-4",
      name: "Automated SaaS Renewal Audit",
      description: "Prevents churn via zero-click intervention.",
      status: "active",
      lastRun: "4 hours ago",
      yield: "100% Retention"
    }
  ]);

  return (
    <div className="h-full flex flex-col bg-black text-gray-200">
      <div className="p-6 border-b border-gray-900 flex justify-between items-center bg-[#050505]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-Rajdhani font-bold text-gray-100 uppercase tracking-wider">Autonomous Workflows</h1>
            <p className="text-xs font-mono text-gray-500">Unsupervised capital acquisition pipelines.</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase text-xs tracking-widest rounded transition-all">
          Deploy New Spider
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {workflows.map(wf => (
          <div key={wf.id} className="p-5 border border-gray-900 rounded-xl bg-[#0a0a0a] hover:border-amber-500/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                  {wf.name}
                  {wf.status === "active" && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">{wf.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono font-bold text-emerald-400">{wf.yield}</div>
                <div className="text-[10px] text-gray-600 flex items-center gap-1 justify-end mt-1">
                  <Clock className="w-3 h-3" /> Last run: {wf.lastRun}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-900 flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1 bg-[#111] hover:bg-[#222] border border-gray-800 rounded text-[10px] uppercase tracking-wider text-gray-300 font-bold transition-colors">
                <Play className="w-3 h-3 text-amber-400" />
                Force Run
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1 bg-[#111] hover:bg-[#222] border border-gray-800 rounded text-[10px] uppercase tracking-wider text-gray-300 font-bold transition-colors">
                <Terminal className="w-3 h-3 text-cyan-400" />
                View Logs
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
