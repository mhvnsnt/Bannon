import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, Trash2, Plus, RefreshCw, Layers, CheckCircle2, Sliders, Search, AlertTriangle, BookOpen, Clock, Activity, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WorldStateEntry {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence: number;
  last_verified: string;
  source: string;
  stale: number;
  entity?: string;     
  parameter?: string;  
  last_updated?: string; 
}

export function ContextCuratorUI() {
  const [states, setStates] = useState<WorldStateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Collapsible category states
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Input States
  const [newCategory, setNewCategory] = useState('PROJECT_TRUTH');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newConfidence, setNewConfidence] = useState(0.95);
  const [newSource, setNewSource] = useState('Manual UI Entry');

  // Interactive Test States
  const [tokenBudget, setTokenBudget] = useState(6000);
  const [testResult, setTestResult] = useState<{ assembledSection: string; tokenUsage: number } | null>(null);
  const [isSieving, setIsSieving] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  const categories = [
    { name: 'PROJECT_TRUTH', label: 'Project Truth (Immutable)', desc: 'Absolute foundational facts about our system', color: 'text-cyan-400 border-cyan-900/30 bg-cyan-950/15' },
    { name: 'CURRENT_PHASE', label: 'Current Phase State', desc: 'Active milestones, layers and operational targets', color: 'text-purple-400 border-purple-900/30 bg-purple-950/15' },
    { name: 'AGENT_MEMORY', label: 'Agent Memory Coordinates', desc: 'Current context stored in Swarm agent vectors', color: 'text-emerald-400 border-emerald-900/30 bg-emerald-950/15' },
    { name: 'OPEN_PROBLEMS', label: 'Open Structural Weaknesses', desc: 'Active issues, bugs, and friction boundaries', color: 'text-rose-400 border-rose-900/30 bg-rose-950/15' },
    { name: 'DECISION_LOG', label: 'Decision & Architectural Log', desc: 'Historical architectural choices and pathways', color: 'text-amber-400 border-amber-900/30 bg-amber-950/15' },
    { name: 'PATTERN_LIBRARY', label: 'Dynamic Pattern Library', desc: 'Active success heuristics and failure flags', color: 'text-blue-400 border-blue-900/30 bg-blue-950/15' }
  ];

  const fetchStates = async () => {
    try {
      const res = await fetch('/api/armada/curator/state');
      if (res.ok) {
        const data = await res.json();
        setStates(data.states || []);
      }
    } catch (e) {
      console.error("[ContextCuratorUI] State retrieval fault:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleCreateState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    try {
      const res = await fetch('/api/armada/curator/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: newCategory,
          parameter: newKey,
          value: newValue,
          confidence: Number(newConfidence),
          source: newSource
        })
      });

      if (res.ok) {
        setNewKey('');
        setNewValue('');
        setNewConfidence(0.95);
        await fetchStates();
        
        // Trigger temporary visual pulse
        const match = states.find(s => s.category === newCategory && s.key === newKey);
        if (match) {
          setFlashId(match.id);
          setTimeout(() => setFlashId(null), 1000);
        }
      }
    } catch (e) {
      console.error("[ContextCuratorUI] Insert failed:", e);
    }
  };

  const handleDeleteState = async (id: string) => {
    try {
      const res = await fetch(`/api/armada/curator/state/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setStates(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error("[ContextCuratorUI] Delete failed:", e);
    }
  };

  const handleRefreshStale = async (id: string, key: string) => {
    // Optimistically flash element during remote verification search
    setFlashId(id);
    try {
      // Simulate/trigger active semantic refire to align staleness
      const res = await fetch(`/api/armada/curator/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: states.find(s => s.id === id)?.category || 'PROJECT_TRUTH',
          parameter: key,
          value: states.find(s => s.id === id)?.value || '',
          confidence: 0.98,
          source: 'User Manual Sync'
        })
      });
      if (res.ok) {
        await fetchStates();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setFlashId(null), 1000);
    }
  };

  const handleSieveContext = async () => {
    setIsSieving(true);
    try {
      const res = await fetch(`/api/armada/curator/bundle?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setTestResult(data.bundle);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSieving(false);
    }
  };

  const toggleCategory = (catName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  // Sieve calculation for Token Bar
  const totalTokensUsed = states.reduce((sum, s) => {
    const textLength = s.key.length + s.value.length + s.category.length;
    return sum + Math.ceil(textLength / 4);
  }, 0);

  const budgetProgress = Math.min(100, (totalTokensUsed / tokenBudget) * 100);

  // Filter logic
  const filteredStates = states.filter(s => {
    const matchesSearch = 
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory) {
      return matchesSearch && s.category === activeCategory;
    }
    return matchesSearch;
  });

  // Group by Category helper
  const groupedStates: Record<string, WorldStateEntry[]> = {};
  for (const s of filteredStates) {
    if (!groupedStates[s.category]) {
      groupedStates[s.category] = [];
    }
    groupedStates[s.category].push(s);
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 text-zinc-300 font-mono" id="context-curator-dashboard">
      
      {/* Dynamic Knowledge Header */}
      <div className="bg-[#0c0c0c] border border-zinc-900 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="curator-hero-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl rounded-full" />
        <div className="flex items-center gap-4 relative z-10" id="curator-meta-info">
          <div className="p-3 bg-cyan-950/20 rounded-xl border border-cyan-800/20">
            <Globe className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Quantum Context Curator & World State</h3>
            <p className="text-xs text-cyan-400/80">Active cognitive structures. Dynamic token budgeting & context packaging gates.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 text-[10px] text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-900" id="curator-live-heartbeat">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>CURATOR STATUS: ALIGNED</span>
        </div>
      </div>

      {/* Control Sieve Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="curator-control-deck">
        
        {/* Token Budget Gate */}
        <div className="md:col-span-8 bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col gap-3" id="token-budget-panel">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Active System Token Footprint
            </span>
            <span className="text-zinc-500 text-[10px]">
              {totalTokensUsed} / {tokenBudget} WORDS (EST. BUDGET)
            </span>
          </div>

          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-850">
            <div 
              className={`h-full transition-all duration-500 ${budgetProgress > 80 ? 'bg-rose-500' : budgetProgress > 50 ? 'bg-amber-500' : 'bg-cyan-500'}`}
              style={{ width: `${budgetProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span className="leading-normal">Curated world state elements compile dynamically into LLM sessions under strict budgets.</span>
            <div className="flex items-center gap-2">
              <label className="text-zinc-500">LIMIT:</label>
              <select 
                value={tokenBudget} 
                onChange={(e) => setTokenBudget(Number(e.target.value))}
                className="bg-black/90 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none"
              >
                <option value={4000}>4k Words</option>
                <option value={6000}>6k Words</option>
                <option value={8000}>8k Words</option>
                <option value={12000}>12k Words</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Quick Filter */}
        <div className="md:col-span-4 bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col justify-center gap-2" id="filter-panel">
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Category Matrix Filter</label>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2 py-1 rounded text-[10px] transition-all border ${!activeCategory ? 'bg-cyan-950/40 border-cyan-700/60 text-cyan-400' : 'bg-black border-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              ALL NODES
            </button>
            {categories.map(c => (
              <button
                key={c.name}
                onClick={() => setActiveCategory(c.name === activeCategory ? null : c.name)}
                className={`px-2 py-1 rounded text-[10px] transition-all border ${activeCategory === c.name ? 'bg-cyan-950/40 border-cyan-700/60 text-cyan-400' : 'bg-black border-zinc-900 text-zinc-400 hover:text-white'}`}
              >
                {c.name.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="curator-body-distribution">
        
        {/* Left Interactive Knowledge Base Grid */}
        <div className="lg:col-span-8 flex flex-col gap-6" id="knowledge-base-grid">
          
          {/* Dynamic Search / Action Input */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 flex gap-2 items-center" id="search-bar-and-sieve">
            <Search className="w-4 h-4 text-zinc-500 ml-2" />
            <input 
              type="text"
              placeholder="Search across project truths, phase states, decision logs, active patterns..."
              className="flex-1 bg-transparent text-xs text-white placeholder-zinc-650 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={handleSieveContext}
              disabled={isSieving}
              className="bg-cyan-950/50 hover:bg-cyan-900/45 text-cyan-400 border border-cyan-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSieving ? 'animate-spin' : ''}`} />
              Test Packaging Sieve
            </button>
          </div>

          {/* Sieve Results Panel */}
          AnimatePresence
          {testResult && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#0b0b0b] border border-cyan-950/30 rounded-xl p-4 flex flex-col gap-3"
              id="context-sieve-result"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Assembled Interactive Context Package Simulation
                </span>
                <button 
                  onClick={() => setTestResult(null)}
                  className="text-zinc-600 hover:text-white text-[10px]"
                >
                  Clear Preview
                </button>
              </div>

              <div className="bg-black/60 border border-zinc-900 rounded-lg p-3 text-[10px] text-zinc-400 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed no-scrollbar">
                {testResult.assembledSection}
              </div>
            </motion.div>
          )}

          {/* Knowledge Sections Panels */}
          {isLoading ? (
            <div className="text-center py-20 text-zinc-500 text-xs flex justify-center items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />
              Sifting world dimensions state logs...
            </div>
          ) : Object.keys(groupedStates).length === 0 ? (
            <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-xl text-zinc-500 text-xs">
              No matching knowledge coordinates mapped under current filter.
            </div>
          ) : (
            categories.filter(cat => groupedStates[cat.name] && groupedStates[cat.name].length > 0).map(cat => {
              const entries = groupedStates[cat.name];
              const isCollapsed = collapsedCategories[cat.name] || false;

              return (
                <div key={cat.name} className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden transition-all duration-300" id={`cat-panel-${cat.name}`}>
                  
                  {/* Category Banner Title */}
                  <div 
                    onClick={() => toggleCategory(cat.name)}
                    className="flex justify-between items-center p-4 bg-black/40 border-b border-zinc-900 cursor-pointer hover:bg-black/70 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg border text-xs font-bold ${cat.color}`}>
                        {cat.name.replace('_', ' ')}
                      </div>
                      <div>
                        <h4 className="text-xs text-white font-bold">{cat.label}</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{cat.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan-400/80 hover:text-white font-semibold">
                      {isCollapsed ? `Expand (${entries.length})` : 'Collapse'}
                    </span>
                  </div>

                  {/* Category Contents Grid */}
                  {!isCollapsed && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {entries.map(ent => {
                        const isFlashing = flashId === ent.id;
                        const isStale = ent.stale === 1;

                        return (
                          <motion.div
                            key={ent.id}
                            className={`border rounded-lg p-3 relative group transition-all duration-300 ${isFlashing ? 'border-cyan-500 bg-cyan-950/20 shadow-cyan-900/10 shadow-lg' : isStale ? 'border-amber-900/40 bg-amber-950/5 hover:border-amber-700/55' : 'border-zinc-900 bg-black/30 hover:border-zinc-800'}`}
                            id={`ws-node-${ent.id}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] text-cyan-400/90 font-bold truncate pr-6">{ent.key}</span>
                              
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isStale && (
                                  <button
                                    onClick={() => handleRefreshStale(ent.id, ent.key)}
                                    title="Verify stale parameter against RAG matrix"
                                    className="text-amber-500 hover:text-white transition-colors p-0.5"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteState(ent.id)}
                                  title="Delete state coordinate"
                                  className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-white font-medium mt-1.5 break-words font-sans">{ent.value}</p>

                            <div className="flex items-center gap-3 mt-4 pt-2 border-t border-zinc-900/60 justify-between text-[9px] text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-cyan-500/80" />
                                Conf: {Math.round(ent.confidence * 100)}%
                              </span>
                              <span className="truncate max-w-[120px]" title={`Source: ${ent.source}`}>
                                src: {ent.source}
                              </span>
                            </div>

                            {isStale && (
                              <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-1.5 z-0 select-none bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold pointer-events-none opacity-40 group-hover:opacity-10 transition-opacity">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                STALE
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>

        {/* Right Dynamic Create Coordinate form */}
        <div className="lg:col-span-4 flex flex-col gap-6" id="curator-right-panel">
          
          {/* Create Node Component Panel */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5" id="imprint-node-form-card">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-cyan-400" />
              <h3 className="text-white text-xs font-bold uppercase tracking-wider">Imprint Node Coordinate</h3>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono leading-relaxed mb-4">
              Directly load truth anchors, architectural state markers, active weak spots, or heuristics rules parameters into the SQLite consensus memory tree.
            </p>

            <form onSubmit={handleCreateState} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest">Target Category</label>
                <select
                  className="bg-black border border-zinc-900 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/40 text-xs"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest">Parameter Key</label>
                <input 
                  type="text"
                  placeholder="E.g., dampingCoef, frameTargetCount, layoutFlow"
                  className="bg-black border border-zinc-900 rounded-lg px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500/40 text-xs"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest">Target Value Anchor</label>
                <textarea 
                  rows={3}
                  placeholder="E.g., 0.12 damping constant across skeletal physics lines."
                  className="bg-black border border-zinc-900 rounded-lg px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500/40 text-xs font-mono leading-normal resize-none"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-zinc-500">
                  <label>Confidence Metric</label>
                  <span className="text-cyan-400 font-bold">{Math.round(newConfidence * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-1"
                  value={newConfidence}
                  onChange={(e) => setNewConfidence(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest">Attribution Source</label>
                <input 
                  type="text"
                  placeholder="E.g., Telemetry Diagnostic, User Override"
                  className="bg-black border border-zinc-900 rounded-lg px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500/40 text-xs"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                className="bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-800 text-cyan-400 font-semibold py-2.5 rounded-lg uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" />
                Imprint State coordinate
              </button>
            </form>
          </div>

          {/* Quick World State Guidelines Card */}
          <div className="bg-[#0a0a0a] border border-zinc-950 rounded-xl p-4 flex flex-col gap-2.5 text-[10px] text-zinc-500 font-mono leading-normal" id="curator-info-card">
            <span className="text-white text-[11px] font-bold flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
              Consensus Mechanics Guidelines
            </span>
            <p>Every dynamic process—from the overnight subconscious mind to individual Swarm builders—consults this table prior to executing builds.</p>
            <p>Conflicts inside <span className="text-amber-500">DECISION LOG</span> generate automatic user warnings, eliminating unintended regression risks.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
