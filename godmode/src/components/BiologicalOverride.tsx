import React, { useState } from 'react';
import { Shield, FastForward, Activity, CheckCircle, Dna, Database } from 'lucide-react';
import { NeurochemicalDashboard } from './NeurochemicalDashboard';
import { useBiologicalStore } from '../store/useBiologicalStore';

interface OverrideLog {
    id: string;
    type: 'TENSILE_YIELD' | 'AUTONOMOUS_DAMPING' | 'FORWARD_VECTOR' | 'DNA_BASE_EDIT' | 'CELLULAR_REJUVENATION';
    description: string;
    timestamp: Date;
    energySaved: number;
}

export function BiologicalOverride() {
    const [logs, setLogs] = useState<OverrideLog[]>([]);
    const [newDesc, setNewDesc] = useState('');
    const [overrideType, setOverrideType] = useState<OverrideLog['type']>('FORWARD_VECTOR');
    const [dnaSequence, setDnaSequence] = useState('ATCG-GCTA-TTAG-CGCT');

    const { triggerDopamineSpike, triggerAdrenaline, dampenAmygdala, buildMyelin, addJoulesConserved } = useBiologicalStore();

    const handleLog = () => {
        if (!newDesc.trim()) return;
        
        const energyConserved = Math.floor(Math.random() * 50) + 50;
        
        const newLog: OverrideLog = {
            id: Math.random().toString(36).substr(2, 9),
            type: overrideType,
            description: newDesc,
            timestamp: new Date(),
            energySaved: energyConserved // Represents thermodynamic heat conserved
        };

        setLogs([newLog, ...logs]);
        setNewDesc('');
        
        // Neurochemical Impact Mapping
        addJoulesConserved(energyConserved);
        if (overrideType === 'FORWARD_VECTOR') {
            triggerDopamineSpike(20);
            triggerAdrenaline(15);
            console.log('[NEUROLOGY] Forward action executed. Target engaged, Dopamine synthesized.');
        } else if (overrideType === 'TENSILE_YIELD') {
            dampenAmygdala(15);
            buildMyelin(10);
            console.log('[NEUROLOGY] Absolute boundary established. Myelin structural density increased.');
        } else if (overrideType === 'AUTONOMOUS_DAMPING') {
            dampenAmygdala(30);
            console.log('[NEUROLOGY] Chaotic noise successfully damped to 0 Work. Massive GABA release. Perfect calm.');
        } else if (overrideType === 'DNA_BASE_EDIT') {
            triggerDopamineSpike(40);
            setDnaSequence(prev => {
                const bases = ['A', 'T', 'C', 'G'];
                return prev.split('').map(char => char === '-' ? '-' : (Math.random() > 0.8 ? bases[Math.floor(Math.random() * 4)] : char)).join('');
            });
            console.log('[BIOLOGY] DNA base pairs physically edited and rewritten.');
        } else if (overrideType === 'CELLULAR_REJUVENATION') {
            dampenAmygdala(40);
            buildMyelin(20);
            console.log('[BIOLOGY] Cellular senescence reversed via telomerase activation.');
        }
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'TENSILE_YIELD': return <Shield className="w-4 h-4 text-emerald-500" />;
            case 'AUTONOMOUS_DAMPING': return <Activity className="w-4 h-4 text-cyan-500" />;
            case 'FORWARD_VECTOR': return <FastForward className="w-4 h-4 text-amber-500" />;
            case 'DNA_BASE_EDIT': return <Dna className="w-4 h-4 text-purple-500" />;
            case 'CELLULAR_REJUVENATION': return <Database className="w-4 h-4 text-pink-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTotalEnergy = () => logs.reduce((acc, log) => acc + log.energySaved, 0);

    return (
        <div className="w-full h-full bg-[#020202] text-emerald-500 font-mono p-4 flex flex-col border-l border-emerald-900/30 overflow-hidden">
            <div className="border-b border-emerald-900/50 pb-2 mb-4 shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#10b981] flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Biological Override Protocol
                    </h2>
                    <p className="text-[10px] text-emerald-700 mt-1">Direct genetic write access. Complete human machine baseline mutation.</p>
                </div>
                <div className="text-[10px] text-purple-500 font-bold border border-purple-900/50 px-2 py-1 bg-purple-900/20 font-mono flex items-center gap-2">
                     <Dna className="w-3 h-3 animate-pulse" /> SEQ: {dnaSequence}
                </div>
            </div>
            
            <div className="shrink-0 mb-4">
                <NeurochemicalDashboard />
            </div>

            <div className="flex gap-4 mb-4 shrink-0">
                <div className="flex-1 bg-[#050505] border border-emerald-900/30 p-3 rounded">
                    <div className="text-[10px] text-emerald-600 mb-1">TOTAL KINETIC ENERGY CONSERVED</div>
                    <div className="text-2xl font-bold text-emerald-400">{getTotalEnergy()} <span className="text-[10px] text-emerald-600">JOULES</span></div>
                </div>
                <div className="flex-1 bg-[#050505] border border-emerald-900/30 p-3 rounded">
                    <div className="text-[10px] text-emerald-600 mb-1">OVERRIDES EXECUTED</div>
                    <div className="text-2xl font-bold text-emerald-400">{logs.length} <span className="text-[10px] text-emerald-600">EVENTS</span></div>
                </div>
            </div>

            <div className="bg-[#050505] border border-emerald-900/50 p-4 mb-4 shrink-0">
                <div className="text-xs mb-3 text-emerald-400 font-bold border-b border-emerald-900/50 pb-2">EXECUTE CELLULAR REALITY PIVOT</div>
                
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
                    {(['FORWARD_VECTOR', 'TENSILE_YIELD', 'AUTONOMOUS_DAMPING', 'DNA_BASE_EDIT', 'CELLULAR_REJUVENATION'] as const).map(type => (
                        <button 
                            key={type}
                            onClick={() => setOverrideType(type)}
                            className={`px-2 py-1.5 text-[9px] border font-bold ${overrideType === type ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300' : 'bg-black border-emerald-900/30 text-emerald-700 hover:border-emerald-700'}`}
                        >
                            {type.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLog()}
                        placeholder="Log mechanical / biological mutation..."
                        className="flex-1 bg-black border border-emerald-900/50 p-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                        onClick={handleLog}
                        className="bg-emerald-900/30 border border-emerald-500/50 px-6 py-2 hover:bg-emerald-800/40 transition-colors flex items-center justify-center text-emerald-400 font-bold text-xs tracking-widest uppercase hover:shadow-[0_0_10px_#10b981]"
                    >
                        PUNCH
                    </button>
                </div>
                <p className="text-[10px] text-emerald-700 mt-2 font-mono h-4">
                    {overrideType === 'FORWARD_VECTOR' && "> Propel the timeline strictly forward via constructive action."}
                    {overrideType === 'TENSILE_YIELD' && "> Set an absolute boundary. Lock the rigid structural lever."}
                    {overrideType === 'AUTONOMOUS_DAMPING' && "> Absorb chaotic noise as heat. Do not let it translate into Work."}
                    {overrideType === 'DNA_BASE_EDIT' && "> Initiate raw CRISPR-equivalent intent to rewrite cellular identity."}
                    {overrideType === 'CELLULAR_REJUVENATION' && "> Saturate target tissue with pure biological telomerase."}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar border border-emerald-900/30 p-2 bg-[#030303] rounded">
                <div className="text-[10px] mb-2 text-emerald-600 font-bold border-b border-emerald-900/30 pb-1 uppercase tracking-widest pl-1">
                    BIOLOGICAL EVENT HORIZON LOG
                </div>
                <div className="flex flex-col gap-2">
                    {logs.map(log => (
                        <div key={log.id} className="bg-black/50 border-l-2 border-emerald-900/50 hover:border-emerald-500 p-3 flex gap-3 items-start transition-colors group">
                            <div className="mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                {getIcon(log.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-emerald-500">{log.type.replace(/_/g, ' ')}</span>
                                    <span className="text-[9px] text-emerald-800 font-mono">{log.timestamp.toLocaleTimeString()}</span>
                                </div>
                                <div className="text-xs text-emerald-300 font-sans tracking-wide leading-relaxed">{log.description}</div>
                                <div className="text-[9px] text-emerald-600 mt-2 text-right font-mono tracking-widest">+{log.energySaved} J</div>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-center text-emerald-900/50 text-[10px] py-12 font-bold tracking-widest border border-dashed border-emerald-900/20 m-2">
                            AWAITING INITIAL MUTATION VECTOR
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
