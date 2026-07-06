import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../App';

export function QuantumStateMonitor() {
  const [progress, setProgress] = useState(0);
  const [metricIndex, setMetricIndex] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let currentProgress = 0;
    
    const animate = () => {
      // Fluctuating progress to simulate quantum superposition evaluation
      currentProgress += (Math.random() * 2 - 0.5);
      if (currentProgress > 100) currentProgress = 0;
      if (currentProgress < 0) currentProgress = 0;
      
      setProgress(currentProgress);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricIndex(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    "Letting him cook...",
    "Main Character Energy: 98.4%",
    "Vibe Check Speed: 12ms avg"
  ];

  const circumference = 2 * Math.PI * 12; // r=12

  return (
    <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-full border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)] relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-transparent opacity-50" />
      
      <div className="relative flex items-center justify-center w-8 h-8">
        {/* Background Ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="12"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-slate-800"
          />
          {/* Animated Glowing Ring */}
          <circle
            cx="16"
            cy="16"
            r="12"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            className="text-cyan-400 transition-all duration-75"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.8))'
            }}
          />
          {/* Second overlapping ring for superposition effect */}
          <circle
            cx="16"
            cy="16"
            r="12"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - ((progress + 30) % 100 / 100) * circumference}
            className="text-purple-500 opacity-60 transition-all duration-75"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))'
            }}
          />
        </svg>
        <Sparkles className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>

      <div className="flex flex-col z-10">
        <span className="text-[9px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Finsta Multi-Launch
        </span>
        <span className="text-[10px] text-slate-300 font-mono min-w-[140px] transition-all duration-300">
          {metrics[metricIndex]}
        </span>
      </div>
    </div>
  );
}
