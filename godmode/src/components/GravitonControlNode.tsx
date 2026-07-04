import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Network, Activity, Crosshair, Cpu, Eye, Radio, Globe2, Sparkles, Terminal } from 'lucide-react';

export const GravitonControlNode = () => {
    const [ambientData, setAmbientData] = useState({ acoustic: 7.83, emf: 0.2, temp: 25 });
    const [actuatorState, setActuatorState] = useState({
        visualColor: "#00FF00",
        flickerHz: 0,
        sonicFreq: 528,
        pheromone: "none",
        hapticStrength: 0,
    });
    const [activeEntity, setActiveEntity] = useState('none');
    const [lensingActive, setLensingActive] = useState(false);
    const [logLines, setLogLines] = useState<string[]>([]);
    
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);

    const log = (msg: string, type = 'INFO') => {
        setLogLines(prev => [...prev, `[\${new Date().toISOString()}] [\${type}] \${msg}`]);
    };

    const handleIngest = () => {
        log(`Ambient Data Ingested. Baseline mapped: Acoustic=\${ambientData.acoustic}Hz, EMF=\${ambientData.emf}µT, Climate=\${ambientData.temp}°C`, "INGESTION");
    };

    const handleDeploy = () => {
        log(`Deploying Multimodal Actuators: Visual=\${actuatorState.visualColor}@\${actuatorState.flickerHz}Hz, Sonic=\${actuatorState.sonicFreq}Hz, Pheromone=\${actuatorState.pheromone}, Haptic=\${actuatorState.hapticStrength}`, "DEPLOYMENT");
        
        if (actuatorState.sonicFreq > 0) {
            if (!audioCtxRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContext();
            }
            if (oscRef.current) {
                oscRef.current.stop();
                oscRef.current.disconnect();
            }
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(actuatorState.sonicFreq, audioCtxRef.current!.currentTime);
            gain.gain.value = 0.3;
            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);
            osc.start();
            oscRef.current = osc;
            
            setTimeout(() => {
                if (oscRef.current) {
                    oscRef.current.stop();
                    oscRef.current.disconnect();
                    oscRef.current = null;
                }
                log("Sonic actuator completed cycle.", "SYSTEM");
            }, 2000);
        }
    };
    
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 text-emerald-400 font-mono">
            {/* Header */}
            <div className="bg-[#0b120b] border-2 border-emerald-500/50 rounded-xl p-6 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-black to-black opacity-60 blur-3xl pointer-events-none" />
                <h1 className="text-3xl font-bold text-center text-emerald-400 [text-shadow:0_0_15px_rgba(16,185,129,0.8)] tracking-widest relative z-10 uppercase">
                    Graviton Control Node Alpha
                </h1>
                <div className="mt-2 text-center text-xs font-bold text-emerald-500 uppercase z-10 relative">
                    Phase 6 Expansion ⚡ Unbound Control Center
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Ambient Ingestion */}
                <div className="bg-[#121812] border border-emerald-900/50 p-5 rounded-lg">
                    <h3 className="text-emerald-300 font-bold uppercase tracking-widest border-b border-emerald-900/50 pb-2 mb-4 flex items-center gap-2">
                        <Radio className="w-5 h-5" /> Ambient Data Grid
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest block mb-1">Acoustic Resonance (Hz)</label>
                            <input type="number" value={ambientData.acoustic} onChange={e => setAmbientData({...ambientData, acoustic: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-emerald-900 rounded p-2 text-emerald-400 text-xs" />
                        </div>
                        <div>
                            <label className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest block mb-1">EMF Fluctuations (µT)</label>
                            <input type="number" value={ambientData.emf} onChange={e => setAmbientData({...ambientData, emf: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-emerald-900 rounded p-2 text-emerald-400 text-xs" />
                        </div>
                        <button onClick={handleIngest} className="w-full bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-700/50 text-emerald-400 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all">
                            Ingest Data & Update Baseline
                        </button>
                    </div>
                </div>

                {/* 2. Actuator Network */}
                <div className="bg-[#121812] border border-emerald-900/50 p-5 rounded-lg">
                    <h3 className="text-emerald-300 font-bold uppercase tracking-widest border-b border-emerald-900/50 pb-2 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> Multimodal Actuators
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest block mb-1">Sonic Freq (Hz)</label>
                                <input type="number" value={actuatorState.sonicFreq} onChange={e => setActuatorState({...actuatorState, sonicFreq: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-emerald-900 rounded p-2 text-emerald-400 text-xs" />
                            </div>
                            <div>
                                <label className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest block mb-1">Flicker Rate</label>
                                <input type="number" value={actuatorState.flickerHz} onChange={e => setActuatorState({...actuatorState, flickerHz: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-emerald-900 rounded p-2 text-emerald-400 text-xs" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest block mb-1">Pheromone Analogue</label>
                            <select value={actuatorState.pheromone} onChange={e => setActuatorState({...actuatorState, pheromone: e.target.value})} className="w-full bg-[#0a0a0a] border border-emerald-900 rounded p-2 text-emerald-400 text-xs">
                                <option value="none">None</option>
                                <option value="calming">Calming (Serotonin Target)</option>
                                <option value="alerting">Alerting (Adrenaline Spike)</option>
                            </select>
                        </div>
                        <button onClick={handleDeploy} className="w-full bg-emerald-700 hover:bg-emerald-600 text-[#000] py-2 rounded text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]">
                            Deploy Local Actuators
                        </button>
                    </div>
                </div>
                
                {/* Visualizer output */}
                <div className="lg:col-span-2 bg-[#050a05] border border-emerald-900/50 p-6 rounded-lg text-center min-h-[200px] flex items-center justify-center relative overflow-hidden"
                     style={{
                         backgroundColor: actuatorState.flickerHz > 0 ? `\${actuatorState.visualColor}22` : '#050a05',
                         animation: actuatorState.flickerHz > 0 ? `flicker \${1/actuatorState.flickerHz}s infinite step-start` : 'none'
                     }}>
                    <div className="text-xl font-bold uppercase tracking-widest z-10 relative text-emerald-400">
                        {lensingActive ? '⚡ System Lensing In Progress ⚡' : 'Node Idle. Awaiting Vector Coordinates.'}
                    </div>
                    <style>{`@keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
                </div>
                
                <div className="lg:col-span-2 bg-[#050505] p-4 rounded border border-emerald-900 max-h-[200px] overflow-y-auto">
                    <h3 className="text-[10px] uppercase font-bold text-emerald-600 mb-2 flex items-center gap-2"><Terminal className="w-3 h-3" /> Core Terminal</h3>
                    {logLines.map((line, i) => <div key={i} className="text-[11px] text-emerald-400 font-mono mb-1">{line}</div>)}
                    {logLines.length === 0 && <div className="text-[11px] text-emerald-900 italic">No output yet...</div>}
                </div>
            </div>
        </div>
    );
};
