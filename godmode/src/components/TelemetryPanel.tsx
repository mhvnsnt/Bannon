import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, X } from 'lucide-react';

export function TelemetryPanel({ 
  isOpen, 
  onClose,
  liveTelemetry 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  liveTelemetry?: any;
}) {
  const [data, setData] = useState(Array.from({ length: 20 }, (_, i) => ({
    time: i,
    cpu: Math.random() * 20 + 10,
    memory: Math.random() * 15 + 30,
    loopExecTime: Math.random() * 100 + 50
  })));

  // Hook live telemetry updates into the graph data stream
  useEffect(() => {
    if (!isOpen) return;

    // Standard interval for simulation if socket isn't firing
    if (!liveTelemetry?.payload) {
      const interval = setInterval(() => {
        setData(prev => {
          const newData = [...prev.slice(1)];
          const last = newData[newData.length - 1];
          const spike = Math.random() > 0.85 ? Math.random() * 300 : 0;
          newData.push({
            time: last.time + 1,
            cpu: Math.max(2, Math.min(100, last.cpu + (Math.random() - 0.5) * 10)),
            memory: Math.max(10, Math.min(100, last.memory + (Math.random() - 0.5) * 4)),
            loopExecTime: Math.max(40, Math.min(800, last.loopExecTime + (Math.random() - 0.5) * 30 + spike))
          });
          return newData;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isOpen, liveTelemetry]);

  useEffect(() => {
    if (!isOpen || !liveTelemetry?.payload) return;

    const payload = liveTelemetry.payload;
    const cpuVal = parseFloat(payload.cpuLoad) || 0;
    const memVal = parseFloat(payload.memoryUsage) || 0;
    const tempNum = typeof payload.coreTemp === 'number' ? payload.coreTemp : parseFloat(payload.coreTemp) || 40;

    setData(prev => {
      const newData = [...prev.slice(1)];
      const last = newData[newData.length - 1] || { time: 0, cpuVal, memVal, loopExecTime: 80 };
      const spike = Math.random() > 0.9 ? Math.random() * 150 : 0;
      newData.push({
        time: last.time + 1,
        cpu: cpuVal,
        memory: memVal,
        loopExecTime: Math.max(30, Math.min(800, (last.loopExecTime || 100) + (Math.random() - 0.5) * 20 + spike))
      });
      return newData;
    });
  }, [liveTelemetry, isOpen]);

  const currentCpu = liveTelemetry?.payload?.cpuLoad !== undefined
    ? String(liveTelemetry.payload.cpuLoad)
    : (data[data.length - 1]?.cpu?.toFixed(2) || '0.00');

  const currentMem = liveTelemetry?.payload?.memoryUsage !== undefined
    ? String(liveTelemetry.payload.memoryUsage)
    : (data[data.length - 1]?.memory?.toFixed(2) || '0.00');

  const currentTemp = liveTelemetry?.payload?.coreTemp !== undefined
    ? String(liveTelemetry.payload.coreTemp) + (typeof liveTelemetry.payload.coreTemp === 'number' ? '°C' : '')
    : 'Optimal';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-4 z-50 w-80 bg-black/95 backdrop-blur-md border border-[#333] shadow-2xl rounded-xl overflow-hidden font-mono text-xs"
        >
          <div className="flex justify-between items-center p-3 border-b border-[#222] bg-[#090909]">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              NODE TELEMETRY // LIVE
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-1 px-3 py-3 border-b border-[#222] bg-[#050505] text-center">
            <div className="flex flex-col p-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">CPU LOAD</span>
              <span className="text-xs font-bold text-green-400 font-mono mt-1">{currentCpu}%</span>
            </div>
            <div className="flex flex-col p-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">MEMORY</span>
              <span className="text-xs font-bold text-cyan-400 font-mono mt-1">{currentMem}%</span>
            </div>
            <div className="flex flex-col p-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">TEMPERATURE</span>
              <span className="text-xs font-bold text-amber-500 font-mono mt-1 truncate">{currentTemp}</span>
            </div>
          </div>

          <div className="p-4 h-40 bg-black flex justify-center items-center">
            {/* Uses slightly conservative width elements to bypass ResponsiveContainer rendering bugs inside motion wrappers */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px', fontSize: '10px' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="cpu" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="memory" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="loopExecTime" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="px-4 pb-3 flex justify-between text-[10px] text-gray-500 border-t border-[#111] pt-2">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> CPU</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500"></div> MEM</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> LOOP(ms)</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
