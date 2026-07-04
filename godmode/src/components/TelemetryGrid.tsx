import React, { useEffect, useState } from 'react';
import { Activity, Zap, Cpu, Database, Network } from 'lucide-react';
import { getChatSessions } from '../lib/persistence';

export const TelemetryGrid = ({
  flickerRate,
  colorTemperature,
  intensity,
  activeAcoustic,
  activePhotonic,
  activeAtmospheric
}: {
  flickerRate: number;
  colorTemperature: number;
  intensity: number;
  activeAcoustic: string | null;
  activePhotonic: string | null;
  activeAtmospheric: string | null;
}) => {
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    // Just a quick DB call to show active database connection state
    const fetchStats = async () => {
      const sessions = await getChatSessions();
      setSessionCount(sessions.length);
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full h-full bg-[#050505] border border-emerald-900/50 p-4 font-mono text-emerald-500 flex flex-col gap-4 overflow-y-auto overflow-x-hidden p-0 relative shadow-inner">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Network className="w-64 h-64 text-emerald-500" />
        </div>
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-900/30">
        <Activity className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-emerald-400 tracking-wider">CORE APPLICATION MONITOR</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 flex-1">
        
        {/* Panel A */}
        <div className="border border-[#112211] p-3 rounded-sm bg-black/60 relative overflow-hidden group hover:border-[#113311] transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900/50 group-hover:bg-emerald-500 transition-colors"></div>
          <h4 className="text-[10px] text-emerald-600 mb-2 font-bold tracking-widest flex items-center gap-1">
            <Zap className="w-3 h-3"/> PANEL A: STIMULI INGESTION
          </h4>
          <ul className="text-xs space-y-1.5 opacity-80">
            <li className="flex justify-between"><span>Audio Wave</span> <span className="text-emerald-300">{activeAcoustic ? `Active (${activeAcoustic})` : 'Offline'}</span></li>
            <li className="flex justify-between"><span>Photonic Index</span> <span className="text-emerald-300">{colorTemperature}K / {flickerRate}Hz</span></li>
            <li className="flex justify-between"><span>Atmospheric Phase</span> <span className="text-emerald-300">{activeAtmospheric ? `Dispersing (${activeAtmospheric})` : 'Stable'}</span></li>
            <li className="flex justify-between"><span>Global Intensity</span> <span className="text-emerald-300">{intensity}%</span></li>
          </ul>
        </div>

        {/* Panel B */}
        <div className="border border-[#112211] p-3 rounded-sm bg-black/60 relative overflow-hidden group hover:border-[#113311] transition-colors">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900/50 group-hover:bg-emerald-500 transition-colors"></div>
          <h4 className="text-[10px] text-emerald-600 mb-2 font-bold tracking-widest flex items-center gap-1">
            <Cpu className="w-3 h-3"/> PANEL B: BIOMETRIC CORRELATION
          </h4>
          <ul className="text-xs space-y-1.5 opacity-80">
            <li className="flex justify-between break-all"><span>Theta/Delta Sync</span> <span className="text-emerald-300 text-right">{activeAcoustic ? '78.4% Aligning...' : 'Nominal'}</span></li>
            <li className="flex justify-between break-all"><span>Autonomic Drift</span> <span className="text-emerald-300 text-right">0.0{Math.floor(Math.random() * 100)} rad/s</span></li>
            <li className="flex justify-between break-all"><span>Ragdoll Hesitation</span> <span className="text-emerald-300 text-right">{activePhotonic ? 'Elevated' : 'Baseline'}</span></li>
            <li className="flex justify-between break-all"><span>Expected NeuroProxy</span> <span className="text-emerald-300 text-right">Dopamine Pursuit</span></li>
          </ul>
        </div>

        {/* Panel C */}
        <div className="border border-[#112211] p-3 rounded-sm bg-black/60 relative overflow-hidden group hover:border-[#113311] transition-colors">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900/50 group-hover:bg-emerald-500 transition-colors"></div>
          <h4 className="text-[10px] text-emerald-600 mb-2 font-bold tracking-widest flex items-center gap-1">
             <Database className="w-3 h-3"/> PANEL C: HISTORICAL VECTOR
          </h4>
          <ul className="text-xs space-y-1.5 opacity-80">
            <li className="flex justify-between"><span>Baseline Shift</span> <span className="text-emerald-300">+0.{Math.floor(Math.random() * 999)}</span></li>
            <li className="flex justify-between"><span>Resource Alloc Vel</span> <span className="text-emerald-300">4.{Math.floor(Math.random() * 9)}u/s</span></li>
            <li className="flex justify-between"><span>Session Vectors</span> <span className="text-emerald-300">{sessionCount} Syncs</span></li>
          </ul>
        </div>

        {/* Panel D */}
        <div className="border border-[#112211] p-3 rounded-sm bg-black/60 relative overflow-hidden group hover:border-[#113311] transition-colors">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900/50 group-hover:bg-emerald-500 transition-colors"></div>
          <h4 className="text-[10px] text-emerald-600 mb-2 font-bold tracking-widest flex items-center gap-1">
            <Activity className="w-3 h-3"/> PANEL D: INTEGRATION LOG
          </h4>
          <ul className="text-xs space-y-1.5 opacity-80">
            <li className="flex justify-between"><span>Real-time P(O_shift)</span> <span className="text-emerald-300 opacity-60 animate-pulse">Computing...</span></li>
            <li className="flex justify-between break-all mt-4 border-t border-emerald-900/30 pt-2"><span className="text-[10px] text-emerald-700">Multi-day entropy ledger synchronized to prime DB cluster.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
