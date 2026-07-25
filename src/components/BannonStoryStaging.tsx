import React, { useState, useEffect } from 'react';
import { Play, Flame, Tv, Volume2, Users, MonitorPlay } from 'lucide-react';
import { StoryEngine } from '../lib/storyEngine';

const M_HEAVENSENT_TRACKS = [
    { id: '1', title: 'Bannon Theme (Main Event)', duration: '3:45', type: 'menu' },
    { id: '2', title: 'Walk Into The Fire', duration: '4:12', type: 'entrance' },
    { id: '3', title: 'The Last Drive', duration: '3:50', type: 'game' },
    { id: '4', title: 'Shattered Glass', duration: '2:45', type: 'entrance' },
    { id: '5', title: 'Crown of Thorns', duration: '4:05', type: 'menu' },
    { id: '6', title: 'Blood on the Canvas', duration: '3:30', type: 'game' },
    { id: '7', title: 'No Surrender', duration: '3:15', type: 'entrance' },
    { id: '21', title: 'Endgame (Cosmic)', duration: '5:15', type: 'victory' }
];

export default function BannonStoryStaging() {
    const [activeStage, setActiveStage] = useState<'backstage' | 'entrance' | 'victory'>('entrance');
    const [isSimulating, setIsSimulating] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(M_HEAVENSENT_TRACKS[1]);
    const [pyroActive, setPyroActive] = useState(false);
    const [tronMessage, setTronMessage] = useState('BANNON');
    const [dialogueLog, setDialogueLog] = useState<string[]>([]);

    const simulateEntrance = () => {
        setIsSimulating(true);
        setPyroActive(true);
        setTronMessage('BANNON: APEX PREDATOR');
        
        setTimeout(() => setPyroActive(false), 3000);
        setTimeout(() => setTronMessage('WALK INTO THE FIRE'), 4500);
        setTimeout(() => {
            setIsSimulating(false);
            setTronMessage('BANNON');
        }, 8000);
    };

    const triggerDialogue = (type: 'insult' | 'recruit' | 'challenge') => {
        const lore = StoryEngine.getFederationLore('bannon_main');
        let newMsg = '';
        if (type === 'insult') newMsg = `[Backstage] Bannon insulted Vortex. Rivalry intensity increased!`;
        if (type === 'recruit') newMsg = `[Backstage] Bannon attempted to recruit The Fiend into a new stable.`;
        if (type === 'challenge') newMsg = `[Ring] Bannon challenges Apex to a Bloodbath match!`;
        
        setDialogueLog(prev => [newMsg, ...prev].slice(0, 5));
    };

    return (
        <div className="w-full h-full bg-neutral-950 text-white flex flex-col p-6 rounded-2xl border border-neutral-800">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <MonitorPlay className="w-6 h-6 text-indigo-500" />
                        Bannon Story Staging
                    </h2>
                    <p className="text-neutral-400 mt-1 text-sm">Visual renderer for Entrances, Pyro, Tron Screens, and Story Events.</p>
                </div>
                <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                    <button 
                        onClick={() => setActiveStage('backstage')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeStage === 'backstage' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                    >
                        Backstage / Dialogue
                    </button>
                    <button 
                        onClick={() => setActiveStage('entrance')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeStage === 'entrance' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                    >
                        Entrance Staging
                    </button>
                </div>
            </div>

            {activeStage === 'entrance' && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* TRON SCREEN SIMULATOR */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="relative w-full aspect-video bg-black rounded-xl border border-neutral-800 overflow-hidden flex items-center justify-center">
                            {pyroActive && (
                                <div className="absolute inset-0 z-10 flex justify-between px-10 items-end pb-0">
                                    <div className="w-16 h-48 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent animate-pulse blur-sm origin-bottom scale-y-150"></div>
                                    <div className="w-16 h-48 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent animate-pulse blur-sm origin-bottom scale-y-150"></div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-indigo-900/20 z-0"></div>
                            
                            <h1 className={`text-6xl md:text-8xl font-black uppercase tracking-widest text-center z-20 ${pyroActive ? 'text-orange-50 animate-bounce' : 'text-indigo-100'} drop-shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-700`}>
                                {tronMessage}
                            </h1>
                            
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-neutral-700/50 z-20">
                                <Tv className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-mono font-bold text-indigo-200">TRON FEED [LIVE]</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={simulateEntrance}
                                disabled={isSimulating}
                                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Flame className={`w-5 h-5 ${isSimulating ? 'animate-pulse text-orange-300' : ''}`} />
                                {isSimulating ? 'Entrance in Progress...' : 'Trigger Full Entrance Sequence'}
                            </button>
                        </div>
                    </div>

                    {/* JUKEBOX INTEGRATION */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Volume2 className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-lg font-bold">Jukebox Integration</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {M_HEAVENSENT_TRACKS.map(track => (
                                <div 
                                    key={track.id}
                                    onClick={() => setCurrentTrack(track)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${currentTrack.id === track.id ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm">{track.title}</span>
                                        <span className="text-xs font-mono">{track.duration}</span>
                                    </div>
                                    <div className="text-xs uppercase mt-1 opacity-60 flex items-center gap-1">
                                        <Play className="w-3 h-3" /> {track.type}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isSimulating && (
                            <div className="mt-4 p-3 bg-black rounded-lg border border-indigo-500/30 flex items-center gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center shrink-0">
                                    <Volume2 className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Now Playing (Entrance)</p>
                                    <p className="text-sm text-white font-medium truncate">{currentTrack.title}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeStage === 'backstage' && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-xl font-bold">Branching Dialogue Events</h3>
                        </div>
                        <p className="text-neutral-400 text-sm mb-6">Trigger narrative logic from the StoryEngine. These events mutate Universe relationships and trigger heel/face turns.</p>
                        
                        <div className="space-y-3">
                            <button onClick={() => triggerDialogue('insult')} className="w-full py-3 bg-red-950/50 hover:bg-red-900/50 border border-red-500/30 text-red-200 font-medium rounded-lg transition-colors flex items-center justify-between px-4">
                                <span>Disrespect / Insult</span>
                                <span className="text-xs bg-red-900/50 px-2 py-1 rounded">Rivalry ++</span>
                            </button>
                            <button onClick={() => triggerDialogue('recruit')} className="w-full py-3 bg-green-950/50 hover:bg-green-900/50 border border-green-500/30 text-green-200 font-medium rounded-lg transition-colors flex items-center justify-between px-4">
                                <span>Recruit / Align</span>
                                <span className="text-xs bg-green-900/50 px-2 py-1 rounded">Alliance ++</span>
                            </button>
                            <button onClick={() => triggerDialogue('challenge')} className="w-full py-3 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/30 text-amber-200 font-medium rounded-lg transition-colors flex items-center justify-between px-4">
                                <span>Issue Title Challenge</span>
                                <span className="text-xs bg-amber-900/50 px-2 py-1 rounded">Match Set</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-black border border-neutral-800 rounded-xl p-6 flex flex-col">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4">Event Log & State Mutations</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                            {dialogueLog.length === 0 ? (
                                <p className="text-neutral-700 italic">No events triggered yet...</p>
                            ) : (
                                dialogueLog.map((log, i) => (
                                    <div key={i} className="p-2 border-l-2 border-indigo-500 bg-neutral-900/50 text-indigo-200">
                                        <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
