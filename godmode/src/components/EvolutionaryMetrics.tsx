import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from 'recharts';
import { Activity, Zap, TrendingDown, Target, Brain } from 'lucide-react';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  generation: i + 1,
  successRate: 0.5 + (0.5 * (i / 20)) + (Math.random() * 0.05),
  entropy: Math.max(0.1, 1 - (i / 20) + (Math.random() * 0.1)),
  convergenceSpeed: Math.max(10, 100 - (i * 4) + (Math.random() * 10))
}));

export default function EvolutionaryMetrics() {
  return (
    <div className="flex flex-col w-full h-full p-6 bg-slate-950 text-slate-200 overflow-y-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-fuchsia-400">
            <Activity className="w-6 h-6" /> Evolutionary Metrics & Agent Telemetry
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Real-time performance tracking of Darwinian self-modifying agents.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
          <Brain className="w-5 h-5 text-cyan-400" />
          <span className="font-mono text-sm">Quantum Chat Link: <span className="text-green-400">ACTIVE</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md">
          <div className="text-slate-400 text-sm font-bold uppercase mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400"/> Avg Success Rate</div>
          <div className="text-3xl font-mono text-emerald-400">92.4%</div>
          <div className="text-xs text-emerald-500/70 mt-1">+1.2% this epoch</div>
        </div>
        <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md">
          <div className="text-slate-400 text-sm font-bold uppercase mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-purple-400"/> System Entropy</div>
          <div className="text-3xl font-mono text-purple-400">0.14</div>
          <div className="text-xs text-purple-500/70 mt-1">-0.05 this epoch</div>
        </div>
        <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md">
          <div className="text-slate-400 text-sm font-bold uppercase mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400"/> Convergence Time</div>
          <div className="text-3xl font-mono text-amber-400">14.2ms</div>
          <div className="text-xs text-amber-500/70 mt-1">-2.1ms this epoch</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md h-[400px]">
          <h3 className="text-slate-300 font-bold mb-4 font-mono text-sm">Agent Success Rate Over Generations</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={mockData}>
              <defs>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="generation" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 1.2]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
              <Area type="monotone" dataKey="successRate" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" name="Success Probability" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md h-[400px]">
          <h3 className="text-slate-300 font-bold mb-4 font-mono text-sm">Entropy vs Convergence Speed</h3>
          <ResponsiveContainer width="100%" height="90%">
            <ComposedChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="generation" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#a855f7" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="entropy" fill="#a855f7" opacity={0.6} name="Entropy Score" />
              <Line yAxisId="right" type="monotone" dataKey="convergenceSpeed" stroke="#f59e0b" strokeWidth={3} name="Convergence (ms)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
