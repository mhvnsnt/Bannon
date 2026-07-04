import React, { useEffect, useRef } from 'react';
import { Network, Cpu, Zap } from 'lucide-react';

export default function MotorolaDataGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    let cx = width / 2;
    let cy = height / 2;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      cx = width / 2;
      cy = height / 2;
    };
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 500 }).map(() => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      size: Math.random() * 2,
      color: Math.random() > 0.5 ? '#10b981' : '#a855f7'
    }));

    let animationId: number;
    let speed = 12; // Hyper-speed velocity

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.2)'; // Fades frame to simulate long exposure
      ctx.fillRect(0, 0, width, height);

      stars.forEach(star => {
        star.z -= speed;
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = width;
        }

        const viewZ = star.z;
        const projectedX = cx + (star.x / viewZ) * cx;
        const projectedY = cy + (star.y / viewZ) * cy;
        
        // Draw star trail / line for hyperspeed feel
        const prevZ = star.z + speed * 2;
        const prevProjectedX = cx + (star.x / prevZ) * cx;
        const prevProjectedY = cy + (star.y / prevZ) * cy;

        const maxOpacity = 1 - (star.z / width);
        const size = Math.max(0.1, (1 - star.z / width) * 3 * star.size);

        ctx.beginPath();
        ctx.moveTo(prevProjectedX, prevProjectedY);
        ctx.lineTo(projectedX, projectedY);
        ctx.strokeStyle = star.color;
        ctx.lineWidth = size;
        ctx.globalAlpha = maxOpacity;
        ctx.stroke();
      });

      // Grid Overlay (Tunnel feel)
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      
      const time = Date.now() * 0.002;
      const tY = (time * 50) % 100;
      for (let i = 0; i < height; i += 100) {
         ctx.beginPath();
         ctx.moveTo(0, i + tY);
         ctx.lineTo(width, i + tY);
         ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden flex flex-col font-sans">
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none">
        <h2 className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-3">
          <Network className="w-6 h-6" /> 
          Motorola High-Density Vector Grid
        </h2>
        <div className="flex gap-6 pointer-events-auto">
          <span className="text-xs text-gray-400 font-mono flex items-center gap-2 bg-black/50 p-2 rounded border border-[#222] shadow-[0_0_10px_rgba(232,121,249,0.1)]">
            <Cpu className="w-4 h-4 text-fuchsia-400"/> LOCALHOST PORT 9999
          </span>
          <span className="text-xs text- emerald-400 font-mono flex items-center gap-2 bg-emerald-950/30 p-2 rounded border border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Zap className="w-4 h-4 text-emerald-400" /> <span className="text-emerald-400">BARE METAL LINK SECURED</span>
          </span>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none flex flex-col gap-2 font-mono text-xs text-gray-500 uppercase tracking-widest">
         <div className="flex items-center gap-3">
           <div className="relative w-2 h-2">
             <div className="absolute w-full h-full rounded-full bg-emerald-500 animate-ping"></div>
             <div className="absolute w-full h-full rounded-full bg-emerald-400"></div>
           </div>
           Incoming Telemetry Streams Active
         </div>
         <div className="flex items-center gap-3">
           <div className="relative w-2 h-2">
             <div className="absolute w-full h-full rounded-full bg-fuchsia-500 animate-ping" style={{ animationDelay: '0.5s' }}></div>
             <div className="absolute w-full h-full rounded-full bg-fuchsia-400"></div>
           </div>
           Outgoing Actuation Vectors Active
         </div>
         <div className="w-48 h-1 bg-gray-900 mt-2 rounded overflow-hidden">
             <div className="h-full bg-emerald-500 w-full animate-[pulse_1.5s_ease-in-out_infinite]"></div>
         </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none"></div>

      <canvas ref={canvasRef} className="w-full h-full pointer-events-none" />
    </div>
  );
}
