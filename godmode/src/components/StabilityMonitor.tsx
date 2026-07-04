import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';

export function StabilityMonitor() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io();

    socket.on('connect', () => {
      setWsConnected(true);
      console.log('[StabilityMonitor] Connected to Telemetry Stream');
    });

    socket.on('bannon-telemetry', (data) => {
      try {
        setTelemetry(data);

        // Alert Logic
        const newAlerts: string[] = [];
        if (data.frame_time_ms && data.frame_time_ms > 16) {
          newAlerts.push(`FRAME TIME SPIKE: ${data.frame_time_ms.toFixed(2)}ms`);
        }
        if (data.ragdoll_jitter_count && data.ragdoll_jitter_count > 3) {
          newAlerts.push(`PHYSICS JITTER COMPROMISED: ${data.ragdoll_jitter_count} counts`);
        }
        
        if (newAlerts.length > 0) {
           setAlerts(prev => {
              const combined = [...newAlerts, ...prev].slice(0, 5); // Keep last 5
              return combined;
           });
        }
      } catch (e) {
        console.error("Telemetry parse error", e);
      }
    });

    socket.on('disconnect', () => {
      setWsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-[#222]">
      <div className="p-4 border-b border-[#222] bg-[#111]">
        <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-red-500">
          <Activity className="w-4 h-4" />
          Stability Monitor
        </h2>
        <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
           {wsConnected ? 'LINK ESTABLISHED' : 'AWAITING TELEMETRY VIA SOCKET.IO'}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Current State */}
        {telemetry && (
          <div className="grid grid-cols-2 gap-3 mb-4">
             <div className="bg-[#1a1a1a] border border-[#222] rounded p-2">
                 <div className="text-[10px] uppercase text-gray-500 mb-1">Frame Time</div>
                 <div className={`text-lg font-mono ${telemetry.frame_time_ms > 16 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {telemetry.frame_time_ms?.toFixed(2)} ms
                 </div>
             </div>
             <div className="bg-[#1a1a1a] border border-[#222] rounded p-2">
                 <div className="text-[10px] uppercase text-gray-500 mb-1">Jitter Count</div>
                 <div className={`text-lg font-mono ${telemetry.ragdoll_jitter_count > 3 ? 'text-red-400' : 'text-white'}`}>
                    {telemetry.ragdoll_jitter_count}
                 </div>
             </div>
             <div className="bg-[#1a1a1a] border border-[#222] rounded p-2">
                 <div className="text-[10px] uppercase text-gray-500 mb-1">Poise</div>
                 <div className="text-lg font-mono text-blue-400">{telemetry.poise?.toFixed(0)}</div>
             </div>
             <div className="bg-[#1a1a1a] border border-[#222] rounded p-2">
                 <div className="text-[10px] uppercase text-gray-500 mb-1">Stamina</div>
                 <div className="text-lg font-mono text-green-400">{telemetry.stamina?.toFixed(0)}</div>
             </div>
          </div>
        )}

        {/* Alerts Log */}
        <div>
           <div className="text-xs uppercase font-bold text-gray-400 mb-2 border-b border-[#222] pb-1">Triggered Alerts</div>
           <div className="space-y-2">
             <AnimatePresence>
                {alerts.map((al, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] font-mono bg-red-950/20 text-red-400 border border-red-900/30 p-2 rounded flex items-center gap-2"
                  >
                     <AlertTriangle className="w-3 h-3" />
                     {al}
                  </motion.div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-[10px] text-gray-600 font-mono italic">No stability warnings reported.</div>
                )}
             </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
