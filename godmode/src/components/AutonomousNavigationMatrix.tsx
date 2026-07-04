import React, { useState } from 'react';
import { 
  Search, X, Zap, Sparkles, Cpu, DollarSign, Orbit, Brain, 
  Activity, Dumbbell, Thermometer, Smartphone, Network, Users, 
  Laptop, Code2, Camera, Database, ShieldAlert, Terminal, 
  Trophy, Clock, Settings, Eye, Wind, Fingerprint
} from 'lucide-react';

interface PortalItem {
  id: string;
  type: 'main' | 'panel';
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface Props {
  onClose: () => void;
  onNavigate: (type: 'main' | 'panel', id: any) => void;
  activeMain: string;
  activePanel: string | null;
}

export function AutonomousNavigationMatrix({ onClose, onNavigate, activeMain, activePanel }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const items: PortalItem[] = [
    // --- MAIN VIEWS ---
    {
      id: 'terminal',
      type: 'main',
      name: 'Quantum Chat & Strategy',
      description: 'Directin the Master Engine and ingestin open source streams with zero friction',
      category: 'core',
      icon: Terminal,
      color: 'text-blue-400 border-blue-500/20 hover:border-blue-400/50'
    },
    {
      id: 'visualizer',
      type: 'main',
      name: 'Kinetic Rig Visualizer',
      description: 'Visualizin active-ragdoll constraints and multi-joint skeletal physics response',
      category: 'core',
      icon: Activity,
      color: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-400/50'
    },
    {
      id: 'omniverse',
      type: 'main',
      name: 'Omniverse Hyper-Structure',
      description: 'Integratin higher spatial dimensions and parallel virtual sandbox spaces',
      category: 'core',
      icon: Sparkles,
      color: 'text-fuchsia-400 border-fuchsia-500/20 hover:border-fuchsia-400/50'
    },
    {
      id: 'apex',
      type: 'main',
      name: 'Apex Core OS',
      description: 'Optimizin absolute mental self-mastery and local structural resources',
      category: 'core',
      icon: ShieldAlert,
      color: 'text-red-400 border-red-500/20 hover:border-red-400/50'
    },
    {
      id: 'abundance',
      type: 'main',
      name: 'Abundance Compiler',
      description: 'Compilein wealth direct vectors and magnetizin external financial resonance',
      category: 'core',
      icon: DollarSign,
      color: 'text-amber-400 border-amber-500/20 hover:border-amber-400/50'
    },
    {
      id: 'quantum_reality',
      type: 'main',
      name: 'Quantum Flow Field',
      description: 'Alignin subatomic states and system telemetry logs for absolute synchronicity',
      category: 'core',
      icon: Orbit,
      color: 'text-purple-400 border-purple-500/20 hover:border-purple-400/50'
    },

    // --- COGNITIVE / BIOLOGICAL PANEL ---
    {
      id: 'metaconscious',
      type: 'panel',
      name: 'Metaconscious Apotheosis',
      description: 'Expandin internal cognitive matrices and transmutin higher thought layers',
      category: 'cognitive',
      icon: Sparkles,
      color: 'text-cyan-300 border-cyan-500/20 hover:border-cyan-300/50'
    },
    {
      id: 'omni_nexus',
      type: 'panel',
      name: 'Omni-Singularity Nexus',
      description: 'Fusein raw dimensional metrics into a unified spatial intelligence grid',
      category: 'cognitive',
      icon: Zap,
      color: 'text-fuchsia-500 border-fuchsia-500/20 hover:border-fuchsia-500/50'
    },
    {
      id: 'neuroplasticity',
      type: 'panel',
      name: 'Neuroplasticity Engine',
      description: 'Hardenin synapse density and optimizin cognitive performance metrics',
      category: 'cognitive',
      icon: Brain,
      color: 'text-cyan-400 border-cyan-500/20 hover:border-cyan-400/50'
    },
    {
      id: 'override',
      type: 'panel',
      name: 'Biological Override Matrix',
      description: 'Monitorin autonomic nervous system stress metabolicHeat and extreme pressure signals',
      category: 'cognitive',
      icon: Activity,
      color: 'text-emerald-500 border-emerald-500/20 hover:border-emerald-500/50'
    },
    {
      id: 'crucible',
      type: 'panel',
      name: 'The Crucible Protocol',
      description: 'Trainin metabolic durability, physical endurance thresholds, and tactical force response',
      category: 'cognitive',
      icon: Dumbbell,
      color: 'text-amber-500 border-amber-500/20 hover:border-amber-500/50'
    },
    {
      id: 'environmental',
      type: 'panel',
      name: 'Environmental Controls',
      description: 'Manipulatin external gravity drag factors and fluid thermodynamic simulation maps',
      category: 'cognitive',
      icon: Wind,
      color: 'text-red-400 border-red-500/20 hover:border-red-400/50'
    },
    {
      id: 'device_sensors',
      type: 'panel',
      name: 'Hardware & Sensor Bridge',
      description: 'Bridgin native GPS coordinates and hardware gyro inputs with pure objectivity',
      category: 'cognitive',
      icon: Smartphone,
      color: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-400/50'
    },

    // --- STRATEGIC & WEALTH PANEL ---
    {
      id: 'sector_matrix',
      type: 'panel',
      name: 'Sector Matrix Hub',
      description: 'Mapin strategic nodes, Life Path 3 resonance, and Soul Urge 1 parameters',
      category: 'strategic',
      icon: Network,
      color: 'text-indigo-400 border-indigo-500/20 hover:border-indigo-400/50'
    },
    {
      id: 'wealth',
      type: 'panel',
      name: 'Kinetic Wealth Engine',
      description: 'Convertin interpersonal attraction parameters into dense wealth assets',
      category: 'strategic',
      icon: DollarSign,
      color: 'text-yellow-500 border-yellow-500/20 hover:border-yellow-500/50'
    },
    {
      id: 'resistance',
      type: 'panel',
      name: 'Kinetic Resistance Matrix',
      description: 'Trackin external friction fields and protectin the integrity of your inner grid',
      category: 'strategic',
      icon: Activity,
      color: 'text-emerald-500 border-emerald-500/20 hover:border-emerald-500/50'
    },
    {
      id: 'resonance',
      type: 'panel',
      name: 'Orbital Resonance System',
      description: 'Mapin high gravity networks and attractin powerful allies or capital streams',
      category: 'strategic',
      icon: Users,
      color: 'text-indigo-300 border-indigo-500/20 hover:border-indigo-300/50'
    },
    {
      id: 'arc_engine',
      type: 'panel',
      name: 'Influence Arc Engine',
      description: 'Launchin electromagnetic attraction loops to dictate real world probability shifts',
      category: 'strategic',
      icon: Orbit,
      color: 'text-fuchsia-400 border-fuchsia-500/20 hover:border-fuchsia-400/50'
    },

    // --- INFRASTRUCTURE & SYNTHESIS ---
    {
      id: 'forge_studio',
      type: 'panel',
      name: 'Forge Studio (IDE)',
      description: 'Compilin and editin system source codes directly in a secure environment',
      category: 'infra',
      icon: Laptop,
      color: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-400/50'
    },
    {
      id: 'code_surgeon',
      type: 'panel',
      name: 'Code Surgeon',
      description: 'Chunk and surgically edit any large HTML/JS file with AI — BANNON, game engines, full codebases',
      category: 'build',
      icon: Code2,
      color: 'text-red-400 border-red-500/20 hover:border-red-400/50'
    },
    {
      id: 'sandbox',
      type: 'panel',
      name: 'Autonomous Sandbox',
      description: 'Testin dangerous algorithms, code payloads, and tracking execution speed loops',
      category: 'infra',
      icon: Code2,
      color: 'text-teal-400 border-teal-500/20 hover:border-teal-400/50'
    },
    {
      id: 'builder',
      type: 'panel',
      name: 'Custom Model Builder',
      description: 'Designin broken no skeleton rigs all the way to intricate DAZ multi-bone structures',
      category: 'infra',
      icon: Cpu,
      color: 'text-amber-500 border-amber-500/20 hover:border-amber-500/50'
    },
    {
      id: 'media_forge',
      type: 'panel',
      name: 'Media Forge & Tensor Node',
      description: 'Synthesizein procedural sound, music, voice, or video streams directly in real time',
      category: 'infra',
      icon: Camera,
      color: 'text-purple-400 border-purple-500/20 hover:border-purple-400/50'
    },
    {
      id: 'sigils',
      type: 'panel',
      name: 'Binary Sigil Manager',
      description: 'Encryptin mystical mathematical equations to lock down localized physics bounds',
      category: 'infra',
      icon: Database,
      color: 'text-cyan-400 border-cyan-500/20 hover:border-cyan-400/50'
    },

    // --- VAULTS, LOGS & OVERSEER ---
    {
      id: 'directives_architect',
      type: 'panel',
      name: 'Prime Architect Directives',
      description: 'Lockin physical actions, targets, and tactical plans into unshakeable logs',
      category: 'admin',
      icon: Trophy,
      color: 'text-yellow-400 border-yellow-500/20 hover:border-yellow-400/50'
    },
    {
      id: 'directives',
      type: 'panel',
      name: 'Directive Vault',
      description: 'Storin raw instructions and executable code fragments for background tasks',
      category: 'admin',
      icon: Terminal,
      color: 'text-indigo-400 border-indigo-500/20 hover:border-indigo-400/50'
    },
    {
      id: 'logs',
      type: 'panel',
      name: 'Action Activity Logs',
      description: 'Trackin live console outputs and sequential telemetry streams devoid of crash loops',
      category: 'admin',
      icon: Database,
      color: 'text-gray-400 border-gray-500/20 hover:border-gray-400/50'
    },
    {
      id: 'memory',
      type: 'panel',
      name: 'Temporal Memory Vault',
      description: 'Loggin index parameters and precompiled SQLite historical records cleanly',
      category: 'admin',
      icon: Clock,
      color: 'text-pink-400 border-pink-500/20 hover:border-pink-400/50'
    },
    {
      id: 'vault',
      type: 'panel',
      name: 'Security Target Vault',
      description: 'Excludin toxic external connections and safe guardin secrets and keys',
      category: 'admin',
      icon: ShieldAlert,
      color: 'text-red-500 border-red-500/20 hover:border-red-505/50'
    },
    {
      id: 'overseer',
      type: 'panel',
      name: 'Overseer Protocol Dashboard',
      description: 'Sanitizein incoming JSON logs to avoid React child errors or telemetry freezes',
      category: 'admin',
      icon: Eye,
      color: 'text-indigo-500 border-indigo-500/20 hover:border-indigo-515/50'
    }
  ];

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col w-full h-full max-w-6xl max-h-[85vh] bg-[#050505]/98 border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex-shrink-0 flex-grow-0 relative overflow-hidden backdrop-blur-xl">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-zinc-900/60 bg-black/40 gap-4 relative z-10">
        <div>
          <h2 className="text-amber-500 font-black tracking-widest text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
            OMNI STRIKE AUTONOMOUS NAVIGATOR
          </h2>
          <p className="text-gray-500 text-[11px] font-mono mt-1 uppercase tracking-wider">
            Teleportin your terminal cleanly between 30 integrated functional channels
          </p>
        </div>
        <button 
          onClick={onClose}
          className="self-end sm:self-center p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 text-gray-400 hover:text-white transition-all border border-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Categories & Search */}
      <div className="p-4 bg-zinc-950/60 border-b border-zinc-900/40 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'core', label: 'Command realities' },
            { id: 'cognitive', label: 'Bio & cognitive' },
            { id: 'strategic', label: 'Wealth & strategic' },
            { id: 'infra', label: 'Code & infra' },
            { id: 'admin', label: 'Vaults & admin' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all border ${
                activeCategory === cat.id 
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                  : 'bg-zinc-900/40 text-gray-400 border-zinc-800/40 hover:text-gray-200'
              }`}
            >
              {cat.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search grid channels..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 text-gray-200 text-xs rounded-lg focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-gray-600 font-mono"
          />
        </div>
      </div>

      {/* Nav Grid */}
      <div className="flex-1 overflow-y-auto p-6 max-h-[55vh] relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center text-center justify-center text-gray-500 font-mono text-xs border border-dashed border-zinc-900 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-amber-500/30 mb-2 animate-bounce" />
            NO RELEVANT MODULE CORES MATCH YOUR SEARCH TERM
          </div>
        ) : (
          filtered.map(item => {
            const Icon = item.icon;
            const isCurrentMain = item.type === 'main' && activeMain === item.id;
            const isCurrentPanel = item.type === 'panel' && activePanel === item.id;
            const isCurrent = isCurrentMain || isCurrentPanel;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.type, item.id)}
                className={`group text-left p-3.5 bg-zinc-950 border rounded-xl flex items-start gap-3 transition-all relative overflow-hidden ${item.color} ${
                  isCurrent ? 'bg-amber-500/5 !border-amber-500/40 shadow-[inner_0_0_10px_rgba(245,158,11,0.05)]' : ''
                }`}
              >
                {/* Active indicator bar */}
                {isCurrent && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" />
                )}

                <div className={`p-2 rounded-lg ${isCurrent ? 'bg-amber-500/10' : 'bg-zinc-900/60 group-hover:bg-zinc-900'} transition-colors shrink-0`}>
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs tracking-wide text-gray-200 group-hover:text-white transition-colors capitalize">
                      {item.name}
                    </span>
                    {item.type === 'main' && (
                      <span className="text-[8px] px-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 uppercase rounded font-mono font-black scale-90">
                        View
                      </span>
                    )}
                    {item.type === 'panel' && (
                      <span className="text-[8px] px-1 bg-purple-500/15 border border-purple-500/30 text-purple-400 uppercase rounded font-mono font-black scale-90">
                        Panel
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors leading-relaxed leading-normal">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Grid footer info */}
      <div className="p-4 bg-black/80 border-t border-zinc-900/60 text-[10px] font-mono text-gray-600 flex justify-between items-center relative z-10">
        <span className="flex items-center gap-1.5">
          <Fingerprint className="w-3.5 h-3.5 text-amber-500/50" />
          PRIME ACCESS NODE DEVOID OF COMPILATION ERROR
        </span>
        <span className="text-gray-500 uppercase tracking-widest text-[9px]">
          [STEREOMATRIX COMPILER LIVE]
        </span>
      </div>
    </div>
  );
}
