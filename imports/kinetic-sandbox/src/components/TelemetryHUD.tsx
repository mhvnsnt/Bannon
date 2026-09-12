import React, { useState } from 'react';
import { usePhysicsStore } from '../store/physicsStore';
import { useHypothalamicStore } from '../store/hypothalamicController';
import { Activity, Beaker, Minus, Maximize2, Droplets } from 'lucide-react';

export function TelemetryHUD() {
    const [minimized, setMinimized] = useState(false);
    
    // Subscribe to specific store variables for HUD
    const calculatedFriction = usePhysicsStore(s => s.calculatedFriction);
    const tissueTrauma = usePhysicsStore(s => s.tissueTrauma);
    const entityPH = usePhysicsStore(s => s.entityPH);
    const simulatedEMG = usePhysicsStore(s => s.simulatedEMG);
    const resetFluidMatrix = usePhysicsStore(s => s.resetFluidMatrix);
    const cfuCount = usePhysicsStore(s => s.cfuCount);
    const thermalVision = usePhysicsStore(s => s.thermalVision);
    const setThermalVision = usePhysicsStore(s => s.setThermalVision);
    const hypothalamicClock = usePhysicsStore(s => s.hypothalamicClock);
    const lactationVolume = usePhysicsStore(s => s.lactationVolume);
    const pupilDilation = usePhysicsStore(s => s.pupilDilation);
    const scleralVasocongestion = usePhysicsStore(s => s.scleralVasocongestion);
    const salivaryViscosity = usePhysicsStore(s => s.salivaryViscosity);

    const hormonalCyclePhase = useHypothalamicStore(s => s.hormonalCyclePhase);
    const resolutionPhaseActive = useHypothalamicStore(s => s.resolutionPhaseActive);

    if (minimized) {
        return (
            <div className="absolute top-4 left-4 z-50">
                <button 
                    onClick={() => setMinimized(false)}
                    className="bg-black/80 border border-cyan-500/30 text-cyan-500 p-2 rounded hover:bg-cyan-900/40 backdrop-blur"
                >
                    <Maximize2 size={16} />
                </button>
            </div>
        );
    }

    const isPain = simulatedEMG > 80;

    return (
        <div className="absolute top-4 left-4 z-50 w-72 bg-black/80 border border-neutral-800 rounded shadow-2xl backdrop-blur font-mono text-xs overflow-hidden flex flex-col">
            <div className="flex justify-between items-center bg-neutral-900/80 px-3 py-2 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider">
                    <Activity size={14} />
                    BIOMECHANICS HUD
                </div>
                <button onClick={() => setMinimized(true)} className="text-gray-500 hover:text-white transition-colors">
                    <Minus size={14} />
                </button>
            </div>
            
            <div className="p-3 space-y-4">
                {/* EMG Readout */}
                <div className="space-y-1">
                    <div className="flex justify-between text-gray-400">
                        <span>Pudendal Nerve EMG</span>
                        <span className={isPain ? 'text-red-500' : 'text-green-400'}>{simulatedEMG.toFixed(1)} Hz</span>
                    </div>
                    <div className="h-12 w-full bg-black/50 border border-white/5 relative overflow-hidden rounded">
                        {/* Fake Waveform */}
                        <svg className="absolute inset-0 h-full w-full stroke-current" preserveAspectRatio="none" style={{ color: isPain ? '#ef4444' : '#4ade80' }}>
                            <polyline
                                fill="none"
                                strokeWidth="1.5"
                                points={Array.from({length: 20}).map((_, i) => {
                                    const x = (i / 19) * 100;
                                    const y = 50 + (isPain ? (Math.random() - 0.5) * 80 : Math.sin(i * 1.5 + Date.now()/200) * 20);
                                    return `${x},${y}`;
                                }).join(' ')}
                            />
                        </svg>
                    </div>
                    <div className="text-[10px]" style={{ color: isPain ? '#ef4444' : '#4ade80' }}>
                        {isPain ? '⚠ NOCICEPTIVE SPIKE (SPLINTING REFLEX)' : '✓ Low-Amplitude Pelvic Oscillation'}
                    </div>
                </div>

                <div className="h-px bg-white/10 w-full" />

                {/* Analytical Telemetry */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-1"><Droplets size={12}/> Friction Matrix (\mu)</span>
                        <span className={calculatedFriction > 1.0 ? 'text-red-500 font-bold' : 'text-cyan-400'}>
                            {calculatedFriction.toFixed(3)}
                        </span>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-gray-400">
                            <span>Tissue Breakdown Risk</span>
                            <span className={tissueTrauma > 0.5 ? 'text-red-500 font-bold animate-pulse' : 'text-cyan-400'}>
                                {(tissueTrauma * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${Math.min(100, tissueTrauma * 100)}%` }} />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-gray-400">
                            <span>Vulnerability (pH Index)</span>
                            <span className={Math.abs(entityPH - 4.5) > 1.0 ? 'text-orange-500 font-bold' : 'text-cyan-400'}>
                                {entityPH.toFixed(2)} pH
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-blue-500 rounded-full overflow-hidden relative">
                            <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_5px_white] transition-all duration-300 flex items-center justify-center" 
                                style={{ left: `${((entityPH - 2) / 7) * 100}%`, transform: 'translateX(-50%)' }}>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Microbiome Health Dashboard */}
                <div className="space-y-2 mt-2 p-2 bg-neutral-900 border border-neutral-700 rounded rounded-t border-t border-b">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[#00ffcc]">MICROBIOME HEALTH</label>
                    <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">Pathogens (CFU):</span>
                        <span className={cfuCount > 1000 ? 'text-red-500 font-bold animate-pulse' : 'text-green-500'}>
                            {cfuCount.toFixed(0)} CFU
                        </span>
                    </div>
                    {cfuCount > 1000 && (
                        <div className="text-[10px] text-red-500 bg-red-900/40 p-1 border border-red-500/50 rounded font-bold text-center">
                            ⚠ ALKALINE CRASH / INFECTION DETECTED
                        </div>
                    )}
                </div>

                {/* Systemic Autonomic Profile */}
                <div className="space-y-1 p-2 bg-neutral-950 border border-neutral-800 rounded text-[9px]">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Hypothalamic Clock:</span>
                        <span className="text-[#aa88ff] font-mono whitespace-nowrap">
                            {(hypothalamicClock * 100).toFixed(1)}% 
                            {resolutionPhaseActive && <span className="text-gray-500 text-[8px] ml-1 uppercase">(Refractory)</span>}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Hormonal Cycle Phase:</span>
                        <span className="text-[#ff55bb] font-mono">{(hormonalCyclePhase * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Pupil Dilation / Ocular:</span>
                        <span className="text-gray-300 font-mono">{(pupilDilation * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Scleral Vasocongestion:</span>
                        <span className={scleralVasocongestion > 0.5 ? "text-red-400 font-mono" : "text-gray-300 font-mono"}>{(scleralVasocongestion * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Salivary Viscosity:</span>
                        <span className="text-[#00ffcc] font-mono">{(salivaryViscosity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Engorgement / Lactation:</span>
                        <span className="text-[#ffbbee] font-mono">{(lactationVolume * 100).toFixed(1)}%</span>
                    </div>
                </div>

                {/* Fluid Matrix Output */}
                <div className="space-y-1 mt-2 p-2 bg-neutral-900 border border-neutral-700 rounded text-[9px]">
                    <div className="text-[9px] uppercase font-bold tracking-widest text-cyan-400 mb-2 border-b border-neutral-800 pb-1">FLUID SECRETION MATRIX</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Vaginal Transudate</span><span className="text-[#aaffff] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidVaginalTransudate * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Cervical Mucus</span><span className="text-[#ffffaa] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidCervicalMucus * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Bartholin Output</span><span className="text-[#aaaaff] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidBartholinMucus * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Skene / Vasocongestion</span><span className="text-[#ffffff] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidSkeneEjaculate * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Menstrual Cycle Shed</span><span className="text-[#ff5555] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidMenstrual * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Labial Smegma Base</span><span className="text-[#ddddaa] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidSmegma * 100).toFixed(0)}%</span></div>
                        
                        <div className="col-span-2 my-1 border-t border-neutral-800"></div>

                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Anal Mucus</span><span className="text-[#ffddaa] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidAnalMucus * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Perianal Sebum</span><span className="text-[#ffaa66] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidPerianalSebum * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Biliary Output</span><span className="text-[#aaffaa] font-mono whitespace-nowrap">{(usePhysicsStore.getState().fluidAnalBile * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Fecal Transit Type</span><span className="text-[#aa6600] font-mono">B-Scl {usePhysicsStore.getState().fecalMatterType}</span></div>

                        <div className="col-span-2 my-1 border-t border-neutral-800"></div>

                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Purulent Discharge (Pus)</span><span className={usePhysicsStore.getState().fluidPurulentDischarge > 0.1 ? 'text-red-500 font-bold' : 'text-gray-400 font-mono whitespace-nowrap'}>{(usePhysicsStore.getState().fluidPurulentDischarge * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 truncate mr-1">Interstitial Swell</span><span className={usePhysicsStore.getState().fluidInterstitial > 0.1 ? 'text-orange-500 font-bold' : 'text-gray-400 font-mono whitespace-nowrap'}>{(usePhysicsStore.getState().fluidInterstitial * 100).toFixed(0)}%</span></div>
                    </div>
                </div>

                <div className="flex gap-2 mt-2">
                    <button 
                        onClick={() => {
                            const data = usePhysicsStore.getState();
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `clinical_trial_export_${Date.now()}.json`;
                            a.click();
                        }}
                        className="flex-1 flex items-center justify-center py-2 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 rounded transition-all uppercase tracking-wider font-bold"
                    >
                        Export Trial
                    </button>
                    <button 
                        onClick={() => setThermalVision(!thermalVision)}
                        className={`flex-1 flex items-center justify-center py-2 text-[10px] border rounded transition-all uppercase tracking-wider font-bold ${thermalVision ? 'bg-orange-600/50 border-orange-500 text-orange-200' : 'bg-black/50 border-orange-900/50 text-orange-700 hover:text-orange-500 hover:border-orange-500'}`}
                    >
                        Thermal Mode
                    </button>
                    {/* Washout Sequence */}
                    <button 
                        onClick={resetFluidMatrix}
                        className="flex-[2] flex items-center justify-center gap-2 py-2 bg-blue-900/30 border border-blue-500/50 hover:bg-blue-800/50 text-blue-300 rounded transition-all text-[10px] uppercase tracking-wider font-bold"
                    >
                        <Beaker size={12} />
                        Systems Wash / Reset
                    </button>
                </div>
            </div>
        </div>
    );
}
