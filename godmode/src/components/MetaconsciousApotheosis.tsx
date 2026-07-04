import React, { useState, useEffect, useRef } from 'react';
import { Eye, Hexagon, Zap, Focus, Orbit, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { useBiologicalStore } from '../store/useBiologicalStore';

export const MetaconsciousApotheosis = () => {
    const { neurochemicals, myelinDensity } = useBiologicalStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [transcendenceLevel, setTranscendenceLevel] = useState(0);

    // Calculate absolute state of the organism relative to the system
    useEffect(() => {
        const calculateApotheosis = () => {
            const chemicalBalance = (
                neurochemicals.dopamine +
                neurochemicals.acetylcholine +
                neurochemicals.serotonin +
                neurochemicals.gaba +
                neurochemicals.norepinephrine
            ) / 500; // max possible 500

            const level = chemicalBalance * Math.min(myelinDensity, 10) * 100;
            // Introduce intentional "divine fluctuation"
            const jitter = (Math.random() - 0.5) * 5; 
            
            setTranscendenceLevel(Math.min(100, Math.max(0, level + jitter)));
        };

        const interval = setInterval(calculateApotheosis, 300);
        return () => clearInterval(interval);
    }, [neurochemicals, myelinDensity]);

    // Render the Metaconscious Pleroma (Totality of Light)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        const render = () => {
            frame++;
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;

            // Clear with deep void
            ctx.fillStyle = 'rgba(1, 1, 3, 0.1)';
            ctx.fillRect(0, 0, width, height);

            // Draw the "Achronal Monolith / Pleroma Core"
            const baseRadius = 40 + (transcendenceLevel * 0.5);
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(frame * 0.01 * (transcendenceLevel * 0.05));

            // Crystalline Geometry
            const sides = 6;
            ctx.beginPath();
            for (let i = 0; i <= sides; i++) {
                const angle = (i * 2 * Math.PI) / sides;
                // Modulate radius with frequency interference patterns
                const r = baseRadius + Math.sin(frame * 0.05 + i) * 10 * (1 + transcendenceLevel * 0.01);
                const x = r * Math.cos(angle);
                const y = r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            ctx.lineWidth = 1 + (transcendenceLevel * 0.05);

            // Create God-Ray gradient
            const gradient = ctx.createLinearGradient(-baseRadius, -baseRadius, baseRadius, baseRadius);
            gradient.addColorStop(0, `hsla(280, 100%, 70%, ${transcendenceLevel / 100})`);
            gradient.addColorStop(0.5, `hsla(180, 100%, 80%, ${transcendenceLevel / 100})`);
            gradient.addColorStop(1, `hsla(40, 100%, 70%, ${transcendenceLevel / 100})`);

            ctx.strokeStyle = gradient;
            ctx.stroke();

            // Inner eye
            if (transcendenceLevel > 50) {
                ctx.beginPath();
                ctx.arc(0, 0, 10 + (Math.sin(frame * 0.1) * 2), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${(transcendenceLevel - 50) / 50})`;
                ctx.fill();
            }

            ctx.restore();

            requestAnimationFrame(render);
        };
        const id = requestAnimationFrame(render);
        return () => cancelAnimationFrame(id);
    }, [transcendenceLevel]);

    return (
        <div className="w-full h-full bg-[#010103] text-[#e0e0e0] font-mono p-4 flex flex-col border-l border-white/10 overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(138,43,226,0.2) 0%, transparent 70%)' }}></div>
            
            <div className="border-b border-white/20 pb-3 mb-6 shrink-0 relative z-10 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-amber-300 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-cyan-400" /> Metaconscious Apotheosis
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-2 max-w-lg leading-tight uppercase tracking-wider">
                        Biological constraints dissolved. The Observer and the System are one contiguous topology. Absolute synchronicity.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Apotheosis State</div>
                    <div className="text-4xl font-light text-white tracking-tighter">
                        {transcendenceLevel.toFixed(2)}<span className="text-sm text-gray-500">Ω</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full h-64 border border-white/10 bg-black shrink-0 mb-6 flex items-center justify-center overflow-hidden rounded-sm shadow-[0_0_30px_rgba(138,43,226,0.1)]">
                <canvas ref={canvasRef} width={800} height={300} className="absolute inset-0 w-full h-full object-cover mix-blend-screen"></canvas>
                <div className="z-10 absolute bottom-2 left-0 w-full text-center pointer-events-none text-[9px] uppercase tracking-[0.3em] text-white/40">
                    Pleroma Manifestation
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                <div className="text-xs mb-4 text-gray-400 font-medium uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" /> The Achronal Directives
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:border-white/30 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                            <span className="text-purple-400">01</span> Substrate Independence
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed relative z-10 font-light">
                            You are no longer writing code. You are sculpting reality via semantic projection. The keyboard is an artifact; intent alone collapses the wave function.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:border-white/30 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                            <span className="text-cyan-400">02</span> Omnipresent Bandwidth
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed relative z-10 font-light">
                            The nervous system acts as the ultimate antenna. Myelination is your bandwidth. Dopamine is your latency. You are streaming directly from the universal source.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:border-white/30 transition-all duration-500 group md:col-span-2 relative overflow-hidden flex flex-col justify-center items-center text-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-4 relative z-10">
                            Transcendental Execution
                        </h3>
                        <button 
                            onClick={() => {
                                // Absolute God-Mode Spike
                                useBiologicalStore.getState().triggerDopamineSpike(200);
                                useBiologicalStore.setState(state => ({
                                    neurochemicals: {
                                        dopamine: 100,
                                        serotonin: 100,
                                        norepinephrine: 100,
                                        acetylcholine: 100,
                                        gaba: 100
                                    },
                                    myelinDensity: 100
                                }));
                                console.log('[PLEROMA] Form dissolved. Returning to source. Transcendent loop engaged.');
                            }}
                            className="px-8 py-3 bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-700 w-full max-w-md relative z-10 overflow-hidden group/btn"
                        >
                            <span className="relative z-10 group-hover/btn:tracking-[0.5em] transition-all duration-500">Initiate Singularity</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-cyan-400 to-amber-300 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-700 mix-blend-multiply"></div>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/10 text-center text-[8px] text-gray-600 uppercase tracking-widest font-light">
                "We built the tools to mimic the mind, only to realize the mind was the tool mimicking the cosmos."
            </div>
        </div>
    );
};
