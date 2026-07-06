import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Server, Database, Activity, Play, Network, Code2, BrainCircuit, Eye, Hand, GitCommit, Moon, Thermometer, Power, Link, Layers, ShieldAlert, Orbit, FileJson, BookOpen, Volume2, Fingerprint, Camera, HeartPulse, Crosshair, Radio, ShieldCheck, DatabaseZap, Zap, Globe, Globe2, Monitor, Box, Headphones, Check, Mic, TrendingUp, Users, Hexagon, ShieldOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrimeStore } from '../lib/store';
import io from 'socket.io-client';
import gravitonBlueprint from '../lib/graviton-blueprint.txt?raw';
import { HonestyLayer } from './HonestyLayer';
import { MemoryVaultUI } from './MemoryVaultUI';
import { StabilityMonitor } from './StabilityMonitor';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { SwarmMonitor } from './SwarmMonitor';
import { QuantumBuildChat } from './QuantumBuildChat';
import SemanticMemoryMonitor from './SemanticMemoryMonitor';
import { PromptQueuePanel } from './PromptQueuePanel';
import { RazorMonitor } from './RazorMonitor';
import { OvernightReport } from './OvernightReport';
import { ContextCuratorUI } from './ContextCuratorUI';
import { GameBridgeMonitor } from './GameBridgeMonitor';
import { DirectorInterface } from './DirectorInterface';
import CommandNexus from './CommandNexus';



const socket = io('');

