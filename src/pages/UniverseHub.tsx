import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Globe, Music, Users, Trophy, BookOpen, Clock, Play, Pause, 
    SkipForward, SkipBack, Search, Filter, Shield, Sword 
} from 'lucide-react';

// MDickie Universe Schema & Playlists Mapped to Bannon Universe
const PROMOTIONS = [
    { id: 'awe', name: 'AWE (American Wrestling Empire)', founder: 'Kennedy', type: 'Major TV', style: 'Sports Entertainment', color: 'bg-blue-600' },
    { id: 'jpcw', name: 'JPCW (Global Network)', founder: 'Combs', type: 'International', style: 'Strong Style / King\'s Road', color: 'bg-red-600' },
    { id: 'nwc', name: 'NWC (Book 6 Canon)', founder: 'Various', type: 'Underground/Major', style: 'Hardcore Brawling', color: 'bg-green-700' },
    { id: 'old_school', name: 'Territory Days (Old School)', founder: 'Legacy', type: 'Classic', style: 'Catch Wrestling', color: 'bg-yellow-700' },
    { id: 'lucha', name: 'Lucha Libre Mexico', founder: 'AAA/CMLL Inspired', type: 'Regional', style: 'High-Flying / Lucha', color: 'bg-emerald-500' },
    { id: 'canada', name: 'Canadian Stampede', founder: 'Hart Inspired', type: 'Regional', style: 'Technical Dungeon', color: 'bg-red-500' },
    { id: 'mma', name: 'Shootfight / MMA', founder: 'UFC/Pride Inspired', type: 'Combat', style: 'Shoot', color: 'bg-neutral-800' },
    { id: 'boxing', name: 'Prizefight Boxing', founder: 'Boxing Org', type: 'Combat', style: 'Striking', color: 'bg-amber-600' },
    { id: 'hollywood', name: 'Hollywood Studio', founder: 'Movie Set', type: 'Cinematic', style: 'Stunt Choreography', color: 'bg-purple-600' },
    { id: 'hardcore', name: 'Deathmatch Pro', founder: 'CZW/ECW Inspired', type: 'Indie', style: 'Ultraviolence', color: 'bg-orange-700' },
    { id: 'indie', name: 'Local Indie Circuit', founder: 'VFW Hall', type: 'Indie', style: 'Indie / Flip', color: 'bg-cyan-600' },
];

const MATCH_TYPES = [
    { id: 'standard', name: 'Standard Match', rules: 'Pinfall or Submission, Countouts, DQs active.' },
    { id: 'hardcore', name: 'Hardcore', rules: 'No DQ, No Countouts. Weapons legal.' },
    { id: 'first_blood', name: 'First Blood', rules: 'First to bleed loses. No DQ.' },
    { id: 'cage', name: 'Steel Cage', rules: 'Escape the cage to win.' },
    { id: 'iron_man', name: 'Iron Man', rules: 'Most falls in 60 minutes wins.' },
    { id: 'royal', name: 'Over the Top', rules: 'Elimination by being thrown over the top rope.' },
];

const SOUNDTRACK = [
    { id: 'track1', title: 'Bannon Theme (Main Event)', artist: 'M. Heaven$ent', duration: '3:45', type: 'menu' },
    { id: 'track2', title: 'Walk Into The Fire', artist: 'M. Heaven$ent', duration: '4:12', type: 'entrance' },
    { id: 'track3', title: 'The Last Drive', artist: 'M. Heaven$ent', duration: '2:58', type: 'game' },
    { id: 'track4', title: 'Cosmic Vengeance', artist: 'M. Heaven$ent', duration: '5:01', type: 'menu' },
    { id: 'track5', title: 'Blood on the Canvas', artist: 'M. Heaven$ent', duration: '3:30', type: 'entrance' },
];

