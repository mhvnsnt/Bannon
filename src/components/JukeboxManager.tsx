import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, FastForward, SkipBack, Volume2, Upload, Plus, Image as ImageIcon, Edit2, X, Music } from 'lucide-react';

export type Track = {
    id: string;
    title: string;
    duration: string;
    type: string;
    artist: string;
    featuredArtist?: string;
    coverArt?: string;
    audioUrl?: string;
};

const INITIAL_TRACKS: Track[] = [
    { id: '1', title: 'Owe Me', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/m owe me_4.mp3' },
    { id: '2', title: 'Lies', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/lies m_2.mp3' },
    { id: '3', title: 'Act Like Ya Know', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', featuredArtist: 'GMG', audioUrl: '/assets/audio/gmg m act like ya know_2.mp3' },
    { id: '4', title: 'Dungeon', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', featuredArtist: 'Finxsse', audioUrl: '/assets/audio/dungeon m_2 fin_1.mp3' },
    { id: '5', title: 'Cream', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/cream m.mp3' },
    { id: '6', title: 'Business That Pays', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', featuredArtist: 'Finxsse & GMG', audioUrl: '/assets/audio/m finxsse gmg business that pays_3 nrw.mp3' },
    { id: '7', title: 'Opps Fallin', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', featuredArtist: 'Jackboy, Blakk Baby J, Finxsse', audioUrl: '/assets/audio/opps fallin m ft jackboy blakk baby j finxsse_4 new mp2' },
    { id: '8', title: 'Hiruzen', duration: '3:00', type: 'menu', artist: '4rtms', audioUrl: '/assets/audio/4RTMS - HIRUZEN.mp3' },
    { id: '9', title: 'Paramore', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', featuredArtist: 'Teezzyy', audioUrl: '/assets/audio/m tz paramore.mp3' },
    { id: '10', title: 'DX', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/m dx 3.mp3' },
    { id: '11', title: 'Stars', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/m stars.mp3' },
    { id: '12', title: 'Sickness', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/m sicikness.mp3' },
    { id: '13', title: 'Picadero', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/Mars FMMG - Picadero' },
    { id: '14', title: 'Narco', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/Mars FMMG - Narco' },
    { id: '15', title: 'Castle Nosferatu (Sega-style FM Synth Remix)', duration: '3:00', type: 'menu', artist: 'Bannon OST', audioUrl: '/assets/audio/04 - Castle Nosferatu (Sega-style FM Synth Remix).aac' },
    { id: '16', title: 'Slo Burn', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/m slo burn_1.mp3' },
    { id: '17', title: 'Cult', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/m cult_3mp3.mp3' },
    { id: '18', title: 'Champion', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', featuredArtist: 'GMG', audioUrl: '/assets/audio/m gmg champion 7.mp3' },
    { id: '19', title: 'Hell Nah', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', featuredArtist: 'Finxsse', audioUrl: '/assets/audio/hell nah m finxsse.mp3' },
    { id: '20', title: 'Bannon Theme', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/Mars FMMG - Bannon Theme' },
    { id: '21', title: 'Final Master Switch', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/final_master_switch.mp3' },
    { id: '22', title: 'Japanese Denim', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/Mars FMMG - Japanese Denim' },
    { id: '23', title: 'Zumbando', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/Mars FMMG - Zumbando.m4a' },
    { id: '24', title: 'Dio', duration: '3:00', type: 'menu', artist: 'M. Heaven$ent', audioUrl: '/assets/audio/Mars FMMG - Dio' }
];

export default function JukeboxManager() {
    const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
    const [currentTrack, setCurrentTrack] = useState<Track>(INITIAL_TRACKS[0]);
    const deleteTrack = (id: string) => {
        setTracks(tracks.filter(t => t.id !== id));
        if (currentTrack.id === id) {
            setCurrentTrack(tracks[0]);
            setIsPlaying(false);
        }
    };

    const playNext = () => {
        const idx = tracks.findIndex(t => t.id === currentTrack.id);
        if (idx >= 0 && idx < tracks.length - 1) {
            setCurrentTrack(tracks[idx + 1]);
            setIsPlaying(true);
        }
    };

    const playPrev = () => {
        const idx = tracks.findIndex(t => t.id === currentTrack.id);
        if (idx > 0) {
            setCurrentTrack(tracks[idx - 1]);
            setIsPlaying(true);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="audio/mp3, audio/wav, audio/m4a, video/mp4" 
                className="hidden" 
                multiple
            />
            <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col relative">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">M. Heaven$ent Master Tapes</h2>
                        <p className="text-neutral-400 text-sm mt-1">Dynamic Engine Streaming Pipeline</p>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
                    >
                        <Upload className="w-4 h-4" />
                        Import Tracks
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {tracks.map((track) => (
                        <div 
                            key={track.id}
                            className={`group flex items-center gap-4 p-3 rounded-lg transition-all ${
                                currentTrack.id === track.id 
                                    ? 'bg-indigo-500/10 border border-indigo-500/30' 
                                    : 'hover:bg-neutral-800/50 border border-transparent'
                            }`}
                        >
                            <div 
                                className="w-8 flex justify-center cursor-pointer"
                                onClick={() => {
                                    if (currentTrack.id === track.id) {
                                        setIsPlaying(!isPlaying);
                                    } else {
                                        setCurrentTrack(track);
                                        setIsPlaying(true);
                                    }
                                }}
                            >
                                {currentTrack.id === track.id && isPlaying ? (
                                    <div className="flex gap-1 items-end h-4">
                                        <div className="w-1 bg-indigo-400 animate-pulse h-4"></div>
                                        <div className="w-1 bg-indigo-400 animate-pulse h-2 delay-75"></div>
                                        <div className="w-1 bg-indigo-400 animate-pulse h-3 delay-150"></div>
                                    </div>
                                ) : (
                                    <span className="text-neutral-500 font-mono text-sm group-hover:text-white transition-colors flex items-center justify-center">
                                        <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity absolute" />
                                        <span className="group-hover:opacity-0 transition-opacity">{track.id.length > 2 ? '*' : track.id.padStart(2, '0')}</span>
                                    </span>
                                )}
                            </div>
                            
                            {track.coverArt ? (
                                <img src={track.coverArt} alt="Cover" className="w-10 h-10 rounded object-cover border border-neutral-700" />
                            ) : (
                                <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center border border-neutral-700">
                                    <Music className="w-5 h-5 text-neutral-500" />
                                </div>
                            )}

                            <div className="flex-1 cursor-pointer" onClick={() => { setCurrentTrack(track); setIsPlaying(true); }}>
                                <p className={`font-medium ${currentTrack.id === track.id ? 'text-indigo-400' : 'text-neutral-200'}`}>
                                    {track.title}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {track.artist} {track.featuredArtist ? `ft. ${track.featuredArtist}` : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono px-2 py-1 bg-neutral-950 rounded border border-neutral-800 text-neutral-400 uppercase">
                                    {track.type}
                                </span>
                                <span className="text-sm font-mono text-neutral-500 w-12 text-right">
                                    {track.duration}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingTrack(track); }}
                                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {editingTrack && (
                    <div className="absolute inset-0 bg-neutral-950/90 z-20 flex items-center justify-center p-6 backdrop-blur-sm rounded-2xl">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Edit Track Metadata</h3>
                                <button onClick={() => setEditingTrack(null)} className="text-neutral-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-6">
                                {editingTrack.coverArt ? (
                                    <img src={editingTrack.coverArt} className="w-20 h-20 rounded-lg object-cover border border-neutral-700" />
                                ) : (
                                    <div className="w-20 h-20 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700">
                                        <ImageIcon className="w-8 h-8 text-neutral-500" />
                                    </div>
                                )}
                                <div>
                                    <input 
                                        type="file" 
                                        ref={coverInputRef} 
                                        onChange={handleCoverUpload} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                    <button 
                                        onClick={() => coverInputRef.current?.click()}
                                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium rounded transition-colors"
                                    >
                                        Upload Cover Art
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Title</label>
                                    <input 
                                        type="text" 
                                        value={editingTrack.title} 
                                        onChange={e => setEditingTrack({...editingTrack, title: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Artist</label>
                                    <input 
                                        type="text" 
                                        value={editingTrack.artist || ''} 
                                        onChange={e => setEditingTrack({...editingTrack, artist: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Featured Artist</label>
                                    <input 
                                        type="text" 
                                        value={editingTrack.featuredArtist || ''} 
                                        onChange={e => setEditingTrack({...editingTrack, featuredArtist: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-8">
                                <button 
                                    onClick={() => { deleteTrack(editingTrack.id); setEditingTrack(null); }}
                                    className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors"
                                >
                                    Delete Track
                                </button>
                                <div className="flex gap-3">
                                    <button onClick={() => setEditingTrack(null)} className="px-4 py-2 text-sm font-bold text-neutral-400 hover:text-white">Cancel</button>
                                    <button onClick={saveTrackEdits} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:w-80 flex flex-col gap-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent z-0"></div>
                    <div className="relative z-10">
                        <div className="w-full aspect-square bg-neutral-950 rounded-xl mb-6 shadow-2xl border border-neutral-800 flex items-center justify-center overflow-hidden relative">
                            {currentTrack.coverArt ? (
                                <img src={currentTrack.coverArt} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <Volume2 className={`w-12 h-12 text-indigo-500/50 mb-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                                    <div className="text-center font-mono text-xs text-neutral-600">
                                        [AUDIO STREAM]<br/>M_HEAVENSENT_OS
                                    </div>
                                </div>
                            )}
                            
                            <div className="absolute top-4 left-4 flex gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-neutral-700'}`}></div>
                                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse delay-75' : 'bg-neutral-700'}`}></div>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-white mb-1 truncate px-2">{currentTrack.title}</h3>
                            <p className="text-neutral-400 text-sm">{currentTrack.artist} {currentTrack.featuredArtist ? `ft. ${currentTrack.featuredArtist}` : ''}</p>
                            {!currentTrack.audioUrl && (
                                <p className="text-amber-500 text-xs mt-2 font-bold uppercase">Audio File Missing - Cannot Play</p>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-6 mb-6">
                            <button onClick={playPrev} className="text-neutral-400 hover:text-white transition-colors">
                                <SkipBack className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                disabled={!currentTrack.audioUrl}
                                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                            <button onClick={playNext} className="text-neutral-400 hover:text-white transition-colors">
                                <FastForward className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="w-full flex items-center gap-3">
                            <span className="text-xs font-mono text-neutral-500 w-8">{currentTimeDisplay}</span>
                            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                                if (audioRef.current && audioRef.current.duration) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - rect.left;
                                    const percent = clickX / rect.width;
                                    audioRef.current.currentTime = percent * audioRef.current.duration;
                                }
                            }}>
                                <div className="h-full bg-indigo-500 transition-all duration-100 ease-linear" style={{width: `${progress}%`}}></div>
                            </div>
                            <span className="text-xs font-mono text-neutral-500 w-8 text-right">{currentTrack.duration}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
