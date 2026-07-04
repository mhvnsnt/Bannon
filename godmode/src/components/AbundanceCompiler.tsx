import { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { Network, Database, Activity, DollarSign, TrendingUp, Cpu, Workflow } from 'lucide-react';

const mockThroughputData = [
  { id: 'Phase I', capital: 1200, attention: 2400, density: 45 },
  { id: 'Phase II', capital: 2100, attention: 3200, density: 55 },
  { id: 'Phase III', capital: 1800, attention: 4100, density: 62 },
  { id: 'Phase IV', capital: 3600, attention: 5500, density: 78 },
  { id: 'Phase V', capital: 4900, attention: 7200, density: 88 },
  { id: 'Apex Array', capital: 8400, attention: 9500, density: 95 },
];

const vectorCapitalData = [
    { source: 'Media Distribution', yield: 4500, conversion: 88 },
    { source: 'Interactive Territory', yield: 6200, conversion: 75 },
    { source: 'Sonic Architecture', yield: 3600, conversion: 92 },
    { source: 'Private Advisin', yield: 8500, conversion: 80 },
    { source: 'System Licensing', yield: 5400, conversion: 85 },
    { source: 'Structural Land', yield: 15000, conversion: 98 },
    { source: 'Generational Vault', yield: 25000, conversion: 99 },
    { source: 'Node Authority', yield: 50000, conversion: 100 },
];

export const AbundanceCompiler = () => {
    const [isCompiling, setIsCompiling] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeTarget, setActiveTarget] = useState('Absolute Territorial Gravity');

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 0;
                return prev + (Math.random() * 5);
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-[#030005] font-mono relative overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <DollarSign className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-emerald-400">Abundance Compiler</h1>
                        <p className="text-xs text-emerald-600/80 uppercase tracking-widest mt-1 font-bold">Maximizing Economic Throughput & Resource Density. Engineering absolute loyalty.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-[#0a0a0a] border border-[#222] p-2 rounded-lg">
                    <Activity className={`w-4 h-4 ${progress > 50 ? 'text-emerald-500 animate-pulse' : 'text-gray-500'}`} />
                    <div className="w-32 h-1.5 bg-[#111] rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-gray-400 w-8">{Math.floor(progress)}%</span>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Graph (Throughput) */}
                <div className="col-span-1 lg:col-span-2 bg-[#0a0a0a]/80 border border-emerald-900/30 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Probability Collapse: Capital & Attention Matrix
                        </h2>
                    </div>

                    <div className="h-64 md:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockThroughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorAttention" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="id" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                    labelStyle={{ color: '#888', marginBottom: '4px' }}
                                />
                                <Area type="monotone" dataKey="attention" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorAttention)" />
                                <Area type="monotone" dataKey="capital" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCapital)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vectors & Tiers */}
                <div className="col-span-1 flex flex-col gap-6">
                    <div className="bg-[#0a0a0a]/80 border border-emerald-900/30 rounded-xl p-6 flex-1">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Workflow className="w-4 h-4 text-emerald-500" />
                            Kinetic Yield Vectors
                        </h2>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={vectorCapitalData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#555" fontSize={10} hide />
                                    <YAxis dataKey="source" type="category" stroke="#888" fontSize={10} axisLine={false} tickLine={false} width={100} />
                                    <Tooltip 
                                        cursor={{fill: '#111'}}
                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="yield" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a]/80 border border-emerald-900/30 rounded-xl p-6 flex-1 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5">
                            <Database className="w-32 h-32 text-emerald-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Network className="w-4 h-4 text-emerald-500" />
                            Sector Matrix Macros
                        </h2>
                        <div className="flex flex-col gap-3 relative z-10">
                            {[
                                { label: 'Absolute Territorial Gravity', val: 'INITIALIZING', color: 'text-emerald-400' },
                                { label: 'Autonomous Digital Clone', val: 'COMPILING', color: 'text-fuchsia-400' },
                                { label: 'The Generational Vault', val: 'ALLOCATING', color: 'text-amber-400' },
                                { label: 'Primary Node Authority', val: 'ACTIVE', color: 'text-cyan-400' },
                            ].map((stat, i) => (
                                <div key={i} 
                                    onClick={() => setActiveTarget(stat.label)}
                                    className={`flex justify-between items-center border-b border-[#222] pb-2 cursor-pointer transition-all ${activeTarget === stat.label ? 'bg-white/5 pl-2 border-l-2 border-l-emerald-500' : 'hover:bg-white/5'}`}>
                                    <span className="text-[11px] text-gray-500 uppercase">{stat.label}</span>
                                    <span className={`font-black tracking-wider ${stat.color}`}>{stat.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Action Bar */}
            <div className="mt-auto border border-emerald-900/40 bg-emerald-950/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-[10px] text-emerald-600/70 uppercase tracking-[0.2em] max-w-lg">
                    System aligned. Target: [{activeTarget.toUpperCase()}]. The Reality Compiler translates intent into automated content generation. Action yields mass.
                </div>
                <button 
                    onClick={() => setIsCompiling(!isCompiling)}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${isCompiling ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#111] text-gray-400 border border-[#333] hover:border-emerald-500/50 hover:text-emerald-400'}`}
                >
                    {isCompiling ? 'Synthesizing...' : 'Compile Attraction Vector'}
                </button>
            </div>
        </div>
    );
}