export default function UniverseHub() {
    const [activeTab, setActiveTab] = useState<'promotions' | 'match_types' | 'jukebox'>('promotions');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(SOUNDTRACK[0]);

    return (
        <div className="w-full h-full bg-neutral-950 text-white flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <Globe className="w-8 h-8 text-indigo-500" /> 
                        BANNON UNIVERSE
                    </h1>
                    <p className="text-neutral-400 mt-1">MDickie Legacy Integration & World Simulation</p>
                </div>
            </div>

            <div className="flex gap-4 mb-8 border-b border-neutral-800 pb-2">
                <button 
                    onClick={() => setActiveTab('promotions')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase transition-colors ${activeTab === 'promotions' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Promotions & Factions
                </button>
                <button 
                    onClick={() => setActiveTab('match_types')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase transition-colors ${activeTab === 'match_types' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Match Types & Rules
                </button>
                <button 
                    onClick={() => setActiveTab('jukebox')}
                    className={`px-4 py-2 text-sm font-bold tracking-wider uppercase transition-colors ${activeTab === 'jukebox' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    Jukebox (M. Heaven$ent)
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'promotions' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {PROMOTIONS.map(promo => (
                            <div key={promo.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all">
                                <div className={`w-12 h-12 rounded-lg ${promo.color} mb-4 flex items-center justify-center font-black text-xl shadow-lg`}>
                                    {promo.id.substring(0,2).toUpperCase()}
                                </div>
                                <h3 className="text-lg font-bold text-white leading-tight">{promo.name}</h3>
                                <div className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">{promo.type}</div>
                                
                                <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-400">Founder</span>
                                        <span className="text-neutral-200 font-medium">{promo.founder}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-400">Style</span>
                                        <span className="text-neutral-200 font-medium">{promo.style}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'match_types' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MATCH_TYPES.map(match => (
                            <div key={match.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all flex items-start gap-4">
                                <div className="p-3 bg-neutral-800 rounded-lg text-neutral-400">
                                    <Sword className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{match.name}</h3>
                                    <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{match.rules}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'jukebox' && (
                    <div className="flex flex-col lg:flex-row gap-8 h-full">
                        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Music className="w-5 h-5 text-indigo-400" />
                                    Soundtrack Engine
                                </h2>
                                <span className="text-xs font-bold px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded uppercase tracking-wider">M. Heaven$ent</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {SOUNDTRACK.map((track, idx) => (
                                    <button 
                                        key={track.id}
                                        onClick={() => { setCurrentTrack(track); setIsPlaying(true); }}
                                        className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all ${currentTrack.id === track.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-neutral-800/50 hover:bg-neutral-800 text-neutral-300'}`}
                                    >
                                        <div className="text-sm font-bold opacity-50 w-6">{idx + 1}</div>
                                        <div className="flex-1">
                                            <div className="font-bold">{track.title}</div>
                                            <div className={`text-xs ${currentTrack.id === track.id ? 'text-indigo-200' : 'text-neutral-500'}`}>{track.artist} • {track.type.toUpperCase()}</div>
                                        </div>
                                        <div className="text-sm opacity-50">{track.duration}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="w-full lg:w-80 flex flex-col gap-4">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center text-center">
                                <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-indigo-900 to-black border-2 border-neutral-800 mb-6 flex items-center justify-center shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=500&auto=format&fit=crop')] bg-cover opacity-20 mix-blend-overlay"></div>
                                    <Music className="w-16 h-16 text-indigo-500/50" />
                                </div>
                                
                                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                                <p className="text-neutral-400 mt-1">{currentTrack.artist}</p>
                                
                                <div className="w-full h-1 bg-neutral-800 rounded-full mt-6 mb-2 overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-1/3"></div>
                                </div>
                                <div className="flex justify-between w-full text-xs text-neutral-500 font-medium">
                                    <span>1:14</span>
                                    <span>{currentTrack.duration}</span>
                                </div>
                                
                                <div className="flex items-center gap-6 mt-8">
                                    <button className="text-neutral-400 hover:text-white transition-colors">
                                        <SkipBack className="w-6 h-6" />
                                    </button>
                                    <button 
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
                                    >
                                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                                    </button>
                                    <button className="text-neutral-400 hover:text-white transition-colors">
                                        <SkipForward className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-5">
                                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Audio Format System</div>
                                <p className="text-sm text-indigo-200/70 leading-relaxed">
                                    Engine compresses source `.wav` files into optimized `.ogg` Vorbis formatting to preserve performance during UE5 asset streaming and web delivery. 
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
