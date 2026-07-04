import { useState, useEffect, useRef } from 'react';

export function usePhoneDaemon() {
  const [isDaemonActive, setIsDaemonActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const startDaemon = async () => {
    try {
      // 1. Screen Wake Lock (keeps screen from sleeping)
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
        });
      }

      // 2. Silent Audio Loop Hack (attempts to keep execution alive in background on mobile)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        // Create an audio context and a silent oscillator that plays indefinitely
        audioContextRef.current = new AudioCtx();
        oscillatorRef.current = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0; // Pure silence
        oscillatorRef.current.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        oscillatorRef.current.start();
      }

      setIsDaemonActive(true);
      console.log('Phone Daemon Activated. Screen awake & background audio hack started.');
    } catch (err) {
      console.error('Failed to start phone daemon', err);
    }
  };

  const stopDaemon = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
      });
    }

    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsDaemonActive(false);
    console.log('Phone Daemon Stopped.');
  };

  // Attempt to re-acquire wake lock if visibility changes (e.g., coming back to app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (isDaemonActive && document.visibilityState === 'visible' && 'wakeLock' in navigator) {
         try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
         } catch(e) {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isDaemonActive]);

  return { isDaemonActive, startDaemon, stopDaemon };
}
