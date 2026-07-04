import React, { useState, useEffect } from 'react';
import { Globe, Leaf, Wind, Droplets, MapPin, Activity, ShieldAlert, Cpu } from 'lucide-react';

export function EarthObservationGrid() {
  const [activeLayer, setActiveLayer] = useState<'CARBON' | 'METHANE' | 'OZONE'>('CARBON');
  const [dataPoints, setDataPoints] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock environmental spatial data
    const generateData = () => {
      const points = [];
      for(let i=0; i<15; i++) {
        points.push({
          id: i,
          lat: (Math.random() * 180 - 90).toFixed(4),
          lng: (Math.random() * 360 - 180).toFixed(4),
          intensity: Math.random() * 100,
          status: Math.random() > 0.8 ? 'CRITICAL' : 'STABLE'
        });
      }
      setDataPoints(points);
    };
    generateData();
    const inv = setInterval(generateData, 5000);
    return () => clearInterval(inv);
  }, [activeLayer]);

  return (
    <div className="w-full h-full bg-[#030303] text-emerald-500 font-mono p-4 flex flex-col border-l border-emerald-900/30 overflow-hidden">
      <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 mb-4 shrink-0">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Earth Observation Grid
          </h2>
          <p className="text-[10px] text-emerald-700 mt-1">Quantum Climate Prediction & Carbon Mineralization Command.</p>
        </div>
        <div className="px-2 py-1 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          GEO-SYNC ACTIVE
        </div>
      </div>

      <div className="flex gap-2 mb-4 shrink-0">
        {[
          { id: 'CARBON', icon: <Leaf />, label: 'Carbon Mineralization' },
          { id: 'METHANE', icon: <Wind />, label: 'Methane Flux' },
          { id: 'OZONE', icon: <Droplets />, label: 'Ozone Integrity' },
        ].map(layer => (
          <button 
            key={layer.id}
            onClick={() => setActiveLayer(layer.id as any)}
            className={`flex-1 p-2 rounded border transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              activeLayer === layer.id 
                ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' 
                : 'bg-[#0a0a0a] border-emerald-900/30 text-emerald-700 hover:border-emerald-700/50'
            }`}
          >
            {React.cloneElement(layer.icon as any, { className: 'w-4 h-4' })}
            <span className="text-[10px] font-bold tracking-widest uppercase">{layer.label}</span>
          </button>
        ))}
      </div>

      <div className="relative flex-1 bg-black border border-emerald-900/40 rounded-lg overflow-hidden shrink-0 mb-4 h-64">
        {/* Abstract Map Background */}
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: 'radial-gradient(circle at center, #10b981 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
        
        {dataPoints.map(pt => (
          <div key={pt.id} 
               className="absolute flex items-center justify-center transition-all duration-1000"
               style={{ 
                 top: `${((parseFloat(pt.lat) + 90) / 180) * 100}%`, 
                 left: `${((parseFloat(pt.lng) + 180) / 360) * 100}%` 
               }}
          >
             <div className={`absolute rounded-full opacity-50 animate-ping ${pt.status === 'CRITICAL' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                  style={{ width: pt.intensity / 2, height: pt.intensity / 2 }} />
             <div className={`w-1.5 h-1.5 rounded-full ${pt.status === 'CRITICAL' ? 'bg-rose-400 shadow-[0_0_5px_rose]' : 'bg-emerald-400 shadow-[0_0_5px_emerald]'}`} />
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar border-t border-emerald-900/50 pt-3">
        <h3 className="text-[10px] text-emerald-600 font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3 h-3" /> Live Geomatrix Telemetry
        </h3>
        <div className="flex flex-col gap-2">
          {dataPoints.sort((a,b) => b.intensity - a.intensity).map(pt => (
            <div key={pt.id} className="bg-[#050505] p-2 rounded border border-emerald-900/30 flex justify-between items-center text-[10px]">
               <div className="flex items-center gap-2">
                 <MapPin className={`w-3 h-3 ${pt.status === 'CRITICAL' ? 'text-rose-500' : 'text-emerald-500'}`} />
                 <span className="text-emerald-300 font-mono">[{pt.lat}, {pt.lng}]</span>
               </div>
               <div className="flex items-center gap-4">
                 <span className="text-emerald-500/70">Intensity: {pt.intensity.toFixed(1)}</span>
                 <span className={`font-bold ${pt.status === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}`}>{pt.status}</span>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
