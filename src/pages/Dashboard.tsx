import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, FileWarning, Clock, Info, Server, Cpu, Database, Flame, Volume2, Orbit, TrendingUp, UserCog, Users, Handshake, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Markdown from 'react-markdown';


type ActivityEvent = {
  id: string;
  type: 'sync' | 'conflict' | 'error' | 'info';
  message: string;
  timestamp: string;
};

export default function Dashboard() {
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([]);
  const [activeConflict, setActiveConflict] = useState<{file: string, localVersion: string, remoteVersion: string} | null>(null);

  const [engineStatus, setEngineStatus] = useState<any>(null);

  // AI Model Settings
  const [aiProvider, setAiProvider] = useState<'gemini' | 'local'>('local');
  const [customBaseUrl, setCustomBaseUrl] = useState('http://localhost:11434');
  const [customModelId, setCustomModelId] = useState('qwen2.5-coder:32b');
  const [huggingFaceToken, setHuggingFaceToken] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const fetchEngineStatus = async () => {
      try {
        const res = await fetch('/api/engine/status');
        const data = await res.json();
        setEngineStatus(data);
      } catch (err) {
        console.warn('Could not fetch engine status', err);
      }
    };
    fetchEngineStatus();

    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

          if (!error && data) {
            if (data.lastSynced) setLastSynced(data.lastSynced);
            if (data.activityLog) setActivityLog(data.activityLog);
            setAiProvider(data.aiProvider || 'local');
            setCustomBaseUrl(data.customBaseUrl || 'http://localhost:11434');
            setCustomModelId(data.customModelId || 'qwen2.5-coder:32b');
            if (data.huggingFaceToken) setHuggingFaceToken(data.huggingFaceToken);
          } else {
            // Write initial defaults to db
            await supabase.from('profiles').upsert({
              id: session.user.id,
              aiProvider: 'local',
              customBaseUrl: 'http://localhost:11434',
              customModelId: 'qwen2.5-coder:32b',
              syncStatus: 'Synced'
            });
          }
        } catch (error) {
          console.warn("Failed to load dashboard data (possibly offline):", error);
        }
      }
    };
    loadData();
  }, []);

  const saveAISettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          aiProvider, 
          customBaseUrl, 
          customModelId,
          huggingFaceToken
        });
        
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
        addActivity('info', `Updated AI Engine settings to use ${aiProvider === 'local' ? 'Local Ollama' : 'Gemini'} model.`);
      } catch (error) {
        console.warn("Failed to save AI settings (possibly offline):", error);
      }
    }
  };

  const addActivity = async (type: ActivityEvent['type'], message: string) => {
    const newEvent: ActivityEvent = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      timestamp: new Date().toLocaleString()
    };
    const updatedLog = [newEvent, ...activityLog].slice(0, 50); // keep last 50
    setActivityLog(updatedLog);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        await supabase.from('profiles').upsert({ id: session.user.id, activityLog: updatedLog });
      } catch (error) {
        console.warn("Failed to save activity log (possibly offline):", error);
      }
    }
  };

  const handleSync = async (resumeProgress = 0) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(resumeProgress);

    if (resumeProgress === 0) {
      addActivity('info', 'Started BANNON asset synchronization.');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      supabase.from('profiles').upsert({ id: session.user.id, syncStatus: 'Pending' }).then();
    }

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        
        // Simulate a conflict roughly 1 in 4 times around 40-60%
        if (prev < 50 && next >= 50 && Math.random() > 0.75) {
          clearInterval(interval);
          setIsSyncing(false);
          setActiveConflict({
            file: 'assets/models/bannon_ring_v2.glb',
            localVersion: 'v2.1.0 (Modified 10 mins ago)',
            remoteVersion: 'v2.1.1 (Modified by remote 2 hours ago)'
          });
          addActivity('conflict', 'Version conflict detected: assets/models/bannon_ring_v2.glb');
          if (session?.user) {
            supabase.from('profiles').upsert({ id: session.user.id, syncStatus: 'In Conflict' }).then();
          }
          return 50;
        }

        if (next >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          const now = new Date().toLocaleString();
          setLastSynced(now);
          if (session?.user) {
            try {
              supabase.from('profiles').upsert({ id: session.user.id, lastSynced: now, syncStatus: 'Synced' }).then();
            } catch (error) {
              console.warn("Failed to save sync time (possibly offline):", error);
            }
          }
          addActivity('sync', 'Successfully synchronized all assets.');
          return 100;
        }
        return next;
      });
    }, 500);
  };

  const resolveConflict = (choice: 'local' | 'remote') => {
    if (activeConflict) {
      addActivity('info', `Resolved conflict for ${activeConflict.file} using ${choice} version.`);
    }
    setActiveConflict(null);
    handleSync(50); // Resume from 50%
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-neutral-400 text-sm mt-1">BANNON Wrestling Game Asset Overview</p>
        </div>
        <button 
          onClick={() => handleSync(0)}
          disabled={isSyncing || activeConflict !== null}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2 rounded-lg font-medium transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Assets'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700">
          <h3 className="text-lg font-semibold mb-2">Total Assets</h3>
          <p className="text-3xl font-bold text-indigo-400">1,204</p>
        </div>
        <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700">
          <h3 className="text-lg font-semibold mb-2">Pending Sync</h3>
          <p className="text-3xl font-bold text-pink-400">{isSyncing ? '0' : '12'}</p>
        </div>
        <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700">
          <h3 className="text-lg font-semibold mb-2">AI Operations</h3>
          <p className="text-3xl font-bold text-green-400">89</p>
        </div>
      </div>

      <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 mb-8 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            GitHub Sync Status 
            {syncProgress === 100 && !isSyncing && <CheckCircle2 className="w-5 h-5 text-green-400" />}
          </h3>
          <span className="text-sm text-neutral-400">
            {lastSynced ? `Last synced: ${lastSynced}` : 'Never synced'}
          </span>
        </div>
        
        <div className="relative w-full h-4 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700">
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-300 ease-out flex items-center justify-end px-2"
            style={{ width: `${Math.min(syncProgress, 100)}%` }}
          >
            {syncProgress > 5 && (
              <span className="text-[10px] font-bold text-white drop-shadow-md">
                {Math.min(syncProgress, 100)}%
              </span>
            )}
          </div>
        </div>
        {isSyncing && (
          <p className="text-sm text-neutral-400 mt-2 animate-pulse">
            Pulling latest assets from Mhvnsnt/Bannon...
          </p>
        )}
      </div>

      {/* Engine Status / Patch Log Overview */}
      {engineStatus && (
        <div className="bg-neutral-800 p-6 rounded-xl border border-indigo-500/30 mb-8 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-indigo-300">Bannon Engine Live Status: {engineStatus.version}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-2">Loaded Federations</h4>
              <div className="flex flex-wrap gap-2">
                {engineStatus.loadedFederations?.map((fed: string) => (
                  <span key={fed} className="bg-indigo-900/40 border border-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-semibold">
                    {fed}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50 max-h-48 overflow-y-auto">
              <div className="prose prose-invert prose-sm">
                <Markdown>{engineStatus.patchLog}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Sequencing Visualizer */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-pink-500/30 mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-semibold text-pink-300">Match Sequencing Visualizer</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-neutral-700 text-pink-500 focus:ring-pink-500 bg-neutral-900" defaultChecked />
              Universe Mode
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-neutral-700 text-pink-500 focus:ring-pink-500 bg-neutral-900" defaultChecked />
              Career Mode
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-neutral-700 text-pink-500 focus:ring-pink-500 bg-neutral-900" defaultChecked />
              Full Show Experience
            </label>
          </div>
        </div>


        <div className="flex overflow-x-auto gap-4 py-4 px-2 snap-x">
          {['Intro Promo', 'Backstage Roam', 'Opening Match', 'Backstage Brawl', 'Midcard Match', 'Main Event Promo', 'Main Event Match', 'Outro Sequence'].map((seg, idx) => (
            <div key={idx} className="snap-center shrink-0 w-48 bg-neutral-900 border border-neutral-700 rounded-lg p-4 flex flex-col items-center justify-center relative group hover:border-pink-500 transition-colors cursor-pointer">
              <div className="absolute -top-3 -right-3 bg-neutral-800 border border-neutral-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 group-hover:bg-pink-600 group-hover:border-pink-400 transition-colors">
                {idx + 1}
              </div>
              <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-transform group-hover:scale-110 ${seg.includes('Match') ? 'bg-indigo-900/50 text-indigo-400' : seg.includes('Backstage') ? 'bg-green-900/50 text-green-400' : 'bg-pink-900/50 text-pink-400'}`}>
                {seg.includes('Match') ? '🥊' : seg.includes('Backstage') ? '🚶' : '🎤'}
              </div>
              <h4 className="font-semibold text-center text-sm">{seg}</h4>
              <p className="text-xs text-neutral-500 mt-2 text-center">
                {seg.includes('Match') ? 'Ring Zone' : seg.includes('Backstage') ? 'Locker Room / Hallway' : 'Stage / Ring'}
              </p>
              
              <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                 <button className="text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded">Edit Segment</button>
                 <button className="text-xs font-bold uppercase tracking-wider text-white bg-neutral-600 hover:bg-neutral-500 px-3 py-1.5 rounded">Toggle Skip</button>
              </div>
            </div>
          ))}
        </div>

      </div>


      {/* Real-Time Engine Monitor */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-indigo-500/30 mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-indigo-300">Real-Time Engine Monitor</h3>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-500/30">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            LIVE
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Character Memory Buffer</h4>
                <div className="font-mono text-xs text-indigo-200">
                    <div><span className="text-neutral-500">Active ID:</span> player_1</div>
                    <div><span className="text-neutral-500">Current Fed:</span> bannon_main</div>
                    <div><span className="text-neutral-500">Morale:</span> 100%</div>
                    <div><span className="text-neutral-500">Fatigue:</span> 0%</div>
                    <div><span className="text-neutral-500">Storyline Flags:</span> {"{ debut: true }"}</div>
                </div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Career State Tracking</h4>
                <div className="font-mono text-xs text-green-200">
                    <div><span className="text-neutral-500">Rank:</span> 100</div>
                    <div><span className="text-neutral-500">Wins/Losses:</span> 0 / 0</div>
                    <div><span className="text-neutral-500">History:</span> Initial Tryout</div>
                    <div><span className="text-neutral-500">Rivalries:</span> 0 Active</div>
                    <div><span className="text-neutral-500">Alliances:</span> 0 Active</div>
                </div>
            </div>
        </div>
      </div>


      {/* Procedural Environment Generation Monitor */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-emerald-500/30 mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-emerald-300">Overpass API Procedural Generator</h3>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FETCHING GEO-NODES
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Data Pipeline (Node.js {'->'} UE5)</h4>
                <div className="font-mono text-xs text-emerald-200">
                    <div><span className="text-neutral-500">Source:</span> https://overpass-api.de</div>
                    <div><span className="text-neutral-500">Target Bounds:</span> [31.95, -83.79] to [31.98, -83.75]</div>
                    <div><span className="text-neutral-500">Parsed Splines:</span> 142 Active Ways</div>
                    <div><span className="text-neutral-500">UE5 PCG Hook:</span> Ready (Awaiting Mesh Spawn)</div>
                </div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">GAS Alignment Check</h4>
                <div className="font-mono text-xs text-green-200">
                    <div><span className="text-neutral-500">Core Brawling:</span> Strict Physical IK (No GAS)</div>
                    <div><span className="text-neutral-500">God Within Mode:</span> GAS Active (Skill Trees)</div>
                    <div><span className="text-neutral-500">Free-Roam Locomotion:</span> ALS-R Bound</div>
                </div>
            </div>
        </div>
      </div>


      {/* Euphoria-Style Active Ragdoll Physics Monitor */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-orange-500/30 mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-orange-300">Active Ragdoll Balance Matrix</h3>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold text-orange-400 bg-orange-900/20 px-2 py-1 rounded border border-orange-500/30">
            DYNAMIC COLLISION
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Entity Physics State</h4>
                <div className="font-mono text-xs text-orange-200">
                    <div><span className="text-neutral-500">Current State:</span> PARTIAL_RAGDOLL</div>
                    <div><span className="text-neutral-500">Center of Mass Offset:</span> 0.65 / 1.0 (Staggering)</div>
                    <div><span className="text-neutral-500">Angular Velocity:</span> 0.22 (Spinning)</div>
                    <div><span className="text-neutral-500">Concussion Factor:</span> 0.45 (Dazed)</div>
                    <div className="w-full bg-neutral-800 h-2 mt-2 rounded overflow-hidden">
                        <div className="bg-orange-500 h-full" style={{ width: '65%' }}></div>
                    </div>
                </div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Impact Event Log</h4>
                <div className="font-mono text-xs text-orange-200">
                    <div><span className="text-neutral-500">[0.0s] Strike Hit:</span> RightLeg</div>
                    <div><span className="text-neutral-500">[0.0s] Force/Mass Ratio:</span> 420.5 N / 105 kg</div>
                    <div><span className="text-neutral-500">[0.1s] Fatigue Mod:</span> 1.4x (Stamina Low)</div>
                    <div><span className="text-neutral-500">[0.2s] Engine Event:</span> Transition to PAC Blend</div>
                </div>
            </div>
        </div>
      </div>


      {/* Procedural Physics & Hit Reaction Monitor */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-orange-500/30 mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-orange-300">Physics: Strike Momentum Matrix</h3>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold text-orange-400 bg-orange-900/20 px-2 py-1 rounded border border-orange-500/30">
            GLANCING BLOW SIMULATOR
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Impact Vector Analysis</h4>
                <div className="font-mono text-xs text-orange-200">
                    <div><span className="text-neutral-500">Attacker Mass:</span> 120kg</div>
                    <div><span className="text-neutral-500">Defender Mass:</span> 85kg</div>
                    <div><span className="text-neutral-500">Mass Ratio:</span> 1.41x (Advantage)</div>
                    <div><span className="text-neutral-500">Trajectory:</span> Off-center (Angle: 0.12)</div>
                </div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Hit Reaction Result</h4>
                <div className="font-mono text-xs text-orange-200">
                    <div><span className="text-neutral-500">Hit Type:</span> <span className="text-yellow-400">GLANCING BLOW</span></div>
                    <div><span className="text-neutral-500">Damage Mult:</span> 0.3x</div>
                    <div><span className="text-neutral-500">Knockback Force:</span> 420N</div>
                    <div><span className="text-neutral-500">Ragdoll State:</span> Safe (Constraint Intact)</div>
                </div>
            </div>
        </div>
      </div>

      {/* Neural AI & Aggression Monitor */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-cyan-500/30 mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-cyan-300">Neural Network AI Logic</h3>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded border border-cyan-500/30">
            BRAWLER PATHFINDING
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Active AI Tendency Profile</h4>
                <div className="font-mono text-xs text-cyan-200">
                    <div><span className="text-neutral-500">Aggression Level:</span> 85% (Relentless)</div>
                    <div><span className="text-neutral-500">Weapon Usage:</span> 20% (Clean Fighter)</div>
                    <div><span className="text-neutral-500">Stamina Pool:</span> 15% (Critical)</div>
                </div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Next Frame Decision</h4>
                <div className="font-mono text-xs text-cyan-200">
                    <div><span className="text-neutral-500">Threat Target:</span> Player_01</div>
                    <div><span className="text-neutral-500">Computed Action:</span> <span className="text-red-400">DEFEND / RETREAT</span></div>
                    <div><span className="text-neutral-500">Reasoning:</span> "Stamina critical. Cowardice trait overriding combat."</div>
                </div>
            </div>
        </div>
      </div>


      {/* Crowd Physics & Interactivity Monitor */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-pink-500/30 mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-semibold text-pink-300">Crowd Entity Engine</h3>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold text-pink-400 bg-pink-900/20 px-2 py-1 rounded border border-pink-500/30">
            DYNAMIC NAVMESH
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Wrestler Proximity (Barricade)</h4>
                <div className="font-mono text-xs text-pink-200">
                    <div><span className="text-neutral-500">Distance to Row 1:</span> 65 cm</div>
                    <div><span className="text-neutral-500">Wrestler State:</span> Airborne (Ragdoll)</div>
                    <div><span className="text-neutral-500">Crowd Cell 04:</span> <span className="text-red-400">FLEEING</span></div>
                </div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Event Logs</h4>
                <div className="font-mono text-xs text-pink-200">
                    <div>&gt;&gt; Crowd member A-14 scrambles out of the way of crashing wrestler!</div>
                    <div className="mt-1">&gt;&gt; Crowd member B-02 passes weapon (Steel Chair) to wrestler!</div>
                </div>
            </div>
        </div>
      </div>

      {/* Contract Negotiation & Economy Monitor */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-yellow-500/30 mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-300">LLM Contract Engine</h3>
          </div>
          <span className="flex items-center gap-2 text-xs font-bold text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/30">
            FEDERATION FINANCES
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Wrestler Leverage State</h4>
                <div className="font-mono text-xs text-yellow-200">
                    <div><span className="text-neutral-500">Superstar:</span> PAC</div>
                    <div><span className="text-neutral-500">Star Power:</span> 92/100</div>
                    <div><span className="text-neutral-500">LLM Tone:</span> <span className="text-yellow-500">Greedy</span></div>
                </div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 border-b border-neutral-700 pb-1">Negotiation Result</h4>
                <div className="font-mono text-xs text-yellow-200">
                    <div><span className="text-neutral-500">Initial Offer:</span> $400k/yr, 15% Merch</div>
                    <div><span className="text-neutral-500">Decision:</span> <span className="text-red-400">REJECTED</span></div>
                    <div><span className="text-neutral-500">Counter:</span> "Counters with $690,000/yr and First Class Travel perk."</div>
                </div>
            </div>
        </div>
      </div>

      {/* Local Infrastructure */}
      <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 mb-8 shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">Local Infrastructure Settings</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAiProvider('gemini')}
              className={`flex-1 py-3 px-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                aiProvider === 'gemini' 
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              <Cpu className="w-6 h-6" />
              <span className="font-medium">Cloud (Gemini)</span>
            </button>
            <button
              onClick={() => setAiProvider('local')}
              className={`flex-1 py-3 px-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                aiProvider === 'local' 
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              <Server className="w-6 h-6" />
              <span className="font-medium">Local (Ollama/OpenRouter)</span>
            </button>
          </div>

          <div className="space-y-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-700/50">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Hugging Face Token
              </label>
              <input 
                type="password" 
                value={huggingFaceToken} 
                onChange={(e) => setHuggingFaceToken(e.target.value)}
                placeholder="hf_..." 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 mb-2" 
              />
              <p className="text-xs text-neutral-500">Required for ZeroGPU instances (like FLUX/Qwen) and image generation models.</p>
            </div>
            
            {aiProvider === 'local' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Local Base URL (e.g., Ollama via ngrok)
                  </label>
                  <input 
                    type="text" 
                    value={customBaseUrl} 
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://yourapp.ngrok.io/v1" 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Model Name (e.g., qwen2.5-coder)
                  </label>
                  <input 
                    type="text" 
                    value={customModelId} 
                    onChange={(e) => setCustomModelId(e.target.value)}
                    placeholder="qwen2.5-coder:32b" 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end items-center gap-3">
            {settingsSaved && <span className="text-sm text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Saved</span>}
            <button 
              onClick={saveAISettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="flex-1 min-h-0 bg-neutral-800 rounded-xl border border-neutral-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-neutral-700 bg-neutral-800/50 flex items-center gap-2 shrink-0">
          <Clock className="w-5 h-5 text-neutral-400" />
          <h3 className="font-semibold">Activity Log</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {activityLog.length === 0 ? (
            <div className="text-center text-neutral-500 py-8">No recent activity.</div>
          ) : (
            activityLog.map(log => (
              <div key={log.id} className="flex gap-3 text-sm bg-neutral-900/50 p-3 rounded-lg border border-neutral-700/50">
                <div className="mt-0.5 shrink-0">
                  {log.type === 'sync' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  {log.type === 'conflict' && <FileWarning className="w-4 h-4 text-pink-400" />}
                  {log.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                  {log.type === 'info' && <Info className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-200">{log.message}</p>
                  <p className="text-neutral-500 text-xs mt-1">{log.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conflict Modal Overlay */}
      {activeConflict && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-neutral-800 bg-pink-900/20 flex items-center gap-3 text-pink-400">
              <FileWarning className="w-6 h-6" />
              <h2 className="text-lg font-bold">Version Conflict Detected</h2>
            </div>
            <div className="p-6">
              <p className="text-neutral-300 mb-4">
                The file <span className="font-mono text-pink-300 bg-pink-900/30 px-1 rounded">{activeConflict.file}</span> was modified both locally and remotely. Please choose which version to keep.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="p-4 rounded-lg border border-indigo-500/30 bg-indigo-900/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-indigo-300">Local Version</span>
                    <span className="text-xs text-indigo-400/70">Your workspace</span>
                  </div>
                  <p className="text-sm text-neutral-400">{activeConflict.localVersion}</p>
                </div>
                
                <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-neutral-300">Remote Version</span>
                    <span className="text-xs text-neutral-500">GitHub (Mhvnsnt/Bannon)</span>
                  </div>
                  <p className="text-sm text-neutral-400">{activeConflict.remoteVersion}</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => resolveConflict('local')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Keep Local
                </button>
                <button 
                  onClick={() => resolveConflict('remote')}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
                >
                  Keep Remote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
