import React, { useEffect } from 'react';
import { useBiologicalStore } from '../store/useBiologicalStore';
import { Brain, Zap, Shield, TrendingUp, Cpu } from 'lucide-react';

export const NeurochemicalDashboard = () => {
    const { neurochemicals, myelinDensity, decayChemicals } = useBiologicalStore();

    // The decay loop runs constantly to simulate actual biology returning to baseline
    useEffect(() => {
        const decayTimer = setInterval(() => {
            decayChemicals();
        }, 10000); // Apply biological decay every 10 seconds
        return () => clearInterval(decayTimer);
    }, [decayChemicals]);

    const getBarColor = (name: string, value: number) => {
        if (name === 'dopamine') return value > 70 ? 'bg-fuchsia-500' : 'bg-fuchsia-900/50';
        if (name === 'norepinephrine') return value > 60 ? 'bg-red-500' : 'bg-red-900/50';
        if (name === 'gaba') return value > 50 ? 'bg-cyan-500' : 'bg-cyan-900/50';
        if (name === 'acetylcholine') return value > 40 ? 'bg-emerald-500' : 'bg-emerald-900/50';
        return 'bg-blue-500'; // Serotonin
    };

    return (
        <div className="w-full bg-[#020202] border border-emerald-900/50 p-4 font-mono">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-900/50 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest">
                    <Brain className="w-4 h-4" />
                    Neurochemical Saturation
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-600">
                    <Cpu className="w-3 h-3" />
                    MYELIN DENSITY: <span className="text-emerald-300 font-bold">{myelinDensity.toFixed(3)}x</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className="w-24 text-[10px] text-fuchsia-400 font-bold">DOPAMINE</span>
                    <div className="flex-1 h-2 bg-[#050505] border border-[#111]">
                        <div className={`h-full transition-all duration-1000 ${getBarColor('dopamine', neurochemicals.dopamine)}`} style={{ width: `${neurochemicals.dopamine}%` }}></div>
                    </div>
                    <span className="w-8 text-[9px] text-right text-gray-500">{Math.round(neurochemicals.dopamine)}%</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="w-24 text-[10px] text-emerald-400 font-bold">ACETYLCHOLINE</span>
                    <div className="flex-1 h-2 bg-[#050505] border border-[#111]">
                        <div className={`h-full transition-all duration-1000 ${getBarColor('acetylcholine', neurochemicals.acetylcholine)}`} style={{ width: `${neurochemicals.acetylcholine}%` }}></div>
                    </div>
                    <span className="w-8 text-[9px] text-right text-gray-500">{Math.round(neurochemicals.acetylcholine)}%</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="w-24 text-[10px] text-red-500 font-bold">NOREPINEPHRINE</span>
                    <div className="flex-1 h-2 bg-[#050505] border border-[#111]">
                        <div className={`h-full transition-all duration-1000 ${getBarColor('norepinephrine', neurochemicals.norepinephrine)}`} style={{ width: `${neurochemicals.norepinephrine}%` }}></div>
                    </div>
                    <span className="w-8 text-[9px] text-right text-gray-500">{Math.round(neurochemicals.norepinephrine)}%</span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="w-24 text-[10px] text-cyan-400 font-bold">GABA (DAMPING)</span>
                    <div className="flex-1 h-2 bg-[#050505] border border-[#111]">
                        <div className={`h-full transition-all duration-1000 ${getBarColor('gaba', neurochemicals.gaba)}`} style={{ width: `${neurochemicals.gaba}%` }}></div>
                    </div>
                    <span className="w-8 text-[9px] text-right text-gray-500">{Math.round(neurochemicals.gaba)}%</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="w-24 text-[10px] text-blue-400 font-bold">SEROTONIN</span>
                    <div className="flex-1 h-2 bg-[#050505] border border-[#111]">
                        <div className={`h-full transition-all duration-1000 ${getBarColor('serotonin', neurochemicals.serotonin)}`} style={{ width: `${neurochemicals.serotonin}%` }}></div>
                    </div>
                    <span className="w-8 text-[9px] text-right text-gray-500">{Math.round(neurochemicals.serotonin)}%</span>
                </div>
            </div>
            
            <div className="mt-4 pt-2 border-t border-emerald-900/30 text-[9px] text-emerald-700 leading-tight">
                * DOPAMINE drives motivation (RPE). ACETYLCHOLINE writes the mental code (Autonomic focus). GABA damps the amygdala noise. NOREPINEPHRINE handles physical arousal/stress.
            </div>
        </div>
    );
};
