import React, { useState, useEffect } from 'react';
import { Network, GitBranch, Cpu, ShieldAlert, Sparkles, Plus, Play, Code } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock agents for the UI
const INITIAL_AGENTS = [
  { id: 'sa-01', name: 'Social Architect', type: 'modeling', focus: 'Behavioral Predictor', status: 'IDLE', performance: 0.92, log: 'Awaiting social dataset.' },
  { id: 'ew-01', name: 'Entanglement Weaver', type: 'simulation', focus: 'Node Network Mapping', status: 'ACTIVE', performance: 0.88, log: 'Mapping group B dynamics.' },
  { id: 'wv-01', name: 'Wealth Vector', type: 'strategy', focus: 'Market Resonance', status: 'ANALYZING', performance: 0.74, log: 'Suboptimal decision-making detected in last cycle. Initiating self-mod.' },
  { id: 'qs-01', name: 'Quantum Strategy', type: 'strategy', focus: 'Probability Engine', status: 'IDLE', performance: 0.96, log: 'Optimal state maintained.' }
];

export default function AutonomousAgents() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [evolutionLog, setEvolutionLog] = useState<string[]>([
    "[SYSTEM] Self-modification module (Darwinian Engine) initialized.",
    "[SYSTEM] Meta-learning principles applied to core OS agents."
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  const selectedData = agents.find(a => a.id === selectedAgent);

  const triggerEvolution = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'EVOLVING' } : a));
    
    setEvolutionLog(prev => [
      ...prev,
      `[${agent.name}] Analyzing past performance logs...`,
      `[${agent.name}] Inefficiencies identified in decision matrix.`,
      `[${agent.name}] Generating hypotheses for algorithm improvements.`
    ]);

    setTimeout(() => {
      setEvolutionLog(prev => [
        ...prev,
        `[${agent.name}] Testing modifications in Docker sandbox container (env: x86_64_isolated)...`,
      ]);
    }, 1500);

    setTimeout(() => {
      const successRate = Math.random() > 0.3; // 70% chance of successful evolution
      if (successRate) {
        setEvolutionLog(prev => [
          ...prev,
          `[${agent.name}] Simulation successful: Faster convergence & reduced entropy achieved.`,
          `[${agent.name}] Integrating changes into core code.`,
          `[${agent.name}] Committing changes via Git version control.`
        ]);
        setAgents(prev => prev.map(a => a.id === agentId ? { 
          ...a, 
          status: 'IDLE', 
          performance: Math.min(0.99, a.performance + 0.05),
          log: 'Core code modified and integrated.' 
        } : a));
      } else {
        setEvolutionLog(prev => [
          ...prev,
          `[${agent.name}] Simulation failed: Negative impact on success probability.`,
          `[${agent.name}] Reverting changes and destroying sandbox container.`
        ]);
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'IDLE', log: 'Evolution hypothesis rejected.' } : a));
      }
    }, 3500);
  };

  const runSocialSimulation = () => {
    setIsSimulating(true);
    setEvolutionLog(prev => [
      ...prev,
      "[LangGraph] Initiating multi-step social scenario modeling...",
      "[Social Architect] Ingesting social physics data and behavior patterns...",
      "[Entanglement Weaver] Simulating cascading effects of node 'Alpha' influence..."
    ]);

    setTimeout(() => {
      setEvolutionLog(prev => [
        ...prev,
        "[Social Architect] Strategy Recommendation: Increase information flow to Node 'Gamma' by 15%.",
        "[Entanglement Weaver] Entanglement mapped: Gamma -> Beta correlation factor 0.82.",
        "[LangGraph] Simulation complete. Probabilities generated."
      ]);
      setIsSimulating(false);
    }, 3000);
  };

  return (
    <div className="flex w-full h-full bg-slate-950 text-slate-200 font-mono overflow-hidden">
      
      {/* Left Panel: Agent Roster */}
      <div className="w-1/3 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
            <Cpu className="w-5 h-5" /> OS Core Agents
          </h2>
          <button className="p-1 hover:bg-slate-800 rounded">
            <Plus className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                selectedAgent === agent.id 
                  ? 'bg-slate-900 border-cyan-500/50' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-100">{agent.name}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  agent.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                  agent.status === 'EVOLVING' ? 'bg-purple-500/20 text-purple-400 animate-pulse' :
                  agent.status === 'ANALYZING' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {agent.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>{agent.focus}</span>
                <span className="text-cyan-400/80">Perf: {(agent.performance * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Agent Details & Sandbox Log */}
      <div className="w-2/3 flex flex-col p-4 bg-[#0a0a0f]">
        
        {/* Agent Inspector */}
        <div className="flex-none h-1/2 mb-4 border border-slate-800 bg-slate-900/40 rounded p-4 flex flex-col">
          {selectedData ? (
            <>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-400" /> {selectedData.name} Details
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => triggerEvolution(selectedData.id)}
                    disabled={selectedData.status === 'EVOLVING'}
                    className="flex items-center gap-1 text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    <GitBranch className="w-3 h-3" /> Trigger Self-Modification
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Architecture Type</div>
                  <div className="text-sm text-slate-300 capitalize">{selectedData.type}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Current Log</div>
                  <div className="text-xs text-amber-400/80 italic">"{selectedData.log}"</div>
                </div>
              </div>

              <div className="mt-auto bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center justify-between">
                  <span>Performance Metric</span>
                  <span className="text-cyan-400">{(selectedData.performance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedData.performance * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-cyan-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Sparkles className="w-8 h-8 mb-2 opacity-50" />
              <p>Select an agent to view diagnostics and trigger evolution.</p>
            </div>
          )}
        </div>

        {/* Global Output Log & LangGraph Actions */}
        <div className="flex-1 border border-slate-800 bg-slate-950 rounded flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-2 border-b border-slate-800 bg-slate-900">
             <div className="flex items-center gap-2 px-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Darwinian Meta-Learning Engine & LangGraph</span>
             </div>
             <button 
                onClick={runSocialSimulation}
                disabled={isSimulating}
                className="flex items-center gap-1 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2 py-1 rounded transition-colors disabled:opacity-50"
             >
                <Play className="w-3 h-3" /> Run Social Physics Sim
             </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-1 font-mono text-[11px]">
            {evolutionLog.map((log, i) => (
              <div key={i} className={`
                ${log.includes('SYSTEM') ? 'text-blue-400' : ''}
                ${log.includes('Testing') || log.includes('Sandbox') ? 'text-amber-400' : ''}
                ${log.includes('successful') || log.includes('Integrating') ? 'text-green-400' : ''}
                ${log.includes('failed') || log.includes('rejected') ? 'text-red-400' : ''}
                ${log.includes('LangGraph') || log.includes('Social Architect') || log.includes('Entanglement Weaver') ? 'text-fuchsia-400' : ''}
                ${!log.match(/SYSTEM|Testing|Sandbox|successful|Integrating|failed|rejected|LangGraph|Social Architect|Entanglement Weaver/) ? 'text-slate-400' : ''}
              `}>
                <span className="opacity-50 select-none mr-2">
                  {new Date().toISOString().substring(11, 19)}
                </span>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
