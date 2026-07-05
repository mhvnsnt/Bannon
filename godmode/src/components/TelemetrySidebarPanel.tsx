import React, { useEffect, useState } from "react";

interface MetricItem {
  id: string;
  agent: string;
  type: string;
  text: string;
  created_at: string;
}

export default function TelemetrySidebarPanel() {
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  const pullActiveMetrics = async () => {
    if (!isMonitoring) return;
    try {
      const response = await fetch("/api/system/notifications");
      const json = await response.json();
      if (json.success) {
        setMetrics(json.list || []);
      }
    } catch (error) {
      console.error("Sidebar stream connectivity issue");
    }
  };

  useEffect(() => {
    pullActiveMetrics();
    const intervalId = setInterval(pullActiveMetrics, 5000);
    return () => clearInterval(intervalId);
  }, [isMonitoring]);

  return (
    <div className="p-3 bg-black border border-gray-900 rounded font-mono text-xs text-gray-300">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
        <span className="font-bold text-gray-400 tracking-wider">SYSTEM LOG TELEMETRY</span>
        <button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-2 py-0.5 rounded text-[10px] ${isMonitoring ? "bg-green-950 text-green-400 border border-green-800" : "bg-zinc-900 text-zinc-500"}`}
        >
          {isMonitoring ? "LIVE" : "PAUSED"}
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {metrics.length === 0 ? (
          <p className="text-gray-600 italic text-center py-4">No active stream items found</p>
        ) : (
          metrics.map((item) => (
            <div key={item.id} className="p-2 bg-zinc-950 border border-zinc-900 rounded">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                <span className="font-bold uppercase text-blue-400">{item.agent}</span>
                <span>{item.created_at}</span>
              </div>
              <p className="font-bold text-zinc-200 text-[11px]">{item.type}</p>
              <p className="text-zinc-400 mt-0.5 text-[11px] leading-relaxed">{item.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-2 bg-indigo-950/20 border border-indigo-900/50 rounded flex flex-col gap-2">
        <div className="flex justify-between items-center border-b border-indigo-900/50 pb-1">
          <span className="font-bold text-[10px] text-indigo-400 tracking-widest uppercase">State Vector Engine</span>
          <span className="text-[9px] text-indigo-300 bg-indigo-900/50 px-1 rounded animate-pulse">ACTIVE</span>
        </div>
        <div className="text-[10px] text-indigo-300/80 leading-relaxed">
          <p>8-Qubit Simulation Matrix Engaged</p>
          <p>Superposition Logic: <span className="text-emerald-400">ONLINE</span></p>
          <p>Tensor Math Backend: <span className="text-emerald-400">ROUTED</span></p>
        </div>
      </div>
    </div>
  );
}
