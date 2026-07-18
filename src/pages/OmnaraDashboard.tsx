import { useState, useEffect } from 'react';
import { Activity, Terminal, Shield, GitCommit, Database, Zap, RefreshCcw, Eye, Play, CheckCircle2 } from 'lucide-react';

export default function OmnaraDashboard() {
  const [logs, setLogs] = useState([
    { id: 1, time: new Date(Date.now() - 5000).toISOString(), type: 'system', message: 'Initialized Goose Plugin Architecture for multi-file orchestration.', status: 'success' },
    { id: 2, time: new Date(Date.now() - 4000).toISOString(), type: 'mcp', message: 'Wasla/vSync: Syncing context matrices across environments.', status: 'success' },
    { id: 3, time: new Date(Date.now() - 2000).toISOString(), type: 'mode', message: 'Custom-Modes-Roo-Code: Switched to Deep Research Protocol.', status: 'success' },
    { id: 4, time: new Date().toISOString(), type: 'action', message: 'Omnara: Streaming live execution feed.', status: 'running' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const last = prev[prev.length - 1];
        if (last && last.status === 'running') {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, status: 'success' };
          return [
            ...updated,
            { 
              id: Date.now(), 
              time: new Date().toISOString(), 
              type: 'action', 
              message: `Polling tallesborges/agentic-system-prompts for schema updates...`, 
              status: 'running' 
            }
          ];
        }
        return prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-6 h-6 text-indigo-400" /> Omnara Agent Visibility
          </h2>
          <p className="text-neutral-400 mt-1">
            Real-time execution streams, Goose multi-file orchestration, and vSync MCP status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Bannon Asset Manager Active
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-medium">
            <RefreshCcw className="w-3 h-3 animate-spin" />
            vSync Syncing
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Active Modes & Configs */}
        <div className="space-y-6 overflow-y-auto pr-2 pb-8">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Active YAML Modes
            </h3>
            <div className="space-y-3">
              <div className="bg-neutral-950 border border-indigo-500/30 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-semibold text-indigo-300">Deep Research Protocol</span>
                  <span className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs text-neutral-400">Optimized for heavy data scraping and multi-file context building. (via Custom-Modes-Roo-Code)</p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg opacity-60">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-semibold text-neutral-300">UI/UX Master</span>
                  <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">Standby</span>
                </div>
                <p className="text-xs text-neutral-400">Strict layout rules, Tailwind enforcement, and responsive design checks.</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-pink-400" /> Base System Prompts
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> 
                <span>tallesborges/agentic-system-prompts loaded</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> 
                <span>cumulativedata/roo-prompts (commands) loaded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Terminal Stream */}
        <div className="lg:col-span-2 bg-black border border-neutral-800 rounded-xl flex flex-col font-mono text-sm shadow-2xl relative overflow-hidden">
          <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex justify-between items-center z-10 shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-300 font-semibold">Omnara Live Execution Stream</span>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10">
            {logs.map((log, i) => (
              <div key={log.id} className="flex gap-3">
                <span className="text-neutral-600 shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                <span className={`shrink-0 ${
                  log.type === 'system' ? 'text-blue-400' :
                  log.type === 'mcp' ? 'text-purple-400' :
                  log.type === 'mode' ? 'text-amber-400' : 'text-green-400'
                }`}>
                  [{log.type.toUpperCase()}]
                </span>
                <span className={`${log.status === 'running' ? 'text-neutral-100' : 'text-neutral-400'}`}>
                  {log.message}
                  {log.status === 'running' && <span className="animate-pulse ml-1">...</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Background Grid Pattern */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>
      </div>
    </div>
  );
}
