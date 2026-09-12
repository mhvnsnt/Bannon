/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Component, ErrorInfo, ReactNode, useEffect } from 'react';
import Scene from './components/Scene';
import ControlsPanel from './components/ControlsPanel';
import { TelemetryHUD } from './components/TelemetryHUD';
import { usePhysicsStore } from './store/physicsStore';

import { initProceduralAudio } from './utils/audio';

class QuarantineBoundary extends Component<{children: ReactNode}, {hasError: boolean, errorMsg: string}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Quarantine Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center text-red-500 font-mono text-center p-8">
          <h2 className="text-xl font-bold mb-4 uppercase tracking-widest">Corrupted Asset Annihilated</h2>
          <p className="text-sm opacity-80 max-w-md">{this.state.errorMsg}</p>
          <button 
             className="mt-6 border border-red-500/50 bg-red-950/30 px-6 py-2 rounded text-xs tracking-widest hover:bg-red-900/50 transition-colors uppercase"
             onClick={() => { this.setState({hasError: false}); window.location.reload(); }}
          >
             Reboot Canvas
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [ignited, setIgnited] = useState(false);
  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    // Gyroscopic Gravity Override (Physical Arena Tilt)
    const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.beta !== null && e.gamma !== null) {
            // Apply a strong gravity tilt based on physical device pitch/roll
            // Assuming default gravity is y = -9.8
            const maxGravity = 20.0;
            const gx = Math.sin((e.gamma * Math.PI) / 180) * maxGravity;
            const gz = Math.sin((e.beta * Math.PI) / 180) * maxGravity;
            const gy = -Math.cos((e.beta * Math.PI) / 180) * Math.cos((e.gamma * Math.PI) / 180) * maxGravity - 9.8;
            
            // Only alert if we have a worker, or pass it to our physics store
            // usePhysicsStore.getState().hiveMindWorker?.postMessage({ type: 'UPDATE_GRAVITY', gravity: { x: gx, y: gy, z: gz } });
            // Since we use Ammo worker in store? (Wait, Ammo worker is global?)
        }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const handleIgnition = () => {
    // 1. Force unlock the Web Audio API
    initProceduralAudio();
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0; // Keep it completely silent
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start(0);
      oscillator.stop(audioCtx.currentTime + 0.001);
    }

    setIgnited(true);
  };

  return (
    <div 
      className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-sans select-none"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
          e.preventDefault(); 
          e.stopPropagation(); 
          if(e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              if (file.type.startsWith('image/')) {
                  const url = URL.createObjectURL(file);
                  usePhysicsStore.setState({ activeTextureUrl: url });
                  alert('Procedural Skin Engine: Decal Registered and Wrapped.');
              }
          }
      }}
    >
      {!ignited && (
        <div 
          onClick={handleIgnition}
          className="absolute inset-0 z-[9999] bg-[#050505] flex items-center justify-center text-[#00f0ff] font-mono text-2xl font-bold cursor-pointer hover:text-white transition-colors duration-300 tracking-widest flex-col gap-4"
        >
          <div className="border-4 border-[#00f0ff] border-dashed p-8 rounded-lg animate-pulse">
             TAP TO INITIALIZE GRID
          </div>
        </div>
      )}
      
      {ignited && (
         <QuarantineBoundary>
           <Scene />
           {showUI && (
               <>
               <ControlsPanel />
               <TelemetryHUD />
               </>
           )}
           <button
             onClick={() => setShowUI(!showUI)}
             className={`absolute top-4 right-4 z-50 bg-black/50 border border-white/20 text-white hover:bg-white/10 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest backdrop-blur transition-all ${!showUI ? 'opacity-50 hover:opacity-100' : ''}`}
           >
             {showUI ? 'Hide UI' : 'Show UI'}
           </button>
         </QuarantineBoundary>
      )}
    </div>
  );
}
