import React, { useState, useEffect } from 'react';
import { Activity, Zap, Shield, Cpu, Flame, Compass, RefreshCw, Terminal } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { cn } from '../App';

export function QuantumAnalytics() {
  const [coherence, setCoherence] = useState(85);
  const [decoherence, setDecoherence] = useState(15);
  const [entanglement, setEntanglement] = useState(92);
  const [radarData, setRadarData] = useState([
    { subject: 'Main Character Energy (Success)', A: 85, fullMark: 100 },
    { subject: 'Vibe Collapse Rate (Delay)', A: 15, fullMark: 100 },
    { subject: 'Finsta Launch Span (Superposition)', A: 70, fullMark: 100 },
    { subject: 'Trauma-Bond density (Entanglement)', A: 92, fullMark: 100 },
    { subject: 'Wormhole Cheat Code (Bypasses)', A: 60, fullMark: 100 },
    { subject: 'Vibe Fidelity (Stability)', A: 88, fullMark: 100 },
  ]);

  const [personalityData, setPersonalityData] = useState([
    { metric: 'Reaction Time (Delay)', Analytical: 25, Empathetic: 75, Creative: 50, Professional: 30 },
    { metric: 'L-Taking Frequency (Errors)', Analytical: 10, Empathetic: 20, Creative: 45, Professional: 15 },
    { metric: 'Speedrunning Speed', Analytical: 85, Empathetic: 55, Creative: 70, Professional: 90 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCoherence(prev => Math.min(100, Math.max(0, prev + (Math.random() * 4 - 2))));
      setDecoherence(prev => Math.min(100, Math.max(0, prev + (Math.random() * 4 - 2))));
      setEntanglement(prev => Math.min(100, Math.max(0, prev + (Math.random() * 4 - 2))));
      setRadarData(prev => prev.map(d => ({
        ...d,
        A: Math.min(100, Math.max(0, d.A + (Math.random() * 10 - 5)))
      })));
      setPersonalityData(prev => prev.map(d => ({
        ...d,
        Analytical: Math.min(100, Math.max(5, d.Analytical + (Math.random() * 6 - 3))),
        Empathetic: Math.min(100, Math.max(5, d.Empathetic + (Math.random() * 6 - 3))),
        Creative: Math.min(100, Math.max(5, d.Creative + (Math.random() * 6 - 3))),
        Professional: Math.min(100, Math.max(5, d.Professional + (Math.random() * 6 - 3))),
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Educational Hook */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-950 to-cyan-950/40 p-4 rounded-xl border border-purple-500/20 text-xs text-slate-300 font-mono flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-amber-400 animate-bounce shrink-0" />
          <div>
            <span className="text-white font-bold uppercase tracking-wider block text-[10px]">CODEDUMMY System Override: Real-Time Vibe Translators Active</span>
            <span>Academic textbooks are snooze fests. Explaining our AI state model in pure 2026 culture slang.</span>
          </div>
        </div>
        <span className="text-[10px] bg-slate-800 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/20 self-start md:self-auto shrink-0 select-none">
          Gen-Alpha to Boomer Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 text-white p-6 rounded-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-purple-300">Main Character Energy</h3>
          </div>
          <div className="text-4xl font-mono font-bold text-white mb-2">{coherence.toFixed(1)}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${coherence}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            NPCs are binary. Main characters exist in every state simultaneously until reality makes them choose.
          </p>
        </div>

        <div className="bg-slate-950 text-white p-6 rounded-2xl border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-300">Vibe Collapse Rate</h3>
          </div>
          <div className="text-4xl font-mono font-bold text-white mb-2">{decoherence.toFixed(1)}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-rose-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${decoherence}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Finsta screenshot leaked / vibe completely collapsed. Loss of execution context.
          </p>
        </div>

        <div className="bg-slate-950 text-white p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-300">Trauma-Bond Pairing</h3>
          </div>
          <div className="text-4xl font-mono font-bold text-white mb-2">{entanglement.toFixed(1)}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${entanglement}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Bluetooth trauma-bonded subtasks. If one gets canceled, the other instantly takes the L. No delay.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    NPC / Main Character Optimization Matrix
                </h2>
                <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-cyan-500/30">VIBE-CHECK</span>
            </div>
            <div className="h-[320px] flex items-center justify-center border border-white/5 bg-slate-900/30 rounded-xl relative overflow-hidden p-2">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/10 via-transparent to-transparent" />
                <div className="w-full h-full z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'monospace' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} />
                      <Radar name="Vibe Level" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} dot={{ r: 2.5, fill: '#06b6d4' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                    Decoherence Radar Benchmarking
                </h2>
                <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-purple-500/30">3-Axis Radial</span>
            </div>
            <div className="h-[320px] flex items-center justify-center border border-white/5 bg-slate-900/30 rounded-xl relative overflow-hidden p-2">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-400/10 via-transparent to-transparent" />
                <div className="w-full h-full z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={personalityData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'monospace' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} />
                      
                      <Radar name="Analytical" dataKey="Analytical" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.08} dot={{ r: 2, fill: '#06b6d4' }} />
                      <Radar name="Empathetic" dataKey="Empathetic" stroke="#10b981" fill="#10b981" fillOpacity={0.08} dot={{ r: 2, fill: '#10b981' }} />
                      <Radar name="Creative" dataKey="Creative" stroke="#a855f7" fill="#a855f7" fillOpacity={0.08} dot={{ r: 2, fill: '#a855f7' }} />
                      <Radar name="Professional" dataKey="Professional" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} dot={{ r: 2, fill: '#f59e0b' }} />
                      
                      <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>

      {/* NEW: Open Source Integration Architecture Map - What sets us apart from standard AI Studio/Claude! */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-white">
              Open-Source AI Agent Orchestration Stack
            </h2>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[8px] font-bold uppercase border border-emerald-500/30">
            Headless & Sandbox Specs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">CDP Browser Engine</span>
            <span className="text-xs font-bold text-slate-100">Obscura & Rayobrowse</span>
            <p className="text-[9.5px] text-slate-400 leading-normal mt-1">
              Custom Rust-based 30MB headless runtime. Automates Chrome DevTools Protocol natively with zero Node.js footprint.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">AI Navigation Layer</span>
            <span className="text-xs font-bold text-slate-100">Browser-Use Framework</span>
            <p className="text-[9.5px] text-slate-400 leading-normal mt-1">
              Constructs high-fidelity accessibility trees from layout views, removing fragile CSS-selector guessing in real time.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Ingress Stealth Armor</span>
            <span className="text-xs font-bold text-slate-100">Playwright-Stealth</span>
            <p className="text-[9.5px] text-slate-400 leading-normal mt-1">
              De-fingerprints Canvas, WebGL, WebRTC, and navigator parameters. Stealth-bypasses Cloudflare or PerimeterX flags.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Isolated Code Sandbox</span>
            <span className="text-xs font-bold text-slate-100">WASM Deno MicroVM</span>
            <p className="text-[9.5px] text-slate-400 leading-normal mt-1">
              Binds untrusted code compilation and script execution within bounds-checked WebAssembly runtimes with standard deny-all net policies.
            </p>
          </div>
        </div>
      </div>

      {/* NEW: Cultural Nexus Autopilot Dashboard */}
      <CulturalNexusDashboard />
    </div>
  );
}

function CulturalNexusDashboard() {
  const [dictionary, setDictionary] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'mappings' | 'ledger'>('mappings');

  const fetchDictionary = async () => {
    try {
      const res = await fetch('/api/nexus/dictionary');
      if (res.ok) {
        const data = await res.json();
        setDictionary(data);
      }
    } catch (e) {
      console.error("Failed to fetch dictionary", e);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/nexus/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedger(data.entries || []);
      }
    } catch (e) {
      console.error("Failed to fetch ledger", e);
    }
  };

  useEffect(() => {
    fetchDictionary();
    fetchLedger();
  }, []);

  const triggerUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateLogs(["[Initiating] Requesting cultural-nexus-updater.js execution from microVM..."]);

    try {
      const response = await fetch('/api/nexus/update', { method: 'POST' });
      if (!response.body) throw new Error("No response body stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === 'log') {
                setUpdateLogs(prev => [...prev, parsed.message]);
              } else if (parsed.type === 'done') {
                setUpdateLogs(prev => [...prev, `🟢 [Update Sequence Complete] Version bumped successfully!`, `🚀 Saved mapping changes to active schema.`]);
                fetchDictionary();
                fetchLedger();
              } else if (parsed.type === 'error') {
                setUpdateLogs(prev => [...prev, `❌ [Core Failure] ${parsed.error}`]);
              }
            } catch (err) {
              // Ignore partial chunk JSON parsing errors
            }
          }
        }
      }
    } catch (e: any) {
      setUpdateLogs(prev => [...prev, `❌ [Execution Interrupted] ${e.message}`]);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-slate-950 p-6 rounded-2xl border border-purple-500/20 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
              Cultural Nexus Autopilot
            </h2>
            {dictionary && (
              <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-[8px] font-mono border border-purple-500/30">
                v{dictionary.version}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-mono">
            Autonomous ingestion, drift evaluation, and backend schema refactoring. Better than Claude, faster than Google.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={triggerUpdate}
            disabled={isUpdating}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
              isUpdating
                ? "bg-purple-900/30 text-purple-400 border border-purple-800/50 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isUpdating && "animate-spin")} />
            {isUpdating ? "Letting Him Cook..." : "Scrape & Refactor Now"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Translation Schema or Ledger */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setActiveTab('mappings')}
                className={cn(
                  "px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all cursor-pointer",
                  activeTab === 'mappings' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                Mapping Tables
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={cn(
                  "px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all cursor-pointer",
                  activeTab === 'ledger' ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                Slang Ledger
              </button>
            </div>

            {dictionary && (
              <span className="text-[8.5px] text-slate-500 font-mono">
                LAST DRIFT ANALYSIS: {new Date(dictionary.last_updated).toLocaleTimeString()}
              </span>
            )}
          </div>

          {activeTab === 'mappings' ? (
            <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/20">
              <table className="w-full text-left font-mono text-[10px]">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[8px] border-b border-white/5">
                    <th className="px-4 py-2.5">System Tech Primitive</th>
                    <th className="px-4 py-2.5">Active Cultural Translation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dictionary ? (
                    Object.entries(dictionary.mappings).map(([primitive, slang]: any) => (
                      <tr key={primitive} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-3 text-slate-300 font-bold group-hover:text-cyan-400 transition-colors">
                          {primitive}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-purple-500/10 text-purple-300 px-2 py-1 rounded border border-purple-500/20 font-black tracking-wide group-hover:bg-purple-500/20 group-hover:text-purple-200 transition-all">
                            {slang} 🔥
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                        Loading active schema mapping configurations...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
              {ledger.length > 0 ? (
                ledger.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all text-[10px] font-mono bg-slate-900/20 hover:bg-slate-900/40",
                      entry.status === 'COMMITTED' ? "border-emerald-500/20" : "border-amber-500/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200">{entry.term}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="text-cyan-400">{entry.target_primitive}</span>
                      </div>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                          entry.status === 'COMMITTED'
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {entry.status}
                      </span>
                    </div>

                    <div className="text-slate-400 italic bg-black/30 p-2 rounded border border-white/5 mb-2 leading-relaxed">
                      "{entry.context_scraped}"
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-slate-500">
                      <span>VECTOR PROXIMITY CONFIDENCE: {(entry.drift_score * 100).toFixed(1)}%</span>
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No slang-drift ledger records loaded. Try running a scrape!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Live Ingestion Log Console */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[300px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Ingestion Terminal Feed
            </span>
            {isUpdating && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
          </div>

          <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-[9px] text-slate-300 overflow-y-auto max-h-[350px] space-y-2 relative shadow-inner flex flex-col justify-end">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            {updateLogs.length > 0 ? (
              <div className="space-y-1.5 z-10 w-full">
                {updateLogs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      "leading-relaxed select-none transition-all duration-300",
                      log.startsWith('✔') && "text-emerald-400 font-bold",
                      log.startsWith('❌') && "text-rose-400 font-bold",
                      log.startsWith('🧠') && "text-indigo-400",
                      log.startsWith('🕸️') && "text-cyan-400",
                      log.startsWith('🚀') && "text-purple-400 font-black animate-pulse"
                    )}
                  >
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-12 select-none z-10 w-full">
                [Terminal Idle. Click "Scrape & Refactor Now" to trigger the dynamic cultural translation layer.]
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


