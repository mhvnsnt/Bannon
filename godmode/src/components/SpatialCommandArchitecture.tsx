import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Box, Network, Orbit, Eye } from 'lucide-react';

export default function SpatialCommandArchitecture() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // A placeholder logic for a futuristic 3D node viewer, normally we'd use THREE.js
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);
    resize();

    const nodes = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? '#e879f9' : '#2dd4bf' // fuchsia or teal
    }));

    let animationFrameId: number;

    const draw = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x <= 0 || node.x >= width) node.vx *= -1;
        if (node.y <= 0 || node.y >= height) node.vy *= -1;

        nodes.slice(i + 1).forEach(other => {
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${1 - dist / 120})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255, 0.05)`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans relative">
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-white">
            <Box className="w-6 h-6 text-fuchsia-400" />
            Spatial Command Architecture
          </h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">
            5D High-Altitude Conceptual Physical Mapping
          </p>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <button className="p-2 bg-black/50 border border-[#333] hover:border-fuchsia-500 hover:text-fuchsia-400 text-gray-400 rounded transition-colors backdrop-blur">
            <Orbit className="w-4 h-4" />
          </button>
          <button className="p-2 bg-black/50 border border-[#333] hover:border-cyan-500 hover:text-cyan-400 text-gray-400 rounded transition-colors backdrop-blur">
            <Network className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute right-6 bottom-6 z-10 pointer-events-none flex flex-col gap-2 font-mono text-[10px] text-gray-500 uppercase tracking-widest text-right">
         <div className="flex items-center justify-end gap-2"><div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></div> Active Node Density: 40</div>
         <div className="flex items-center justify-end gap-2"><div className="w-2 h-2 rounded-full bg-teal-500"></div> Quantum Field: Stabilized</div>
         <div>Collapsing Probability Matrices to 3D Wins</div>
      </div>

      {/* Physics Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />
    </div>
  );
}
