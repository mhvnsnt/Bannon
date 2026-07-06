import { useEffect, useRef } from 'react';
import { AutonomicMetrics } from './useAutonomicSystem';

export const useProceduralAudio = (metrics: AutonomicMetrics, active: boolean) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  useEffect(() => {
    if (!active) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
        audioCtxRef.current = null;
      }
      return;
    }

    const initAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Using white noise or a low frequency sawtooth for a raspy/breath sound
        osc.type = 'sawtooth'; 
        
        // Filter out harsh highs to make it sound more like breath
        filter.type = 'lowpass';
        filter.Q.value = 1.0;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        oscillatorRef.current = osc;
        filterRef.current = filter;
        gainNodeRef.current = gain;
      } catch (e) {
         console.error("Audio Context initialization failed", e);
      }
    };

    if (!audioCtxRef.current) {
      initAudio();
    }

    return () => {
      if (audioCtxRef.current) {
         try {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
         } catch(e) {}
      }
    };
  }, [active]);

  useEffect(() => {
    if (!audioCtxRef.current || !oscillatorRef.current || !gainNodeRef.current || !filterRef.current) return;

    // Pitch mapping: higher strain = higher pitch gasp
    const baseFreq = 100;
    const peakFreq = baseFreq + (metrics.currentStrain * 1.5);
    
    // Smooth transitions
    const now = audioCtxRef.current.currentTime;
    
    oscillatorRef.current.frequency.setTargetAtTime(peakFreq, now, 0.1);

    // Amplitude mapping based on chestVolume (simulating inhalation/exhalation)
    // chestVolume oscillates around 1.0. Let's map 0.85-1.15 to 0.0-0.4 volume
    const normalizedVol = Math.max(0, (metrics.chestVolume - 0.85) / 0.3);
    const targetAmp = normalizedVol * metrics.systemSaturation * 0.3; // max volume 0.3 to not deafen
    
    gainNodeRef.current.gain.setTargetAtTime(targetAmp, now, 0.05);

    // Filter frequency based on heat / saturation to make it harsher at peak stress
    const filterFreq = 400 + (metrics.metabolicHeat - 37) * 200;
    filterRef.current.frequency.setTargetAtTime(filterFreq, now, 0.1);

  }, [metrics]);
};
