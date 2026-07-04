import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, HeartPulse } from 'lucide-react';
import { BiomechanicalCombatGrid, FiniteElementNode } from '../engine/BiomechanicalPhysics';

export default function BiomechanicalSandbox() {
    const [combatGrid] = useState(() => new BiomechanicalCombatGrid());
    const [bones, setBones] = useState({
        cervicalVertebrae: new FiniteElementNode(8500, 42000), // High stiffness
        orbitalBone: new FiniteElementNode(3000, 15000),       // Lower threshold
        ulnarCollateralLigament: new FiniteElementNode(5000, 22000)
    });
    
    const [telemetry, setTelemetry] = useState<any[]>([]);

    useEffect(() => {
        let animationFrameId: number;
        let lastTime = performance.now();

        const animate = (time: number) => {
            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            // Physical state updates are synchronized precisely with the browser's refresh rate,
            // reducing visual judder during high-impact wrestling maneuvers.
            // Future tie-in: combatGrid.step(deltaTime)
            
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [combatGrid]);

    const triggerStrike = (targetId: keyof typeof bones, mass: number, velocity: number) => {
        const bone = bones[targetId];
        // Generate pseudo-random moment of inertia and angular properties for impact
        const momentOfInertia = mass * 0.4;
        const angularVelocity = velocity * 0.5;

        const result = combatGrid.simulateStrikeImpact(mass, velocity, angularVelocity, momentOfInertia, bone);
        
        setTelemetry(prev => [{
            id: Date.now(),
            target: targetId,
            energy: result.kineticEnergy.toFixed(2),
            fracture: result.fractured,
            time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 8));

        // Update state
        setBones({...bones});
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0512] text-fuchsia-100 font-mono border-t border-fuchsia-900/30">
            <div className="p-4 border-b border-fuchsia-900/40 bg-[#0f0a1c]/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity className="text-red-500 w-5 h-5" />
                    <h2 className="tracking-[0.2em] font-bold text-sm uppercase">Biomechanical Combat Simulator (The Sandbox)</h2>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Visualizer Simulation Area */}
                <div className="flex-[2] p-6 flex flex-col relative">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent pointer-events-none" />
                    <h3 className="text-xs uppercase tracking-widest text-[#cbd5e1] mb-6 flex items-center gap-2 font-bold z-10">
                        <Cpu className="w-4 h-4 text-red-500" /> Active Vector Grid Generation
                    </h3>

                    <div className="flex flex-wrap gap-4 z-10">
                        {Object.entries(bones).map(([key, node]: [string, any]) => (
                            <div key={key} className={`border p-4 rounded-lg flex flex-col gap-2 min-w-[200px] shadow-lg transition-colors duration-500 ${node.currentlyFractured ? 'border-red-600 bg-red-950/40' : 'border-fuchsia-900 bg-[#11051c]'}`}>
                                <h4 className="text-xs uppercase tracking-widest text-gray-300 font-bold">{key}</h4>
                                <div className="text-[10px] uppercase text-fuchsia-500 font-mono tracking-wider">
                                    Stiffness: {node.stiffnessMatrixK} <br/>
                                    Yield Pt: {node.yieldPoint}
                                </div>
                                <div className="mt-2 font-bold text-xs">
                                    {node.currentlyFractured ? (
                                        <span className="text-red-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> INTEGRITY YIELDED</span>
                                    ) : (
                                        <span className="text-emerald-400">STRUCTURAL STABLE</span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => triggerStrike(key as keyof typeof bones, 15, 65)} 
                                    disabled={node.currentlyFractured}
                                    className="mt-2 bg-fuchsia-950 hover:bg-red-900/60 border border-fuchsia-800 disabled:opacity-50 text-[10px] uppercase p-2 rounded transition-all cursor-pointer"
                                >
                                    Execute Strike (m15, v65)
                                </button>
                                <button 
                                    onClick={() => triggerStrike(key as keyof typeof bones, 5, 30)} 
                                    disabled={node.currentlyFractured}
                                    className="mt-1 bg-fuchsia-950 hover:bg-amber-900/60 border border-fuchsia-800 disabled:opacity-50 text-[10px] uppercase p-2 rounded transition-all cursor-pointer"
                                >
                                    Grapple Leverage (m5, v30)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Telemetry Output */}
                <div className="flex-1 bg-[#0c0617] border-l border-fuchsia-900/30 p-6 overflow-y-auto custom-scrollbar z-10">
                    <h3 className="text-xs uppercase tracking-widest text-[#cbd5e1] mb-6 flex items-center gap-2 font-bold z-10">
                        <HeartPulse className="w-4 h-4 text-emerald-500" /> Autonomic Telemetry Logs
                    </h3>

                    <div className="flex flex-col gap-3">
                        {telemetry.length === 0 && (
                            <div className="text-[10px] opacity-40 font-mono text-center tracking-widest uppercase">No kinetic vector collisions logged.</div>
                        )}
                        {telemetry.map(log => (
                            <div key={log.id} className="p-3 bg-[#150a24] border border-fuchsia-900/50 rounded shadow flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] uppercase tracking-widest opacity-60">
                                    <span>[KINEMATIC VECTOR COLLAPSE]</span>
                                    <span>{log.time}</span>
                                </div>
                                <div className="text-[11px] font-mono mt-1 text-gray-300">
                                    Target: <span className="text-fuchsia-300">{log.target}</span><br/>
                                    Transferred Energy: <span className="text-cyan-400">{log.energy} Joules</span>
                                </div>
                                {log.fracture && (
                                    <div className="text-[10px] text-red-500 uppercase tracking-wider font-bold mt-1 bg-red-950/50 inline-block px-2 py-1 rounded">
                                        Finite Element Yield Breached
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
