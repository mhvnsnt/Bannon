import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Music, Volume2, VolumeX, Hexagon, Layers, Wind } from 'lucide-react';
import { usePrimeStore } from '../lib/store';

export const HarmonicStateEngine = () => {
    const [isActive, setIsActive] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const droneOscillatorRef = useRef<OscillatorNode | null>(null);
    const [isSubSonic, setIsSubSonic] = useState(false);
    const [visualNotes, setVisualNotes] = useState<{ id: string; freq: number; x: number; y: number }[]>([]);

    const playEventNote = (frequency: number, type: OscillatorType = 'sine', duration: number = 0.5) => {
        if (!audioCtxRef.current || !isActive) return;
        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtxRef.current.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);

        oscillator.start();
        oscillator.stop(audioCtxRef.current.currentTime + duration);

        const newNote = {
            id: `note_${Date.now()}_${Math.random()}`,
            freq: frequency,
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10,
        };
        setVisualNotes(prev => [...prev, newNote]);
        setTimeout(() => {
            setVisualNotes(prev => prev.filter(n => n.id !== newNote.id));
        }, duration * 1000);
    };

    const toggleEngine = () => {
        if (!isActive) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
            
            // Background Harmonic Drone (Core 432Hz baseline mapping)
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isSubSonic ? 60 : 432, audioCtxRef.current.currentTime);
            gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
            
            // Very slow LFO for wave modulation
            const lfo = audioCtxRef.current.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.05, audioCtxRef.current.currentTime);
            lfo.connect(gain.gain);
            lfo.start();

            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);
            osc.start();
            droneOscillatorRef.current = osc;

            setIsActive(true);
            playEventNote(852, 'sine', 1.0); // Solfeggio awakening freq
        } else {
            if (droneOscillatorRef.current) {
                droneOscillatorRef.current.stop();
                droneOscillatorRef.current.disconnect();
                droneOscillatorRef.current = null;
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close().then(() => {
                    audioCtxRef.current = null;
                });
            }
            setIsActive(false);
        }
    };

    // Simulate reactive sonification of API calls and mutations
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                // Procedural arpeggio mapping representing file edit success
                const root = 432;
                const pentatonicMultipliers = [1, 1.125, 1.25, 1.5, 1.666]; // Pythagorean
                const freq = root * pentatonicMultipliers[Math.floor(Math.random() * pentatonicMultipliers.length)];
                playEventNote(freq, 'triangle', 0.8);
            }
            if (Math.random() > 0.95) {
                // Dissonant error representation
                playEventNote(210, 'sawtooth', 1.2);
            }
        }, 1500);
        return () => clearInterval(interval);
    }, [isActive]);

    useEffect(() => {
        if (droneOscillatorRef.current && audioCtxRef.current) {
            droneOscillatorRef.current.frequency.setTargetAtTime(isSubSonic ? 60 : 432, audioCtxRef.current.currentTime, 1);
        }
    }, [isSubSonic]);

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 text-emerald-400 font-mono" id="harmonic-engine-dashboard">
            <div className="bg-[#0c110c] border border-emerald-900/50 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black opacity-60 pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10 w-full">
                    <div className={`p-4 rounded-xl border border-emerald-500/20 transition-all ${isActive ? 'bg-emerald-900/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-black'}`}>
                        <Music className={`w-8 h-8 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-emerald-800'}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-lg tracking-widest flex items-center gap-2">
                           HARMONIC STATE ENGINE <span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 uppercase">Phase 6 Active</span>
                        </h3>
                        <p className="text-xs text-emerald-500 mt-1 uppercase tracking-wider">Sub-atomic procedural audio sonification binding to active file mutations.</p>
                    </div>
                    <button 
                        onClick={toggleEngine}
                        className={`px-6 py-3 rounded-lg font-bold tracking-widest text-sm transition-all flex items-center gap-2 ${isActive ? 'bg-rose-950/40 border-rose-900/50 text-rose-400 hover:bg-rose-900/50' : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/50'}`}
                    >
                        {isActive ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        {isActive ? 'DEACTIVATE' : 'ENGAGE AUDIO DOMAIN'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                {/* Visualizer Canvas */}
                <div className="lg:col-span-8 bg-black/80 backdrop-blur-md border border-emerald-900/30 rounded-xl p-6 relative overflow-hidden min-h-[400px]">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest absolute top-6 left-6 flex items-center gap-2 z-20">
                        <Activity className="w-4 h-4" /> Realtime Resonance Waveform
                    </h4>
                    
                    {/* Procedural Visual Generation based on active notes */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
                        {visualNotes.map(note => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 1, scale: 0, boxShadow: '0 0 0px #10b981' }}
                                animate={{ opacity: 0, scale: 5, boxShadow: '0 0 40px #10b981' }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                style={{
                                    position: 'absolute',
                                    left: `\${note.x}%`,
                                    top: `\${note.y}%`,
                                }}
                                className="w-16 h-16 rounded-full border border-emerald-400/50"
                            />
                        ))}
                        
                        {isActive ? (
                            <div className="flex gap-1 items-end h-32 opacity-30 mt-20">
                                {Array.from({length: 40}).map((_, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: "10%" }}
                                        animate={{ height: `\${Math.random() * 80 + 20}%` }}
                                        transition={{ repeat: Infinity, repeatType: "mirror", duration: Math.random() * 0.5 + 0.2 }}
                                        className="w-2 bg-emerald-500 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-emerald-900/50 uppercase tracking-widest text-sm font-bold flex flex-col items-center gap-2">
                                <Hexagon className="w-12 h-12" /> Engine Dormant
                            </div>
                        )}
                    </div>
                </div>

                {/* Engine Tuning Panel */}
                <div className="lg:col-span-4 bg-[#0a0f0a] border border-emerald-900/30 rounded-xl p-6 flex flex-col gap-6">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2 border-b border-emerald-900/30 pb-3">
                        <Layers className="w-4 h-4" /> Waveform Engineering
                    </h4>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider flex justify-between">
                            <span>Core Tuning Baseline</span>
                            <span className="text-emerald-400">{isSubSonic ? '60.0 Hz' : '432.0 Hz'}</span>
                        </label>
                        <div className="flex gap-2 bg-black border border-emerald-900/30 p-1 rounded-lg">
                            <button 
                                onClick={() => setIsSubSonic(false)}
                                className={`flex-1 py-2 text-xs font-bold rounded \${!isSubSonic ? 'bg-emerald-900/40 text-emerald-300' : 'text-emerald-700 hover:text-emerald-500'}`}
                            >
                                432Hz (Cosmic)
                            </button>
                            <button 
                                onClick={() => setIsSubSonic(true)}
                                className={`flex-1 py-2 text-xs font-bold rounded \${isSubSonic ? 'bg-emerald-900/40 text-emerald-300' : 'text-emerald-700 hover:text-emerald-500'}`}
                            >
                                60Hz (Sub-Drone)
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-emerald-900/30">
                        <div className="text-[9px] text-emerald-700 uppercase leading-relaxed font-bold tracking-wider">
                            <span className="text-emerald-500 mb-1 block flex items-center gap-1"><Wind className="w-3 h-3" /> Metaconscious Routing</span>
                            Direct binding established between Redux store mutations, SQLite write-ahead-logs, and WebAudio context oscillators. Entropy manifests as dissonance. Order resolves to pure sines.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
