import React, { useState } from 'react';
import { Orbit, Plus, Cpu, Trash2, Power, Settings2, Activity, Play, Square, Code2 } from 'lucide-react';

interface LocalAgent {
    id: string;
    name: string;
    model: string;
    status: 'idle' | 'running' | 'training' | 'offline';
    directive: string;
    metrics: { iterations: number, successRate: number };
}

export default function AutonomousAgents() {
    const [agents, setAgents] = useState<LocalAgent[]>([
        { id: '1', name: 'Scorpio-01', model: 'llama3:8b', status: 'idle', directive: 'Crawl local filesystem for exposed env variables.', metrics: { iterations: 1420, successRate: 98.4 } },
        { id: '2', name: 'Oracle-Node', model: 'phi3:instruct', status: 'running', directive: 'Parse incoming unarchived logs and extract deterministic patterns.', metrics: { iterations: 84432, successRate: 91.2 } }
    ]);
    const [showCreate, setShowCreate] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: '', model: 'llama3:8b', directive: '' });

    const handleCreate = () => {
        if (!newAgent.name) return;
        setAgents([...agents, {
            id: crypto.randomUUID(),
            name: newAgent.name,
            model: newAgent.model,
            status: 'idle',
            directive: newAgent.directive,
            metrics: { iterations: 0, successRate: 0 }
        }]);
        setShowCreate(false);
        setNewAgent({ name: '', model: 'llama3:8b', directive: '' });
    };

    const toggleStatus = (id: string) => {
        setAgents(agents.map(a => {
            if (a.id === id) {
                return { ...a, status: a.status === 'running' ? 'idle' : 'running' };
            }
            return a;
        }));
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
            <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#111]">
                <div className="flex items-center gap-2">
                    <Orbit className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-semibold tracking-wide">Autonomous Agents</h2>
                </div>
                <button 
                  onClick={() => setShowCreate(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs px-3"
                >
                    <Plus className="w-4 h-4" /> Instantiate
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                 {/* Background Grid */}
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    {agents.map(agent => (
                        <div key={agent.id} className="bg-[#111] border border-[#333] rounded-xl p-4 flex flex-col hover:border-emerald-500/50 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-200 flex items-center gap-2">
                                        <Cpu className={`w-4 h-4 ${agent.status === 'running' ? 'text-emerald-400' : 'text-gray-500'}`} />
                                        {agent.name}
                                    </h3>
                                    <span className="text-xs font-mono text-gray-500 bg-[#222] px-2 py-0.5 rounded-full mt-1 inline-block">{agent.model}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => toggleStatus(agent.id)} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-emerald-400 transition-colors">
                                        {agent.status === 'running' ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    </button>
                                    <button className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-blue-400 transition-colors">
                                        <Settings2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setAgents(agents.filter(a => a.id !== agent.id))} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-xs text-gray-400 bg-[#0a0a0a] p-2 rounded mb-4 font-mono h-12 overflow-hidden text-ellipsis line-clamp-2">
                                <span className="text-emerald-500 font-bold">{'>'}</span> {agent.directive || 'No prime directive set.'}
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[#222] pt-3 text-xs">
                                <div className="flex items-center gap-1 text-gray-400">
                                   <Activity className="w-3 h-3" /> 
                                   <span className="font-mono">{agent.metrics.iterations.toLocaleString()} iter</span>
                                </div>
                                <div className="flex items-center justify-end gap-1 text-gray-400">
                                   <Code2 className="w-3 h-3" /> 
                                   <span className="font-mono text-emerald-400">{agent.metrics.successRate.toFixed(1)}% SR</span>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>

                 {agents.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-48 text-gray-500 relative z-10">
                         <Orbit className="w-12 h-12 mb-2 opacity-50" />
                         <p>No autonomous agents active in the local grid.</p>
                     </div>
                 )}
            </div>

            {showCreate && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-[#111] border border-[#333] rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-400"/> Instantiate ICE Agent</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Agent Designation</label>
                                <input 
                                    type="text" 
                                    value={newAgent.name}
                                    onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none placeholder-gray-600"
                                    placeholder="e.g., Hunter-Killer-01"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Local Core Engine</label>
                                <select 
                                    value={newAgent.model}
                                    onChange={e => setNewAgent({...newAgent, model: e.target.value})}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="llama3:8b">llama3:8b (Ollama)</option>
                                    <option value="llama3:70b">llama3:70b (Ollama)</option>
                                    <option value="mistral:v0.3">mistral:v0.3 (Ollama)</option>
                                    <option value="phi3:instruct">phi3:instruct (Ollama)</option>
                                    <option value="huggingface:custom">hf:custom (HuggingFace)</option>
                                    <option value="gpt-4o-local-mock">gpt-4o-micro (Local Bridge)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Prime Directive</label>
                                <textarea 
                                    value={newAgent.directive}
                                    onChange={e => setNewAgent({...newAgent, directive: e.target.value})}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none placeholder-gray-600 font-mono h-24"
                                    placeholder="Define the autonomous operational vector..."
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowCreate(false)} className="flex-1 bg-[#222] hover:bg-[#333] text-white p-2 rounded transition-colors text-sm font-semibold">Cancel</button>
                                <button onClick={handleCreate} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded transition-colors text-sm font-semibold">Deploy Agent</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
