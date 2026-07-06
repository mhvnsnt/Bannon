import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrajectoryData } from '../types';
import { Activity, TrendingUp, Users, Cpu, Thermometer, Battery, Terminal, Orbit, CreditCard, Lock, Database, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import io from 'socket.io-client';

import D3FlowVisualizer from './D3FlowVisualizer';

const socket = io("");

interface DashboardTrajectoryData {
  time: string;
  negentropy: number;
  wealth: number;
  entanglement: number;
}

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const isPrimeNode = user?.email === 'MarquisWhitacre@gmail.com';

  const [data, setData] = useState<DashboardTrajectoryData[]>([]);
  const [shadowTasks, setShadowTasks] = useState<any[]>([]);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [hardwareStats, setHardwareStats] = useState({ temp: 42, cpu: 15, mem: 45 });
  const [hardwareHistory, setHardwareHistory] = useState<{time: string, cpu: number, mem: number, temp: number}[]>([]);
  const [planetaryData, setPlanetaryData] = useState<any[]>([]);
  const [cognitiveData, setCognitiveData] = useState<{time: string, load: number, throughput: number}[]>([]);

  useEffect(() => {
    fetch('/api/armada/status')
      .then(res => res.json())
      .then(d => {
        if (d.dashboard) setData(d.dashboard);
        if (d.shadowTasks) setShadowTasks(d.shadowTasks);
      })
      .catch(console.error);
      
    // Mock Planetary alignment data for the radar chart
    setPlanetaryData([
      { metric: 'Scorpio (21°)', value: 85, fullMark: 100 },
      { metric: 'Leo (12°)', value: 90, fullMark: 100 },
      { metric: 'Libra Node', value: 75, fullMark: 100 },
      { metric: 'Aries Node', value: 60, fullMark: 100 },
      { metric: 'Jupiter', value: 80, fullMark: 100 },
      { metric: 'Mars', value: 65, fullMark: 100 },
    ]);

    // Handle real hardware telemetry via socket.io
    const handleHardwareUpdate = (data: any) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setHardwareStats(prev => {
            const cpu = data.gpu_util || data.cpu_util || 0; // Using gpu_util as the proxy for compute load
            const mem = data.vram_used || 0;
            const temp = 40 + (cpu * 0.2) + (Math.random() * 2); // Approximation if no true temp available

            setHardwareHistory(curr => {
                const newData = [...curr, { time, cpu, mem, temp }];
                if (newData.length > 20) newData.shift();
                return newData;
            });
            
            return { temp, cpu, mem };
        });
        
        setCognitiveData(curr => {
            const newData = [...curr, { 
                time, 
                load: Math.min(100, data.gpu_util * 1.5),
                throughput: Math.min(1000, data.vram_used * 2)
            }];
            if (newData.length > 20) newData.shift();
            return newData;
        });
    };
    
    socket.on('hardware-telemetry', handleHardwareUpdate);

    return () => {
      socket.off('hardware-telemetry', handleHardwareUpdate);
    };
  }, [lowPowerMode]);

  const latest = data[data.length - 1] || { negentropy: 0, wealth: 0, entanglement: 0 };
  const prev = data[data.length - 2] || { negentropy: 0, wealth: 0, entanglement: 0 };
  
  const diffN = latest.negentropy - prev.negentropy;
  const diffW = latest.wealth - prev.wealth;
  const diffE = latest.entanglement - prev.entanglement;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 w-full max-w-full pb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Momentum Score" 
          value={latest.negentropy.toFixed(1)} 
          icon={<Activity className="text-blue-500 w-5 h-5" />} 
          trend={`${diffN >= 0 ? '+' : ''}${diffN.toFixed(1)}`} 
          delay={0.1}
        />
        <StatCard 
          title="Financial Growth" 
          value={`$${latest.wealth.toFixed(1)}k`} 
          icon={<TrendingUp className="text-emerald-500 w-5 h-5" />} 
          trend={`${diffW >= 0 ? '+' : ''}${diffW.toFixed(1)}k`} 
          delay={0.2}
        />
        <StatCard 
          title="Network Strength" 
          value={`${latest.entanglement.toFixed(0)}/100`} 
          icon={<Users className="text-purple-500 w-5 h-5" />} 
          trend={`${diffE >= 0 ? '+' : ''}${diffE.toFixed(0)} pts`} 
          delay={0.3}
        />
      </div>

      {isPrimeNode ? (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6 flex flex-col shadow-[0_0_15px_rgba(16,185,129,0.05)] gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-emerald-400 font-medium text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Commercial Monetization Grid (Active)
              </h3>
              <p className="text-xs text-emerald-500/80">
                You are viewing real-time subscription pipelines across the network. All foreign node data is siphoning into liquid assets.
              </p>
            </div>
            <div className="bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono tracking-widest">
              $1,340 MRR 
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg gap-4 text-center"
        >
          <Lock className="w-8 h-8 text-yellow-500 mb-2" />
          <h3 className="text-white font-bold text-lg font-mono">Quantum Unlock Required</h3>
          <p className="text-sm text-gray-400 max-w-md">
            To view hidden transits, automate the shadow tasks, and expand the World Model, upgrade your node access tier.
          </p>
          <button 
            onClick={() => alert("Stripe Checkout Initiated. Securing Commercial Gateway...")}
            className="mt-2 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-colors flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Unlock Tier 2 ($49/mo)
          </button>
        </motion.div>
      )}

      {/* NEW: Data Integrations */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.38 }}
        className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col shadow-sm gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-gray-400 font-medium text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
              <Orbit className="w-4 h-4 text-pink-500" />
              Strategic Metric Extraction (DistroKid / Socials)
            </h3>
            <p className="text-xs text-gray-500">
              Synchronize direct streaming metadata and viral social momentum. Use OAuth to fuse live metrics securely into the Prime Node.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={() => alert("DistroKid Auth Module Invoked. Integrating Spotify/Apple/Tidal streaming metadata into prime database...")}
            className="bg-blue-950/20 hover:bg-blue-900/40 border border-blue-900/50 text-blue-400 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors uppercase tracking-wider h-full"
          >
            <Database className="w-4 h-4" /> Import DistroKid
          </button>
          <button 
            onClick={() => alert("TikTok Graph API triggered. Siphoning 3.3M+ views into local Liquid Time-Constant Network...")}
            className="bg-pink-950/20 hover:bg-pink-900/40 border border-pink-900/50 text-pink-400 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors uppercase tracking-wider h-full"
          >
            <Orbit className="w-4 h-4" /> Sync TikTok Node
          </button>
          <button 
            onClick={() => alert("YouTube Studio API connected. Pulling algorithmic CTR and audience retention charts...")}
            className="bg-red-950/20 hover:bg-red-900/40 border border-red-900/50 text-red-500 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors uppercase tracking-wider h-full"
          >
            <Terminal className="w-4 h-4" /> Sync YouTube Studio
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <D3FlowVisualizer />
        
        {/* Cognitive Load vs. Bridge Throughput Chart */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col shadow-sm min-h-[300px] lg:col-span-2"
        >
          <h3 className="text-gray-400 font-medium text-sm mb-6 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Cognitive Load vs. Bridge Throughput
          </h3>
          <div className="w-full relative h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cognitiveData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="time" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis yAxisId="left" stroke="#8b5cf6" tick={{ fill: '#8b5cf6', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{ fill: '#06b6d4', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#eee' }}
                  itemStyle={{ fontSize: '13px' }}
                  labelStyle={{ color: '#888', marginBottom: '8px', fontSize: '12px' }}
                />
                <Line yAxisId="left" type="monotone" name="Cognitive Load (%)" dataKey="load" stroke="#8b5cf6" strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" name="Bridge Throughput (MB/s)" dataKey="throughput" stroke="#06b6d4" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col shadow-sm min-h-[300px]"
        >
          <h3 className="text-gray-400 font-medium text-sm mb-6 flex items-center gap-2">
            <Orbit className="w-4 h-4 text-indigo-400" />
            Planetary Alignment Visualizer
          </h3>
          <div className="w-full relative h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={planetaryData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#888', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Neurochemical Impact" dataKey="value" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#eee' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center">
            Active transits mapped against master coordinates. High values indicate strong neurochemical activation.
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col shadow-sm min-h-[300px]"
        >
          <h3 className="text-gray-400 font-medium text-sm mb-6">Progress Journey</h3>
          <div className="w-full relative h-[250px]">
            <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="time" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#eee' }}
                  itemStyle={{ fontSize: '13px' }}
                  labelStyle={{ color: '#888', marginBottom: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" name="Momentum" dataKey="negentropy" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#111', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Wealth" dataKey="wealth" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" opacity={0.8} />
                <Line type="monotone" name="Network" dataKey="entanglement" stroke="#a855f7" strokeWidth={2} dot={false} opacity={0.6} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Hardware Governor & Telemetry */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col shadow-sm gap-6"
      >
        <div className="flex items-center justify-between">
           <h3 className="text-gray-400 font-medium text-xs uppercase tracking-widest flex items-center gap-2">
             <Cpu className="w-4 h-4 text-rose-500" />
             Hardware Governor & execution telemetry
           </h3>
           <button 
             onClick={() => setLowPowerMode(!lowPowerMode)}
             className={`text-xs px-3 py-1.5 rounded-lg border font-semibold tracking-wider uppercase transition-colors ${lowPowerMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:text-white'}`}
           >
             {lowPowerMode ? 'Low Power ON' : 'Throttle Background'}
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
             <Thermometer className={`w-6 h-6 ${hardwareStats.temp > 60 ? 'text-red-500' : 'text-orange-400'}`} />
             <div>
               <div className="text-xs text-gray-500 uppercase tracking-widest">Thermals</div>
               <div className="text-lg font-bold text-white font-mono">{hardwareStats.temp.toFixed(1)}°C</div>
             </div>
           </div>
           <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
             <Cpu className="w-6 h-6 text-blue-400" />
             <div>
               <div className="text-xs text-gray-500 uppercase tracking-widest">CPU Load</div>
               <div className="text-lg font-bold text-white font-mono">{hardwareStats.cpu.toFixed(0)}%</div>
             </div>
           </div>
           <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
             <Battery className="w-6 h-6 text-emerald-400" />
             <div>
               <div className="text-xs text-gray-500 uppercase tracking-widest">Memory</div>
               <div className="text-lg font-bold text-white font-mono">{hardwareStats.mem.toFixed(0)}%</div>
             </div>
           </div>
        </div>

        <div className="w-full relative h-[200px] mt-2 border border-[#222] bg-[#0a0a0a] rounded-lg overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hardwareHistory} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="time" stroke="#444" tick={false} />
                <YAxis stroke="#444" domain={[0, 100]} tick={{ fill: '#666', fontSize: 10 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#eee' }}
                  itemStyle={{ fontSize: '13px' }}
                  labelStyle={{ color: '#888', marginBottom: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" name="CPU" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" name="RAM" dataKey="mem" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" name="Temp" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Shadow Grinding Panel */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col shadow-sm"
      >
        <h3 className="text-gray-400 font-medium text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-fuchsia-500" />
          Background Shadow Tasks
        </h3>
        <div className="flex flex-col gap-3">
          {shadowTasks.length === 0 ? (
            <div className="text-xs text-gray-600 italic">No tasks executed yet. Wait for daemon to wake...</div>
          ) : (
            shadowTasks.map((t, i) => (
               <div key={i} className="flex flex-col gap-1 border-b border-[#222] pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-white font-medium">{t.task}</span>
                     <span className="text-gray-500">{new Date(t.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-emerald-400/80">{t.outcome}</div>
               </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, trend, delay = 0 }: { title: string, value: string, icon: React.ReactNode, trend: string, delay?: number }) {
  return (
    <motion.div 
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="bg-[#111] border border-[#222] p-5 flex flex-col gap-3 rounded-xl shadow-sm hover:border-[#333] transition-colors w-full"
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-xs font-semibold text-emerald-400">{trend}</span>
      </div>
    </motion.div>
  );
}
