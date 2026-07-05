import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Activity, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  Terminal, 
  Heart, 
  Zap, 
  FileText,
  Sliders
} from 'lucide-react';

interface TableCoverage {
  totalRows: number;
  indexedRows: number;
  coveragePct: number;
  lastIndexedAt: string;
  avgLatencyMs: number;
}

interface PatternSummary {
  type: string;
  description: string;
  frequency: number;
  lastSeen: string;
  affectedFiles: string[];
  recommendedAction: string;
  confidence: number;
}

interface SemanticSearchResult {
  sourceTable: string;
  sourceId: string;
  content: string;
  score: number;
  timestamp: string;
  tokenCount: number;
}

export default function SemanticMemoryMonitor() {
  // State variables
  const [coverage, setCoverage] = useState<Record<string, TableCoverage>>({});
  const [patterns, setPatterns] = useState<PatternSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [searchTableFilter, setSearchTableFilter] = useState<string>('all');
  const [patternTypeFilter, setPatternTypeFilter] = useState<string>('all');
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Triple-Layer Memory Vault states
  const [directives, setDirectives] = useState<string[]>([]);
  const [memoryLogs, setMemoryLogs] = useState<{ rowid: number; role: string; content: string; timestamp: string }[]>([]);
  const [newDirective, setNewDirective] = useState("");
  const [loadingPersistent, setLoadingPersistent] = useState(false);
  const [addingDirective, setAddingDirective] = useState(false);

  const fetchPersistentMemory = async () => {
    setLoadingPersistent(true);
    try {
      const res = await fetch('/api/persistent-memory');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDirectives(data.directives || []);
          setMemoryLogs(data.logs || []);
        }
      }
    } catch (e) {
      console.error('Error fetching persistent memory:', e);
    } finally {
      setLoadingPersistent(false);
    }
  };

  const handleAddDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirective.trim()) return;
    setAddingDirective(true);
    try {
      const res = await fetch('/api/persistent-memory/directive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directive: newDirective })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDirectives(data.directives || []);
          setNewDirective("");
          fetchPersistentMemory();
        }
      }
    } catch (e) {
      console.error('Error adding core directive:', e);
    } finally {
      setAddingDirective(false);
    }
  };

  const handleDeleteDirective = async (directiveText: string) => {
    try {
      const res = await fetch('/api/persistent-memory/directive/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directive: directiveText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDirectives(data.directives || []);
          fetchPersistentMemory();
        }
      }
    } catch (e) {
      console.error('Error deleting core directive:', e);
    }
  };

  // Embedding Health / Test State
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthReport, setHealthReport] = useState<{
    cacheHits: number;
    cacheMisses: number;
    hitRatio: number;
    similarityAccuracy: number;
    fallbackActive: boolean;
    latencies: number[];
  } | null>(null);

  // Load stats
  const fetchCoverage = async () => {
    setLoadingCoverage(true);
    try {
      const res = await fetch('/api/semantic/coverage');
      const data = await res.json();
      setCoverage(data.tables || data);
    } catch (e) {
      console.error('Error fetching coverage:', e);
    } finally {
      setLoadingCoverage(false);
    }
  };

  const fetchPatterns = async () => {
    setLoadingPatterns(true);
    try {
      const res = await fetch('/api/semantic/patterns');
      const data = await res.json();
      setPatterns(data);
    } catch (e) {
      console.error('Error fetching patterns:', e);
    } finally {
      setLoadingPatterns(false);
    }
  };

  const triggerIndexAll = async () => {
    setLoadingCoverage(true);
    try {
      await fetch('/api/semantic/index', { method: 'POST' });
      await fetchCoverage();
      await fetchPatterns();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCoverage(false);
    }
  };

  const executeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    setSearchPerformed(true);
    try {
      const res = await fetch(`/api/semantic/search?q=${encodeURIComponent(searchQuery)}`);
      const data = (await res.json()) as SemanticSearchResult[];
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Run a real client-side simulation test of embedding model metrics
  const runEmbeddingHealthTests = async () => {
    setTestingHealth(true);
    setHealthReport(null);
    try {
      const res = await fetch('/api/armada/semantic/health', { method: 'POST' });
      const data = await res.json();
      setHealthReport(data);
    } catch (e) {
      console.error("Health check error", e);
    } finally {
      setTestingHealth(false);
    }
  };

  useEffect(() => {
    fetchCoverage();
    fetchPatterns();
    fetchPersistentMemory();
  }, []);

  // Filter lists
  const filteredPatterns = patterns.filter(p => {
    if (patternTypeFilter === 'all') return true;
    return p.type === patternTypeFilter;
  });

  const filteredSearchResults = searchResults.filter(r => {
    if (searchTableFilter === 'all') return true;
    return r.sourceTable === searchTableFilter;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl shadow-sm font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <Cpu className="text-emerald-500 w-6 h-6 animate-pulse" />
            Layer 8 — Semantic Memory & Cognitive Diagnostics
          </h2>
          <p className="text-sm text-gray-500 font-mono mt-1">
            System: Absolute Autonomy | Execution: Reality Compiler | Nine Protocol Active
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            onClick={fetchCoverage}
            disabled={loadingCoverage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded border border-gray-200 bg-white hover:bg-gray-100 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingCoverage ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button 
            onClick={triggerIndexAll}
            disabled={loadingCoverage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm transition disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            Index All Tables
          </button>
        </div>
      </div>

      {/* TRIPLE-LAYER PERSISTENT MEMORY INTEGRATION */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-emerald-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-850 pb-4 mb-5">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              Tri-Layer Persistent Memory Vault (SQLite-vec Enabled)
            </h3>
            <p className="text-xs text-teal-300 font-mono mt-0.5">
              Dual-Channel Memory Consolidation Layer. Real-time 768-D Nomadic Vector Embeddings.
            </p>
          </div>
          <button 
            type="button"
            onClick={fetchPersistentMemory}
            disabled={loadingPersistent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded border border-emerald-700 bg-emerald-900/60 hover:bg-emerald-800 text-teal-100 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPersistent ? 'animate-spin' : ''}`} />
            Sync Vault Cache
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Layer 1: Immutable Core Directives */}
          <div className="bg-emerald-950/45 border border-emerald-800/40 rounded-lg p-5">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 font-mono mb-3 flex items-center gap-1.5">
              <span>🧠</span> Layer 1: Immutable Core Directives (Vision & Boundaries)
            </h4>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-2 text-xs leading-relaxed font-mono text-teal-100">
              {directives.slice().reverse().map((dir, idx) => (
                <div key={idx} className="flex justify-between items-start bg-emerald-900/30 border border-emerald-850 rounded p-2.5 gap-2 group">
                  <div className="flex gap-2 items-start">
                    <span className="text-amber-400 font-bold">⚡</span>
                    <p className="flex-1">{dir}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDirective(dir)}
                    className="text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition duration-150 font-sans px-1 text-sm font-semibold shrink-0"
                    title="Delete Directive"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {directives.length === 0 && (
                <div className="text-center py-8 text-xs text-teal-400">
                  Syncing core directives...
                </div>
              )}
            </div>

            {/* Form to inject new Core goal */}
            <form onSubmit={handleAddDirective} className="mt-4 pt-4 border-t border-emerald-800/50 flex gap-2">
              <input 
                type="text"
                placeholder="Lock a new permanent directive or design boundary..."
                value={newDirective}
                onChange={(e) => setNewDirective(e.target.value)}
                className="flex-1 bg-emerald-900/30 border border-emerald-800 text-xs px-3 py-2 rounded focus:outline-none focus:border-amber-400 focus:bg-emerald-950/20 text-white placeholder-emerald-400/60"
              />
              <button 
                type="submit"
                disabled={addingDirective}
                className="bg-amber-500 hover:bg-amber-600 font-semibold font-mono text-emerald-950 px-4 py-2 rounded text-xs transition duration-150 shadow"
              >
                {addingDirective ? "Locking..." : "Lock Goal"}
              </button>
            </form>
          </div>

          {/* Layer 2: Semantic Vector Ledger Logs */}
          <div className="bg-emerald-950/45 border border-emerald-800/40 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-teal-300 font-mono mb-3 flex items-center gap-1.5">
                <span>📂</span> Layer 2 & 3: Semantic Conversation Ledger (Vector Space)
              </h4>

              <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-2">
                {memoryLogs.map((log) => {
                  const isUser = log.role === 'user';
                  return (
                    <div key={log.rowid} className={`p-3 rounded border text-xs font-mono transition duration-150 ${
                      isUser ? 'bg-indigo-950/40 border-indigo-900/30 text-indigo-100' : 'bg-emerald-900/30 border-emerald-800/30 text-teal-200'
                    }`}>
                      <div className="flex justify-between items-center mb-1 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${
                          isUser ? 'bg-indigo-950 text-indigo-200 border border-indigo-805' : 'bg-emerald-800/50 text-emerald-200 border border-emerald-700'
                        }`}>
                          {log.role}
                        </span>
                        <span className="text-teal-400/50">RowID: {log.rowid} | {new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{log.content}</p>
                    </div>
                  );
                })}

                {memoryLogs.length === 0 && (
                  <div className="text-center py-12 text-xs text-teal-400 font-mono">
                    No conversation rows written to persistent database yet. Start a new chat to build!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: split 4 large panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PANEL 1: TOP LEFT — INDEX COVERAGE */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm tracking-tight text-gray-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                INDEX COVERAGE PROGRESS
              </h3>
              <span className="text-[10px] font-mono text-gray-400">7 Connected Tables</span>
            </div>
            
            <div className="space-y-4">
              {Object.keys(coverage).length === 0 ? (
                <div className="text-center py-10 font-mono text-xs text-gray-400">
                  No DB context indexed. Click "Index All Tables" to build.
                </div>
              ) : (
                Object.entries(coverage).map(([tbl, val]: [string, any]) => (
                  <div key={tbl} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-gray-700">
                      <span className="font-semibold">{tbl}</span>
                      <span>
                        {val.indexedRows}/{val.totalRows} rows ({val.coveragePct.toFixed(0)}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          val.coveragePct < 70 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${val.coveragePct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Last Indexed: {val.lastIndexedAt !== 'N/A' ? new Date(val.lastIndexedAt).toLocaleTimeString() : 'N/A'}</span>
                      <span>Latency: {val.avgLatencyMs}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-[11px] font-mono text-amber-600 bg-amber-50 rounded p-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Auto-Healer Directive:</strong> Tables with &lt;70% coverage auto-trigger an indexAll() sweep on standard queue complete transitions.
            </span>
          </div>
        </div>

        {/* PANEL 2: TOP RIGHT — EMBEDDING HEALTH */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm tracking-tight text-gray-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              EMBEDDING HEALTH & CACHE PERFORMANCE
            </h3>
            <button 
              onClick={runEmbeddingHealthTests}
              disabled={testingHealth}
              className="text-xs px-2.5 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 font-mono rounded transition disabled:opacity-50"
            >
              {testingHealth ? 'Running Sim...' : 'Test LRU Engine'}
            </button>
          </div>

          {!healthReport ? (
            <div className="flex flex-col items-center justify-center p-10 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
              <Activity className="w-8 h-8 text-rose-300 animate-pulse mb-2" />
              <p className="text-xs font-mono text-gray-500 text-center">
                Press "Test LRU Engine" to run validation checks over local model state caches.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* LRU stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                  <div className="text-[10px] font-mono text-gray-400">CACHE HITS</div>
                  <div className="text-lg font-mono font-semibold text-emerald-600">{healthReport.cacheHits}</div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                  <div className="text-[10px] font-mono text-gray-400">CACHE MISSES</div>
                  <div className="text-lg font-mono font-semibold text-rose-600">{healthReport.cacheMisses}</div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                  <div className="text-[10px] font-mono text-gray-400">HIT RATIO</div>
                  <div className="text-lg font-mono font-semibold text-gray-700">{healthReport.hitRatio.toFixed(1)}%</div>
                </div>
              </div>

              {/* Status parameters */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-500">Cosine Similarity Accuracy Checklist:</span>
                  <span className="text-emerald-600 font-semibold">{healthReport.similarityAccuracy}% pass</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-500">TF-IDF Local Fallback status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100">
                    Offline Fallback Passive
                  </span>
                </div>
              </div>

              {/* Latency visualization */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-gray-500 block">Performance Latency Chart (Last 6 calculations):</span>
                <div className="flex items-end gap-1.5 h-16 pt-2 bg-gray-50 border border-gray-100 rounded px-3">
                  {healthReport.latencies.map((l, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 text-[9px] font-mono">
                      <div 
                        className="w-full bg-rose-400 rounded-t hover:bg-rose-500 transition-all duration-300"
                        style={{ height: `${Math.min(l, 100)}%` }}
                      />
                      <span className="text-gray-400 shrink-0">{l}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PANEL 3: BOTTOM LEFT — PATTERN INTELLIGENCE */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm tracking-tight text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                PATTERN INTELLIGENCE & SHADOW CO-MUTATIONS
              </h3>
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-gray-400" />
                <select 
                  className="text-xs font-mono border-gray-200 rounded p-1 bg-white text-gray-600 focus:outline-none"
                  value={patternTypeFilter}
                  onChange={(e) => setPatternTypeFilter(e.target.value)}
                >
                  <option value="all">ALL PATTERNS</option>
                  <option value="RECURRING_BLOCKAGE">RECURRING_BLOCKAGE</option>
                  <option value="SUCCESS_PATTERN">SUCCESS_PATTERN</option>
                  <option value="CO_MUTATION_EVENT">CO_MUTATION_EVENT</option>
                  <option value="FRICTION_POINT">FRICTION_POINT</option>
                  <option value="METAPHYSICAL_CONSTANTS">METAPHYSICAL_CONSTANTS</option>
                </select>
              </div>
            </div>

            {loadingPatterns ? (
              <div className="flex items-center justify-center py-12 text-gray-500 text-xs font-mono">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Retrieving extracted cognitive streams...
              </div>
            ) : filteredPatterns.length === 0 ? (
              <div className="text-center py-12 font-mono text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                No active target patterns matching categories detected.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[290px] pr-1.5">
                {filteredPatterns.map((pat, idx) => {
                  let badgeColor = "bg-gray-100 text-gray-700";
                  if (pat.type === 'RECURRING_BLOCKAGE') badgeColor = "bg-rose-100 text-rose-700";
                  if (pat.type === 'SUCCESS_PATTERN') badgeColor = "bg-emerald-100 text-emerald-700";
                  if (pat.type === 'CO_MUTATION_EVENT') badgeColor = "bg-indigo-100 text-indigo-700";
                  if (pat.type === 'METAPHYSICAL_CONSTANTS') badgeColor = "bg-teal-100 text-teal-850 font-bold border border-teal-200 shadow-sm";

                  return (
                    <div 
                      key={idx} 
                      className="group border border-gray-150 rounded-lg p-3 hover:bg-gray-50 transition relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold tracking-wide ${badgeColor}`}>
                          {pat.type}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          Confidence: {Math.round(pat.confidence * 100)}% | Freq: {pat.frequency}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-700 mt-2 font-medium leading-relaxed">
                        {pat.description}
                      </p>

                      {/* Tooltip Recommendation Hover Block */}
                      <div className="hidden group-hover:block mt-2.5 p-2 bg-indigo-50 border border-indigo-100 rounded text-[11px] text-indigo-800 leading-snug font-mono">
                        <span className="font-semibold block text-indigo-900 mb-0.5">💡 Actionable Recommendation:</span>
                        {pat.recommendedAction}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-150 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Scan Frequency: 6H intervals</span>
            <span>Nine Protocol bypass index: ACTIVE (Position 9 skipped)</span>
          </div>
        </div>

        {/* PANEL 4: BOTTOM RIGHT — NATURAL LANGUAGE SEARCH */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm tracking-tight text-gray-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-500" />
                NATURAL LANGUAGE SEMANTIC SEARCH
              </h3>
              <div className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-gray-400" />
                <select 
                  className="text-xs font-mono border-gray-200 p-1 rounded bg-white text-gray-600 focus:outline-none"
                  value={searchTableFilter}
                  onChange={(e) => setSearchTableFilter(e.target.value)}
                >
                  <option value="all">ALL SOURCES</option>
                  <option value="swarm_results">swarm_results</option>
                  <option value="mind_log">mind_log</option>
                  <option value="kinetic_logs">kinetic_logs</option>
                  <option value="dna_archive">dna_archive</option>
                  <option value="quantum_conversations">quantum_conversations</option>
                  <option value="overnight_log">overnight_log</option>
                  <option value="world_state">world_state</option>
                </select>
              </div>
            </div>

            <form onSubmit={executeSearch} className="flex gap-2 mb-3">
              <input 
                type="text" 
                placeholder="Query query context, past failures, decisions..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loadingSearch}
                className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-1.5 rounded text-xs px-3 font-mono font-medium flex items-center gap-1 transition shadow-sm"
              >
                {loadingSearch ? 'Searching...' : 'Vector Match'}
              </button>
            </form>

            <div className="space-y-3 overflow-y-auto max-h-[240px] pr-1.5">
              {loadingSearch ? (
                <div className="text-center py-10 text-xs text-gray-400 font-mono">
                  Loading vectors & matching matrices...
                </div>
              ) : filteredSearchResults.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg font-mono">
                  {searchPerformed ? '0 vector hits. Performing local keyword search fallback...' : 'Input search terms to scan neural embedding space.'}
                </div>
              ) : (
                filteredSearchResults.map((res, idx) => (
                  <div key={idx} className="border border-gray-150 rounded-lg p-2.5 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                      <span className="font-semibold uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                        {res.sourceTable}
                      </span>
                      <span>
                        Match Score: <strong>{(res.score * 100).toFixed(0)}%</strong>
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-700 mt-2 font-mono whitespace-pre-wrap leading-relaxed">
                      {res.content.length > 250 ? `${res.content.substring(0, 250)}...` : res.content}
                    </p>
                    
                    <div className="text-[9px] text-gray-400 font-mono mt-1 pt-1 border-t border-gray-100 text-right">
                      ID: {res.sourceId} | Tokens: {res.tokenCount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-gray-400 text-center mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            RAG Budget Guard enabled: trims relevant inputs above token limits.
          </div>
        </div>

      </div>

    </div>
  );
}