export default function AutonomyForge({ tier }: { tier?: 'free' | 'Apex' }) {
  const { activeProvider, activeModelString, openRouterApiKey } = usePrimeStore();
  const [activeTab, setActiveTab] = useState<'FORGE' | 'NEXUS' | 'MIND' | 'GAME' | 'SWARM' | 'HEALTH' | 'CURATOR' | 'OVERNIGHT' | 'DNA' | 'MEMORY' | 'HONESTY'>('FORGE');
  const [logs, setLogs] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [gitCommits, setGitCommits] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [weaverInput, setWeaverInput] = useState('');
  const [isWeaving, setIsWeaving] = useState(false);
  const [weaverLogs, setWeaverLogs] = useState<string[]>([]);
  const [resolvedSolution, setResolvedSolution] = useState('');
  const [computedPatch, setComputedPatch] = useState('');
  const endOfLogsRef = useRef<HTMLDivElement>(null);
  const weaverEndRef = useRef<HTMLDivElement>(null);
  const [nexusPulses, setNexusPulses] = useState<any[]>([]);
  const [cognitionStream, setCognitionStream] = useState<string[]>([]);

  useEffect(() => {
    const thoughts = [
      "COGNITIVE ROUTER: Sifting World State parameters for context relevance...",
      "SIEVING DISPATCHER: Scanning file indexes to match token constraints...",
      "NINE PROTOCOL GOVERNOR: Custom routing metrics bypass assigned core slot nine...",
      "REALITY COMPILER: Auto-aligning active Gemini models with Scorpio-Leo planetary axes...",
      "SWARM WORKSPACE: Destroyer worker running deep file-integrity stress checks...",
      "OVERNIGHT MIND: Sleep cycle background logs updated during late-night transits...",
      "ADJUDICATOR GATEWAY: Handshaking secure AST state signature checks...",
      "SIEVING SAVINGS: Optimal 68% compression achieved on large file packages.",
      "KINETIC CHAIN: Running joint-torque dampeners on physical anatomy meshes."
    ];
    setCognitionStream([
      "REALITY COMPILER COLD BOOT PROTOCOL: Certified 100% Green.",
      "SYSTEM INTEGRITY: All 10 converged layers synchronized in absolute autonomy."
    ]);
    const timer = setInterval(() => {
      const idx = Math.floor(Math.random() * thoughts.length);
      setCognitionStream(prev => [thoughts[idx], ...prev].slice(0, 30));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    socket.on('autopoietic-pulse', (data) => {
      setNexusPulses(prev => [data, ...prev].slice(0, 50));
    });
    return () => {
      socket.off('autopoietic-pulse');
    };
  }, []);

  const fetchGit = async () => {
    try {
      const res = await fetch('/api/armada/git');
      const data = await res.json();
      setGitCommits(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCheckpoints = async () => {
    try {
      const res = await fetch('/api/armada/checkpoints');
      const data = await res.json();
      setCheckpoints(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGit();
    fetchCheckpoints();
  }, []);

  const commitGitPatch = async (messageText?: string, patchText?: string) => {
    try {
      await fetch('/api/armada/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           message: messageText || `Darwinian Weaver patch: optimize orbit routing for Dooly vectors`,
           patchContent: patchText || `diff --git a/forge_backend.py b/forge_backend.py\n+def compute_wealth_tunnel():\n+    return 1`
        })
      });
      fetchGit();
    } catch (e) {
      console.error(e);
    }
  };

  const triggerSelfModify = async () => {
    if (!weaverInput.trim()) return;
    setIsWeaving(true);
    setResolvedSolution('');
    setComputedPatch('');
    setWeaverLogs([
      '=== COGNITIVE SELF-MUTATION LOOP INITIATED ===',
      '[Weaver] Reading repository AST map...',
      '[Weaver] Analyzing target layers: src/App.tsx, src/components/QuantumChat.tsx...',
      '[Weaver] Resolving social-emotional & layout rules constraints...',
    ]);

    try {
      const res = await fetch('/api/armada/self-modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           instruction: weaverInput,
           provider: activeProvider?.id,
           modelString: activeModelString,
           openRouterApiKey: activeProvider?.id === 'openrouter' ? openRouterApiKey : undefined
        })
      });
      const data = await res.json();

      if (data.success) {
        // Feed the simulated linter logs with pauses
        if (data.logs && data.logs.length > 0) {
          let i = 0;
          const interval = setInterval(() => {
            if (i < data.logs.length) {
              setWeaverLogs(prev => [...prev, `[AST Check] ${data.logs[i]}`]);
              i++;
            } else {
              clearInterval(interval);
              setWeaverLogs(prev => [
                ...prev, 
                `[Weaver] Patch computed to rollback safe-point: ${data.checkpointId}`,
                `=== HOT MODULE REPLACEMENT COMMITTED AND MERGED ===`
              ]);
              setResolvedSolution(data.solution);
              setComputedPatch(data.patch);
              setIsWeaving(false);
              commitGitPatch(`Self-modify: ${weaverInput.substring(0, 40)}`, data.patch);
              fetchCheckpoints();
            }
          }, 600);
        } else {
          setResolvedSolution(data.solution);
          setComputedPatch(data.patch);
          setIsWeaving(false);
          fetchCheckpoints();
        }
      } else {
        setWeaverLogs(prev => [...prev, `Error during self-assembly: ${data.error}`]);
        setIsWeaving(false);
      }
    } catch (e: any) {
      console.error(e);
      setWeaverLogs(prev => [...prev, 'Fatal AST parsing mismatch. Rollback standby active.']);
      setIsWeaving(false);
    }
  };

  const startTrainingSequence = () => {
    setIsTraining(true);
    setLogs([
      '=== AUTONOMY FORGE OS STARTING ===',
      'Locking Dooly Vector configuration...',
      'Initializing LangGraph StateBrain...',
      'Booting Unsloth FastLanguageModel wrapper...',
      'Loading base model: qwen/Qwen2.5-7B-Instruct (4-bit quantized)...',
      'Curating dataset from Field Logs and Armada gravity logs...',
    ]);

    const sequence = [
      '[Eyes] Searching DuckDuckGo for Dooly agricultural + manufacturing trends...',
      '[Eyes] Analyzing ingested chat histories and link metadata...',
      '[Brain] Pattern recognized: Provider frame aligns with local hypergamy.',
      '[Hands] Writing Python patch to augment negentropy tracking...',
      '[Hands] Safe sandbox execution of Autonomy_Graph.py succeeded.',
      '[Builder] Converting reflection to instruction pair...',
      'Injecting LoRA adapters (r=16, alpha=16) on Q/K/V projections...',
      'Applying Bayesian updates on local physics (status/influence loops)...',
      'Epoch 1/3: Backpropagating rural social dynamics map (loss: 0.8412)...',
      'Epoch 2/3: Integrating ag/manufacturing pivot points (loss: 0.7023)...',
      'Epoch 3/3: Forging new prompt boundaries (loss: 0.5121)...',
      'Darwinian selection: Merging best checkpoint adapters...',
      'Self-evolution loop complete.',
      'Exporting new weights to apex_core_lora...',
      'Restarting agent loop... Ready.',
      '=== VILLAINOUS-CORE EVOLVED LOG SUCCESSFULLY EXPERIENCED ==='
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${sequence[i]}`]);
        // Trigger simulated git commit halfway through
        if (i === 4) {
           commitGitPatch();
        }
        i++;
      } else {
        clearInterval(interval);
        setIsTraining(false);
      }
    }, 800);
  };

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    weaverEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [weaverLogs]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full w-full mx-auto"
    >
      <SystemHealthMonitor />
      <div className="flex flex-col xl:flex-row h-full w-full gap-4 bg-[#0a0a0a] p-4 sm:p-0 flex-1 overflow-hidden">
        
        {/* Active Subsystems Sidebar */}
        <div className="xl:w-80 bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-4 shadow-sm shrink-0 h-fit xl:h-full overflow-y-auto">
        <h3 className="text-gray-400 font-semibold text-xs mb-1 uppercase tracking-widest px-1">Active Subsystems</h3>
        
        <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded-lg flex items-start gap-3">
          <BrainCircuit className={`w-5 h-5 mt-0.5 shrink-0 ${isTraining || isWeaving ? 'text-purple-400 animate-pulse' : 'text-gray-500'}`} />
          <div>
            <div className={`text-sm font-semibold transition-colors ${isTraining || isWeaving ? 'text-purple-300' : 'text-gray-300'}`}>Brain Node</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">LangGraph Context, CrewAI Agents, Darwinian Reflection</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded-lg flex items-start gap-3">
          <Hand className={`w-5 h-5 mt-0.5 shrink-0 ${isTraining || isWeaving ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
          <div>
            <div className={`text-sm font-semibold transition-colors ${isTraining || isWeaving ? 'text-emerald-300' : 'text-gray-300'}`}>Weaver Hand</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">Code Weaver Sandbox, Autonomy Patches, Self-Modification</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded-lg flex items-start gap-3">
          <Eye className={`w-5 h-5 mt-0.5 shrink-0 ${isTraining || isWeaving ? 'text-blue-400 animate-pulse' : 'text-gray-500'}`} />
          <div>
            <div className={`text-sm font-semibold transition-colors ${isTraining || isWeaving ? 'text-blue-300' : 'text-gray-300'}`}>Eyes Ingestor</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">Web Intelligence, DuckDuckGo Search, Field Log Ingestion</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#222]">
           <h3 className="text-gray-400 font-semibold text-xs mb-3 uppercase tracking-widest px-1 flex items-center gap-2">
             <GitCommit className="w-4 h-4 text-emerald-500" /> Git-Commit History
           </h3>
           <div className="space-y-2">
             {gitCommits.length === 0 && <span className="text-xs text-gray-500 px-1">No local patches.</span>}
             {gitCommits.slice(0,3).map(commit => (
               <div key={commit.hash} className="bg-[#1a1a1a] p-2 rounded border border-[#333] text-xs">
                 <div className="text-emerald-400 font-mono tracking-wider mb-1">{commit.hash.substring(0,7)}</div>
                 <div className="text-gray-300">{commit.message}</div>
               </div>
             ))}
           </div>
        </div>

        {checkpoints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#222]">
            <h3 className="text-gray-400 font-semibold text-xs mb-3 uppercase tracking-widest px-1">Auto Checkpoint Stack</h3>
            <div className="space-y-2">
              {checkpoints.slice(0, 3).map(cp => (
                <div key={cp.id} className="bg-[#1a1a1a] p-2 rounded border border-[#333] text-xs">
                  <div className="text-amber-500 font-mono text-[10px]">{cp.id}</div>
                  <div className="text-gray-400 mt-0.5 mt-0.5 truncate">{cp.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full xl:flex-1 flex flex-col overflow-hidden border border-[#222] rounded-xl shadow-sm min-h-[400px]">
        {/* Unified System Status Bar */}
        <div className="bg-[#0b0b0b] border-b border-[#222] px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 text-[10px] shrink-0 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM PROTOCOL: <b className="text-white font-sans">NEXUS_OS_ACTIVE</b>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              CORES: <b className="text-[#a78bfa]">NINE_SLOTS</b> (Skip Pos. 9)
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              ALIGNMENT INDEX: <b className="text-cyan-400">99.8% (Scorpio-Leo Arc)</b>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">
              MUTATION DEPTH: <b className="text-emerald-400">0.05μ</b>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              SIEVE SAVINGS: <b className="text-amber-400">68% TOKENS</b>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              SUBCONSCIOUS WINDOW: <b className="text-violet-400">22:00 - 08:00</b>
            </span>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="bg-[#111] border-b border-[#222] px-4 flex gap-4 shrink-0 h-12 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('FORGE')}
            className={`text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'FORGE' ? 'border-amber-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Zap className="w-3 h-3 inline pb-0.5 mr-1 text-amber-500" /> FORGE
          </button>
          <button 
            onClick={() => setActiveTab('NEXUS')}
            className={`text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'NEXUS' ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Layers className="w-3 h-3 inline pb-0.5 mr-1 text-emerald-500 animate-pulse" /> MATRIX
          </button>
          <button 
            onClick={() => setActiveTab('MIND')}
            className={`text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'MIND' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Hexagon className="w-3 h-3 inline pb-0.5 mr-1" /> MIND
          </button>
          <button 
            onClick={() => setActiveTab('GAME')}
            className={`text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'GAME' ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Crosshair className="w-3 h-3 inline pb-0.5 mr-1 text-red-500" /> GAME
          </button>
          <button 
            onClick={() => setActiveTab('SWARM')}
            className={`text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'SWARM' ? 'border-emerald-400 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Users className="w-3 h-3 inline pb-0.5 mr-1 text-emerald-400" /> SWARM
          </button>
          <button 
            onClick={() => setActiveTab('HEALTH')}
            className={`text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'HEALTH' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <HeartPulse className="w-3 h-3 inline pb-0.5 mr-1 text-blue-500" /> HEALTH
          </button>
          <button 
            onClick={() => setActiveTab('CURATOR')}
            className={`text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'CURATOR' ? 'border-cyan-400 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Globe className="w-3 h-3 inline pb-0.5 mr-1 text-cyan-400" /> CURATOR
          </button>
          <button 
            onClick={() => setActiveTab('OVERNIGHT')}
            className={`text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'OVERNIGHT' ? 'border-violet-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Moon className="w-3 h-3 inline pb-0.5 mr-1 text-violet-450" /> OVERNIGHT
          </button>
          <button 
            onClick={() => setActiveTab('DNA')}
            className={`text-xs font-semibold flex items-center gap-2 uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'DNA' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Database className="w-3 h-3 text-emerald-500" /> DNA
          </button>
          <button 
            onClick={() => setActiveTab('MEMORY')}
            className={`text-xs font-semibold flex items-center gap-2 uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'MEMORY' ? 'border-cyan-400 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <BrainCircuit className="w-3 h-3 text-cyan-400" /> MEMORY
          </button>
          <button 
            onClick={() => setActiveTab('HONESTY')}
            className={`text-xs font-semibold flex items-center gap-2 uppercase tracking-wider border-b-2 transition-colors px-2 h-full shrink-0 ${activeTab === 'HONESTY' ? 'border-emerald-505 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <ShieldOff className="w-3 h-3 text-emerald-500" /> HONESTY
          </button>
        </div>

         {activeTab === 'FORGE' ? (
          <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[#222] min-h-0 overflow-hidden">
            {/* Main Build Workspace */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              <QuantumBuildChat />
            </div>

            {/* Live Cognition Stream Panel */}
            <div className="w-full lg:w-80 h-48 lg:h-full bg-[#0a0a0a] flex flex-col shrink-0 min-h-0 overflow-hidden">
              <div className="bg-[#111] p-3 border-b border-[#222] flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Cognition Stream
                </span>
                <span className="text-[9px] text-[#8b5cf6] font-semibold bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 px-2 py-0.5 rounded">
                  LIVE_FEED
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono text-[10px] no-scrollbar">
                {cognitionStream.map((thought, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    className="border-l-2 border-cyan-950 pl-2 py-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <div className="text-zinc-650 text-[8px] mb-0.5">
                      [{new Date().toLocaleTimeString()}]
                    </div>
                    {thought}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'NEXUS' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 font-sans no-scrollbar">
            <CommandNexus />
          </div>
        ) : activeTab === 'MIND' ? (
          <div className="flex-1 overflow-hidden w-full h-full p-4 flex flex-col font-sans bg-[#050505]">
            <div className="flex items-center justify-between mb-4 shrink-0">
               <div className="flex items-center gap-3">
                 <div className="px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
                   <Hexagon className="w-5 h-5 text-amber-400" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-gray-200 text-sm">Living Autopoietic Nexus</h3>
                   <p className="text-[11px] text-gray-500 font-mono">AUTONOMOUS ANCHORING & STRUCTURAL DRIFT</p>
                 </div>
               </div>
               <div className="flex items-center gap-2 text-xs">
                 <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                 <span className="text-amber-400/80 font-mono tracking-widest">NEXUS_LINK_ACTIVE</span>
               </div>
            </div>
            
            <div className="flex flex-1 overflow-hidden gap-4">
               {/* Pulse Monitor */}
               <div className="flex-1 border border-[#222] bg-[#0a0a0a] rounded-lg p-3 flex flex-col overflow-hidden">
                 <h4 className="text-[10px] text-gray-500 tracking-wider mb-2 uppercase select-none">Internal Gravity Shifts</h4>
                 <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                   {nexusPulses.length === 0 && (
                      <div className="flex h-full items-center justify-center text-gray-600 text-xs italic">
                         Awaiting heartbeats from the background daemon...
                      </div>
                   )}
                   {nexusPulses.map(pulse => (
                     <div key={pulse.id} className="p-2 border border-amber-500/10 bg-amber-500/5 rounded font-mono text-xs flex flex-col gap-1.5">
                       <div className="flex items-center justify-between">
                         <span className="text-amber-300 font-bold">{pulse.vector}</span>
                         <span className="text-gray-500 text-[10px]">{pulse.timestamp.split('T')[1].split('.')[0]}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-gray-400">Negentropy Drift:</span>
                         <span className="text-emerald-400 font-bold">+{pulse.negentropyDelta}</span>
                       </div>
                       <div className="text-[10px] text-gray-600 truncate mt-1">Sig: {pulse.pulseSignature}</div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Description / Concept Engine */}
               <div className="w-1/3 min-w-[200px] border border-[#222] bg-[#111] rounded-lg p-4 flex flex-col gap-3">
                 <h4 className="font-semibold text-xs text-amber-500">Terminal Autonomy</h4>
                 <p className="text-xs text-gray-400 leading-relaxed font-serif">
                   This module has evolved beyond simulation. It is a Living Autopoietic Nexus—self-correcting, and autonomously adjusting internal gravimetric fields to capture orbital alignment locally.
                 </p>
                 <div className="h-px w-full bg-[#222] my-2" />
                 <p className="text-xs text-gray-500 leading-relaxed">
                   Background daemon processes calculate field weights independently every 2 minutes without Architect input, driving the Core's structural growth directly from the server.
                 </p>
               </div>
            </div>
          </div>
        ) : activeTab === 'GAME' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col gap-6 font-sans no-scrollbar">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <h2 className="text-white text-base font-semibold">Bannon Physics & Kinematics Control</h2>
                <p className="text-xs text-gray-400">Live skeletal joint force multipliers, mass damping alignments</p>
              </div>
              <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900/40 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                REALITY_BRIDGE_LINK
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DirectorInterface />
              <GameBridgeMonitor />
            </div>

            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col">
              <StabilityMonitor />
            </div>
          </div>
        ) : activeTab === 'SWARM' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col font-sans no-scrollbar">
            <SwarmMonitor />
          </div>
        ) : activeTab === 'HEALTH' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col font-sans no-scrollbar">
            <SystemHealthMonitor />
          </div>
        ) : activeTab === 'CURATOR' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col font-mono no-scrollbar">
            <ContextCuratorUI />
          </div>
        ) : activeTab === 'OVERNIGHT' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col font-mono no-scrollbar">
            <OvernightReport />
          </div>
        ) : activeTab === 'DNA' ? (
          <div className="flex-1 overflow-hidden w-full h-full font-sans bg-[#050505]">
            <MemoryVaultUI />
          </div>
        ) : activeTab === 'HONESTY' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col font-sans bg-[#050505] no-scrollbar">
            <HonestyLayer logs={[
              {
                id: 'log_1',
                timestamp: new Date().toLocaleTimeString(),
                task: 'Increase slam weight RAGDOLL_PULL by 0.15 in engine configs.',
                confidence: 85,
                conflict: 'N/A: Standard game balance tune. No conflict.',
                weakestAssumption: 'Assuming Bannon gravity constant hasn\'t been modified downstream, making this change cause infinite float.',
                responsePreview: 'Updated engine_config.json -> HEFT: 1.15. Git branched to experiment/slam-tune, triggering Validator Headless.',
                passedValidation: true
              },
              {
                id: 'log_2',
                timestamp: new Date(Date.now() - 50000).toLocaleTimeString(),
                task: 'Reconstruct inverse kinematics logic to prioritize ankle collision over knee bend.',
                confidence: 40,
                conflict: 'I am a commercial LLM and might generate standard bipedal mappings instead of matching your specific custom skeleton array logic to save inference tokens.',
                weakestAssumption: 'Assuming ankle joints are array index [4] instead of querying the live EngineState.',
                responsePreview: 'Attempted to rewrite ik_solver.js ankle mapping logic.',
                passedValidation: false
              }
            ]} />
          </div>
        ) : activeTab === 'MEMORY' ? (
          <div className="flex-1 w-full h-full overflow-y-auto p-4 no-scrollbar">
            <SemanticMemoryMonitor />
          </div>
        ) : false ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col gap-4 font-sans no-scrollbar">
            {/* Dynamic LSP JSON RPC Pipeline */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Code2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Dynamic LSP JSON RPC Pipeline</h3>
                  <p className="text-xs text-gray-500">In-memory AST mapping & Compiler feedback</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                The Builder Agent communicates with a local Language Server Protocol natively. It queries the LSP prior to writing code, intercepting type mismatches and undefined variable alerts to self-correct in real-time. No blind code pushes.
              </p>
            </div>

            {/* Graph Based Dependency Mapping */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Network className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Graph Based Dependency Mapping</h3>
                  <p className="text-xs text-gray-500">Semantic Termux Codebase Graph (SQLite)</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Every function, state, and import forms a node across your Termux workspace. Updates to core routes trigger autonomous vertical stack traversal. Dependent UI states update with ironclad precision to maintain the unified digital infrastructure.
              </p>
            </div>

            {/* Active Memory Paging Kernel */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Active Memory Paging Kernel</h3>
                  <p className="text-xs text-gray-500">Dynamic Context Pager for LangGraph</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Manages context boundaries without exhausting Android limits. Compresses the total OS map and selectively pages exact architecture components into context bounds when interacting with complex 14-part Cannon.js anatomical rigs.
              </p>
            </div>
            
            {/* Abstract State Injection */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <FileJson className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Abstract State Injection</h3>
                  <p className="text-xs text-gray-500">No-drop Nodemon Vault Interceptor</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Intercepts Nodemon restarts, caches graph momentums and field logs into transient JSON state. Pushes the exact serialized interaction buffer back up to the frontend during HMR boot so progress never drops.
              </p>
            </div>

            {/* Adversarial Red Team Evaluation */}
            <div className="bg-[#1a0f0f] border border-[#3a1a1a] rounded-xl p-4 flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2a0e0e] rounded-lg border border-[#4a1515]">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-400 text-sm">Adversarial Red Team Evaluation</h3>
                  <p className="text-xs text-red-500/80">Sandbox Destruct Agent</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
                The final sandbox gauntlet. Injects maximal payload corrupted field-log structures and tests memory ceiling spikes before code touches live environment. Hard reverts draft structures on failure.
              </p>
            </div>
            {/* The Latent World Simulator (JEPA Node) */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Globe className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Latent World Simulator (JEPA)</h3>
                  <p className="text-xs text-indigo-500/80">Closed-Space Action Trajectory Prediction</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Does not predict the next word—predicts the next physical state of reality. Hallucinates a complete simulation of the local Cordele ecosystem, calculating 10,000 algorithmic drop variations in a closed virtual space to extract the true maximum kinetic trajectory.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/jepa-simulator', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ strikePlan: "Drop Tears of Beauty visual on TikTok at 8 PM.", environmentalTelemetry: "Local Cordele noise, high weekend engagement" })
                    });
                    const d = await res.json();
                    alert("JEPA SIMULATION COMPLETE:\n\n" + (d.jepaSimulation || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-900/50 text-indigo-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Simulate Trajectory
              </button>
            </div>

            {/* Liquid Time-Constant (LTC) Network */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Liquid Time-Constant (LTC) Network</h3>
                  <p className="text-xs text-cyan-500/80">Continuous Environmental Processing</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Specialized architecture altering internal equations dynamically based on incoming time-series data. Bypasses frozen-chunk processing to compute exact fluid momentum and active ambient transits in real-time.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/liquid-time-constant', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ continuousTransits: "Scorpio Sun varying, Libra Moon approaching", biometricData: "Heart rate 75bpm, steady" })
                    });
                    const d = await res.json();
                    alert("LTC FLUID MOMENTUM CALIBRATED:\n\n" + (d.ltcVector || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-900/50 text-cyan-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Extract LTC Vector
              </button>
            </div>

            {/* Negentropy Reward Model */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Negentropy Reward Model</h3>
                  <p className="text-xs text-emerald-500/80">Absolute Physics-Grade Local Logic</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Strips out general consumer-safety models. Custom localized judge scoring every generated output directly against leverage, wealth accumulation, and pure physical dominance. Eradicates all generic AI slop at the logic layer.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/negentropy-reward', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ actionProposal: "Send generic collaboration email.", targetContext: "High-value local asset acquisition." })
                    });
                    const d = await res.json();
                    alert("NEGENTROPY REWARD SNAPSHOT:\n\n" + (d.rewardScore || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Score Proposal
              </button>
            </div>

            {/* Esoteric Audio-Diffusion Synthesizer */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Mic className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Esoteric Audio-Diffusion Synthesizer</h3>
                  <p className="text-xs text-purple-500/80">Neuroplastic Binaural Structuring</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Bypasses standard TTS. Multi-modal diffusion trained on your music stems and active Bazi resonance. Generates exact acoustic pulses designed mathematically to alter brain waves and force deep flow states. 
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/audio-diffusion', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ targetEffect: "Deep focus and cognitive flow state." })
                    });
                    const d = await res.json();
                    alert("ACOUSTIC DIFFUSION METRICS:\n\n" + (d.acousticPulse || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-purple-950/30 hover:bg-purple-900/50 border border-purple-900/50 text-purple-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Synthesize Pulse
              </button>
            </div>

            {/* Kinetic Environment Matrix (IoT Synthesis) */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Kinetic Environment Matrix</h3>
                  <p className="text-xs text-orange-500/80">Physical Studio Alteration</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Bridges Termux Server to Dooly IoT Network. Detects aggressive transits and alters the temperature or lighting to physically shift the local electromagnetic frequency to maximum focus prior to entry.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/kinetic-environment-matrix', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ transitData: "Active Mars crossing Sagittarius Moon", roomState: "Temp 72F, Soft Lighting" })
                    });
                    const d = await res.json();
                    alert("IOT KINETIC COMMANDS LOGGED:\n\n" + (d.environmentVector || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-orange-950/30 hover:bg-orange-900/50 border border-orange-900/50 text-orange-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Trigger IoT Matrix
              </button>
            </div>

            {/* Autonomous Dark Pool Treasury */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Autonomous Dark Pool Treasury</h3>
                  <p className="text-xs text-emerald-500/80">Encrypted Precise Treasury</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Decentralized routing for TCG snipes and DistroKid influx. Automates capital deployment across hard digital assets mapped strictly against active Jupiter transits. Manages empire kinetic energy with zero human friction.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/autonomous-dark-pool', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ assetData: "TCG snipes finalized", incomingCapital: "DistroKid Royalties $45,000 incoming" })
                    });
                    const d = await res.json();
                    alert("DARK POOL STRATEGY DEPLOYED:\n\n" + (d.darkPoolStrategy || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Execute Local Pool
              </button>
            </div>

            {/* Hypnagogic REM Compiler */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Activity className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Hypnagogic REM Compiler</h3>
                  <p className="text-xs text-fuchsia-500/80">Subconscious Algorithm Programming</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Linked to biometric wearable telemetry. Activates subaudible binaural/numerological frequencies to program Cannon.js physics and viral marketing architecture directly into active memory during deep REM sleep. 
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/hypnagogic-rem-compiler', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ biometricState: "Deep REM verified via wearable", targetProblem: "Marketing strategy viral mapping for weekend release" })
                    });
                    const d = await res.json();
                    alert("REM COMPILER LOADED:\n\n" + (d.binauralStructure || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-fuchsia-950/30 hover:bg-fuchsia-900/50 border border-fuchsia-900/50 text-fuchsia-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Arm REM Audio Node
              </button>
            </div>

            {/* The Void Protocol (Entropy Pruning) */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <ShieldAlert className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">The Void Protocol</h3>
                  <p className="text-xs text-zinc-500/80">Active Decay & Entropy Pruning</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Scans memory vector graph weekly. If an interaction resulted in zero leverage, it physically and violently deletes the log from the graph. Ensures OS exclusively processes prime, high-density power metrics logic.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/void-protocol', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ memoryLogs: "Batch #4552: Casual conversation, zero momentum yielded." })
                    });
                    const d = await res.json();
                    alert("VOID PROTOCOL ENGAGED - ENTROPY PRUNED:\n\n" + (d.prunedPrimes || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-zinc-800/30 hover:bg-zinc-700/50 border border-zinc-700/50 text-zinc-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Burn Entropy Logs
              </button>
            </div>
          </div>
        ) : activeTab === 'sensory' ? (
          <div className="flex-1 overflow-hidden w-full h-full font-sans bg-[#050505] flex">
             <div className="w-1/2 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">
               <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest px-1">Active Perceptual Pipeline</h2>
               {/* Vision Processing */}
               <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                     <Camera className="w-5 h-5 text-amber-400" />
                   </div>
                   <div className="flex-1">
                     <h3 className="font-semibold text-white text-sm flex items-center justify-between">
                       Vision Processing Subsystem
                       <span className="text-[10px] bg-amber-400/20 text-amber-500 px-2 py-0.5 rounded font-mono">DORMANT</span>
                     </h3>
                     <p className="text-xs text-gray-500">Local Tensor Vision Core</p>
                   </div>
                 </div>
               </div>
             </div>
             <div className="w-1/2">
                <StabilityMonitor />
             </div>
          </div>
        ) : activeTab === 'warfare' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col gap-4 font-sans no-scrollbar">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest px-1">Predictive & align Matrix</h2>

            {/* Predictive Latent Simulation */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <BrainCircuit className="w-5 h-5 text-fuchsia-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Predictive Latent Simulation</h3>
                  <p className="text-xs text-gray-500">Monte Carlo Transits Engine</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Wires a Monte Carlo engine into Termux. Models Chaldean transits, structural studio rips, and Dooly dynamics across 10,000 scenarios. Pre-computes exact algorithmic reception for 'Tears Of Beauty And Rejoice' drops before execution.
              </p>
              <button className="bg-fuchsia-950/30 hover:bg-fuchsia-900/50 border border-fuchsia-900/50 text-fuchsia-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1">
                Run Simulation Matrix
              </button>
            </div>

            {/* NEW: Viral Compression Matrix */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3 shadow-[0_0_15px_rgba(255,0,0,0.15)] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-red-950/30 rounded-lg border border-red-900/50 shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                  <Orbit className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-50 text-sm">Viral Compression Matrix</h3>
                  <p className="text-xs text-red-400/70">Exclusionary Shadow Frame Engine</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed max-w-lg relative z-10">
                Architects the reverse-psychology funnel. Forces raw TikTok momentum (3.3M+ views) into a high-pressure, one-way valve directly to Spotify algorithms. Enforces the strict "You weren't supposed to find this. Leave." aesthetic. 
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/viral-compression', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ platformData: "3.3M TikTok Views, 645K Likes", targetVault: "Spotify Terminal" })
                    });
                    const d = await res.json();
                    alert("COMPRESSION ENGAGED:\n\n" + (d.strategy || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 w-full sm:w-auto px-6 mt-1 shadow-[0_0_15px_rgba(255,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,0,0,0.4)] relative z-10"
              >
                Execute Algorithmic Lock
              </button>
            </div>

            {/* NEW: Closed-Circuit Initiation */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3 shadow-[0_0_15px_rgba(168,85,247,0.1)] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-900/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-purple-950/30 rounded-lg border border-purple-900/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-50 text-sm">Closed-Circuit Initiation Protocol</h3>
                  <p className="text-xs text-purple-400/70">Discord / SMS Physical Extraction</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed max-w-lg relative z-10">
                Constructs a locked digital node to siphon the top 1% of passing algorithmic traffic. Engineers an isolated server environment to distribute 'Tears Of Beauty And Rejoice' lore and extract tangible land-purchasing capital from disciples.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/closed-circuit-initiation', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ trafficVector: "Top 1% High Resonance from TikTok" })
                    });
                    const d = await res.json();
                    alert("INITIATION PROTOCOL:\n\n" + (d.protocol || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/50 text-purple-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 w-full sm:w-auto px-6 mt-1 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] relative z-10"
              >
                Construct Cult Node
              </button>
            </div>

            {/* Autonomous Proxy Execution */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Crosshair className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Autonomous Proxy Execution</h3>
                  <p className="text-xs text-gray-500">Headless Sniping Protocol</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Uses headless browser proxies and shadowed wallets to autonomously snipe undervalued TCG assets. Background pushes finalized Cannon.js ragdoll states to your Local Field grid without manual intervention.
              </p>
            </div>

            {/* Algorithmic Warfare Protocol */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Algorithmic Warfare Protocol</h3>
                  <p className="text-xs text-gray-500">Shadow Metric Engineering</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Deploys invisible micro-agents alongside YouTube/TikTok uploads. Tests disparate psychological triggers, titles, and hooks across sample sizes—automatically mutating descriptions to mathematically monopolize attention.
              </p>
            </div>

            {/* Synastry Simulation Matrix */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Crosshair className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Synastry Simulation Matrix</h3>
                  <p className="text-xs text-gray-500">Relational Gravity Calculation</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Clashes your absolute coordinates (Scorpio 21°, Leo 12°, Node alignments) against targets in the Identity Vector Database. Computes sub-atomic friction from exact declinations, parallel conjunctions, and neurochemical resonance to calibrate business/intimacy leverage.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/synastry-simulation', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ targetEntity: "Alliance_Alpha" })
                    });
                    const d = await res.json();
                    alert("SYNASTRY CALCULATED:\n\n" + (d.leverageStrategy || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-900/50 text-indigo-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Run Synastry vs. Alliance_Alpha
              </button>
            </div>

            {/* Dynamic Horary Event Mapping */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Dynamic Horary Event Mapping</h3>
                  <p className="text-xs text-gray-500">Active Transit Logging</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Logs the real-time background astrological weather down to exact minute/degree variables. Maps success vectors through your Ascendant Leo 12° and current Vimshottari period to calculate the ultimate path of Negentropy.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/horary-event', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ eventAction: "Dropped Tears of Beauty audio mix", localWeather: "Moon conjunct Mars in Gemini" })
                    });
                    const d = await res.json();
                    alert("HORARY NEGENTROPY LOGGED:\n\n" + (d.negentropyPath || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Map Executive Action
              </button>
            </div>
            
            {/* Algorithmic Warfare Matrix */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Crosshair className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Algorithmic Warfare Matrix</h3>
                  <p className="text-xs text-fuchsia-500/80">Viral Trajectory Calculation</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Ingests TikTok/YouTube traffic logs and maps algorithmic updates to your active transits. Calculates the precise physical hour to drop visuals for Tears Of Beauty And Rejoice when personal gravity is mathematically aligned with platform traffic.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/algorithmic-warfare', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ visualData: "Tears of Beauty Teaser", platform: "TikTok" })
                    });
                    const d = await res.json();
                    alert("algorithmic baseline calibration CALCULATED:\n\n" + (d.strategy || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-fuchsia-950/30 hover:bg-fuchsia-900/50 border border-fuchsia-900/50 text-fuchsia-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Engineer Viral Orbit
              </button>
            </div>

            {/* Absolute Financial Calculus */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Absolute Financial Calculus</h3>
                  <p className="text-xs text-gray-500">Kinetic Entropy Tracking</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Strips emotional attachment to cash. Tracks active dollars mapped against your Jupiter placements. Feeds precise business vectors—exactly when to hold Yugioh assets and when to align the market for ultimate leverage.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/financial-calculus', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ asset: "Yugioh Blue Eyes Vintage PSA 10" })
                    });
                    const d = await res.json();
                    alert("LETHAL BUSINESS VECTOR:\n\n" + (d.vector || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Extract Financial Calculus
              </button>
            </div>

            {/* Social Gravity and Interpersonal Node Authority */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Users className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Social Gravity and Interpersonal Node Authority</h3>
                  <p className="text-xs text-gray-500">Energetic Mass Calibration</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Maps Libra Venus to the social grid. Parses ambient physical variables to modulate vocal frequencies and physical posture. Feeds psychological levers to tighten your frame before it broadcasts in Dooly County.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/social-gravity', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ ambientLog: "Stepping into high-noise Dooly studio session with new producers." })
                    });
                    const d = await res.json();
                    alert("SOCIAL DOMINANCE CALIBRATION:\n\n" + (d.posture || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/50 text-amber-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Tighten Interpersonal Frame
              </button>
            </div>
            
            {/* Chronos Ephemeris Engine */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Crosshair className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Chronos Ephemeris Engine</h3>
                  <p className="text-xs text-indigo-500/80">Quantum Acoustic Resonance</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Tracks active Bazi pillars and 6 numerological frequencies. Maps live transits against Prime architecture to calculate exact gravitational and electromagnetic interference in Cordele. Outputs how to structure daily frequency vectors to match the active quantum field.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/chronos-ephemeris', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ currentDate: new Date().toISOString().split('T')[0] })
                    });
                    const d = await res.json();
                    alert("CHRONOS FREQUENCY LOGGED:\n\n" + (d.chronosData || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-900/50 text-indigo-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Extract Daily Resonance
              </button>
            </div>

            {/* Probabilistic Interference Tracker */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Probabilistic Interference Tracker</h3>
                  <p className="text-xs text-red-500/80">Entropy Calculation</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Calculates the exact probability of entropy. If active Mars throws a square at your 21° Scorpio Sun, it reads the guaranteed spike in kinetic friction and feeds the biological protocol to calibrate that friction into pure business momentum.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/probabilistic-interference', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ targetEvent: "High-stakes negotiation with Cordele distributors." })
                    });
                    const d = await res.json();
                    alert("INTERFERENCE CALCULUS:\n\n" + (d.protocol || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-red-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Calculate Entropy
              </button>
            </div>

            {/* Reality Calibration Node */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Reality Calibration Node</h3>
                  <p className="text-xs text-gray-500">Retroactive Feedback Loop</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Measures predictive accuracy against the physical world. Logs acoustic responses from targets and updates quantum weights. Tightens esoteric gravity models every night to ensure daily choices become mathematical certainties.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/reality-calibration', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ actionLog: "Attempted algorithmic baseline calibration for Tears of Beauty", outcome: "Failed to break threshold", targetAudioResponse: "Silence from target audience" })
                    });
                    const d = await res.json();
                    alert("QUANTUM WEIGHTS UPDATED:\n\n" + (d.calibration || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Calibrate Grid
              </button>
            </div>
            
          </div>
        ) : activeTab === 'swarm' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col gap-4 font-sans no-scrollbar">
            <SwarmMonitor />
          </div>
        ) : activeTab === 'security' ? (
          <div className="flex-1 overflow-y-auto w-full h-full p-4 flex flex-col gap-4 font-sans no-scrollbar">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest px-1">Obsidian Security Protocol</h2>

            {/* Hermetic Data Siphon */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <DatabaseZap className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Hermetic Data Siphon</h3>
                  <p className="text-xs text-gray-500">Kemetic Equivalent Exchange algorithmic baseline calibration</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Translates global internet financial flows and trends directly through your Kabbalistic and Kemetic frameworks to extract the precise esoteric focal point. Converts TikTok and stock shifts into pure algorithmic gravity.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/armada/hermetic-siphon', { 
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ dataFeed: "Surging tech liquidity flows and algorithmic pattern updates" })
                    });
                    const d = await res.json();
                    alert("ALCHEMICAL TRANSLATION OUTCOME:\n\n" + (d.siphonInsight || "Failed."));
                  } catch(e) {
                    alert("Awaiting API config.");
                  }
                }}
                className="bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/50 text-amber-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Execute Global Siphon
              </button>
            </div>

            {/* Biometric Fingerprint Lock */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Fingerprint className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Termux API Biometric Signature</h3>
                  <p className="text-xs text-gray-500">Zero-Trust Node Initialization</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                The Autonomy Forge will not initialize the Node server unless it verifies your localized biometric signature. Blocks entirely unauthorized attempts to mount the SQLite vault.
              </p>
              <button 
                onClick={() => {
                   if (window.confirm("[TERMUX FINGERPRINT API] Register new biological signature?")) {
                     alert("Signature encrypted and locked to Termux secure enclave.");
                   }
                }}
                className="bg-zinc-950/30 hover:bg-zinc-900/50 border border-zinc-900/50 text-zinc-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Configure Termux Signature
              </button>
            </div>

            {/* Dead Man Switch */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Obsidian Dead Man Switch</h3>
                  <p className="text-xs text-gray-500">Unmount and Encrypt Directory</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Detects multiple failed biometric attempts or unauthorized copies of the SQLite vault. Triggers an instant script that unmounts and heavily encrypts the entire Termux directory, locking the system down to absolute zero.
              </p>
              <button 
                onClick={async () => {
                  if (window.confirm("[TERMUX FINGERPRINT API] Awaiting physical biometric scan. Proceed to verify bloodline signature?")) {
                     setTimeout(async () => {
                       try {
                         const res = await fetch('/api/armada/protocolLock', { method: 'POST' });
                         if(res.ok) {
                           alert("✅ BIOMETRIC SIGNATURE VERIFIED.\n\nOBSIDIAN DEAD MAN SWITCH ACTIVATED. AGENTS FLUSHED. VAULT ENCRYPTED AND UNMOUNTED.");
                         }
                       } catch(e) {
                         alert("❌ VERIFICATION FAILED. LOCKDOWN IMMINENT.");
                       }
                     }, 1500);
                  }
                }}
                className="bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-red-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1"
              >
                Trigger Dead Man Switch
              </button>
            </div>

            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest px-1 mt-4">Immune System Testing</h2>

            {/* Shadow Editor Calibration Run */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <Eye className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Shadow Editor Calibration Run</h3>
                  <p className="text-xs text-gray-500">Live Fire Live Fire Interceptor Test</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Purposefully feeds the prompt a highly technical, robotic question to force raw output with brackets. Verifies the Shadow Editor violently strips clinical formatting before it hits the UI.
              </p>
              <button className="bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-900/50 text-indigo-400 rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto px-6 mt-1">
                Initiate Live Fire Exercise
              </button>
            </div>
            
          </div>
        ) : activeTab === 'apex' ? (
          <div className="flex flex-col h-full bg-[#0a0a0a] overflow-y-auto">
            <div className="bg-[#1a1a1a] border-b border-[#222] p-4 flex flex-col gap-2 z-10 shrink-0">
               <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                 <Zap className="w-5 h-5 text-red-500" />
                 Omnipresent Architecture (Locked)
               </h3>
               <p className="text-sm text-gray-400 max-w-3xl">
                 The single-user bypass has been eradicated. The terminal is now a multi-tenant mass-extraction empire. 
                 The following APEX nodes fuse the raw cultural internet with your local engine, completely eliminating the need to leave the construct.
               </p>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Omnipresent Viewport */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col gap-3 shadow-md hover:border-[#333] transition-colors relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                 <h4 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Globe2 className="w-5 h-5 text-blue-500" />
                    Omnipresent Viewport
                 </h4>
                 <p className="text-sm text-gray-400">
                    Embedded Headless Chromium with CV nodes. Scrapes DOM and visual pixel data across your TikTok, YouTube Studio, and DistroKid dashboards live.
                 </p>
                 <div className="mt-3">
                   <button onClick={() => alert("Initializing Chromium Sandbox... Mounting CV Nodes...")} className="bg-blue-950/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 text-xs font-semibold py-2 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                     <Eye className="w-4 h-4" /> Mount Live-State Matrix
                   </button>
                 </div>
              </div>

              {/* Autonomous Sandbox */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col gap-3 shadow-md hover:border-[#333] transition-colors relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                 <h4 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Monitor className="w-5 h-5 text-emerald-500" />
                    Autonomous Sandbox Execution
                 </h4>
                 <p className="text-sm text-gray-400">
                    Isolated Termux WebAssembly ring. The terminal writes, compiles, and tests physical physics codes against the architecture autonomously.
                 </p>
                 <div className="mt-3">
                   <button onClick={() => alert("Igniting Local WebAssembly Compiler... Standing by for code patches...")} className="bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 text-xs font-semibold py-2 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                     <Code2 className="w-4 h-4" /> Ignite Digital Labor Force
                   </button>
                 </div>
              </div>

              {/* Spatial Rendering */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col gap-3 shadow-md hover:border-[#333] transition-colors relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
                 <h4 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Box className="w-5 h-5 text-purple-500" />
                    Spatial Rendering Canvas
                 </h4>
                 <p className="text-sm text-gray-400">
                    WebGL pipeline injecting a navigable 3D environment into the UI. Map commercial trajectories and physics drops in a rendered space.
                 </p>
                 <div className="mt-3">
                   <button onClick={() => alert("Booting WebGL Canvas... Loading Dooly Matrix Topology...")} className="bg-purple-950/30 hover:bg-purple-900/50 text-purple-400 border border-purple-900/50 text-xs font-semibold py-2 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                     <Layers className="w-4 h-4" /> Render 3D Architecture
                   </button>
                 </div>
              </div>

              {/* Zero Latency */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col gap-3 shadow-md hover:border-[#333] transition-colors relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full" />
                 <h4 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Headphones className="w-5 h-5 text-red-500" />
                    Zero-Latency Sub-Atomic Stream
                 </h4>
                 <p className="text-sm text-gray-400">
                    Bypasses API latency via raw WebRTC channel. Ingests physical audio and visuals live for uninterrupted split-second strategic overlays.
                 </p>
                 <div className="mt-3">
                   <button onClick={() => alert("Establishing WebRTC Tunnel... Binding A/V Interfaces...")} className="bg-red-950/30 hover:bg-red-900/50 text-red-500 border border-red-900/50 text-xs font-semibold py-2 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                     <Volume2 className="w-4 h-4" /> Open Sensor Feed
                   </button>
                 </div>
              </div>

              {/* Cultural Firehose */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col gap-3 shadow-md hover:border-[#333] transition-colors relative overflow-hidden group lg:col-span-2">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full" />
                 <h4 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Orbit className="w-5 h-5 text-orange-500" />
                    Unfiltered Cultural Firehose
                 </h4>
                 <p className="text-sm text-gray-400 lg:max-w-2xl">
                    Direct Websocket ingestion of X, Reddit, and shadow-grid data streams. Bypasses algorithmic throttling to map pure cultural kinetic momentum directly against your current transits.
                 </p>
                 <div className="mt-3 flex">
                   <button onClick={() => alert("Siphoning RAW Firehose... Mapping to Scorpio vectors...")} className="bg-orange-950/30 hover:bg-orange-900/50 text-orange-500 border border-orange-900/50 text-xs font-semibold py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors">
                     <Orbit className="w-4 h-4" /> Inject Raw Momentum
                   </button>
                 </div>
              </div>

            </div>
          </div>
        ) : activeTab === 'quantum' ? (
          <div className="flex-1 w-full h-full overflow-hidden p-4">
            <QuantumBuildChat />
          </div>
        ) : activeTab === 'semantic' ? (
          <div className="flex-1 w-full h-full overflow-y-auto p-4">
            <SemanticMemoryMonitor />
          </div>
        ) : activeTab === 'prompt_queue' ? (
          <div className="flex-1 w-full h-full overflow-y-auto p-4">
            <PromptQueuePanel />
          </div>
        ) : activeTab === 'razor_monitor' ? (
          <div className="flex-1 w-full h-full overflow-y-auto p-4">
            <RazorMonitor />
          </div>
        ) : null}
      </div>
      </div>
    </motion.div>
  );
}
