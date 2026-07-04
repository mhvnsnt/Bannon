import React, { useState, useEffect, useRef } from 'react';
import { Brain, Activity, Target, Zap, Focus, Eye, Wind, Droplets } from 'lucide-react';
import { useBiologicalStore } from '../store/useBiologicalStore';

interface ProtocolState {
  active: 'NONE' | 'HRV_RESONANCE' | 'OCULOMOTOR_DAMPING' | 'EXECUTIVE_OVERRIDE' | 'NSDR' | 'COLD_EXPOSURE';
  duration: number;
  timer: number | null;
}

export const NeuroplasticityEngine = () => {
    const [state, setState] = useState<ProtocolState>({ active: 'NONE', duration: 0, timer: null });
    const [breathPhase, setBreathPhase] = useState<'INHALE' | 'EXHALE' | 'HOLD'>('INHALE');
    const [eyePos, setEyePos] = useState(-1); // -1 left, 1 right
    
    // Executive override state (Stroop-like)
    const [stroopScore, setStroopScore] = useState(0);
    const [stroopWord, setStroopWord] = useState({ text: 'RED', color: 'text-red-500', isMatch: true });

    // Link into biological state
    const { dampenAmygdala, buildMyelin, triggerDopamineSpike, triggerAdrenaline, neurochemicals } = useBiologicalStore();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state.active !== 'NONE' && state.timer !== null && state.timer > 0) {
            interval = setInterval(() => {
                setState(s => ({ ...s, timer: s.timer! - 1 }));
            }, 1000);
        } else if (state.timer === 0) {
            // Protocol Finished - Apply Neurochemical payload
            if (state.active === 'HRV_RESONANCE') {
                dampenAmygdala(30); // Major parasympathetic increase
                console.log('[NEUROLOGY] Vagal Tone Maximized. GABA synthesized. Amygdala suppressed.');
            } else if (state.active === 'OCULOMOTOR_DAMPING') {
                dampenAmygdala(20);
                triggerDopamineSpike(10); // Forward-movement circuitry
                console.log('[NEUROLOGY] Bilateral processing complete. Forward-movement dopamine circuit engaged.');
            } else if (state.active === 'EXECUTIVE_OVERRIDE') {
                buildMyelin(15); // Intense acetylcholine release for conflict resolution
                console.log('[NEUROLOGY] Task conflict resolved. Significant Acetylcholine released. Synapses reinforced.');
            } else if (state.active === 'NSDR') {
                dampenAmygdala(50);
                triggerDopamineSpike(20);
                buildMyelin(5);
                console.log('[NEUROLOGY] NSDR Complete. Striatal dopamine restored. Neuroplasticity consolidated.');
            } else if (state.active === 'COLD_EXPOSURE') {
                triggerDopamineSpike(60);
                triggerAdrenaline(80);
                console.log('[NEUROLOGY] Cold Shock Complete. Massive 2.5x sustained Dopamine release. Norepinephrine spiked.');
            }
            
            setState({ active: 'NONE', duration: 0, timer: null });
        }
        return () => clearInterval(interval);
    }, [state.active, state.timer, dampenAmygdala, buildMyelin, triggerDopamineSpike, triggerAdrenaline]);

    // Resonance Breathing Logic (0.1 Hz / 6 breaths per min)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state.active === 'HRV_RESONANCE') {
            interval = setInterval(() => {
                setBreathPhase(p => p === 'INHALE' ? 'EXHALE' : 'INHALE');
            }, 5000); // 5 sec inhale, 5 sec exhale
        }
        return () => clearInterval(interval);
    }, [state.active]);

    // Oculomotor Logic (EMDR / Amygdala damping)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state.active === 'OCULOMOTOR_DAMPING') {
            interval = setInterval(() => {
                setEyePos(p => p * -1);
            }, 1000); // 1 sec left, 1 sec right
        }
        return () => clearInterval(interval);
    }, [state.active]);

    const startProtocol = (type: ProtocolState['active'], durationSeconds: number) => {
        setState({ active: type, duration: durationSeconds, timer: durationSeconds });
        if (type === 'EXECUTIVE_OVERRIDE') {
            setStroopScore(0);
            generateStroop();
        }
    };

    const generateStroop = () => {
        const words = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
        const colors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500'];
        const wordIdx = Math.floor(Math.random() * words.length);
        const colorIdx = Math.random() > 0.5 ? wordIdx : Math.floor(Math.random() * colors.length);
        setStroopWord({ text: words[wordIdx], color: colors[colorIdx], isMatch: wordIdx === colorIdx });
    };

    const handleStroop = (guessedMatch: boolean) => {
        if (guessedMatch === stroopWord.isMatch) {
            setStroopScore(s => s + 1);
        } else {
            setStroopScore(s => Math.max(0, s - 1));
        }
        generateStroop();
    };

    const renderActiveProtocol = () => {
        if (state.active === 'HRV_RESONANCE') {
            return (
                <div className="flex flex-col items-center justify-center p-8 border border-cyan-900/50 bg-[#050a0a] h-64 relative overflow-hidden shrink-0">
                    <div className="absolute top-2 right-2 text-xs text-cyan-500 font-mono">T-{state.timer}s</div>
                    <div className="text-xs text-cyan-600 mb-8 uppercase tracking-widest text-center">
                        Autonomic Regulation<br/>0.1 Hz Resonance
                    </div>
                    <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all duration-[5000ms] ease-in-out ${breathPhase === 'INHALE' ? 'scale-150 border-cyan-400 bg-cyan-900/20' : 'scale-75 border-cyan-800 bg-transparent'}`}>
                        <span className="text-cyan-400 font-bold tracking-widest">{breathPhase}</span>
                    </div>
                </div>
            );
        }
        if (state.active === 'OCULOMOTOR_DAMPING') {
            return (
                <div className="flex flex-col items-center justify-center p-8 border border-fuchsia-900/50 bg-[#0a050a] h-64 relative overflow-hidden shrink-0">
                    <div className="absolute top-2 right-2 text-xs text-fuchsia-500 font-mono">T-{state.timer}s</div>
                    <div className="text-xs text-fuchsia-600 mb-8 uppercase tracking-widest text-center">
                        Amygdala Damping<br/>Lateral Smooth Pursuit
                    </div>
                    <div className="w-full relative h-8 flex items-center">
                        <div className="w-full h-px bg-fuchsia-900/50 absolute top-1/2"></div>
                        <div 
                            className="w-6 h-6 rounded-full bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] absolute top-1 transition-all duration-1000 ease-in-out"
                            style={{ left: eyePos === -1 ? '10%' : '85%' }}
                        ></div>
                    </div>
                    <div className="mt-8 text-[10px] text-fuchsia-700 text-center uppercase tracking-widest max-w-[200px]">Keep head perfectly still. Track the kinetic point with eyes only to force bilateral processing.</div>
                </div>
            );
        }
        if (state.active === 'EXECUTIVE_OVERRIDE') {
            return (
                <div className="flex flex-col items-center justify-center p-8 border border-amber-900/50 bg-[#0a0805] h-64 relative shrink-0">
                    <div className="absolute top-2 flex justify-between w-full px-4">
                        <span className="text-xs text-amber-600 font-mono">SCORE: {stroopScore}</span>
                        <span className="text-xs text-amber-500 font-mono">T-{state.timer}s</span>
                    </div>
                    <div className="text-xs text-amber-600 mb-4 uppercase tracking-widest text-center">
                        Prefrontal Density<br/>Conflict Inhibition
                    </div>
                    <div className={`text-4xl font-bold tracking-widest uppercase mb-6 ${stroopWord.color}`}>
                        {stroopWord.text}
                    </div>
                    <div className="text-[10px] text-amber-600 mb-4 uppercase">Does the text match its color?</div>
                    <div className="flex gap-4">
                        <button onClick={() => handleStroop(true)} className="px-6 py-2 border border-emerald-900/50 bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40 text-xs font-bold uppercase transition-colors">MATCH</button>
                        <button onClick={() => handleStroop(false)} className="px-6 py-2 border border-red-900/50 bg-red-900/20 text-red-500 hover:bg-red-900/40 text-xs font-bold uppercase transition-colors">CONFLICT</button>
                    </div>
                </div>
            );
        }
        if (state.active === 'NSDR') {
            return (
                <div className="flex flex-col items-center justify-center p-8 border border-blue-900/50 bg-[#020511] h-64 relative shrink-0">
                    <div className="absolute top-2 right-2 text-xs text-blue-500 font-mono">T-{state.timer}s</div>
                    <Wind className="w-8 h-8 text-blue-600 mb-4 animate-pulse duration-3000" />
                    <div className="text-xs text-blue-400 mb-2 uppercase tracking-widest text-center font-bold">
                        NON-SLEEP DEEP REST
                    </div>
                    <div className="text-[10px] text-blue-800 text-center uppercase tracking-widest max-w-[250px]">
                        Lie absolutely still. Scan the body. Dilate time perception. 10m NSDR replaces 1h of lost sleep.
                    </div>
                    <div className="mt-4 w-48 h-1 bg-black border border-[#111]">
                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${((state.duration - (state.timer || 0)) / state.duration) * 100}%` }}></div>
                    </div>
                </div>
            );
        }
        if (state.active === 'COLD_EXPOSURE') {
            return (
                <div className="flex flex-col items-center justify-center p-8 border border-indigo-900/50 bg-[#05051a] h-64 relative shrink-0">
                    <div className="absolute top-2 right-2 text-xs text-indigo-500 font-mono">T-{state.timer}s</div>
                    <Droplets className="w-8 h-8 text-indigo-400 mb-4" />
                    <div className="text-xs text-indigo-300 mb-2 uppercase tracking-widest text-center font-bold">
                        THERMOGENIC SHOCK
                    </div>
                    <div className="text-[10px] text-indigo-700 text-center uppercase tracking-widest max-w-[250px]">
                        Subject the mesh to absolute cold. Suppress the panic reflex. Spikes Adrenaline and sustains Dopamine at 2.5x baseline for hours.
                    </div>
                    <div className="text-xl font-bold text-indigo-200 mt-4 animate-pulse">
                        MAINTAIN BREATH
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-8 border border-emerald-900/30 bg-[#020202] h-64 text-center shrink-0">
                <Brain className="w-8 h-8 text-emerald-800 mb-3" />
                <div className="text-emerald-500 font-mono text-sm tracking-widest mb-1">AWAITING NEURAL INPUT</div>
                <div className="text-emerald-700 font-mono text-[10px]">Select a clinical protocol to initiate thermodynamic brain state alterations.</div>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-[#020202] text-emerald-500 font-mono p-4 flex flex-col border-l border-emerald-900/30 overflow-hidden">
            <div className="border-b border-emerald-900/50 pb-2 mb-4 shrink-0">
                <h2 className="text-lg font-bold uppercase tracking-widest text-emerald-400">Neuroplasticity Engine</h2>
                <p className="text-[10px] text-emerald-700 mt-1 max-w-md">
                    Clinical protocols proven to alter white matter density, vagal tone, and localized hemispheric blood flow. Write the brain like code.
                </p>
                
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-fuchsia-700">DOPAMINE: {Math.round(neurochemicals.dopamine)}%</span>
                    <span className="text-[10px] text-emerald-700">ACETYLCHOLINE: {Math.round(neurochemicals.acetylcholine)}%</span>
                    <span className="text-[10px] text-cyan-700">GABA: {Math.round(neurochemicals.gaba)}%</span>
                </div>
            </div>

            {renderActiveProtocol()}

            <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar flex flex-col gap-3">
                <div className="text-xs mb-1 text-emerald-600 font-bold">AVAILABLE PROTOCOLS</div>
                
                <button 
                    disabled={state.active !== 'NONE'}
                    onClick={() => startProtocol('HRV_RESONANCE', 120)}
                    className="w-full text-left bg-black border border-cyan-900/30 p-3 hover:bg-[#050a0a] transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-cyan-500" />
                        <span className="text-xs font-bold text-cyan-400">0.1 Hz Resonance Breathing</span>
                    </div>
                    <div className="text-[10px] text-cyan-700 leading-tight">
                        Mechanically forces maximum Heart Rate Variability (HRV). Balances the autonomic nervous system, pulling you out of sympathetic overdrive (fight/flight) into coherent focus. 120s Execution.
                    </div>
                </button>

                <button 
                    disabled={state.active !== 'NONE'}
                    onClick={() => startProtocol('EXECUTIVE_OVERRIDE', 60)}
                    className="w-full text-left bg-black border border-amber-900/30 p-3 hover:bg-[#0a0805] transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-400">Prefrontal Conflict Inhibition</span>
                    </div>
                    <div className="text-[10px] text-amber-700 leading-tight">
                        Based on the Stroop task. Forces the anterior cingulate cortex and dorsolateral prefrontal cortex to resolve conflicting data. Increases structural density of the executive override grid. 60s Execution.
                    </div>
                </button>

                <button 
                    disabled={state.active !== 'NONE'}
                    onClick={() => startProtocol('OCULOMOTOR_DAMPING', 60)}
                    className="w-full text-left bg-black border border-fuchsia-900/30 p-3 hover:bg-[#0a050a] transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Eye className="w-4 h-4 text-fuchsia-500" />
                        <span className="text-xs font-bold text-fuchsia-400">Lateral Smooth Pursuit</span>
                    </div>
                    <div className="text-[10px] text-fuchsia-700 leading-tight">
                        Optic flow simulation. Bilateral eye movements naturally suppress amygdala activation and forward-propel dopaminergic pathways (Huberman EMDR protocols). 60s Execution.
                    </div>
                </button>
                
                <button 
                    disabled={state.active !== 'NONE'}
                    onClick={() => startProtocol('NSDR', 600)}
                    className="w-full text-left bg-black border border-blue-900/30 p-3 hover:bg-[#050a11] transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Wind className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-blue-400">NSDR (Non-Sleep Deep Rest)</span>
                    </div>
                    <div className="text-[10px] text-blue-700 leading-tight">
                        Maximum parasympathetic integration. Clears neuro-metabolic waste. Rapidly restores striatal dopamine levels and accelerates skill consolidation via 600s of deep rest state.
                    </div>
                </button>

                <button 
                    disabled={state.active !== 'NONE'}
                    onClick={() => startProtocol('COLD_EXPOSURE', 180)}
                    className="w-full text-left bg-black border border-indigo-900/30 p-3 hover:bg-[#05051a] transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Droplets className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-400">Thermogenic Shock (Cold Exposure)</span>
                    </div>
                    <div className="text-[10px] text-indigo-700 leading-tight">
                        Forces massive release of norepinephrine (focus) and dopamine (elevated 250% above baseline for hours). Builds extreme top-down executive override over panic reflex. 180s Execution.
                    </div>
                </button>
            </div>
        </div>
    );
};
