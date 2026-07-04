import React, { useState } from 'react';
import { Network, History, Share2, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';

export const MultiverseTimelineGrid = () => {
    const [selectedTimeline, setSelectedTimeline] = useState<number | null>(null);

    // Mock branching timelines
    const timelines = [
        { id: 1, probability: 98.4, name: "Alpha Baseline (Current)", drift: "+0.0", events: ["Core stability achieved", "WASM compression online"] },
        { id: 2, probability: 14.2, name: "Gamma Divergence", drift: "-12.4", events: ["Aggressive logic pruning", "UI simplification", "High entropy"] },
        { id: 3, probability: 67.8, name: "Sigma Resonance", drift: "+4.5", events: ["Dreamweaver optimization", "React Suspense heavily utilized", "Density +4%"] }
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6">
            <div className="bg-[#0c0c0f] border border-indigo-900/50 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black opacity-40 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10 w-full">
                    <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                        <Network className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg tracking-widest flex items-center gap-2">
                           MULTIVERSE TIMELINE GRID 
                           <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 uppercase">Phase 6 Active</span>
                        </h3>
                        <p className="text-xs text-indigo-400/80 mt-1 uppercase tracking-wider">Markov chain simulation mapping +weeks into divergent probabilistic codebases.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {timelines.map((tl) => (
                    <motion.div
                        key={tl.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: tl.id * 0.1 }}
                        onClick={() => setSelectedTimeline(tl.id)}
                        className={`cursor-pointer border rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all \${selectedTimeline === tl.id ? 'bg-indigo-950/20 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.15)]' : 'bg-[#050508] border-indigo-900/30 hover:border-indigo-700/50'}`}
                    >
                        {selectedTimeline === tl.id && (
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                        )}
                        <div className="flex justify-between items-start z-10 relative">
                            <span className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-indigo-400" /> {tl.name}
                            </span>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded \${tl.probability > 50 ? 'bg-indigo-950 text-indigo-300' : 'bg-rose-950 text-rose-300'}`}>
                                {tl.probability}% P
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-2 mt-2 z-10 relative">
                            {tl.events.map((ev, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] text-indigo-200/60 font-mono">
                                    <div className="w-1 h-1 rounded-full bg-indigo-600" />
                                    {ev}
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-4 border-t border-indigo-900/30 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-indigo-500 z-10 relative">
                            <span>Drift Variance</span>
                            <span>{tl.drift}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            {/* Simulation Canvas area */}
            <div className="bg-[#050508] border border-indigo-900/30 rounded-xl min-h-[300px] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e51a_1px,transparent_1px),linear-gradient(to_bottom,#4f46e51a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
                
                {selectedTimeline ? (
                    <div className="text-center z-10 font-mono flex flex-col items-center gap-3">
                        <History className="w-10 h-10 text-indigo-400 animate-pulse" />
                        <h4 className="text-indigo-300 text-sm font-bold uppercase tracking-widest">
                            Projecting Data for {timelines.find(t => t.id === selectedTimeline)?.name}
                        </h4>
                        <p className="text-xs text-indigo-500/80 max-w-md">Running local Markov chains to simulate 10,000 architectural decisions. Awaiting collision metrics.</p>
                        
                        <button className="mt-4 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/50 px-6 py-2 rounded uppercase text-[10px] font-bold tracking-widest transition-all">
                            Merge Future State
                        </button>
                    </div>
                ) : (
                    <div className="text-indigo-900/50 uppercase tracking-widest text-sm font-bold z-10">
                        Select a timeline to view collision metrics
                    </div>
                )}
            </div>
        </div>
    );
};
