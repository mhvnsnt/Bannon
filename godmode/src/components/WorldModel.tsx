import React, { useState, useEffect } from 'react';
import { useLivingNexus } from '../hooks/useLivingNexus';

export default function WorldModel() {
  const { socket, bridgeStatus } = useLivingNexus();
  const [activeTelemetry, setActiveTelemetry] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event: any) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TELEMETRY_STREAM') {
        setActiveTelemetry((prev) => [data.payload, ...prev.slice(0, 19)]);
      }
    };
  }, [socket]);

  return (
    <div className="flex-1 flex flex-col bg-black border border-gray-950 rounded-xl p-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-gray-950 pb-2 mb-3">
        <span className="text-emerald-400 font-bold tracking-widest">🌐 SYSTEM WORLD MODEL VIEWPORT</span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${bridgeStatus === 'ONLINE' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-red-950/40 text-red-400 border border-red-900/30'}`}>{bridgeStatus}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 h-[60vh]">
        {activeTelemetry.length === 0 ? (
          <div className="text-gray-600 italic animate-pulse">Monitoring autonomous multi-node proxy arrays... Waking up scrapers...</div>
        ) : (
          activeTelemetry.map((log, i) => (
            <div key={i} className="p-2 bg-zinc-950/80 border border-gray-900 rounded-lg flex justify-between items-start">
              <div>
                <span className="text-pink-500 font-bold">[{log.node}]</span>{' '}
                <span className="text-gray-300 tracking-wide">{log.action}</span>
              </div>
              <span className="text-[10px] text-gray-600">{log.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
