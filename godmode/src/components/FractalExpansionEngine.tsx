import React, { useState, useEffect, useRef, useMemo } from 'react';
import QuantumChat from './QuantumChat';
import * as d3 from 'd3';

export default function FractalExpansionEngine() {
  const [nodes, setNodes] = useState<{ id: string; timestamp: number }[]>([]);
  const [gravityWellIntensity, setGravityWellIntensity] = useState(0);
  const [predictedStabilization, setPredictedStabilization] = useState<number | null>(null);
  
  // Velocity and Stability metrics
  const [densityVelocity, setDensityVelocity] = useState(0);
  const [stabilityIndex, setStabilityIndex] = useState(100);
  const [velocityHistory, setVelocityHistory] = useState<number[]>([]);

  // Audio context and nodes for Spatialized 3D audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const oscillatorRefs = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Canvas ref for Quantum Entropy visualizer
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Structural Feedback Loop Fix
  // Isolate state updates to prevent infinite render loops
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    
    // Pure mathematical objectivity for density
    const calculateIntensity = () => {
      return nodes.length * 1.618; 
    };

    const newIntensity = calculateIntensity();
    if (Math.abs(gravityWellIntensity - newIntensity) > 0.5) {
      setGravityWellIntensity(newIntensity);
    }
  }, [nodes.length, gravityWellIntensity]); // Only depend on length to prevent constant triggers

  // Calculate Velocity Delta
  useEffect(() => {
     if (nodes.length > 5) {
        // Look at the last 5 nodes to determine velocity (nodes / second)
        const recentNodes = nodes.slice(-5);
        const timeSpan = recentNodes[recentNodes.length - 1].timestamp - recentNodes[0].timestamp;
        if (timeSpan > 0) {
           const currentVelocity = (5 / timeSpan) * 1000; // nodes per second
           setDensityVelocity(currentVelocity);
           setVelocityHistory(prev => [...prev.slice(-20), currentVelocity]);
        }
     }
  }, [nodes.length]);

  useEffect(() => {
     // Generate dummy nodes for visualization over time
     let i = 0;
     const interval = setInterval(() => {
        i++;
        setNodes((prev) => [...prev, { id: `mock-${i}`, timestamp: Date.now() }]);
        if (i > 60) clearInterval(interval);
     }, 2000);
     return () => clearInterval(interval);
  }, []);

  // Linear Regression Trendline for Orbital Ring Stabilization
  useEffect(() => {
    if (nodes.length > 1) {
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;
      const n = nodes.length;

      nodes.forEach((node, index) => {
        // Convert to relative time to avoid massive numbers breaking precision
        const x = node.timestamp - nodes[0].timestamp; 
        const y = index + 1;      // Density count
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });

      // m = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX)
      const denominator = (n * sumX2) - (sumX * sumX);
      if (denominator !== 0) {
        const m = ((n * sumXY) - (sumX * sumY)) / denominator;
        const b = (sumY - (m * sumX)) / n;
        
        // Project 10 minutes (600000 ms) into the future
        const futureTime = (Date.now() - nodes[0].timestamp) + 600000;
        const projectedNodes = (m * futureTime) + b;
        setPredictedStabilization(projectedNodes > 0 ? projectedNodes : null);
      }
    }
  }, [nodes.length]);

  // Autonomous Gravity Well Stabilizer (d3-force cooling simulation)
  useEffect(() => {
     // If velocity spikes, stability drops
     if (densityVelocity > Math.max(...velocityHistory.slice(0, -1) || [0]) * 1.5 && nodes.length > 10) {
        setStabilityIndex(prev => Math.max(30, prev - 15));
        
        // Apply d3 cooling to simulate stabilizing the well
        const simulation = d3.forceSimulation(nodes as any)
           .force("charge", d3.forceManyBody().strength(30)) // push apart slightly to cool
           .alpha(0.5) // start warm but not hot
           .alphaDecay(0.05); // decay faster to freeze

        simulation.on("end", () => {
           setStabilityIndex(prev => Math.min(100, prev + 25)); // Recover stability
        });
     } else {
        setStabilityIndex(prev => Math.min(100, prev + 2)); // Natural passive recovery
     }
  }, [densityVelocity]);

  // Spatialized 3D Sonic Architecture Web Audio API
  useEffect(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      
      // Setup spatial panner
      pannerRef.current = audioCtxRef.current.createPanner();
      pannerRef.current.panningModel = 'HRTF';
      pannerRef.current.distanceModel = 'inverse';
      pannerRef.current.refDistance = 1;
      pannerRef.current.maxDistance = 10000;
      pannerRef.current.rolloffFactor = 1;
      pannerRef.current.coneInnerAngle = 360;
      pannerRef.current.coneOuterAngle = 0;
      pannerRef.current.coneOuterGain = 0;
      
      // Create a chord of oscillators for richer resonance
      const freqs = [432, 432 * 1.5, 432 * 2];
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = 0.05;

      freqs.forEach(freq => {
         const osc = audioCtxRef.current!.createOscillator();
         osc.type = 'sine';
         osc.frequency.value = freq;
         osc.connect(pannerRef.current!);
         oscillatorRefs.current.push(osc);
      });

      pannerRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioCtxRef.current.destination);

      oscillatorRefs.current.forEach(osc => osc.start());
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    // Modulate spatial position and pitch based on localized gravity well intensity
    if (pannerRef.current && gainNodeRef.current) {
       // Move sound around head based on density
       const angle = (gravityWellIntensity / 50) * Math.PI * 2;
       const x = Math.cos(angle) * 5;
       const z = Math.sin(angle) * 5;
       
       pannerRef.current.positionX.setTargetAtTime(x, audioCtxRef.current.currentTime, 0.1);
       pannerRef.current.positionZ.setTargetAtTime(z, audioCtxRef.current.currentTime, 0.1);
       
       // Pitch shifting
       oscillatorRefs.current.forEach((osc, i) => {
          const targetFreq = (432 * (i === 0 ? 1 : i === 1 ? 1.5 : 2)) + (gravityWellIntensity * (i + 1));
          osc.frequency.setTargetAtTime(
            Math.min(targetFreq, 1200), // Cap frequency to avoid ear damage
            audioCtxRef.current.currentTime, 
            0.1
          );
       });
       
       // Volume tied to stability (chaotic = louder, stable = quieter)
       const volumeLevel = Math.min(((100 - stabilityIndex) / 100) * 0.05 + 0.01, 0.1);
       gainNodeRef.current.gain.setTargetAtTime(
         volumeLevel, 
         audioCtxRef.current.currentTime, 
         0.1
       );
    }

    return () => {
       // Cleanup audio on unmount
       if (audioCtxRef.current) {
         audioCtxRef.current.close().catch(() => {});
         audioCtxRef.current = null;
         oscillatorRefs.current = [];
       }
    };
  }, [gravityWellIntensity, stabilityIndex]);

  // Kinetic Force Haptic Feedback
  useEffect(() => {
    // Trigger physical pulse when density crosses heavy thresholds
    if (Math.round(gravityWellIntensity) % 5 === 0 && gravityWellIntensity > 1) {
      if ('vibrate' in navigator) {
        // Array maps pure network physics: [vibrate pause vibrate]
        navigator.vibrate([150, 50, 150]); 
      }
    }
  }, [gravityWellIntensity]);

  // Quantum Entropy Visualizer (WebGL Noise Shader Simulation)
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let frameId: number;
      const render = () => {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);
          
          // Entropy increases as stability drops
          const entropyLevel = (100 - stabilityIndex) / 100;
          
          ctx.fillStyle = `rgba(16, 185, 129, ${0.1 + (entropyLevel * 0.2)})`;
          
          for (let i = 0; i < 50; i++) {
              const x = Math.random() * width;
              const y = Math.random() * height;
              const w = Math.random() * 4 * (1 + entropyLevel * 5);
              const h = Math.random() * 4 * (1 + entropyLevel * 5);
              ctx.fillRect(x, y, w, h);
          }
          
          frameId = requestAnimationFrame(render);
      };
      
      render();
      
      return () => cancelAnimationFrame(frameId);
  }, [stabilityIndex]);

  return (
    <div className="flex h-full w-full bg-black text-white overflow-hidden relative">
      {/* Primary Node Authority: Main Sidebar is removed here as it is now in App.tsx globally */}

      {/* Quantum Entropy Canvas Background */}
      <canvas 
          ref={canvasRef} 
          width={window.innerWidth} 
          height={window.innerHeight} 
          className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen"
      />

      {/* Localized Vector Grid: Core Operating Screen */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#050505]/80 backdrop-blur-[2px] z-10">
        
        {/* Top Data View: Spatial Command Architecture */}
        <div className="absolute top-0 w-full p-6 z-10 flex justify-between bg-black/40 backdrop-blur-md border-b border-emerald-900/30">
          <div>
            <h2 className="text-xs font-bold tracking-[0.3em] text-emerald-500 uppercase">GRAVITY WELL INTENSITY</h2>
            <p className="text-4xl font-mono mt-1 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
               {gravityWellIntensity.toFixed(2)}
            </p>
          </div>
          
          {/* New Panel: Density Velocity & Stability */}
          <div className="flex gap-8 px-8 border-x border-emerald-900/40">
             <div>
                <h2 className="text-xs font-bold tracking-[0.3em] text-fuchsia-500 uppercase">DENSITY VELOCITY</h2>
                <div className="flex items-end gap-2 mt-1">
                   <p className="text-2xl font-mono text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                      {densityVelocity.toFixed(2)} <span className="text-sm">N/s</span>
                   </p>
                   {/* Mini sparkline */}
                   <div className="flex items-end h-8 gap-[2px]">
                      {velocityHistory.slice(-10).map((v, i) => (
                         <div key={i} className="w-1.5 bg-fuchsia-500/80" style={{ height: `${Math.min(32, Math.max(4, v * 10))}px` }} />
                      ))}
                   </div>
                </div>
             </div>
             <div>
                <h2 className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase">STABILITY INDEX</h2>
                <p className={`text-2xl font-mono mt-1 ${stabilityIndex < 50 ? 'text-red-400 animate-pulse' : 'text-amber-400'} drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]`}>
                   {Math.round(stabilityIndex)}%
                </p>
             </div>
          </div>

          <div className="text-right">
            <h2 className="text-xs font-bold tracking-[0.3em] text-cyan-500 uppercase">10 MIN STABILIZATION VECTOR</h2>
            <p className="text-4xl font-mono mt-1 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
               {predictedStabilization ? Math.round(predictedStabilization) + ' Nodes' : 'Calculatin...'}
            </p>
          </div>
        </div>

        {/* Central Component Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 mt-20 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black pointer-events-none" />
            
            {/* Visual representation of the Fractal Expansion */}
            <div className="relative flex items-center justify-center">
               {/* Core Anchor */}
               <div className="absolute w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_30px_rgba(52,211,153,1)] z-10" />
               
               {/* Growing Gravity Grid */}
               <div 
                 className="absolute rounded-full border border-emerald-500/50 shadow-[0_0_80px_rgba(34,197,94,0.3)] transition-all duration-1000 ease-out flex items-center justify-center"
                 style={{ 
                    width: `${Math.max(10, gravityWellIntensity * 6)}px`, 
                    height: `${Math.max(10, gravityWellIntensity * 6)}px`,
                    transform: `scale(${1 + Math.sin(Date.now() / 1000) * (stabilityIndex < 50 ? 0.15 : 0.05)})` // Jitter based on stability
                 }}
               >
                 {nodes.map((node, i) => {
                    const angle = (i * 137.5) * (Math.PI / 180); // Fibonacci spiral
                    const radius = Math.sqrt(i) * 12;
                    
                    // Add entropy jitter to position if unstable
                    const entropyOffset = ((100 - stabilityIndex) / 100) * (Math.random() - 0.5) * 20;
                    
                    const x = Math.cos(angle) * radius + entropyOffset;
                    const y = Math.sin(angle) * radius + entropyOffset;
                    return (
                       <div 
                         key={node.id}
                         className="absolute w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-[0_0_10px_rgba(110,231,183,0.8)]"
                         style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                         }}
                       />
                    )
                 })}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
