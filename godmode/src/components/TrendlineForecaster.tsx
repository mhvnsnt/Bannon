import React, { useState, useEffect } from 'react';
import { LineChart, Activity, TrendingUp, GitCommit, Crosshair, ArrowUpRight } from 'lucide-react';

export function TrendlineForecaster() {
  const [historicalData, setHistoricalData] = useState<number[]>(Array.from({ length: 40 }, () => Math.random() * 50 + 25));
  const [forecastData, setForecastData] = useState<number[]>([]);
  const [momentum, setMomentum] = useState<number>(0);

  useEffect(() => {
    const generateForecast = (data: number[]) => {
       // Linear regression y = mx + b
       let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
       const n = data.length;
       for (let i = 0; i < n; i++) {
          sumX += i;
          sumY += data[i];
          sumXY += i * data[i];
          sumXX += i * i;
       }
       const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
       const b = (sumY - m * sumX) / n;
       
       setMomentum(m);
       
       // project 10 steps into future
       const projection = [];
       const volatility = Math.abs(m) * 10;
       for(let i = n; i < n + 10; i++) {
          projection.push(m * i + b + (Math.random() * volatility - volatility/2));
       }
       setForecastData(projection);
    };

    const interval = setInterval(() => {
       setHistoricalData(prev => {
          const next = [...prev.slice(1), prev[prev.length - 1] + (Math.random() * 10 - 5)];
          generateForecast(next);
          return next;
       });
    }, 2000);

    generateForecast(historicalData);
    return () => clearInterval(interval);
  }, []);

  const maxValue = Math.max(...historicalData, ...forecastData) + 10;
  const minValue = Math.max(0, Math.min(...historicalData, ...forecastData) - 10);
  const range = maxValue - minValue;

  return (
    <div className="w-full h-full bg-[#050510] text-cyan-500 font-mono p-4 flex flex-col border-l border-cyan-900/40 overflow-hidden">
      <div className="border-b border-cyan-900/50 pb-3 mb-4 shrink-0 flex justify-between items-center">
        <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
             <Crosshair className="w-4 h-4" /> Predictive Reality Forecaster
           </h2>
           <p className="text-[10px] text-cyan-700 mt-1">Linear regression mapping +10m reality density shifts.</p>
        </div>
        <div className="flex gap-4">
           <div className={`px-2 py-1 text-[10px] font-bold border rounded flex items-center gap-1 ${
              momentum > 0 ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
           }`}>
             <TrendingUp className={`w-3 h-3 ${momentum < 0 && 'rotate-180'}`} />
             MOMENTUM: {momentum.toFixed(4)}
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 pb-4">
         <div className="bg-[#0a0a1a] border border-cyan-900/30 rounded p-4 flex-1 flex flex-col relative overflow-hidden">
            <h3 className="text-xs uppercase font-bold text-cyan-500 flex items-center gap-2 mb-4 shrink-0">
               <LineChart className="w-3 h-3" /> Reality Density Vector
            </h3>

            <div className="flex-1 relative border border-cyan-900/20 bg-black rounded w-full flex items-end pt-4 pb-0 overflow-hidden">
               {/* Vertical target line marking "now" */}
               <div className="absolute top-0 bottom-0 border-l border-cyan-500/50 border-dashed" style={{ left: '80%' }} />
               <span className="absolute top-2 text-[9px] text-cyan-500 font-bold" style={{ left: '81%' }}>T-ZERO</span>

               {/* Historical Data */}
               <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <polyline
                     points={historicalData.map((val, idx) => {
                        const x = (idx / 49) * 100;
                        const y = 100 - ((val - minValue) / range) * 100;
                        return `${x}%,${y}%`;
                     }).join(' ')}
                     fill="none"
                     stroke="#06b6d4"
                     strokeWidth="2"
                     vectorEffect="non-scaling-stroke"
                     className="drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
                  />
                  {/* Forecast Data */}
                  <polyline
                     points={forecastData.map((val, idx) => {
                        const x = ((40 + idx) / 49) * 100;
                        const y = 100 - ((val - minValue) / range) * 100;
                        return `${x}%,${y}%`;
                     }).join(' ')}
                     fill="none"
                     stroke="#f59e0b"
                     strokeWidth="2"
                     strokeDasharray="4 4"
                     vectorEffect="non-scaling-stroke"
                     className="drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"
                  />
               </svg>
            </div>
         </div>

         <div className="h-32 shrink-0 bg-[#0a0a1a] border border-cyan-900/30 rounded p-4 flex gap-4">
             <div className="flex-1 border-r border-cyan-900/20 pr-4">
                 <h4 className="text-[10px] uppercase text-cyan-600 mb-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> Regression Metrics</h4>
                 <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-700">T-Zero Density</span>
                    <span className="text-cyan-300 font-bold">{historicalData[historicalData.length-1].toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-700">T+10 Projected</span>
                    <span className="text-amber-400 font-bold">{forecastData[forecastData.length-1].toFixed(2)}</span>
                 </div>
             </div>
             <div className="flex-1">
                 <h4 className="text-[10px] uppercase text-cyan-600 mb-2 flex items-center gap-1"><Activity className="w-3 h-3"/> Trajectory Status</h4>
                 <div className="text-xs text-cyan-400 font-mono leading-relaxed">
                    {momentum > 0 ? 
                       "Possibility curve expanding upstream. Positive reality bias confirmed. Lock current operational metrics." :
                       "Reality density contracting. Shift structural baseline to conserve kinetic wealth."
                    }
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
}
