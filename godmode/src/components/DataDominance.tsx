import React, { useState, useEffect } from 'react';
import { Database, Search, ShieldAlert, Zap, Globe, Table as TableIcon, RefreshCw, Plus, Trash2, ShieldCheck, Cpu } from 'lucide-react';

interface MarketMargin {
  id: number;
  category: string;
  asset: string;
  source: string;
  deviation: string;
  suggestion: string;
  value: string;
  timestamp: string;
}

interface StealthProxy {
  id: number;
  ip: string;
  country: string;
  latency: number;
  active: number;
}

export default function DataDominance() {
  const [margins, setMargins] = useState<MarketMargin[]>([]);
  const [proxies, setProxies] = useState<StealthProxy[]>([]);
  
  const [loadingMargins, setLoadingMargins] = useState(false);
  const [loadingProxies, setLoadingProxies] = useState(false);
  const [rotatingProxies, setRotatingProxies] = useState(false);

  // Form states to introduce new asymmetry
  const [newAsset, setNewAsset] = useState("");
  const [newCategory, setNewCategory] = useState("DFS_LAG_EDGE");
  const [newSource, setNewSource] = useState("");
  const [newDeviation, setNewDeviation] = useState("");
  const [newSuggestion, setNewSuggestion] = useState("");
  const [newValue, setNewValue] = useState("");

  const fetchMarginsAndProxies = async () => {
    setLoadingMargins(true);
    setLoadingProxies(true);
    try {
      const marginRes = await fetch('/api/persistent-memory/margins');
      if (marginRes.ok) {
        const mData = await marginRes.json();
        setMargins(mData.margins || []);
      }
      const proxyRes = await fetch('/api/persistent-memory/proxies');
      if (proxyRes.ok) {
        const pData = await proxyRes.json();
        setProxies(pData.proxies || []);
      }
    } catch (e) {
      console.error('Error fetching data asymmetry:', e);
    } finally {
      setLoadingMargins(false);
      setLoadingProxies(false);
    }
  };

  const clearMargins = async () => {
    if (!confirm('Are you sure you want to flush the cached market margin disparities?')) return;
    try {
      const res = await fetch('/api/persistent-memory/margins/clear', { method: 'POST' });
      if (res.ok) {
        setMargins([]);
      }
    } catch (e) {
      console.error('Error clearing margins:', e);
    }
  };

  const handleAddMargin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.trim() || !newSuggestion.trim()) {
      alert('Asset name and suggested execution are required');
      return;
    }
    try {
      const res = await fetch('/api/persistent-memory/margins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          asset: newAsset,
          source: newSource || 'Scraper Aggregator',
          deviation: newDeviation || 'Arbitrage variance discovered',
          suggestion: newSuggestion,
          value: newValue || '$500.00'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMargins(data.margins || []);
        // Reset form
        setNewAsset("");
        setNewSource("");
        setNewDeviation("");
        setNewSuggestion("");
        setNewValue("");
      }
    } catch (e) {
      console.error('Error adding market margins:', e);
    }
  };

  const handleRotateProxies = async () => {
    setRotatingProxies(true);
    try {
      const res = await fetch('/api/persistent-memory/proxies/rotate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProxies(data.proxies || []);
      }
    } catch (e) {
      console.error('Error rotating residential proxy array:', e);
    } finally {
      setTimeout(() => setRotatingProxies(false), 800);
    }
  };

  useEffect(() => {
    fetchMarginsAndProxies();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#030008] text-teal-400 font-mono p-4 md:p-6 overflow-y-auto space-y-6">
      
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-teal-900/40 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-widest text-[#00f3ff] uppercase">Asymmetry & Decoupled Spread Harvesters</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase">
            Autonomous multi-source scrapers targeting DFS line lag, Polymarket contracts, and localized physical boundaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchMarginsAndProxies}
            title="Update memory vaults"
            className="p-2 border border-teal-900/55 bg-[#0a0a14] rounded-lg hover:border-teal-400 text-teal-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loadingMargins ? 'animate-spin' : ''}`} />
          </button>
          <Database className="w-8 h-8 text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.3)] animate-pulse" />
        </div>
      </div>

      {/* Main Stats Counters / Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#070712] p-5 border border-teal-900/30 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <Globe className="w-12 h-12 text-teal-400" />
          </div>
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">DFS Projections Scraped</h3>
          <div className="text-2xl font-black text-white hover:scale-105 transition-transform duration-300">PrizePicks lag</div>
          <p className="text-[10px] text-teal-500 font-bold mt-1 uppercase">Active Consensus line sweep: Live</p>
        </div>

        <div className="bg-[#070712] p-5 border border-teal-900/30 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <ShieldCheck className="w-12 h-12 text-amber-400" />
          </div>
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">Polymarket Contract Variance</h3>
          <div className="text-2xl font-black text-white hover:scale-105 transition-transform duration-300">Geopolitical Arbitrage</div>
          <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase">Scanners parsing localized contracts</p>
        </div>

        <div className="bg-[#070712] p-5 border border-[#300305]/60 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <Cpu className="w-12 h-12 text-fuchsia-400" />
          </div>
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">Autonomic Firewall Guard</h3>
          <div className="text-2xl font-black text-white hover:scale-105 transition-transform duration-300">Stealth Brower Stealth</div>
          <p className="text-[10px] text-fuchsia-500 font-bold mt-1 uppercase">WebGL Masking & TLS rotating arrays</p>
        </div>
      </div>

      {/* Middle Split Grid: Live margins ledger on left, residential proxy monitor on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Margins & Edge Discrepancy Database */}
        <div className="lg:col-span-2 bg-[#070712] border border-teal-900/40 p-5 rounded-xl flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-teal-950 gap-3">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-[#00f3ff]" />
              Real-time Ingested Discrepancy Matrix (SQLite-vec ledger)
            </h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={clearMargins}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-red-950/40 border border-red-800 text-red-200 hover:bg-red-900/60 transition"
                title="Flush discrepancies from database"
              >
                <Trash2 className="w-3 h-3" /> Flush cache
              </button>
            </div>
          </div>

          <div className="overflow-x-auto select-text scrollbar-thin">
            <table className="w-full text-xs text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-teal-950 text-gray-500 uppercase pb-2">
                  <th className="py-2.5 px-3">Asset / Target</th>
                  <th className="py-2.5 px-3">Variance Category</th>
                  <th className="py-2.5 px-3">Source Deviation</th>
                  <th className="py-2.5 px-3">Actioned Strategy</th>
                  <th className="py-2.5 px-3 text-right">Yield Spread</th>
                </tr>
              </thead>
              <tbody>
                {margins.map((m) => (
                  <tr key={m.id} className="border-b border-teal-950/50 hover:bg-teal-950/20 text-gray-300">
                    <td className="py-3 px-3 font-bold text-teal-100">{m.asset}</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#14142a] border border-teal-900 border-opacity-70 text-cyan-300">
                        {m.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#00f3ff] font-mono">{m.source} <br/><span className="text-[10px] text-teal-500">{m.deviation}</span></td>
                    <td className="py-3 px-3 text-amber-200">{m.suggestion}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400">{m.value}</td>
                  </tr>
                ))}
                {margins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Discrepancy database has been flushed. Inject a mock edge to seed vectors.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Proxy Rotator Panel */}
        <div className="bg-[#070712] border border-teal-900/40 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-teal-950 mb-4">
              <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                <Globe className="w-4 h-4 text-fuchsia-400" />
                Proxy Array (Anti-lock stealth logs)
              </h3>
              <button 
                onClick={handleRotateProxies}
                disabled={rotatingProxies}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-fuchsia-900 bg-fuchsia-950/30 text-fuchsia-200 hover:bg-fuchsia-900/50 transition"
              >
                <RefreshCw className={`w-3 h-3 ${rotatingProxies ? 'animate-spin' : ''}`} />
                {rotatingProxies ? 'Rotating...' : 'Rotate IPs'}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed mb-4 uppercase">
              Scrapers route traffic through these randomized residential backconnect channels to obscure bot footprints completely. Latencies are adjusted dynamically dynamically.
            </p>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {proxies.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-[#0f0f1d]/40 rounded border border-teal-950">
                  <div className="flex flex-col">
                    <span className="text-xs text-teal-100 font-mono tracking-wider">{p.ip}</span>
                    <span className="text-[9px] text-fuchsia-400 uppercase tracking-wide font-bold">{p.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black text-emerald-400">{p.latency}ms</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>
              ))}
              {proxies.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-500 uppercase">
                  Loading secure residential rotation...
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-teal-950 bg-teal-950/10 p-2.5 rounded text-[10px] text-teal-500 leading-relaxed uppercase">
            ⚡ WebGL dynamic hashes, window sizes, and HTTP headers are updated globally on active rotators after every outbound payload fetch.
          </div>
        </div>

      </div>

      {/* Manual Arbitrage Ingestion Form */}
      <div className="bg-[#070712] border border-teal-900/30 p-5 rounded-xl">
        <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-emerald-400" />
          Introduce New Discrepancy (Inject into SQLite memory ledger)
        </h3>

        <form onSubmit={handleAddMargin} className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-black">Target Asset</label>
            <input 
              type="text"
              placeholder="e.g. Trae Young (NBA)"
              value={newAsset}
              onChange={(e) => setNewAsset(e.target.value)}
              className="bg-[#0f0f1c]/50 border border-teal-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-[#00f3ff]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-black">Category</label>
            <select 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-[#0f0f1c]/50 border border-teal-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-[#00f3ff]"
            >
              <option value="DFS_LAG_EDGE">DFS Lag Edge</option>
              <option value="POLYMARKET_ARBITRAGE">Polymarket Arbitrage</option>
              <option value="REGULATORY_SPREAD">Regulatory Spread</option>
              <option value="CASUAL_SENTIMENT">Casual Sentiment</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-black">Deviation Source</label>
            <input 
              type="text"
              placeholder="Pinnacle vs PrizePicks"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="bg-[#0f0f1c]/50 border border-teal-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-[#00f3ff]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-black">Line Deviation</label>
            <input 
              type="text"
              placeholder="+2.5 PTS on shift"
              value={newDeviation}
              onChange={(e) => setNewDeviation(e.target.value)}
              className="bg-[#0f0f1c]/50 border border-teal-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-[#00f3ff]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-black">Suggested Action</label>
            <input 
              type="text"
              placeholder="Buy/Lock OVER 24.5"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              className="bg-[#0f0f1c]/50 border border-teal-900/60 p-2 text-xs rounded text-white focus:outline-none focus:border-[#00f3ff]"
            />
          </div>

          <div className="flex flex-col gap-1 justify-end">
            <button 
              type="submit"
              className="w-full bg-[#00f3ff] hover:bg-[#00d0db] text-[#030008] font-bold font-mono tracking-widest text-xs uppercase p-2 rounded transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> Inject
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

