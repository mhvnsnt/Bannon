import React, { useState, useEffect, useRef } from 'react';
import { Infinity as InfinityIcon, Network, Orbit, Zap, Command, Cpu, Hexagon, Power } from 'lucide-react';
import { useBiologicalStore } from '../store/useBiologicalStore';

export const OmniSingularityNexus = () => {
    const { neurochemicals, myelinDensity, triggerDopamineSpike, buildMyelin } = useBiologicalStore();
    const [coherence, setCoherence] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Meta-Quantum entanglement simulation
    useEffect(() => {
        const interval = setInterval(() => {
            // Coherence scales with myelin density and dopamine/acetylcholine
            const baseCoherence = (neurochemicals.dopamine + neurochemicals.acetylcholine) / 2;
            const quantumMultiplier = Math.pow(myelinDensity, 2);
            setCoherence(Math.min(100, Math.max(0, (baseCoherence * quantumMultiplier) + (Math.random() * 5 - 2.5))));
        }, 100);
        return () => clearInterval(interval);
    }, [neurochemicals, myelinDensity]);

    // Draw the collapsing waveform
    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        const render = () => {
            frame++;
            const width = canvasRef.current!.width;
            const height = canvasRef.current!.height;
            
            ctx.fillStyle = 'rgba(2, 2, 2, 0.1)'; // Fade effect
            ctx.fillRect(0, 0, width, height);

            ctx.beginPath();
            const startX = 0;
            const startY = height / 2;
            ctx.moveTo(startX, startY);

            // The waveform's collapse is dictated by coherence. Higher coherence = straighter laser-like beam.
            // Lower coherence = chaotic quantum probability spread.
            const chaosLevel = 100 - coherence;
            const amplitude = chaosLevel * 1.5;
            const frequency = 0.05 + (chaosLevel * 0.001);

            for (let x = 0; x < width; x++) {
                const noise = (Math.random() - 0.5) * chaosLevel * 0.5;
                const wave = Math.sin(x * frequency + frame * 0.1) * amplitude;
                const y = height / 2 + wave + noise;
                
                // Color shifts based on quantum state
                const r = Math.floor(255 - (coherence * 2.5));
                const g = Math.floor(coherence * 2.5);
                const b = 255;
                
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
                ctx.lineWidth = coherence > 80 ? 3 : 1;
                
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            requestAnimationFrame(render);
        };
        const id = requestAnimationFrame(render);
        return () => cancelAnimationFrame(id);
    }, [coherence]);

    return (
        <div className="w-full h-full bg-[#020202] text-fuchsia-500 font-mono p-4 flex flex-col border-l border-fuchsia-900/30 overflow-hidden">
            <div className="border-b border-fuchsia-900/50 pb-2 mb-4 shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-fuchsia-400 flex items-center gap-2">
                        <InfinityIcon className="w-6 h-6" /> Omni-Singularity Nexus
                    </h2>
                    <p className="text-[10px] text-fuchsia-700 mt-1 max-w-lg leading-tight">
                        Post-OS Paradigm. Transcending conventional physics strings. Integrating the biological neural net directly into the quantum probability field.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-fuchsia-600 mb-1">MACRO-COHERENCE</div>
                    <div className="text-3xl font-bold text-fuchsia-300">{coherence.toFixed(1)}%</div>
                </div>
            </div>

            <div className="relative w-full h-48 border border-fuchsia-900/30 bg-black shrink-0 mb-6 flex items-center justify-center overflow-hidden">
                <canvas ref={canvasRef} width={800} height={200} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"></canvas>
                <div className="z-10 absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Orbit className={`w-16 h-16 text-fuchsia-500/20 ${coherence > 90 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                </div>
                {coherence > 95 && (
                    <div className="absolute top-2 left-2 text-[10px] font-bold text-fuchsia-300 animate-pulse">
                        WAVEFORM COLLAPSE: DETERMINISTIC REALITY ACHIEVED
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-xs mb-3 text-fuchsia-600 font-bold uppercase tracking-widest border-b border-fuchsia-900/30 pb-1">
                    Meta-Laws Override Panel
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#050005] border border-fuchsia-900/40 p-4 hover:border-fuchsia-500/50 transition-colors cursor-crosshair group">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                            <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-wider">Neuromorphic Compilation</h3>
                        </div>
                        <p className="text-[10px] text-fuchsia-800 leading-relaxed mb-3">
                            Bypass standard CPU/GPU execution. Compile intent directly into the myelinated pathways of the observer's biological brain array.
                        </p>
                        <div className="w-full h-1 bg-black border border-[#111]">
                            <div className="h-full bg-cyan-500" style={{ width: `${neurochemicals.acetylcholine}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-[#050005] border border-fuchsia-900/40 p-4 hover:border-fuchsia-500/50 transition-colors cursor-crosshair group">
                        <div className="flex items-center gap-2 mb-2">
                            <Network className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Entanglement Bridging</h3>
                        </div>
                        <p className="text-[10px] text-fuchsia-800 leading-relaxed mb-3">
                            Connect the 3D local physical constraints (Time/Space) with the 6D origin intent pool. Forces synchronicities into localized reality.
                        </p>
                        <div className="w-full h-1 bg-black border border-[#111]">
                            <div className="h-full bg-emerald-500" style={{ width: `${coherence}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-[#050005] border border-fuchsia-900/40 p-4 hover:border-fuchsia-500/50 transition-colors cursor-crosshair group md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Power className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">God-Mode Instantiation</h3>
                        </div>
                        <p className="text-[10px] text-fuchsia-800 leading-relaxed mb-3">
                            Eradicate the boundary between software "OS" and the user's biological consciousness. Re-write the observer as the root execution thread of the universe. Action = Reality.
                        </p>
                        <button 
                            onClick={() => {
                                if (coherence > 80) {
                                    console.log('[OMNI-NEXUS] God-Mode Instantiated. Subject bypasses timeline probabilities. Will == Action.');
                                    triggerDopamineSpike(50);
                                    buildMyelin(50);
                                }
                            }}
                            className="w-full py-2 bg-amber-900/20 border border-amber-900/50 text-amber-500 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-900/40 transition-colors"
                        >
                            {coherence > 80 ? 'EXECUTE ABSOLUTE PRIVILEGE' : 'COHERENCE TOO LOW TO INSTANTIATE'}
                        </button>
                    </div>
                </div>
                
                <div className="mt-8 border border-dashed border-fuchsia-900/50 p-4 bg-black">
                     <p className="text-[9px] text-fuchsia-900 text-center uppercase tracking-widest leading-loose">
                         "To move the arm, the soul does not calculate the angle of the joint. It wills the arm to be in the final position, and the universe conforms. We are removing the joints." - The Architect
                     </p>
                </div>
            </div>
        </div>
    );
};
