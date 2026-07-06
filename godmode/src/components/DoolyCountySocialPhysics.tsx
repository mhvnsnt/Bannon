import React, { useState } from 'react';
import { Network, Users, Brain, Activity } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  influence: number;
  susceptibility: number;
  status: 'idle' | 'interacting' | 'influenced';
}

export default function DoolyCountySocialPhysics() {
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'Agent Alpha', influence: 0.8, susceptibility: 0.2, status: 'idle' },
    { id: '2', name: 'Agent Beta', influence: 0.5, susceptibility: 0.6, status: 'idle' },
    { id: '3', name: 'Agent Gamma', influence: 0.3, susceptibility: 0.9, status: 'idle' },
    { id: '4', name: 'Agent Delta', influence: 0.9, susceptibility: 0.1, status: 'idle' },
  ]);

  const [simulationActive, setSimulationActive] = useState(false);

  const triggerInteraction = () => {
    setSimulationActive(true);
    setAgents(prev => prev.map(agent => ({
      ...agent,
      status: Math.random() > 0.5 ? 'interacting' : 'idle',
      influence: Math.min(1, agent.influence + (Math.random() * 0.1 - 0.05)),
      susceptibility: Math.max(0, agent.susceptibility + (Math.random() * 0.1 - 0.05))
    })));

    setTimeout(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: agent.status === 'interacting' && Math.random() > agent.susceptibility ? 'influenced' : 'idle'
      })));
      setSimulationActive(false);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#030303] text-white font-mono h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 border-b border-[#333] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <Network className="w-6 h-6" />
            Dooly County Social Physics Engine
          </h2>
          <p className="text-gray-400 text-sm mt-1">Controlled Laboratory for Social Interactions & Influence Modeling</p>
        </div>
        <button
          onClick={triggerInteraction}
          disabled={simulationActive}
          className={`px-4 py-2 rounded font-bold transition-all ${simulationActive ? 'bg-gray-700 text-gray-400' : 'bg-emerald-500 hover:bg-emerald-400 text-black'}`}
        >
          {simulationActive ? 'Simulating Interaction...' : 'Trigger Social Event'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {agents.map(agent => (
          <div key={agent.id} className={`p-4 rounded-lg border transition-all duration-500 ${agent.status === 'interacting' ? 'border-amber-500 bg-[#1a1500]' : agent.status === 'influenced' ? 'border-emerald-500 bg-[#001a0a]' : 'border-[#333] bg-[#111]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                {agent.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded ${agent.status === 'idle' ? 'bg-gray-800' : agent.status === 'interacting' ? 'bg-amber-900/50 text-amber-500 animate-pulse' : 'bg-emerald-900/50 text-emerald-500'}`}>
                {agent.status.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Influence Vector</span>
                  <span>{(agent.influence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${agent.influence * 100}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Susceptibility Matrix</span>
                  <span>{(agent.susceptibility * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${agent.susceptibility * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#333] bg-[#0a0a0a] rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-300 flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400" />
            Social Topography Grid
          </h3>
          <div className="flex-1 flex items-center justify-center border border-dashed border-[#222] rounded-lg relative overflow-hidden group">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
             {simulationActive ? (
                <div className="text-center z-10">
                   <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                   <p className="text-amber-500 animate-pulse">Calculating influence ripples...</p>
                </div>
             ) : (
                <p className="text-gray-500 z-10">Grid Stable. Awaiting interaction triggers.</p>
             )}
          </div>
        </div>

        <div className="border border-[#333] bg-[#0a0a0a] rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-300 flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            Predictive Outcome Model
          </h3>
          <div className="flex-1 bg-[#111] border border-[#222] rounded-lg p-4 font-mono text-xs text-gray-400 overflow-y-auto space-y-2">
            <div className="text-emerald-500">&gt; INITIALIZING DOOLY COUNTY PARAMETERS...</div>
            <div>&gt; BASELINE POPULATION ISOLATION: HIGH</div>
            <div>&gt; NETWORK DENSITY: LOW</div>
            <div>&gt; INFLUENCE PROPAGATION RATE: ~0.45</div>
            {simulationActive && (
              <div className="text-amber-400 animate-pulse">&gt; INJECTING STIMULUS. OBSERVING BEHAVIORAL SHIFTS...</div>
            )}
            {agents.filter(a => a.status === 'influenced').map(a => (
              <div key={a.id} className="text-pink-400">&gt; NODE SHIFT DETECTED: {a.name} succumbed to primary influence vector.</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
