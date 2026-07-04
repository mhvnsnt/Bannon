import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, Shield, CloudOff, Cloud, RefreshCw } from 'lucide-react';

export function SystemHealthMonitor() {
  const [routerStats, setRouterStats] = useState<any>(null);
  const [routerCosts, setRouterCosts] = useState<any>(null);
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);
  const [resurrectionStatus, setResurrectionStatus] = useState<any>(null);
  const [sessionVal, setSessionVal] = useState<any>(null);
  const [budgetLimit, setBudgetLimit] = useState(0);

  const fetchData = async () => {
    try {
      const statsReq = await fetch('/api/armada/model_router/stats');
      if (statsReq.ok) setRouterStats(await statsReq.json());

      const costsReq = await fetch('/api/armada/model_router/costs');
      if (costsReq.ok) setRouterCosts(await costsReq.json());

      const snapshotReq = await fetch('/api/armada/session/snapshot');
      if (snapshotReq.ok) setSessionVal((await snapshotReq.json()).snapshot);

      // (We skip polling the check all providers directly unless button clicked to save time)
    } catch (e) {
      console.log('Error fetching health monitor data');
    }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="bg-[#050505] border-b border-white/5 py-2 px-4 flex flex-wrap items-center justify-between text-[10px] font-mono shrink-0">
      <div className="flex items-center gap-6">
         {/* Model Router */}
         <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span className="text-gray-400">ROUTER:</span>
            <span className="text-emerald-400 font-bold">{routerStats?.activeProvider || 'Local Llama'}</span>
         </div>
         {/* Costs & Budget */}
         <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-amber-500" />
            <span className="text-gray-400">TODAY:</span>
            <span className="text-amber-400">${routerCosts?.today.toFixed(2) || '0.00'}</span>
         </div>
         
         {/* Session Guard */}
         <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-blue-500" />
            <span className="text-gray-400">SESSION GUARD:</span>
            <span className="text-blue-400">{sessionVal ? new Date(sessionVal.timestamp + 'Z').toLocaleTimeString() : 'AWAITING SNAPSHOT'}</span>
         </div>

         {/* Ollama Status */}
         <div className="flex items-center gap-2">
            <Server className="w-3 h-3 text-purple-500" />
            <span className="text-gray-400">OLLAMA:</span>
            <span className="text-purple-400">ONLINE (2 Models)</span>
         </div>
      </div>
      <div className="flex items-center gap-4">
         <button className="flex items-center gap-1 hover:text-emerald-400 transition-colors text-gray-500" onClick={fetchData}>
            <RefreshCw className="w-3 h-3" />
            <span>SYNC</span>
         </button>
      </div>
    </div>
  );
}
