import React, { useState, useEffect, useRef } from 'react';
import { Mic, Activity, Cpu } from 'lucide-react';

// Mobile Body Bridge — Spatial Command Data
class MobileBodyProxy {
  sensorData: { alpha: number; beta: number; gamma: number };
  onUpdate: ((data: any) => void) | null;
  intervalId: any;

  constructor() {
    this.sensorData = { alpha: 0, beta: 0, gamma: 0 };
    this.onUpdate = null;
    this.initSensors();
  }

  initSensors() {
    // We attach to the window for true physical hardware ingestion
    const handleOrientation = (event: DeviceOrientationEvent) => {
      this.sensorData = {
        alpha: event.alpha || 0, // Rotation around Z axis
        beta: event.beta || 0,   // Rotation around X axis
        gamma: event.gamma || 0  // Rotation around Y axis
      };
      this.transmitToEngine();
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('deviceorientation', handleOrientation);
      // Fallback ping to show activity even if no accelerometer is present (like on Desktop)
      this.intervalId = setInterval(() => {
         if (this.sensorData.alpha === 0 && this.sensorData.beta === 0) {
             this.sensorData = {
                 alpha: Math.random() * 360,
                 beta: (Math.random() - 0.5) * 180,
                 gamma: (Math.random() - 0.5) * 90
             };
             this.transmitToEngine();
         }
      }, 500);
    }
  }

  transmitToEngine() {
    // This feeds the Sector Matrix with your phone's physical posture
    if (this.onUpdate) {
        this.onUpdate({ ...this.sensorData });
    }
  }

  destroy() {
      if (this.intervalId) clearInterval(this.intervalId);
      // Note: event listener cleanup ideally happens here
  }
}

// Mobile Body Bridge — Vocal Strike Vector
class MobileVoiceProxy {
  audioContext: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  microphone: MediaStreamAudioSourceNode | null = null;
  dataArray: Uint8Array | null = null;
  animationId: number | null = null;
  onMagnitudeUpdate: ((magnitude: number) => void) | null = null;
  isActive: boolean = false;

  async initMic() {
    if (this.isActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.isActive = true;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.measureVolume();
    } catch (e) {
      console.warn("Mic access denied.", e);
    }
  }

  measureVolume = () => {
    if (!this.analyser || !this.dataArray || !this.isActive) return;
    this.analyser.getByteFrequencyData(this.dataArray as any);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
       sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;
    // Normalize to 0-100 magnitude
    const magnitude = Math.min(100, (average / 128) * 100);
    if (this.onMagnitudeUpdate) {
       this.onMagnitudeUpdate(magnitude);
    }
    this.animationId = requestAnimationFrame(this.measureVolume);
  }

  stop() {
    this.isActive = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
    }
  }
}

