import React, { useState } from 'react';
import { Play, Pause, FastForward, SkipBack, Volume2, Upload, Plus } from 'lucide-react';

import BannonStoryStaging from '../components/BannonStoryStaging';
import JukeboxManager from '../components/JukeboxManager';



export default function UniverseHub() {
    const [activeTab, setActiveTab] = useState<'promotions' | 'match_types' | 'jukebox' | 'booking' | 'politics' | 'medical' | 'story' | 'ontological'>('promotions');
        
    return (
        <div className="w-full h-full bg-neutral-950 text-white flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Bannon Universe Hub</h1>
                    <p className="text-neutral-400">Manage promotions, AI logic, and the M. Heaven$ent Jukebox</p>
                </div>
            </div>

            <div className="flex gap-4 mb-8 border-b border-neutral-800 pb-2 overflow-x-auto scrollbar-none">
                <button 
                    onClick={() => setActiveTab('promotions')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'promotions' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Promotions
                </button>
                <button 
                    onClick={() => setActiveTab('match_types')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'match_types' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Rules
                </button>
                <button 
                    onClick={() => setActiveTab('booking')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'booking' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Booking & Leverage
                </button>
                <button 
                    onClick={() => setActiveTab('politics')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'politics' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Politics & Heat
                </button>
                <button 
                    onClick={() => setActiveTab('medical')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'medical' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Trauma Matrix
                </button>
                <button 
                    onClick={() => setActiveTab('ontological')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'ontological' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Ontological Alignment
                </button>
                <button 
                    onClick={() => setActiveTab('jukebox')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'jukebox' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Jukebox (M. Heaven$ent)
                </button>
                <button 
                    onClick={() => setActiveTab('story')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'story' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Story Engine
                </button>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'promotions' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
                            <h3 className="text-xl font-black text-white mb-2">AWE (American Wrestling Elite)</h3>
                            <p className="text-neutral-400 text-sm mb-4">High-budget, main-stream promotion. Relies heavily on Draw Power and merchandise multipliers.</p>
                            <div className="flex justify-between items-center text-xs">
                                <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded">Budget: $$$</span>
                                <span className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded">Roster: 45</span>
                            </div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
                            <h3 className="text-xl font-black text-white mb-2">JPCW (Japan Pro Combat)</h3>
                            <p className="text-neutral-400 text-sm mb-4">Focuses on high physical output. Poise degradation limits are pushed. Hard-hitting ruleset.</p>
                            <div className="flex justify-between items-center text-xs">
                                <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded">Budget: $$</span>
                                <span className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded">Roster: 32</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'match_types' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold mb-4 text-white">Physics Modifiers</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                    <div>
                                        <p className="font-medium text-white">First Blood</p>
                                        <p className="text-sm text-neutral-400">Match terminates instantly when Laceration threshold hits 100%.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <div>
                                        <p className="font-medium text-white">Iron Man</p>
                                        <p className="text-sm text-neutral-400">Forces Stamina Conservation logic in AI. Poise recovers slower over time.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'booking' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold mb-4 text-white">The Script Torn Decision Matrix</h3>
                            <p className="text-neutral-400 mb-6 text-sm">When live ratings dip, the AI Promoter forces an audible. Choose your response path.</p>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                                    <div className="font-bold text-indigo-400">1. Comply (The Company Man)</div>
                                    <div className="text-xs text-neutral-400 mt-1">Accept forced audible. +Boss Approval, -Heat</div>
                                </div>
                                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                    <div className="font-bold text-red-400">2. Sabotage (The Shoot)</div>
                                    <div className="text-xs text-neutral-400 mt-1">Trigger STATE_SHOOT. -Boss Approval, +Massive Heat, High suspension risk.</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold mb-4 text-white">Cross-Promotion Warfare</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-neutral-800/50 rounded-lg">
                                    <div className="font-bold text-white">Hostile AI Promoters</div>
                                    <div className="text-xs text-neutral-400 mt-1">Rival promoters actively scout and outbid you for top talent.</div>
                                </div>
                                <div className="p-4 bg-neutral-800/50 rounded-lg">
                                    <div className="font-bold text-white">Title Hostaging</div>
                                    <div className="text-xs text-neutral-400 mt-1">Champions with expiring contracts take titles to rival promotions, freezing prestige.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'politics' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold mb-4 text-white">Locker Room Politics & Heat Engine</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-neutral-800/50 rounded-lg border-l-4 border-indigo-500">
                                    <div className="font-bold text-white">Clique Clustering Algorithm</div>
                                    <div className="text-sm text-neutral-400 mt-1">Dynamic factions dictate run-ins, tag teams, and walkouts based on shared alignments.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold mb-4 text-white">Anatomical Wear & Trauma</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-neutral-800/50 rounded-lg">
                                    <div className="font-bold text-white">Persistent Poise Degradation</div>
                                    <div className="text-sm text-neutral-400 mt-1">Repeated concussive trauma permanently lowers poise recovery rate until surgery.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "jukebox" && (
                    <JukeboxManager />
                )}
                
                {activeTab === 'story' && (
                    <BannonStoryStaging />
                )}
            </div>
        </div>
    );
}
