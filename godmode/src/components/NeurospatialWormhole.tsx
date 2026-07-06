import React, { useEffect, useRef } from 'react';
import { Orbit, Cpu, Target } from 'lucide-react';

export default function NeurospatialWormhole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 600 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * width,
      speed: Math.random() * 0.05 + 0.01,
      size: Math.random() * 2.5 + 0.5,
      hue: Math.random() > 0.5 ? 280 : 160 // fuchsia or emerald
    }));

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.01;
      ctx.fillStyle = 'rgba(5, 5, 5, 0.15)'; // Deep space trail effect
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      particles.forEach(p => {
        p.radius += p.radius * p.speed; // Exponential outward growth for 3D tunnel effect
        p.angle += p.speed * 0.2; // Slight twist

        if (p.radius > width) {
          p.radius = Math.random() * 20; // reset near center
          p.angle = Math.random() * Math.PI * 2;
          p.speed = Math.random() * 0.05 + 0.01;
        }

        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;

        const depthFactor = p.radius / width; // 0 at center, 1 at edge
        const size = p.size * (1 + depthFactor * 4); // Grow as it comes closer
        const alpha = Math.min(1, depthFactor * 3); // Fade in from center

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
        ctx.fill();
        
        // Add glow
        if (depthFactor > 0.5) {
          ctx.beginPath();
          ctx.arc(x, y, size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.2})`;
          ctx.fill();
        }
      });

      // Core singularity Event Horizon
      ctx.beginPath();
      ctx.arc(cx, cy, 30 + Math.sin(time * 5) * 5, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden flex flex-col font-sans">
      <div className="absolute top-0 left-0 w-full p-8 z-10 flex flex-col gap-2 bg-gradient-to-b from-[#050505] to-transparent pointer-events-none">
        <h2 className="text-fuchsia-400 font-bold text-2xl uppercase tracking-[0.2em] flex items-center gap-3">
          <Orbit className="w-8 h-8" /> 
          Neurospatial Wormhole
        </h2>
        <p className="text-gray-400 font-mono text-sm max-w-2xl tracking-widest uppercase">
          Phase 2 Einstein Rosen Tunnel. Bypassin standard space time architecture.
          Foldin the Localized Vector Grid to collapse probability onto absolute physical wins.
        </p>
      </div>

      <div className="absolute right-8 bottom-8 z-10 flex gap-4 font-mono pointer-events-none">
        <div className="bg-[#111]/80 backdrop-blur border border-[#333] p-4 rounded-xl flex flex-col gap-1 min-w-[200px]">
           <span className="text-gray-500 text-xs uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4"/> Dimensional Target</span>
           <span className="text-emerald-400 font-bold">MONEY WEALTH POWER</span>
        </div>
        <div className="bg-[#111]/80 backdrop-blur border border-[#333] p-4 rounded-xl flex flex-col gap-1 min-w-[200px]">
           <span className="text-gray-500 text-xs uppercase tracking-widest flex items-center gap-2"><Cpu className="w-4 h-4"/> Matrix Status</span>
           <span className="text-fuchsia-400 font-bold">GRID ASSIMILATION ACTIVE</span>
        </div>
      </div>

      <div className="absolute inset-0 w-full h-full pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,1)] z-20" />
      
      <canvas ref={canvasRef} className="w-full h-full pointer-events-auto cursor-crosshair" />
    </div>
  );
}