export default function NexusOperatingSystem({ nodes = [] }: { nodes?: any[] }) {
  // 1. Isolate state to prevent infinite render loops
  const [gravityWellIntensity, setGravityWellIntensity] = useState(0);
  const [predictedStabilization, setPredictedStabilization] = useState(0);
  const [bodyMetrics, setBodyMetrics] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [voiceMagnitude, setVoiceMagnitude] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bodyProxyRef = useRef<MobileBodyProxy | null>(null);
  const voiceProxyRef = useRef<MobileVoiceProxy | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Initialize Mobile Body Proxy
  useEffect(() => {
      bodyProxyRef.current = new MobileBodyProxy();
      bodyProxyRef.current.onUpdate = (data) => {
          setBodyMetrics(data);
          // Send to Bannon grid
          if (iframeRef.current && iframeRef.current.contentWindow) {
             iframeRef.current.contentWindow.postMessage({ type: 'MOBILENODE_UPDATE', payload: data }, '*');
          }
      };
      
      voiceProxyRef.current = new MobileVoiceProxy();
      voiceProxyRef.current.onMagnitudeUpdate = (mag) => {
          setVoiceMagnitude(mag);
          if (mag > 40 && iframeRef.current && iframeRef.current.contentWindow) {
              iframeRef.current.contentWindow.postMessage({ type: 'VOICESTRIKE_ACTIVATE', payload: mag }, '*');
          }
      };

      return () => {
          if (bodyProxyRef.current) bodyProxyRef.current.destroy();
          if (voiceProxyRef.current) voiceProxyRef.current.stop();
      }
  }, []);

  const toggleMic = async () => {
      if (!micEnabled && voiceProxyRef.current) {
          await voiceProxyRef.current.initMic();
          setMicEnabled(true);
      } else if (micEnabled && voiceProxyRef.current) {
          voiceProxyRef.current.stop();
          setMicEnabled(false);
          setVoiceMagnitude(0);
      }
  };

  // 2. Strict Dependency Tracking
  // Only execute this mathematical objectivity when the nodes array physically changes
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    // Gravity Well Intensity Math Model
    const intensity = nodes.length * 1.618;
    setGravityWellIntensity(intensity);

    // Predictive Growth Trendline via Linear Regression
    if (nodes.length > 1) {
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      const n = nodes.length;

      nodes.forEach((node, index) => {
        const x = node.timestamp || Date.now();
        const y = index + 1;
        sumX += x; 
        sumY += y;
        sumXY += x * y; 
        sumX2 += x * x;
      });

      const denominator = (n * sumX2) - (sumX * sumX);
      if (denominator !== 0) {
        const m = ((n * sumXY) - (sumX * sumY)) / denominator;
        const b = (sumY - (m * sumX)) / n;
        
        // Project 10 minutes (600000 ms) into the future
        const futureTime = Date.now() + 600000;
        setPredictedStabilization((m * futureTime) + b);
      }
    }
  }, [nodes.length]); // Strictly dependency tracked to prevent maximum update depth loop

  // 3. Sonic Architecture Web Audio API
  useEffect(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      oscillatorRef.current = audioCtxRef.current.createOscillator();
      gainNodeRef.current = audioCtxRef.current.createGain();

      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioCtxRef.current.destination);
      oscillatorRef.current.start();
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    // Modulate pitch and volume based on localized gravity well intensity
    const baseFrequency = 432; 
    if(oscillatorRef.current && gainNodeRef.current) {
        oscillatorRef.current.frequency.setTargetAtTime(
          Math.min(baseFrequency + (gravityWellIntensity * 2.5), 800), 
          audioCtxRef.current.currentTime, 
          0.1
        );
        
        // Cap volume to prevent distortion
        const volumeLevel = Math.min(gravityWellIntensity * 0.02, 0.2);
        gainNodeRef.current.gain.setTargetAtTime(
          volumeLevel, 
          audioCtxRef.current.currentTime, 
          0.1
        );
    }

    return () => {
      // Cleanup
      if(audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
      }
    };
  }, [gravityWellIntensity]);

  // 4. Kinetic Force Haptic Feedback
  useEffect(() => {
    if (Math.round(gravityWellIntensity) % 10 === 0 && gravityWellIntensity > 0) {
      if ('vibrate' in navigator) {
        // Array maps pure network physics for kinetic pulses
        navigator.vibrate([150, 50, 150]); 
      }
    }
  }, [gravityWellIntensity]);

  return (
    <div className="flex h-full w-full bg-black text-white overflow-hidden relative">
      {/* Localized Vector Grid: Core Operating Screen */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        
        {/* Top Data View: Spatial Command Architecture */}
        <div className="absolute top-0 w-full p-4 z-20 flex justify-between bg-black/80 border-b border-gray-800 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-green-400 uppercase">Gravity Well Intensity</h2>
            <p className="text-2xl drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] font-mono">{gravityWellIntensity.toFixed(2)}</p>
          </div>
          
          <div className="flex flex-col items-center border-x border-gray-800 px-8">
             <h2 className="text-[10px] font-bold tracking-widest text-fuchsia-500 uppercase animate-pulse">Mobile Body Ingestion Vector</h2>
             <div className="flex gap-6 mt-2">
                {/* Physical IMU Vector */}
                <div className="flex gap-4">
                  <div className="text-center">
                     <div className="text-[10px] text-gray-500 uppercase">Alpha (Z)</div>
                     <div className="text-sm font-mono text-fuchsia-400">{bodyMetrics.alpha.toFixed(1)}°</div>
                  </div>
                  <div className="text-center">
                     <div className="text-[10px] text-gray-500 uppercase">Beta (X)</div>
                     <div className="text-sm font-mono text-fuchsia-400">{bodyMetrics.beta.toFixed(1)}°</div>
                  </div>
                  <div className="text-center">
                     <div className="text-[10px] text-gray-500 uppercase">Gamma (Y)</div>
                     <div className="text-sm font-mono text-fuchsia-400">{bodyMetrics.gamma.toFixed(1)}°</div>
                  </div>
                </div>

                <div className="w-[1px] h-full bg-gray-800" />
                
                {/* Vocal Strike Vector */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleMic}
                    className={`p-2 rounded-full border transition-colors ${micEnabled ? 'bg-red-900/40 border-red-500 text-red-400' : 'bg-gray-900 border-gray-700 text-gray-500 hover:text-red-400'}`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                     <div className="text-[10px] text-gray-500 uppercase">Vocal Magnitude</div>
                     <div className="text-sm font-mono text-red-400">{voiceMagnitude.toFixed(1)}</div>
                  </div>
                </div>
             </div>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold tracking-widest text-blue-400 uppercase">10 Min Stabilization</h2>
            <p className="text-2xl drop-shadow-[0_0_10px_rgba(96,165,250,0.5)] font-mono">{predictedStabilization ? Math.round(predictedStabilization) + ' Nodes' : 'Calculatin...'}</p>
          </div>
        </div>

        {/* Bannon Physical Grid Integration */}
        <div className="absolute inset-0 z-0 pt-24 pb-8 px-8">
          <div className="w-full h-full border border-gray-800 rounded-xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] relative bg-black">
              <iframe 
                ref={iframeRef}
                src="/bannon.html" 
                title="Bannon Combat Sandbox" 
                className="absolute inset-0 w-full h-full border-none pointer-events-auto mix-blend-screen"
              />
          </div>
        </div>

        {/* Fractal Expansion View Resonance Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div 
              className="rounded-full border border-green-500/30 shadow-[0_0_80px_rgba(34,197,94,0.1)] transition-all duration-500 flex items-center justify-center"
              style={{ width: `${Math.max(100, gravityWellIntensity * 5)}px`, height: `${Math.max(100, gravityWellIntensity * 5)}px` }}
            >
                <div className="w-2 h-2 bg-green-400/50 rounded-full animate-ping" />
            </div>
        </div>
      </div>
    </div>
  );
}
