import { useState, useEffect, useRef } from 'react';

export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Attempt auto-activation for Android/Chrome which often doesn't need explicit request
  useEffect(() => {
    if (window.DeviceOrientationEvent) {
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
         setPermissionGranted(true);
      }
    }
  }, []);

  const requestAccess = async () => {
    if (typeof (window.DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const permission = await (window.DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Orientation access error:', error);
      }
    } else {
      setPermissionGranted(true); // Non-iOS 13+ devices
    }
  };

  useEffect(() => {
    if (!permissionGranted) return;

    let lastPostTime = 0;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const newOrientation = {
        alpha: e.alpha || 0,
        beta: e.beta || 0,
        gamma: e.gamma || 0
      };
      setOrientation(newOrientation);

      const now = Date.now();
      if (now - lastPostTime > 1000) {
        lastPostTime = now;
        fetch('/api/nexus/sensors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orientation: newOrientation, timestamp: now })
        }).catch(err => {
          // Silent catch for background failures
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [permissionGranted]);

  return { orientation, requestAccess, permissionGranted };
}

export function useAudioOscillator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const playFrequency = (freq: number, type: OscillatorType = 'sine') => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    const osc = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    
    osc.start();
    oscillatorRef.current = osc;
    setIsPlaying(true);
  };

  const stop = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  };

  return { playFrequency, stop, isPlaying };
}

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
         videoRef.current.srcObject = stream;
         setIsActive(true);
      }
    } catch (err: any) {
      setError(err.message || 'Camera access denied');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t: MediaStreamTrack) => t.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
    }
  };

  return { videoRef, startCamera, stopCamera, isActive, error };
}

export function useHardwareSenses() {
  const [vibrationSupported, setVibrationSupported] = useState(false);
  
  useEffect(() => {
    setVibrationSupported('vibrate' in navigator);
  }, []);

  const triggerKineticFeedback = (pattern: number | number[] = [50, 100, 50]) => {
     if (vibrationSupported) {
       navigator.vibrate(pattern);
     }
  };

  return { triggerKineticFeedback, vibrationSupported };
}

export function useDeviceMotion() {
  const [motionState, setMotionState] = useState<'still' | 'moving' | 'vigorous'>('still');
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (window.DeviceMotionEvent) {
      if (typeof (DeviceMotionEvent as any).requestPermission !== 'function') {
         setPermissionGranted(true);
      }
    }
  }, []);

  const requestAccess = async () => {
    if (typeof (window.DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const permission = await (window.DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Motion access error:', error);
      }
    } else {
      setPermissionGranted(true);
    }
  };

  useEffect(() => {
    if (!permissionGranted) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const x = e.acceleration?.x || 0;
      const y = e.acceleration?.y || 0;
      const z = e.acceleration?.z || 0;
      
      const magnitude = Math.sqrt(x*x + y*y + z*z);
      if (magnitude > 10) setMotionState('vigorous');
      else if (magnitude > 2) setMotionState('moving');
      else setMotionState('still');
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionGranted]);

  return { motionState, requestAccess, permissionGranted };
}
