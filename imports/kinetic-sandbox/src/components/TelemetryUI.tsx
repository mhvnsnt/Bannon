import React, { useState, useEffect, useRef } from 'react';
import { usePhysicsStore } from '../store/physicsStore';

export const TelemetryUI: React.FC = () => {
    const systemSaturation = usePhysicsStore(s => s.systemSaturation);
    const metabolicHeat = usePhysicsStore(s => s.metabolicHeat);
    const chestVolume = usePhysicsStore(s => s.chestVolume);
    const currentStrain = usePhysicsStore(s => s.currentStrain);
    const entityHeartRate = usePhysicsStore(s => s.entityHeartRate);
    
    // History for graph
    const [history, setHistory] = useState<number[]>([]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setHistory(prev => {
                const nh = [...prev, usePhysicsStore.getState().systemSaturation];
                if (nh.length > 50) nh.shift();
                return nh;
            });
        }, 200); // 5 points a second
        return () => clearInterval(interval);
    }, []);

    // SVG path generation
    const pts = history.map((val, i) => {
        const x = (i / 49) * 200;
        const y = 40 - (val * 40);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="absolute right-4 bottom-4 w-64 bg-black/60 backdrop-blur-md border border-[#00ffff]/30 rounded-lg p-4 font-mono text-cyan-400 pointer-events-none z-50">
            <div className="text-[10px] font-bold border-b border-[#00ffff]/30 pb-2 mb-2 tracking-widest text-[#00ffff] flex justify-between">
                <span>AUTONOMIC NERVOUS SYSTEM</span>
                <span className="animate-pulse">● REC</span>
            </div>
            
            {/* 2D Line Graph */}
            <div className="w-full h-10 bg-black/50 border border-neutral-800 rounded relative overflow-hidden mb-4">
                <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="w-full h-full">
                    {pts.length > 0 && (
                        <polyline
                            points={pts}
                            fill="none"
                            stroke="#ff00ff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                </svg>
                {/* Axis lines */}
                <div className="absolute top-0 right-1 text-[6px] text-gray-500">Peak</div>
                <div className="absolute bottom-0 right-1 text-[6px] text-gray-500">Base</div>
            </div>
            
            <div className="space-y-2">
                <div>
                   <div className="flex justify-between text-[8px] uppercase">
                       <span>Saturation (Arousal)</span>
                       <span>{(systemSaturation * 100).toFixed(1)}%</span>
                   </div>
                   <div className="w-full h-1.5 bg-neutral-900 mt-1 rounded-sm overflow-hidden">
                       <div 
                         className="h-full bg-magenta-500 transition-all" 
                         style={{ width: `${Math.min(100, Math.max(0, systemSaturation * 100))}%`, backgroundColor: '#ff00ff' }} 
                       />
                   </div>
                </div>

                <div>
                   <div className="flex justify-between text-[8px] uppercase">
                       <span>Metabolic Heat</span>
                       <span>{metabolicHeat.toFixed(1)}°C</span>
                   </div>
                   <div className="w-full h-1.5 bg-neutral-900 mt-1 rounded-sm overflow-hidden">
                       <div 
                         className="h-full bg-red-500 transition-all" 
                         style={{ width: `${Math.min(100, Math.max(0, ((metabolicHeat - 36.5)/3) * 100))}%`, backgroundColor: '#ff0000' }} 
                       />
                   </div>
                </div>

                <div className="flex justify-between items-center bg-cyan-900/30 p-1">
                    <span className="text-[8px] uppercase">Heart Rate</span>
                    <span className="text-[10px] font-bold">{entityHeartRate.toFixed(0)} BPM</span>
                </div>
                
                <div className="flex justify-between items-center bg-cyan-900/30 p-1">
                    <span className="text-[8px] uppercase">Tidal Chest Vol</span>
                    <span className="text-[10px] font-bold">{(chestVolume * 100).toFixed(0)}%</span>
                </div>

            </div>
        </div>
    );
}
