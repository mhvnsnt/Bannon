import { useState, useEffect, useRef } from 'react';

export function useAmbientAudio() {
  const [ambientState, setAmbientState] = useState<'silence' | 'speech' | 'loud' | 'unknown'>('unknown');
  const [volume, setVolume] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>(0);

  const startAmbientTracking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVolume(avg);
        
        let nextState: 'silence' | 'speech' | 'loud' = 'silence';
        if (avg > 100) nextState = 'loud';
        else if (avg > 25) nextState = 'speech'; // basic threshold for speech/noise
        
        setAmbientState(prev => prev === nextState ? prev : nextState);
        
        requestRef.current = requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
    } catch (e) {
      console.error("Ambient tracking failed:", e);
    }
  };

  const stopAmbientTracking = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
  };

  return { ambientState, volume, startAmbientTracking, stopAmbientTracking };
}
