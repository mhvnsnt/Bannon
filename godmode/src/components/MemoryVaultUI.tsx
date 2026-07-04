import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, RefreshCw, Cpu, FileText, Layers, Award, Sparkles, Play, ShieldAlert, Dna, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemoryItem {
  id: number;
  content: string;
  updated_at: string;
}

interface DnaConfigItem {
  id: number;
  config_json: string;
  run_status: string;
  frame_time_avg: number;
  jitter_peak: number;
  promoted: number;
  timestamp: string;
}

export function MemoryVaultUI() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [dnaArchive, setDnaArchive] = useState<DnaConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMemory, setNewMemory] = useState("");
  const [evolving, setEvolving] = useState(false);
  
  const [finetuneStatus, setFinetuneStatus] = useState<any>(null);
  const [collecting, setCollecting] = useState(false);

  // Simulation parameters for manual DNA generation
  const [bipedalHeight, setBipedalHeight] = useState(1.8);
  const [knockdownThresh, setKnockdownThresh] = useState(4.5);
  const [slamWeight, setSlamWeight] = useState(1.2);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/armada/memory/view');
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchDnaArchive = async () => {
    try {
      const res = await fetch('/api/armada/dna/archive');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDnaArchive(data.archive);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFinetuneStatus = async () => {
    try {
      const res = await fetch('/api/armada/finetune/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFinetuneStatus(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerCollection = async () => {
    setCollecting(true);
    try {
      const res = await fetch('/api/armada/finetune/collect', { method: 'POST' });
      if (res.ok) {
        await fetchFinetuneStatus();
      }
    } catch (e) {
      console.error(e);
    }
    setCollecting(false);
  };

  const simulateDnaEvolution = async () => {
    setEvolving(true);
    try {
      // Craft random but highly optimized physical coefficients
      const config_json = {
        BIPEDAL_HEIGHT: bipedalHeight,
        KNOCKDOWN_THRESHOLD: knockdownThresh,
        SLAM_WEIGHT: slamWeight,
        GRAVITY_CONSTANT: 9.81,
        INERTIAL_CLAMP: 0.14,
        STANCE_WIDTH: 0.65
      };
      
      const frame_time_avg = parseFloat((12.5 + Math.random() * 4).toFixed(2));
      const jitter_peak = Math.floor(Math.random() * 3) + 1;
      const success_run = frame_time_avg <= 16.0 && jitter_peak <= 3;

      await fetch('/api/armada/dna/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_json,
          frame_time_avg,
          jitter_peak,
          success_run
        })
      });

      await fetchDnaArchive();
      await fetchFinetuneStatus();
    } catch (e) {
      console.error(e);
    }
    setEvolving(false);
  };

  const forceMaster = async (id: number) => {
    try {
      await fetch('/api/armada/dna/force-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      await fetchDnaArchive();
      await fetchFinetuneStatus();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemories();
    fetchDnaArchive();
    fetchFinetuneStatus();
    const interval = setInterval(() => {
      fetchMemories();
      fetchDnaArchive();
      fetchFinetuneStatus();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    try {
      await fetch('/api/armada/memory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ control: newMemory })
      });
      setNewMemory("");
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  const removeMemory = async (id: number) => {
    try {
      await fetch('/api/armada/memory/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_number: id })
      });
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  const lastSuccessfulLog = finetuneStatus?.lastLogs?.find((l: any) => l.status === 'SUCCESS');
  const lastRunTime = lastSuccessfulLog ? new Date(lastSuccessfulLog.timestamp).toLocaleString() : 'Never';

  return (
    <div className="flex flex-col h-full bg-[#050505] p-5 text-emerald-400 font-mono overflow-y-auto no-scrollbar">
      
      {/* Title block */}
      <div className="flex items-center justify-between mb-6 border-b border-emerald-950 pb-3">
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <Dna className="w-6 h-6 text-emerald-500 animate-pulse" />
            heaven$ent.nexus // physical_dna_evolution_grid
          </h1>
          <p className="text-[10px] text-emerald-700 uppercase mt-1">
            Absolute skeletal mechanics, bipedal balance, and custom fine-tune dataset convergence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { fetchMemories(); fetchDnaArchive(); fetchFinetuneStatus(); }} 
            className="p-1.5 bg-emerald-950/20 border border-emerald-900/40 hover:bg-emerald-900/30 rounded text-emerald-400 transition-colors"
            title="Refresh All Grid Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || collecting || evolving) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left column: Persistent Fact Store and DNA simulation injector */}
        <div className="space-y-6">
          
          {/* Persistent Fact Store card */}
          <div id="persistent-fact-store" className="bg-[#080808] border border-emerald-900/20 rounded-xl p-4 flex flex-col min-h-[320px]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500 border-b border-emerald-950/50 pb-2 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              memory_user_edits // persistent fact store
            </h2>

            <div className="flex gap-2 mb-4">
              <input 
                id="fact-input-field"
                type="text" 
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMemory()}
                placeholder="Inject persistent facts, identity rules, or system vectors..."
                className="flex-1 bg-[#030303] border border-emerald-950 p-2.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-700 rounded-lg placeholder-emerald-900"
              />
              <button 
                id="add-fact-button"
                onClick={addMemory}
                className="bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/40 px-4 py-2 text-xs uppercase tracking-wider font-extrabold rounded-lg flex items-center gap-1.5 transition-all text-shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Inject
              </button>
            </div>

            <div className="flex-1 max-h-[220px] overflow-y-auto pr-1 space-y-2.5 no-scrollbar">
              <AnimatePresence>
                {memories.map((mem) => (
                  <motion.div 
                    key={mem.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-[#030303] border border-emerald-950/50 p-3.5 rounded-lg group relative hover:border-emerald-900/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] bg-emerald-950/50 text-emerald-500 px-2 py-0.5 rounded font-black tracking-wider border border-emerald-900/20">
                        FACT #{mem.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-emerald-800 uppercase font-semibold">
                          {new Date(mem.updated_at + 'Z').toLocaleString()}
                        </span>
                        <button 
                          onClick={() => removeMemory(mem.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 transition-all p-0.5 rounded hover:bg-red-950/20"
                          title="Purge Memory"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-emerald-200/90 whitespace-pre-wrap leading-relaxed">
                      {mem.content}
                    </div>
                  </motion.div>
                ))}
                {memories.length === 0 && !loading && (
                  <div className="text-center text-emerald-950/40 text-[10px] py-16 uppercase tracking-widest border border-dashed border-emerald-950/40 rounded-lg">
                    [Vault Empty. Awaiting initial memory injection.]
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* DNA Mutation Lab / Injector */}
          <div className="bg-[#080808] border border-emerald-900/20 rounded-xl p-4 flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00b0ff] border-b border-emerald-950/50 pb-2 mb-4 flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5 text-[#00b0ff]" />
              Skeletal Physics DNA Mutation Lab
            </h2>

            <p className="text-[10px] text-gray-500 uppercase leading-relaxed mb-4">
              Manually mutate physical coefficients to test poise stability controls, knockdown thresholds, and dynamic skeleton weightings on standard ragdoll arrays.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
              <div>
                <label className="text-[9px] text-[#00b0ff] uppercase block mb-1">Bipedal Height (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={bipedalHeight}
                  onChange={(e) => setBipedalHeight(parseFloat(e.target.value) || 1.8)}
                  className="w-full bg-[#030303] border border-emerald-950 p-2 text-emerald-300 rounded"
                />
              </div>
              <div>
                <label className="text-[9px] text-[#00b0ff] uppercase block mb-1">Knockdown (N-m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={knockdownThresh}
                  onChange={(e) => setKnockdownThresh(parseFloat(e.target.value) || 4.5)}
                  className="w-full bg-[#030303] border border-emerald-950 p-2 text-emerald-300 rounded"
                />
              </div>
              <div>
                <label className="text-[9px] text-[#00b0ff] uppercase block mb-1">Slam Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={slamWeight}
                  onChange={(e) => setSlamWeight(parseFloat(e.target.value) || 1.2)}
                  className="w-full bg-[#030303] border border-emerald-950 p-2 text-emerald-300 rounded"
                />
              </div>
            </div>

            <button
              onClick={simulateDnaEvolution}
              disabled={evolving}
              className="w-full bg-[#00b0ff]/10 hover:bg-[#00b0ff]/20 text-[#00b0ff] border border-[#00b0ff]/30 hover:border-[#00b0ff]/60 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <Cpu className={`w-3.5 h-3.5 ${evolving ? "animate-spin" : ""}`} />
              {evolving ? "MUTATING PHYSICAL STRUCTURES..." : "EXECUTE PHYSICS MUTATOR STRIKE"}
            </button>
          </div>

        </div>

        {/* Right column: DNA Physics Archive and FineTuneCollector status */}
        <div className="space-y-6">

          {/* DNA Archive and Master promotion */}
          <div id="dna-physics-archive" className="bg-[#080808] border border-emerald-900/20 rounded-xl p-4 flex flex-col min-h-[280px]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00e5ff] border-b border-emerald-950/50 pb-2 mb-3 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#00e5ff]" />
              Skeletal DNA configuration archive [Physical constants]
            </h2>

            <div className="flex-1 max-h-[220px] overflow-y-auto pr-1 space-y-2 no-scrollbar">
              {dnaArchive.map((item) => {
                let parsedConfig: any = {};
                try {
                  parsedConfig = JSON.parse(item.config_json);
                } catch {
                  parsedConfig = { raw: item.config_json };
                }

                const isMaster = item.run_status === 'MASTER';

                return (
                  <div key={item.id} className="bg-[#030303] border border-emerald-950/60 p-3 rounded-lg flex flex-col justify-between hover:border-emerald-900/30 transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-[#00e5ff]">
                          ID-{item.id}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          isMaster ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/30" : 
                          item.run_status === 'SUCCESS' ? "text-cyan-400 bg-cyan-950/20" : "text-amber-500 bg-amber-950/20"
                        }`}>
                          {item.run_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500 uppercase font-semibold">
                          Frame: {item.frame_time_avg}ms | Jitter: {item.jitter_peak}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 bg-[#050505] p-2 rounded text-[9px] text-gray-400 font-mono mt-1 mb-2">
                      <div>Height: <span className="text-white font-bold">{parsedConfig.BIPEDAL_HEIGHT ?? "1.80"}m</span></div>
                      <div>Thresh: <span className="text-white font-bold">{parsedConfig.KNOCKDOWN_THRESHOLD ?? "4.5"}N</span></div>
                      <div>Slam: <span className="text-white font-bold">{parsedConfig.SLAM_WEIGHT ?? "1.2"}kg</span></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[8px] text-emerald-800">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                      {!isMaster && (
                        <button
                          onClick={() => forceMaster(item.id)}
                          className="text-[8.5px] bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-400 border border-emerald-800/30 px-2 py-1 rounded flex items-center gap-1 transition-all"
                        >
                          PROMOTE TO MASTER <ArrowUpRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {isMaster && (
                        <div className="text-[8.5px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACTIVE MASTER
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {dnaArchive.length === 0 && (
                <div className="text-center text-emerald-950/40 text-[10px] py-14 uppercase tracking-widest border border-dashed border-emerald-950/40 rounded-lg">
                  [Archive Empty. Mutate new physics configurations on the left.]
                </div>
              )}
            </div>
          </div>

          {/* ADDED SECTION: FineTuneCollector Status */}
          <div id="finetune-collector-status" className="bg-[#080808] border border-emerald-900/20 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-emerald-950/50 pb-2 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                local fine-tuning dataset pipeline
              </h2>
              <button
                id="collect-trigger-button"
                onClick={triggerCollection}
                disabled={collecting}
                className="text-[10px] bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/40 hover:border-emerald-600/60 px-3 py-1 rounded-md text-emerald-400 flex items-center gap-1.5 transition-all text-shadow font-extrabold disabled:opacity-50"
              >
                <Play className={`w-3 h-3 ${collecting ? "text-amber-400 animate-spin" : "text-emerald-400"}`} />
                {collecting ? "COLLECTING..." : "COLLECT NOW"}
              </button>
            </div>

            {/* Current Counts Block */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#030303] border border-emerald-950 p-2.5 rounded-lg flex flex-col">
                <span className="text-[9px] text-emerald-700 uppercase font-bold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-600" /> Swarm Jobs
                </span>
                <span className="text-base font-extrabold text-emerald-300 mt-1">
                  {finetuneStatus?.currentLiveCounts?.swarm ?? 0} pairs
                </span>
                <span className="text-[8px] text-emerald-800 mt-0.5">Confidence &gt; 0.85</span>
              </div>
              
              <div className="bg-[#030303] border border-emerald-950 p-2.5 rounded-lg flex flex-col">
                <span className="text-[9px] text-emerald-700 uppercase font-bold flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-600" /> Overnight Logs
                </span>
                <span className="text-base font-extrabold text-emerald-300 mt-1">
                  {finetuneStatus?.currentLiveCounts?.overnight ?? 0} pairs
                </span>
                <span className="text-[8px] text-emerald-800 mt-0.5">COMPLETE & verified</span>
              </div>

              <div className="bg-[#030303] border border-emerald-950 p-2.5 rounded-lg flex flex-col">
                <span className="text-[9px] text-emerald-700 uppercase font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-600" /> Mind Decisions
                </span>
                <span className="text-base font-extrabold text-emerald-300 mt-1">
                  {finetuneStatus?.currentLiveCounts?.mind ?? 0} pairs
                </span>
                <span className="text-[8px] text-emerald-800 mt-0.5">ADJUDICATOR Approved</span>
              </div>

              <div className="bg-[#030303] border border-emerald-950 p-2.5 rounded-lg flex flex-col">
                <span className="text-[9px] text-emerald-700 uppercase font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-600" /> DNA Master Structs
                </span>
                <span className="text-base font-extrabold text-emerald-300 mt-1">
                  {finetuneStatus?.currentLiveCounts?.dna ?? 0} pairs
                </span>
                <span className="text-[8px] text-emerald-800 mt-0.5">Rank MASTER configs</span>
              </div>
            </div>

            {/* Aggregate Total */}
            <div className="bg-[#040c04]/30 border border-emerald-900/40 p-3.5 rounded-xl flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest block">
                  total jsonl training pairs available
                </span>
                <span className="text-[8px] text-emerald-700 uppercase block mt-0.5">
                  Saved destination: /training_data/ directory
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 text-shadow animate-pulse">
                  {finetuneStatus?.currentLiveCounts?.total ?? 0}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold block">PAIRS INSTALLED</span>
              </div>
            </div>

            {/* Last Run & Path info */}
            <div className="bg-[#030303] border border-emerald-950/60 p-3 rounded-lg text-[10px] text-emerald-750 space-y-2">
              <div className="flex justify-between items-center">
                <span>LAST COLLECTION TIMESTAMP:</span>
                <span className="text-emerald-500 font-bold">{lastRunTime}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span>DATASET DESTINATION PATH:</span>
                <span className="text-emerald-600 font-bold text-right break-all">/training_data/swarm_pairs.jsonl | mind_pairs.jsonl ...</span>
              </div>
              <div className="flex justify-between items-center">
                <span>AGGREGATE PIPELINE ENGINE CYCLE:</span>
                <span className="text-emerald-600 font-bold">INTERVAL 24H [AUTOMATED DAEMON]</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
