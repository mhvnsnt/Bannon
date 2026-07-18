import React, { useState } from 'react';
import { Play, Pause, FastForward, SkipBack, Volume2, Upload, Plus } from 'lucide-react';

const M_HEAVENSENT_TRACKS = [
    { id: '1', title: 'Bannon Theme (Main Event)', duration: '3:45', type: 'menu' },
    { id: '2', title: 'Walk Into The Fire', duration: '4:12', type: 'entrance' },
    { id: '3', title: 'The Last Drive', duration: '3:50', type: 'game' },
    { id: '4', title: 'Shattered Glass', duration: '2:45', type: 'entrance' },
    { id: '5', title: 'Crown of Thorns', duration: '4:05', type: 'menu' },
    { id: '6', title: 'Blood on the Canvas', duration: '3:30', type: 'game' },
    { id: '7', title: 'No Surrender', duration: '3:15', type: 'entrance' },
    { id: '8', title: 'Liontamer', duration: '4:20', type: 'menu' },
    { id: '9', title: 'Iron Will', duration: '3:40', type: 'game' },
    { id: '10', title: 'Fallen Angels', duration: '5:00', type: 'entrance' },
    { id: '11', title: 'Concrete Jungle', duration: '3:25', type: 'menu' },
    { id: '12', title: 'The Shoot', duration: '2:55', type: 'game' },
    { id: '13', title: 'Forbidden Door', duration: '4:10', type: 'entrance' },
    { id: '14', title: 'Sabotage', duration: '3:18', type: 'menu' },
    { id: '15', title: 'Barricade', duration: '3:45', type: 'game' },
    { id: '16', title: 'Regional Heat', duration: '3:33', type: 'entrance' },
    { id: '17', title: 'Smark Tears', duration: '2:50', type: 'menu' },
    { id: '18', title: 'Sabotage II', duration: '4:05', type: 'game' },
    { id: '19', title: 'The Rub', duration: '3:15', type: 'entrance' },
    { id: '20', title: 'Sabotage III', duration: '3:40', type: 'menu' },
    { id: '21', title: 'Endgame (Cosmic)', duration: '5:15', type: 'victory' }
];

export default function UniverseHub() {
    const [activeTab, setActiveTab] = useState<'promotions' | 'match_types' | 'jukebox' | 'booking' | 'politics' | 'medical'>('promotions');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(M_HEAVENSENT_TRACKS[0]);

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
                    onClick={() => setActiveTab('jukebox')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${activeTab === 'jukebox' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Jukebox (M. Heaven$ent)
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

                {activeTab === 'jukebox' && (
                    <div className="flex flex-col lg:flex-row gap-8 h-full">
                        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">M. Heaven$ent Master Tapes</h2>
                                    <p className="text-neutral-400 text-sm mt-1">Dynamic Engine Streaming Pipeline</p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium">
                                    <Upload className="w-4 h-4" />
                                    Import Tracks
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {M_HEAVENSENT_TRACKS.map((track) => (
                                    <div 
                                        key={track.id}
                                        onClick={() => {
                                            setCurrentTrack(track);
                                            setIsPlaying(true);
                                        }}
                                        className={`group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                                            currentTrack.id === track.id 
                                                ? 'bg-indigo-500/10 border border-indigo-500/30' 
                                                : 'hover:bg-neutral-800/50 border border-transparent'
                                        }`}
                                    >
                                        <div className="w-8 flex justify-center">
                                            {currentTrack.id === track.id && isPlaying ? (
                                                <div className="flex gap-1 items-end h-4">
                                                    <div className="w-1 bg-indigo-400 animate-pulse h-4"></div>
                                                    <div className="w-1 bg-indigo-400 animate-pulse h-2 delay-75"></div>
                                                    <div className="w-1 bg-indigo-400 animate-pulse h-3 delay-150"></div>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-500 font-mono text-sm group-hover:text-white transition-colors">
                                                    {track.id.padStart(2, '0')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium ${currentTrack.id === track.id ? 'text-indigo-400' : 'text-neutral-200'}`}>
                                                {track.title}
                                            </p>
                                            <p className="text-xs text-neutral-500">M. Heaven$ent</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-mono px-2 py-1 bg-neutral-950 rounded border border-neutral-800 text-neutral-400 uppercase">
                                                {track.type}
                                            </span>
                                            <span className="text-sm font-mono text-neutral-500">{track.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Player Bar */}
                            <div className="mt-6 pt-6 border-t border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-neutral-800 rounded flex items-center justify-center border border-neutral-700">
                                            <Volume2 className="w-6 h-6 text-neutral-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{currentTrack.title}</p>
                                            <p className="text-sm text-neutral-400">M. Heaven$ent</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <button className="text-neutral-400 hover:text-white transition-colors">
                                            <SkipBack className="w-6 h-6" />
                                        </button>
                                        <button 
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors"
                                        >
                                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                        </button>
                                        <button className="text-neutral-400 hover:text-white transition-colors">
                                            <FastForward className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="w-32">
                                        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-1/3"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
