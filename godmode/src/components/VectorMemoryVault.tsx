import React, { useState, useEffect } from 'react';
import { Database, Search, DatabaseZap, Clock, Cpu, Zap } from 'lucide-react';
import { vectorMemory, VectorLog } from '../lib/chromaService';
import { GroversSearch } from '../lib/quantum/GroversSearch';

export default function VectorMemoryVault() {
  const [logs, setLogs] = useState<VectorLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dbStatus, setDbStatus] = useState('CONNECTING');
  const [groverStats, setGroverStats] = useState<string | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        await vectorMemory.init();
        setDbStatus('CONNECTED');
        loadRecentLogs();
      } catch (e) {
        setDbStatus('OFFLINE');
      }
    };
    initDB();
  }, []);

  const loadRecentLogs = async () => {
    const recent = await vectorMemory.getAllLogs(10);
    setLogs(recent);
    setGroverStats(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      await loadRecentLogs();
      return;
    }

    setIsSearching(true);
    
    // Simulate Grover's Search execution over the memory graph
    const allLogs = await vectorMemory.getAllLogs(100);
    const memoryGraph = allLogs.map(l => l.content);
    
    // Execute the quantum search
    const startTime = performance.now();
    const resultContent = GroversSearch.execute(memoryGraph, memoryGraph.find(c => c.includes(searchQuery)) || "");
    const endTime = performance.now();
    
    if (resultContent) {
        const foundLog = allLogs.find(l => l.content === resultContent);
        if (foundLog) {
            setLogs([foundLog]);
            const N = memoryGraph.length;
            const iterations = Math.floor((Math.PI / 4) * Math.sqrt(N));
            setGroverStats(`Retrieved in ${iterations} iterations (O(√N)) vs ${N} classically. Time: ${(endTime - startTime).toFixed(2)}ms`);
        } else {
            setLogs([]);
            setGroverStats("No quantum resonance found.");
        }
    } else {
        const results = await vectorMemory.queryLogs(searchQuery);
        setLogs(results);
        setGroverStats("Fell back to classical linear search.");
    }
    
    setIsSearching(false);
  };

  return (
    <div className="flex flex-col w-full h-full p-6 bg-slate-950 text-slate-200 overflow-y-auto font-mono">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
            <Database className="w-6 h-6" /> Vector Memory Vault
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Semantic storage layer with Simulated Grover's Amplitude Amplification.</p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold px-3 py-1 rounded border flex items-center gap-2 ${dbStatus === 'CONNECTED' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            <DatabaseZap className="w-4 h-4" />
            STATUS: {dbStatus}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search via Grover's Oracle..."
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 pl-10 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2 rounded text-white font-bold transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {isSearching ? 'Amplifying...' : 'Quantum Search'}
          </button>
        </form>
      </div>
      
      {groverStats && (
          <div className="mb-4 text-xs font-bold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 p-2 rounded flex items-center gap-2">
             <Zap className="w-3 h-3" />
             {groverStats}
          </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {logs.length === 0 ? (
          <div className="bg-slate-900 p-8 rounded border border-slate-800 text-center text-slate-500">
            No vector logs found in the database.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-slate-900 p-4 rounded border border-slate-800 hover:border-indigo-500/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-300">{log.agentId}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs">{log.mutationType}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded text-sm text-slate-300 mb-3 border border-slate-800/50">
                {log.content}
              </div>
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-emerald-400">Success Prob: {(log.successProbability * 100).toFixed(1)}%</span>
                <span className="text-purple-400">Entropy Score: {log.entropyScore.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
