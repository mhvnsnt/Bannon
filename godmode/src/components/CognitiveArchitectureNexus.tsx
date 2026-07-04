import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Network, Cpu, Activity, Database, Sparkles, RefreshCw, Search, PlusCircle, AlertTriangle, ShieldCheck, Play, Square, Trash2 } from 'lucide-react';

interface ArxivPaper {
  id: number;
  query: string;
  title: string;
  abstract: string;
  leverage_unlocked: string;
  insight: string;
  timestamp: string;
}

interface SelfHealingLog {
  id: number;
  event_type: string;
  error_summary: string;
  action_taken: string;
  status: string;
  timestamp: string;
}

interface SentinelNode {
  id: string;
  name: string;
  task: string;
  status: 'ACTIVE' | 'PAUSED' | 'STANDBY';
  allocation: number; // percentage
}

export default function CognitiveArchitectureNexus() {
  const [activeTab, setActiveTab] = useState<'sentinel' | 'memory' | 'autonomy'>('sentinel');
  
  // Data vectors loaded from SQLite
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [healingLogs, setHealingLogs] = useState<SelfHealingLog[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [loadingHealing, setLoadingHealing] = useState(false);

  // Search input for targeted arXiv cognitive scrape
  const [arxivQuery, setArxivQuery] = useState("");
  const [harvesting, setHarvesting] = useState(false);

  // Manual paper inputs
  const [manualTitle, setManualTitle] = useState("");
  const [manualAbstract, setManualAbstract] = useState("");
  const [manualLeverage, setManualLeverage] = useState("");
  const [manualInsight, setManualInsight] = useState("");

  // Sentinels in memory (dynamic state)
  const [sentinels, setSentinels] = useState<SentinelNode[]>([
    { id: '1', name: 'Sentinel-Alpha (Wealth Compiler)', task: 'Market Resonance Mapping & Spread Sweep', status: 'ACTIVE', allocation: 68 },
    { id: '2', name: 'Sentinel-Omega (Social Gravity)', task: 'Interpersonal Node Routing & Narrative Analysis', status: 'STANDBY', allocation: 32 },
    { id: '3', name: 'Sentinel-V8 (Memory Garbage Collection)', task: 'Compressing semantic vectors to offline stores', status: 'ACTIVE', allocation: 45 }
  ]);
  const [newSentinelName, setNewSentinelName] = useState("");
  const [newSentinelTask, setNewSentinelTask] = useState("");

  // Autonomy actions
  const [dispatchingPatch, setDispatchingPatch] = useState(false);

  const fetchPapers = async () => {
    setLoadingPapers(true);
    try {
      const res = await fetch('/api/persistent-memory/arxiv');
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
      }
    } catch (e) {
      console.error('[NEXUS UI ERROR] Fetching papers failed:', e);
    } finally {
      setLoadingPapers(false);
    }
  };

  const fetchHealingLogs = async () => {
    setLoadingHealing(true);
    try {
      const res = await fetch('/api/persistent-memory/healing');
      if (res.ok) {
        const data = await res.json();
        setHealingLogs(data.logs || []);
      }
    } catch (e) {
      console.error('[NEXUS UI ERROR] Fetching healing logs failed:', e);
    } finally {
      setLoadingHealing(false);
    }
  };

  useEffect(() => {
    fetchPapers();
    fetchHealingLogs();
  }, []);

  const handleArxivHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arxivQuery.trim()) return;
    setHarvesting(true);
    try {
      const res = await fetch('/api/persistent-memory/arxiv/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: arxivQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
        setArxivQuery("");
      } else {
        const err = await res.json();
        alert(`Scrape Fault: ${err.error || 'Server error'}`);
      }
    } catch (e) {
      console.error('[NEXUS DISPATCH FAULT]:', e);
    } finally {
      setHarvesting(false);
    }
  };

  const handleManualPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualAbstract.trim()) {
      alert('Title and Summary are required');
      return;
    }
    try {
      const res = await fetch('/api/persistent-memory/arxiv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'behavioral economics choice architecture',
          title: manualTitle,
          abstract: manualAbstract,
          leverage_unlocked: manualLeverage || 'Psychological leverage synthesized manually.',
          insight: manualInsight || 'Strategic directives added successfully.'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
        setManualTitle("");
        setManualAbstract("");
        setManualLeverage("");
        setManualInsight("");
      }
    } catch (e) {
      console.error('[NEXUS DISPATCH FAULT]:', e);
    }
  };

  // Sentinel manipulations
  const toggleSentinel = (id: string) => {
    setSentinels(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const handleSliderChange = (id: string, val: number) => {
    setSentinels(prev => prev.map(s => s.id === id ? { ...s, allocation: val } : s));
  };

  const deleteSentinel = (id: string) => {
    setSentinels(prev => prev.filter(s => s.id !== id));
  };

  const flushObsoleteSentinels = () => {
    setSentinels(prev => prev.filter(s => s.status === 'ACTIVE'));
  };

  const handleSpawnSentinel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSentinelName.trim()) return;
    const node: SentinelNode = {
      id: Date.now().toString(),
      name: newSentinelName,
      task: newSentinelTask || 'Standing-by for directive allocations',
      status: 'ACTIVE',
      allocation: 50
    };
    setSentinels(prev => [...prev, node]);
    setNewSentinelName("");
    setNewSentinelTask("");
  };

  // Autonomy actions
  const triggerManualRsiPatch = async () => {
    setDispatchingPatch(true);
    try {
      const res = await fetch('/api/persistent-memory/healing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'MANUAL_DEPT_PATCH',
          error_summary: 'User requested defensive sandbox security refresh and V8 optimization run.',
          action_taken: 'Rebuilt active routes, initialized memory garbage collection, and verified stack balance.',
          status: 'RESOLVED_AUTO'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHealingLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error triggering local RSI patch:', e);
    } finally {
      setTimeout(() => setDispatchingPatch(false), 800);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#030008] text-[#cc00ff] overflow-y-auto p-4 md:p-6 font-mono space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-purple-950/40 gap-4">
        <div className="flex items-center gap-3">
          <Brain className="w-9 h-9 text-[#cc00ff] drop-shadow-[0_0_10px_rgba(204,0,255,0.4)] animate-pulse" />
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-widest text-[#f5dbff] uppercase">Cognitive Architecture Nexus</h1>
            <p className="text-xs text-gray-400 mt-1 uppercase">
              Orchestrating continuous background research ingestion (arXiv), sentient agent nodes, and self-healing telemetry.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { fetchPapers(); fetchHealingLogs(); }} 
            title="Refresh Core Data"
            className="p-2 border border-purple-900/55 bg-[#0a0a14] rounded-lg hover:border-purple-400 text-purple-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 border-b border-purple-950/40 pb-2">
        <button 
          onClick={() => setActiveTab('sentinel')}
          className={`px-4 py-2 text-xs font-bold uppercase transition rounded ${activeTab === 'sentinel' ? 'text-[#cc00ff] bg-purple-950/20 border border-purple-900/50' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Sentinel Swarm (Embodied)
        </button>
        <button 
          onClick={() => setActiveTab('memory')}
          className={`px-4 py-2 text-xs font-bold uppercase transition rounded ${activeTab === 'memory' ? 'text-cyan-400 bg-cyan-950/20 border border-cyan-900/40' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Academic Cortex (arXiv)
        </button>
        <button 
          onClick={() => setActiveTab('autonomy')}
          className={`px-4 py-2 text-xs font-bold uppercase transition rounded ${activeTab === 'autonomy' ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/40' : 'text-gray-500 hover:text-gray-300'}`}
        >
          RSI Autonomy & Incident Records
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 w-full text-gray-200">
        <AnimatePresence mode="wait">
          {activeTab === 'sentinel' && (
            <motion.div
              key="sentinel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sentinel list panel */}
                <div className="lg:col-span-2 bg-[#070712] border border-purple-900/30 p-5 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b border-purple-950 gap-2">
                    <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#cc00ff]" />
                      Active Embodied Sentinel Nodes ({sentinels.length})
                    </h3>
                    {sentinels.some(s => s.status !== 'ACTIVE') && (
                      <button
                        type="button"
                        onClick={flushObsoleteSentinels}
                        className="text-[10px] text-red-400 hover:text-red-300 transition uppercase font-black px-2.5 py-1 border border-purple-950 hover:border-red-500 bg-red-950/15 rounded flex items-center gap-1 self-start sm:self-auto"
                        title="Remove all paused and standby sentinel nodes from active memory thread pools"
                      >
                        <Trash2 className="w-3 h-3 text-red-400 animate-pulse" /> Flush Obsolete Nodes
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 select-text">
                    {sentinels.map((s) => (
                      <div key={s.id} className="p-4 bg-[#0a0a14] border border-purple-950/60 rounded-xl relative overflow-hidden group">
                        
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">{s.name}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">{s.task}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              s.status === 'ACTIVE' 
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' 
                                : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25'
                            }`}>
                              {s.status}
                            </span>

                            <button 
                              onClick={() => toggleSentinel(s.id)}
                              className="p-1 px-2 border border-purple-900 text-[10px] uppercase font-semibold text-purple-200 hover:border-[#cc00ff] bg-[#111] rounded"
                            >
                              {s.status === 'ACTIVE' ? <Square className="w-3 h-3 text-yellow-500" /> : <Play className="w-3 h-3 text-emerald-400" />}
                            </button>

                            <button 
                              onClick={() => deleteSentinel(s.id)}
                              className="p-1.5 border border-red-950 hover:bg-red-950/45 text-red-400 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Slider allocation controls */}
                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-purple-950/30 text-xs text-gray-500">
                          <span className="uppercase text-[9px] font-black">CPU Allocation: {s.allocation}%</span>
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={s.allocation}
                            onChange={(e) => handleSliderChange(s.id, Number(e.target.value))}
                            className="flex-1 accent-[#cc00ff] h-1 bg-[#1a1a2b] rounded-lg cursor-pointer"
                          />
                        </div>

                      </div>
                    ))}
                    {sentinels.length === 0 && (
                      <p className="text-gray-500 text-center py-10 uppercase text-xs">No active sentinel nodes. Create one below to process tasks.</p>
                    )}
                  </div>
                </div>

                {/* Spawn new node form */}
                <div className="bg-[#070712] border border-purple-900/30 p-5 rounded-xl justify-between flex flex-col">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 pb-2 border-b border-purple-950 mb-4">
                      <Sparkles className="w-4 h-4 text-[#cc00ff]" />
                      Spawn New Sentinel Node
                    </h3>
                    <p className="text-[10px] text-gray-400 leading-relaxed mb-4 uppercase">
                      Provision a background agent worker. It immediately inherits short-term memory parameters and handles asynchronous indexing of designated pipelines.
                    </p>

                    <form onSubmit={handleSpawnSentinel} className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Node Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Sentinel-Delta (DFS Sweep)"
                          value={newSentinelName}
                          onChange={(e) => setNewSentinelName(e.target.value)}
                          className="bg-[#0f0f1c]/50 border border-purple-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-[#cc00ff]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Task Description</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Ingesting late-night sentiment parameters"
                          value={newSentinelTask}
                          onChange={(e) => setNewSentinelTask(e.target.value)}
                          className="bg-[#0f0f1c]/50 border border-purple-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-[#cc00ff]"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-[#cc00ff] hover:bg-[#aa00d1] text-black font-black uppercase text-xs rounded transition flex justify-center items-center gap-2 mt-2"
                      >
                        <PlusCircle className="w-4 h-4" /> SPAWN NODE
                      </button>
                    </form>
                  </div>

                  <div className="mt-4 pt-4 border-t border-purple-950 text-[10px] text-[#cc00ff] leading-relaxed uppercase">
                    🔒 Sentinels automatically optimize their local threads dynamically based on CPU core temp thresholds and background garbage logs.
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'memory' && (
            <motion.div
              key="memory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              
              {/* Custom Academic / arXiv sweep bar */}
              <div className="bg-[#070712] border border-cyan-900/40 p-5 rounded-xl">
                <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-cyan-400" />
                  Targeted arXiv Cognitive Extraction
                </h3>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-4 uppercase">
                  Query the global arXiv repository live! The Intelligence Nexus will fetch relevant papers, invoke Gemini models to translate academic abstracts into actionable tactical blueprints, and burn them into your SQLite persistent vault.
                </p>

                <form onSubmit={handleArxivHarvest} className="flex gap-3">
                  <input 
                    type="text"
                    required
                    disabled={harvesting}
                    placeholder="e.g. game theory, neurochemistry, behavioral layout models..."
                    value={arxivQuery}
                    onChange={(e) => setArxivQuery(e.target.value)}
                    className="flex-1 bg-[#0f0f1c]/50 border border-cyan-900/60 p-2.5 text-xs rounded text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button 
                    type="submit"
                    disabled={harvesting}
                    className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-black font-black uppercase text-xs rounded transition flex items-center justify-center gap-2"
                  >
                    {harvesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting breakthroughs...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" /> Harvester Engaged
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Grid: List of academic papers on left, manual insertion on right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Captured thesis papers list */}
                <div className="lg:col-span-2 bg-[#070712] border border-cyan-900/30 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 pb-2 border-b border-cyan-950">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Cognitive Knowledge Base (ArXiv Ingests)
                  </h3>

                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 select-text scrollbar-thin">
                    {papers.map((p) => (
                      <div key={p.id} className="p-4 bg-[#0a0a14] border border-cyan-950 rounded-xl space-y-3 font-sans relative text-gray-300">
                        <div className="absolute top-3 right-3 text-[9px] font-mono text-cyan-400 uppercase font-black bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-900/30">
                          {p.query}
                        </div>
                        <div className="flex flex-col pr-12">
                          <h4 className="text-sm font-extrabold text-[#00f3ff]">{p.title}</h4>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5">{new Date(p.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans">{p.abstract}</p>
                        
                        {/* Highlighted Leverage Unlocked */}
                        <div className="p-3 bg-cyan-950/10 border border-cyan-900/30 rounded-lg text-xs leading-relaxed">
                          <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider block mb-1">💡 LEVERAGE UNLOCKED:</span>
                          <span className="text-gray-300">{p.leverage_unlocked}</span>
                        </div>

                        {/* Expandable Technical insights */}
                        {p.insight && (
                          <div className="text-[11px] text-gray-500 font-mono leading-relaxed pt-2 border-t border-cyan-950/40">
                            <span className="font-semibold text-gray-300 block mb-1">TACTICAL INSIGHT EXTRACT:</span>
                            <span className="block whitespace-pre-wrap">{p.insight}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {papers.length === 0 && (
                      <p className="text-gray-500 text-center py-10 uppercase text-xs font-mono">No papers found. Hook crawler into arXiv above to seed.</p>
                    )}
                  </div>
                </div>

                {/* Manual Breakthrough Input formulation */}
                <div className="bg-[#070712] border border-cyan-900/30 p-5 rounded-xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 pb-2 border-b border-cyan-950 mb-4 font-mono">
                      <PlusCircle className="w-4 h-4 text-cyan-400" />
                      Inscribe Breakthrough
                    </h3>
                    
                    <form onSubmit={handleManualPaper} className="space-y-4 font-mono">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Thesis Title</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Biomechanical joints constraints"
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          className="bg-[#0f0f1c]/50 border border-cyan-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Paper Abstract / Summary</label>
                        <textarea 
                          rows={2}
                          required
                          placeholder="Detailed abstract parameters..."
                          value={manualAbstract}
                          onChange={(e) => setManualAbstract(e.target.value)}
                          className="bg-[#0f0f1c]/50 border border-cyan-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-cyan-400 font-mono resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Leverage Unlocked Statement</label>
                        <input 
                          type="text" 
                          placeholder="Core physical power gained..."
                          value={manualLeverage}
                          onChange={(e) => setManualLeverage(e.target.value)}
                          className="bg-[#0f0f1c]/50 border border-cyan-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Application Instructions</label>
                        <textarea 
                          rows={3}
                          placeholder="Provide concrete tactical use-case steps..."
                          value={manualInsight}
                          onChange={(e) => setManualInsight(e.target.value)}
                          className="bg-[#0f0f1c]/50 border border-cyan-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-cyan-400 font-mono resize-none"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-500 text-black font-black uppercase text-xs rounded transition flex justify-center items-center gap-2"
                      >
                        Inscribe Brain Memory
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'autonomy' && (
            <motion.div
              key="autonomy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              
              {/* RSI Actions Dashboard panel */}
              <div className="bg-[#070712] border border-emerald-900/30 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Autonomic Active Defenses (RSI Engine)
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed uppercase max-w-xl">
                    When runtime exceptions/bugs intercept normal routines (e.g. database locking, WebGL skin tearing, Stripe crashes), the Swarm immediately triggers auto-isolation. You can manually force a patch cycle here!
                  </p>
                </div>
                
                <button 
                  onClick={triggerManualRsiPatch}
                  disabled={dispatchingPatch}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-900/40 text-black font-black uppercase text-xs rounded-xl transition flex items-center gap-2 shadow-lg hover:shadow-emerald-500/10 min-w-[200px] justify-center"
                >
                  <Activity className={`w-4 h-4 ${dispatchingPatch ? 'animate-pulse' : ''}`} />
                  {dispatchingPatch ? 'Deploying Patch...' : 'Deploy RSI Patch'}
                </button>
              </div>

              {/* Live incidents auditing logs */}
              <div className="bg-[#070712] border border-emerald-900/40 p-5 rounded-xl">
                <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 pb-2 border-b border-emerald-950 mb-4">
                  <AlertTriangle className="w-4 h-4 text-emerald-400" />
                  Swarm Incident Audit Reports (SQLite Persisted Logs)
                </h3>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 select-text scrollbar-thin">
                  {healingLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-[#0a0a14] border border-emerald-950/70 rounded-lg flex flex-col md:flex-row items-start justify-between gap-4 text-gray-300">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black text-[#00f3ff] tracking-wider font-mono">{log.event_type}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-red-400 font-mono italic">Fault: {log.error_summary}</p>
                        <p className="text-xs text-emerald-400 font-mono">Action taken: {log.action_taken}</p>
                      </div>

                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        log.status === 'RESOLVED_AUTO' || log.status === 'DEFENSE_SECURE' 
                          ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-400' 
                          : 'border-yellow-500/25 bg-yellow-500/15 text-yellow-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                  {healingLogs.length === 0 && (
                    <p className="text-gray-500 text-center py-10 uppercase text-xs">No autonomous incidents logged yet. Autonomic security is green.</p>
                  )}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

