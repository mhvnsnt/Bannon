import { FederationManager } from '../lib/federationManager';
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Maximize, RotateCcw, ExternalLink, Activity, Shield, Crosshair, 
  AlertTriangle, Zap, Download, Upload, Image, Cpu, Check, AlertCircle, 
  Compass, Flame, Radio, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Layers, HelpCircle,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StrengthMiniGame } from '../types';

type ReversalType = 'Tap' | 'Breaker' | 'Block' | 'Dodge' | 'MidMove';

const PRESETS = [
  { id: 'bannon_fed', name: 'Bannon Championship', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=300' },
  { id: 'neon_apex', name: 'Neon Apex Cyberpunk', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300' },
  { id: 'grim_skull', name: 'Grim Fire Skull', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=300' },
  { id: 'iron_fist', name: 'Brawlers Syndicate', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=300' }
];

export default function GameClient() {
  const [iframeUrl, setIframeUrl] = useState('https://mhvnsnt.github.io/Bannon/');
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameScreen, setGameScreen] = useState<'main_menu' | 'character_select' | 'play'>('main_menu');
  const [selectedCharacter1, setSelectedCharacter1] = useState(0);
  const [selectedCharacter2, setSelectedCharacter2] = useState(1);
  const [attire1, setAttire1] = useState(0);
  const [attire2, setAttire2] = useState(0);
  const fedManager = useRef(new FederationManager());
  const [matchCard, setMatchCard] = useState<any[]>([]);

  useEffect(() => {
    setMatchCard(fedManager.current.generateMatchCard('genesis'));
  }, []);
  
  // Gameplay Loop State
  const [isInputCaptured, setIsInputCaptured] = useState(false);
  const [stamina, setStamina] = useState(100);
  const [momentum, setMomentum] = useState(0);
  const [health, setHealth] = useState(100);
  const [lastReversal, setLastReversal] = useState<{type: ReversalType, time: number} | null>(null);
  
  // Engine Synchronization States
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [customDecal, setCustomDecal] = useState<string>('');
  const [selectedDecalId, setSelectedDecalId] = useState<string>('bannon_fed');
  const [activeDecalUrl, setActiveDecalUrl] = useState<string>(PRESETS[0].url);

  // Bridge Connection Monitor
  const [bridgeStatus, setBridgeStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to LiveLink WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/livelink`);
    wsRef.current = ws;

    ws.onopen = () => setBridgeStatus('connected');
    ws.onclose = () => setBridgeStatus('disconnected');
    ws.onerror = () => setBridgeStatus('disconnected');

    return () => ws.close();
  }, []);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [selectedCalibrateJoint, setSelectedCalibrateJoint] = useState<'head' | 'shoulder_l' | 'shoulder_r' | 'spine' | 'hip'>('head');
  const [calibrationOffsets, setCalibrationOffsets] = useState<Record<string, { x: number; y: number }>>({
    head: { x: 0, y: 0 },
    shoulder_l: { x: 0, y: 0 },
    shoulder_r: { x: 0, y: 0 },
    spine: { x: 0, y: 0 },
    hip: { x: 0, y: 0 }
  });
  const [boneScales, setBoneScales] = useState({
    head: 1.0,
    spine: 1.0,
    shoulder_l: 1.0,
    shoulder_r: 1.0,
    arm_l: 1.0,
    arm_r: 1.0,
    hip: 1.0,
    leg_l: 1.0,
    leg_r: 1.0
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // LiveLink Pipeline Logs
  const [liveLinkLogs, setLiveLinkLogs] = useState<Array<{time: string, msg: string, status: 'success' | 'warn' | 'info'}>>([
    { time: new Date().toLocaleTimeString(), msg: 'LiveLink server pipeline online on port 3000', status: 'info' }
  ]);

  // Test of Strength & Grapple Hub Simulation
  const [isLockUpActive, setIsLockUpActive] = useState(false);
  const [lockUpStyle, setLockUpStyle] = useState<'aki' | 'w2k26'>('w2k26');
  const [lockUpOutcome, setLockUpOutcome] = useState<string | null>(null);
  
  // AKI Minigame States
  const [akiSliderPos, setAkiSliderPos] = useState(50);
  const [akiSweetSpot, setAkiSweetSpot] = useState(45);
  const [akiDirection, setAkiDirection] = useState<'up' | 'down'>('up');
  const [akiDominance, setAkiDominance] = useState(0); // -100 to 100

  // WWE 2K26 Intentional Grapple Hub States
  const [w2kHold, setW2kHold] = useState<'none' | 'wrist_lock' | 'facelock' | 'hammerlock' | 'headlock'>('none');
  const [isDriving, setIsDriving] = useState(false);
  const [driveDistance, setDriveDistance] = useState(0); // 0 to 10 meters
  const [driveEnvironment, setDriveEnvironment] = useState<'neutral' | 'ropes' | 'turnbuckle' | 'steel_barricade'>('neutral');

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Core Gameplay Loop for Stamina/Breathing Regeneration
  const updateGameLoop = useCallback((time: number) => {
    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    if (isInputCaptured) {
      setStamina(prev => {
        // Regenerate stamina slowly, cap at 100
        const regenRate = 8; // stamina per second
        let decay = 0;
        
        // Additional continuous drain for active grappling
        if (isLockUpActive && w2kHold !== 'none') {
          decay = 12; // active hold wrestling drain
        }
        if (isDriving) {
          decay = 20; // driving/relocating opponent drain
        }

        const netChange = (regenRate - decay) * deltaTime;
        return Math.max(0, Math.min(100, prev + netChange));
      });
    }

    gameLoopRef.current = requestAnimationFrame(updateGameLoop);
  }, [isInputCaptured, isLockUpActive, w2kHold, isDriving]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(updateGameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [updateGameLoop]);

  // AKI Bouncing Slider Loop
  useEffect(() => {
    if (!isLockUpActive || lockUpStyle !== 'aki') return;
    
    let frameId: number;
    const tick = () => {
      setAkiSliderPos(pos => {
        let next = pos + (akiDirection === 'up' ? 2.2 : -2.2);
        if (next >= 100) {
          setAkiDirection('down');
          next = 100;
        } else if (next <= 0) {
          setAkiDirection('up');
          next = 0;
        }
        return next;
      });
      frameId = requestAnimationFrame(tick);
    };
    
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isLockUpActive, lockUpStyle, akiDirection]);

  // Handle continuous drive relocation tick
  useEffect(() => {
    if (!isDriving) return;
    const interval = setInterval(() => {
      setDriveDistance(d => {
        const next = Math.min(10, d + 0.5);
        if (next >= 10) {
          setIsDriving(false);
          const envs: Array<'ropes' | 'turnbuckle' | 'steel_barricade'> = ['ropes', 'turnbuckle', 'steel_barricade'];
          const chosenEnv = envs[Math.floor(Math.random() * envs.length)];
          setDriveEnvironment(chosenEnv);
          addLog(`Opponent driven directly into environmental collider: ${chosenEnv.replace('_', ' ').toUpperCase()}`, 'warn');
          setMomentum(prev => Math.min(100, prev + 25));
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isDriving]);

  // Handle AKI Push Timing Input
  const handleAkiInput = () => {
    const distance = Math.abs(akiSliderPos - akiSweetSpot);
    let delta = 0;
    if (distance <= 12) {
      delta = 25;
      addLog('TEST OF STRENGTH: Perfect Push Timing! Gaining ground', 'success');
      setMomentum(prev => Math.min(100, prev + 15));
    } else if (distance <= 25) {
      delta = 10;
      addLog('TEST OF STRENGTH: Decent Timing', 'info');
    } else {
      delta = -20;
      addLog('TEST OF STRENGTH: Slow reaction! Opponent pushes back', 'warn');
      setStamina(prev => Math.max(0, prev - 10));
    }

    setAkiDominance(prev => {
      const next = Math.max(-100, Math.min(100, prev + delta));
      if (next >= 100) {
        setLockUpOutcome('WIN_PLAYER');
        setIsLockUpActive(false);
        addLog('TEST OF STRENGTH CONCLUDED: Operator dominated lock-up!', 'success');
        setMomentum(100);
      } else if (next <= -100) {
        setLockUpOutcome('WIN_OPPONENT');
        setIsLockUpActive(false);
        addLog('TEST OF STRENGTH CONCLUDED: Opponent overpowered lock-up', 'warn');
        setHealth(prev => Math.max(0, prev - 15));
      }
      return next;
    });

    setAkiSweetSpot(Math.floor(Math.random() * 60) + 20);
  };

  // Helper to append server-side LiveLink and HUD activity logs
  const addLog = (msg: string, status: 'success' | 'warn' | 'info' = 'info') => {
    setLiveLinkLogs(prev => [
      { time: new Date().toLocaleTimeString(), msg, status },
      ...prev.slice(0, 30)
    ]);
  };

  // REST LiveLink backend gateway synchronization
  const pushLiveLinkUpdate = async (type: string, payload: any) => {
    try {
      const res = await fetch('/api/livelink/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
      });
      const data = await res.json();
      addLog(`LiveLink update broadcasted on port 3000: ${type}`, 'success');
      console.log('LiveLink broadcast result:', data);
    } catch (err) {
      addLog(`LiveLink socket sync warning: local game client not running`, 'warn');
      console.warn('LiveLink REST API warning (this is expected if local game instance is idle):', err);
    }
  };

  // Simulate active MediaPipe Landmark extraction & outbound WebSocket LiveLink pipe
  useEffect(() => {
    if (!isMediaPipeActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    // Attempt video device stream
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log("Video play interrupted:", e));
        }
        addLog("MediaPipe Camera Ingress active. Reading stream buffer...", "success");
      })
      .catch(err => {
        console.warn("Camera device access restricted or unavailable. Starting virtual landmark simulation...", err);
        addLog("Camera device not accessible in this context. Initializing high-fidelity virtual MediaPipe tracker.", "warn");
      });

    // Start streaming skeletal vector updates over the LiveLink websocket pipe
    const interval = setInterval(() => {
      const timestamp = Date.now();
      const fluctuation = Math.sin(timestamp / 500) * 0.08;
      const pulse = Math.cos(timestamp / 300) * 0.04;
      
      const newScales = {
        head: parseFloat((1.0 + pulse).toFixed(3)),
        spine: parseFloat((1.0 + fluctuation * 0.5).toFixed(3)),
        shoulder_l: parseFloat((1.0 + fluctuation).toFixed(3)),
        shoulder_r: parseFloat((1.0 - fluctuation).toFixed(3)),
        arm_l: parseFloat((0.95 + pulse).toFixed(3)),
        arm_r: parseFloat((0.95 - pulse).toFixed(3)),
        hip: parseFloat((1.05 + fluctuation * 0.3).toFixed(3)),
        leg_l: parseFloat((1.0 + fluctuation * 0.8).toFixed(3)),
        leg_r: parseFloat((1.0 - fluctuation * 0.8).toFixed(3))
      };
      
      setBoneScales(newScales);

      // Establish the outbound WebSocket stream /api/livelink pipe
      pushLiveLinkUpdate('SKELETAL_BONE_SCALING', {
        source: 'MediaPipe_Joint_Ingress',
        landmarks: {
          head: {
            x: parseFloat((0.0 + (calibrationOffsets.head?.x || 0) / 100.0).toFixed(3)),
            y: parseFloat((0.8 - (calibrationOffsets.head?.y || 0) / 100.0).toFixed(3)),
            z: 0.1
          },
          left_shoulder: {
            x: parseFloat((-0.5 - fluctuation * 0.1 + (calibrationOffsets.shoulder_l?.x || 0) / 100.0).toFixed(3)),
            y: parseFloat((0.6 - (calibrationOffsets.shoulder_l?.y || 0) / 100.0).toFixed(3)),
            z: 0.2
          },
          right_shoulder: {
            x: parseFloat((0.5 + fluctuation * 0.1 + (calibrationOffsets.shoulder_r?.x || 0) / 100.0).toFixed(3)),
            y: parseFloat((0.6 - (calibrationOffsets.shoulder_r?.y || 0) / 100.0).toFixed(3)),
            z: 0.2
          },
          left_elbow: { x: -0.8, y: 0.4 + pulse, z: 0.1 },
          right_elbow: { x: 0.8, y: 0.4 - pulse, z: 0.1 },
          mid_spine: {
            x: parseFloat((0.0 + (calibrationOffsets.spine?.x || 0) / 100.0).toFixed(3)),
            y: parseFloat((0.5 - (calibrationOffsets.spine?.y || 0) / 100.0).toFixed(3)),
            z: 0.0
          },
          mid_hip: {
            x: parseFloat((0.0 + (calibrationOffsets.hip?.x || 0) / 100.0).toFixed(3)),
            y: parseFloat((0.3 - (calibrationOffsets.hip?.y || 0) / 100.0).toFixed(3)),
            z: 0.0
          }
        },
        calibrationOffsets: calibrationOffsets,
        boneScales: newScales
      });
    }, 1500);

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isMediaPipeActive, calibrationOffsets]);

  // Sync Superstar DNA
  const syncCharacterToEngine = () => {
    const local = localStorage.getItem('customSuperstar');
    if (!local) {
      setSyncStatus('No saved character found!');
      setTimeout(() => setSyncStatus(''), 3000);
      return;
    }
    
    const parsed = JSON.parse(local);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SYNC_SUPERSTAR_DNA', payload: parsed },
        '*'
      );
    }
    pushLiveLinkUpdate('SYNC_SUPERSTAR_DNA', parsed);
    setSyncStatus('DNA Injected!');
    addLog(`Injected Superstar '${parsed.name || 'Superstar'}' DNA payload to engine`, 'success');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  // Sync Arena Construction Layout
  const syncArenaToEngine = () => {
    const local = localStorage.getItem('customArena');
    if (!local) {
      setSyncStatus('No saved custom arena found!');
      setTimeout(() => setSyncStatus(''), 3000);
      return;
    }
    
    const parsed = JSON.parse(local);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SYNC_ARENA', payload: parsed },
        '*'
      );
    }
    pushLiveLinkUpdate('SYNC_ARENA', parsed);
    setSyncStatus('Arena Synced!');
    addLog(`Aligned Unreal viewport arena nodes with layout settings`, 'success');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  // Inject logo decals into Titantron dynamic texture parameter
  const injectTitantronDecal = (decalUrlOrBase64: string) => {
    const payload = {
      decalUrl: decalUrlOrBase64,
      parameterName: 'TitantronTexture',
      timestamp: new Date().toISOString()
    };

    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'INJECT_TITANTRON_DECAL', payload },
        '*'
      );
    }
    pushLiveLinkUpdate('INJECT_TITANTRON_DECAL', payload);
    setSyncStatus('Decal Synced!');
    addLog(`Mapped user custom logo image to modular Stage mesh nodes`, 'success');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  // Handle manual custom logo uploading
  const handleDecalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Str = event.target.result as string;
          setCustomDecal(base64Str);
          setSelectedDecalId('uploaded_custom');
          setActiveDecalUrl(base64Str);
          injectTitantronDecal(base64Str);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger preset logo selection
  const selectPresetDecal = (id: string, url: string) => {
    setSelectedDecalId(id);
    setActiveDecalUrl(url);
    injectTitantronDecal(url);
  };

  const finishStrengthTest = async (game: StrengthMiniGame, playerInput: number) => {
    try {
      const res = await fetch('/api/bannon/strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, playerInput })
      });
      const data = await res.json();
      if (data.result) {
        addLog('Test of Strength: SUCCESS!', 'success');
      } else {
        addLog('Test of Strength: FAILED.', 'warn');
      }
    } catch(e) {
      addLog('Test of Strength: Error', 'warn');
    }
  };

  // Reversals & gameplay input logic
  useEffect(() => {
    if (!isInputCaptured) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid blocking typing if focusing inputs
      if (document.activeElement?.tagName === 'INPUT') return;
      e.preventDefault();
      
      // Send input over WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'INPUT', code: e.code, state: 'down' }));
      }
      
      const consumeStamina = (amount: number) => {
        setStamina(prev => Math.max(0, prev - amount));
      };

      const now = Date.now();

      // Lock-up input interception if lock-up menu is active
      if (isLockUpActive) {
        if (lockUpStyle === 'w2k26') {
          // Direct hold selector
          if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            setW2kHold('facelock');
            consumeStamina(10);
            addLog('Transitioned Lock-Up into: Front Facelock', 'info');
            return;
          }
          if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            setW2kHold('wrist_lock');
            consumeStamina(8);
            addLog('Transitioned Lock-Up into: Wrist Lock', 'info');
            return;
          }
          if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            setW2kHold('hammerlock');
            consumeStamina(12);
            addLog('Transitioned Lock-Up into: Hammerlock', 'info');
            return;
          }
          if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            setW2kHold('headlock');
            consumeStamina(9);
            addLog('Transitioned Lock-Up into: Side Headlock', 'info');
            return;
          }
          if (e.code === 'KeyY') {
            // Drive Mechanic
            if (w2kHold === 'none') {
              addLog('Select an active hold first to Drive your opponent', 'warn');
            } else {
              setIsDriving(true);
              setDriveEnvironment('neutral');
              addLog('DRIVE ACTIVE: Driving opponent across ring geometry', 'info');
            }
            return;
          }
        } else {
          // AKI Style input
          if (e.code === 'Space' || e.code === 'KeyY') {
            handleAkiInput();
            return;
          }
        }
      }

      switch (e.code) {
        case 'KeyY': // Tap-reversal
          setLastReversal({ type: 'Tap', time: now });
          consumeStamina(10);
          setMomentum(prev => Math.min(100, prev + 5));
          break;
        case 'KeyX': // Breakers
          setLastReversal({ type: 'Breaker', time: now });
          consumeStamina(15);
          break;
        case 'Space': // Block/Guard
          setLastReversal({ type: 'Block', time: now });
          consumeStamina(5);
          break;
        case 'ShiftLeft': 
        case 'ShiftRight': // Dodge
          setLastReversal({ type: 'Dodge', time: now });
          consumeStamina(20);
          break;
        case 'KeyR': // Mid-move reversal
          setLastReversal({ type: 'MidMove', time: now });
          consumeStamina(25);
          setMomentum(prev => Math.min(100, prev + 15));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputCaptured, isLockUpActive, lockUpStyle, w2kHold, isDriving, akiSliderPos, akiSweetSpot]);

  const triggerLockUpSuccess = (move: string) => {
    setLockUpOutcome(move);
    addLog(`Lock-up won! Executing high-impact ${move}`, 'success');
    setMomentum(prev => Math.min(100, prev + 30));
    setTimeout(() => {
      setLockUpOutcome(null);
      setIsLockUpActive(false);
      setW2kHold('none');
      setDriveDistance(0);
      setDriveEnvironment('neutral');
      setAkiDominance(0);
    }, 2500);
  };

  const reloadGame = () => {
    setKey(prev => prev + 1);
  };

  const openExternal = () => {
    window.open(iframeUrl, '_blank');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const ROSTER = [
    { name: 'Bannon', image: 'https://images.unsplash.com/photo-1590483736622-398541ce1f8c?auto=format&fit=crop&q=80', attires: ['Default', 'Alt 1', 'Alt 2'] },
    { name: 'Vortex', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80', attires: ['Cyber', 'Street'] },
    { name: 'The Fiend', image: 'https://images.unsplash.com/photo-1623844874971-cebba1c97a5b?auto=format&fit=crop&q=80', attires: ['Base', 'God Within'] },
    { name: 'Custom Superstar', image: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80', attires: ['Slot 1', 'Slot 2', 'Slot 3'] },
  ];

  if (gameScreen === 'main_menu') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-neutral-950 p-6 relative w-full overflow-hidden" ref={containerRef}>
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay blur-sm"></div>
         <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 via-pink-500 to-red-500 mb-16 tracking-tighter uppercase z-10 drop-shadow-2xl italic">
            BANNON
         </h1>
         <div className="flex flex-col gap-4 w-full max-w-sm z-10">
            <button onClick={() => setGameScreen('character_select')} className="bg-neutral-900 border border-neutral-700 hover:border-indigo-500 hover:bg-indigo-900/40 text-white font-bold py-5 px-6 rounded-xl uppercase tracking-widest transition-all text-lg shadow-lg hover:shadow-indigo-500/20 text-left flex items-center justify-between group">
               <span>Exhibition / Fight</span>
               <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
            </button>
            <button onClick={() => setGameScreen('play')} className="bg-neutral-900 border border-neutral-700 hover:border-pink-500 hover:bg-pink-900/40 text-white font-bold py-5 px-6 rounded-xl uppercase tracking-widest transition-all text-lg shadow-lg hover:shadow-pink-500/20 text-left flex items-center justify-between group">
               <span>Career Mode</span>
               <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-pink-400 transition-colors" />
            </button>
            <button onClick={() => setGameScreen('play')} className="bg-neutral-900 border border-neutral-700 hover:border-purple-500 hover:bg-purple-900/40 text-white font-bold py-5 px-6 rounded-xl uppercase tracking-widest transition-all text-lg shadow-lg hover:shadow-purple-500/20 text-left flex items-center justify-between group">
               <span>Universe Mode</span>
               <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-purple-400 transition-colors" />
            </button>
            <button onClick={() => setGameScreen('play')} className="bg-neutral-900 border border-neutral-700 hover:border-red-500 hover:bg-red-900/40 text-white font-bold py-5 px-6 rounded-xl uppercase tracking-widest transition-all text-lg shadow-lg hover:shadow-red-500/20 text-left flex items-center justify-between group">
               <span>God Within Mode</span>
               <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-red-400 transition-colors" />
            </button>
         </div>
         <div className="absolute bottom-8 text-neutral-500 text-xs tracking-widest uppercase z-10 flex gap-6">
            <span>V159.3</span>
            <span>Unreal Engine 5</span>
            <span>LiveLink Active</span>
         </div>
      </div>
    );
  }

  if (gameScreen === 'character_select') {
    return (
      <div className="flex flex-col h-full bg-neutral-950 p-6 relative w-full overflow-hidden" ref={containerRef}>
         <div className="flex items-center justify-between z-10 mb-8 shrink-0">
           <button onClick={() => setGameScreen('main_menu')} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors uppercase tracking-wider font-bold text-sm bg-neutral-900 px-4 py-2 rounded border border-neutral-800">
             <ArrowLeft className="w-4 h-4" /> Back to Menu
           </button>
           <h2 className="text-3xl font-black text-white uppercase tracking-widest italic">Fighter Select</h2>
           <button onClick={() => setGameScreen('play')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-colors uppercase tracking-wider font-bold text-sm px-6 py-2 rounded shadow-lg shadow-indigo-500/20">
             Start Match <ArrowRight className="w-4 h-4" />
           </button>
         </div>

         <div className="flex flex-1 gap-12 z-10 items-stretch justify-center h-full min-h-0 overflow-hidden">
            {/* Player 1 Card */}
            <div className="flex-1 max-w-md flex flex-col items-center">
              <h3 className="text-indigo-400 font-black tracking-widest uppercase mb-4 text-xl">Player 1</h3>
              <div className="w-full flex-1 bg-neutral-900 border-2 border-indigo-500/50 rounded-2xl relative overflow-hidden group shadow-[0_0_30px_rgba(79,70,229,0.15)] flex flex-col justify-end">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
                <img src={ROSTER[selectedCharacter1].image} className="absolute inset-0 w-full h-full object-cover object-top opacity-80 group-hover:scale-105 transition-transform duration-700" alt="P1" />
                <div className="relative z-20 p-6 w-full text-center">
                  <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic drop-shadow-md mb-4">{ROSTER[selectedCharacter1].name}</h4>
                  
                  {/* Attire Selection - Now Functional! */}
                  <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur p-3 rounded-xl border border-neutral-800">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Change Attire</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setAttire1((prev) => (prev - 1 + ROSTER[selectedCharacter1].attires.length) % ROSTER[selectedCharacter1].attires.length)} className="p-1 hover:bg-neutral-800 rounded transition-colors text-indigo-400"><ArrowLeft className="w-5 h-5"/></button>
                      <span className="text-white font-bold min-w-[100px] text-center">{ROSTER[selectedCharacter1].attires[attire1]}</span>
                      <button onClick={() => setAttire1((prev) => (prev + 1) % ROSTER[selectedCharacter1].attires.length)} className="p-1 hover:bg-neutral-800 rounded transition-colors text-indigo-400"><ArrowRight className="w-5 h-5"/></button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6 overflow-x-auto max-w-full pb-2 scrollbar-hide">
                 {ROSTER.map((char, idx) => (
                   <button 
                     key={idx} 
                     onClick={() => { setSelectedCharacter1(idx); setAttire1(0); }}
                     className={`w-16 h-16 shrink-0 rounded border-2 overflow-hidden ${selectedCharacter1 === idx ? 'border-indigo-500' : 'border-neutral-800 opacity-50 hover:opacity-100 transition-opacity'}`}
                   >
                     <img src={char.image} className="w-full h-full object-cover object-top" />
                   </button>
                 ))}
              </div>
            </div>

            {/* VS Graphic */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-neutral-300 to-neutral-700 italic drop-shadow-2xl">VS</div>
            </div>

            {/* Player 2 Card */}
            <div className="flex-1 max-w-md flex flex-col items-center">
              <h3 className="text-red-500 font-black tracking-widest uppercase mb-4 text-xl">CPU / Player 2</h3>
              <div className="w-full flex-1 bg-neutral-900 border-2 border-red-500/50 rounded-2xl relative overflow-hidden group shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col justify-end">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
                <img src={ROSTER[selectedCharacter2].image} className="absolute inset-0 w-full h-full object-cover object-top opacity-80 group-hover:scale-105 transition-transform duration-700" alt="P2" />
                <div className="relative z-20 p-6 w-full text-center">
                  <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic drop-shadow-md mb-4">{ROSTER[selectedCharacter2].name}</h4>
                  
                  {/* Attire Selection */}
                  <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur p-3 rounded-xl border border-neutral-800">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Change Attire</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setAttire2((prev) => (prev - 1 + ROSTER[selectedCharacter2].attires.length) % ROSTER[selectedCharacter2].attires.length)} className="p-1 hover:bg-neutral-800 rounded transition-colors text-red-400"><ArrowLeft className="w-5 h-5"/></button>
                      <span className="text-white font-bold min-w-[100px] text-center">{ROSTER[selectedCharacter2].attires[attire2]}</span>
                      <button onClick={() => setAttire2((prev) => (prev + 1) % ROSTER[selectedCharacter2].attires.length)} className="p-1 hover:bg-neutral-800 rounded transition-colors text-red-400"><ArrowRight className="w-5 h-5"/></button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6 overflow-x-auto max-w-full pb-2 scrollbar-hide">
                 {ROSTER.map((char, idx) => (
                   <button 
                     key={idx} 
                     onClick={() => { setSelectedCharacter2(idx); setAttire2(0); }}
                     className={`w-16 h-16 shrink-0 rounded border-2 overflow-hidden ${selectedCharacter2 === idx ? 'border-red-500' : 'border-neutral-800 opacity-50 hover:opacity-100 transition-opacity'}`}
                   >
                     <img src={char.image} className="w-full h-full object-cover object-top" />
                   </button>
                 ))}
              </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row h-full bg-neutral-950 p-4 gap-6" ref={containerRef}>
      
      {/* Left Column: Game Viewport & HUD (Takes major space) */}
      <div className="flex-1 flex flex-col h-full space-y-4">
        
        {/* Control Bar */}
        <div className={`flex flex-wrap items-center justify-between gap-4 bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 ${isFullscreen ? 'hidden' : ''}`}>
          <div className="flex items-center gap-3">
            <Radio className={`w-5 h-5 ${bridgeStatus === 'connected' ? 'text-indigo-400 animate-pulse' : 'text-neutral-600'}`} />
            <h2 className="text-white font-bold tracking-wider uppercase text-xs">
              Bannon Game Client Viewport 
              <span className={`ml-2 text-[8px] px-1.5 py-0.5 rounded border ${bridgeStatus === 'connected' ? 'bg-indigo-950 text-indigo-300 border-indigo-700' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
                {bridgeStatus}
              </span>
            </h2>
          </div>
          
          <div className="flex-1 max-w-sm mx-2">
            <input 
              type="text" 
              value={iframeUrl}
              onChange={(e) => setIframeUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="https://mhvnsnt.github.io/Bannon/"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                // Actual Strength Test implementation
                const game: StrengthMiniGame = { difficulty: 1, threshold: 80 };
                addLog('Test of Strength: MASH BUTTON!', 'info');
                
                let mashCount = 0;
                const startTime = Date.now();
                const duration = 3000; // 3 seconds

                // Simple local UI mash handler - this needs to be integrated properly
                // For now, simulating rapid inputs during this window
                const interval = setInterval(() => {
                    mashCount += Math.floor(Math.random() * 5); // Simulating mashing
                    if (Date.now() - startTime > duration) {
                        clearInterval(interval);
                        finishStrengthTest(game, mashCount);
                    }
                }, 100);
              }}
              className="px-3 py-1.5 text-xs font-bold uppercase rounded-md bg-amber-900 hover:bg-amber-800 text-amber-200 border border-amber-700 transition-colors"
            >
              Test of Strength
            </button>
            <button 
              onClick={async () => {
                const res = await fetch('/api/bannon/mode/universe', { method: 'POST' });
                const data = await res.json();
                addLog('Universe Mode: ' + JSON.stringify(data.result), 'info');
              }}
              className="px-3 py-1.5 text-xs font-bold uppercase rounded-md bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-700 transition-colors"
            >
              Universe
            </button>
            <button 
              onClick={async () => {
                const res = await fetch('/api/bannon/mode/career', { method: 'POST' });
                const data = await res.json();
                addLog('Career Mode: ' + JSON.stringify(data.result), 'info');
              }}
              className="px-3 py-1.5 text-xs font-bold uppercase rounded-md bg-green-900 hover:bg-green-800 text-green-200 border border-green-700 transition-colors"
            >
              Career
            </button>
            <button 
              onClick={async () => {
                const res = await fetch('/api/bannon/mode/godwithin', { method: 'POST' });
                const data = await res.json();
                addLog('The God Within: ' + JSON.stringify(data.result), 'info');
              }}
              className="px-3 py-1.5 text-xs font-bold uppercase rounded-md bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-700 transition-colors"
            >
              God Within
            </button>
            <button 
              onClick={async () => {
                const res = await fetch('/api/bannon/mode/backyard', { method: 'POST' });
                const data = await res.json();
                addLog('Backyard Wrestling: ' + JSON.stringify(data.result), 'info');
              }}
              className="px-3 py-1.5 text-xs font-bold uppercase rounded-md bg-orange-900 hover:bg-orange-800 text-orange-200 border border-orange-700 transition-colors"
            >
              Backyard
            </button>
            <button 
              onClick={async () => {
                const res = await fetch('/api/bannon/mode/sandbox', { method: 'POST' });
                const data = await res.json();
                addLog('Sandbox: ' + JSON.stringify(data.result), 'info');
              }}
              className="px-3 py-1.5 text-xs font-bold uppercase rounded-md bg-teal-900 hover:bg-teal-800 text-teal-200 border border-teal-700 transition-colors"
            >
              Sandbox
            </button>
            <button 
              onClick={async () => {
                const res = await fetch('/api/bannon/mode/backstage', { method: 'POST' });
                const data = await res.json();
                addLog('Backstage: ' + JSON.stringify(data.result), 'info');
              }}
              className="px-3 py-1.5 text-xs font-bold uppercase rounded-md bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 transition-colors"
            >
              Backstage
            </button>
            {syncStatus && (
              <span className={`text-xs font-bold uppercase mr-2 flex items-center gap-1 ${syncStatus.includes('No') ? 'text-red-400' : 'text-green-400'}`}>
                <Check className="w-3.5 h-3.5" /> {syncStatus}
              </span>
            )}
            <button 
              onClick={() => setIsInputCaptured(!isInputCaptured)}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-colors flex items-center gap-2 ${
                isInputCaptured 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]' 
                  : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {isInputCaptured ? <Activity className="w-3.5 h-3.5 animate-pulse" /> : <Shield className="w-3.5 h-3.5" />}
              {isInputCaptured ? 'Input Captured' : 'Capture Key Inputs'}
            </button>
            <div className="w-px h-5 bg-neutral-800 mx-1" />
            <button 
              onClick={reloadGame}
              className="p-1.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-md transition-colors"
              title="Reload Frame"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={openExternal}
              className="p-1.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-md transition-colors"
              title="Open external viewport"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Game IFrame & HUD Wrapper */}
        <div className={`flex-1 min-h-[460px] relative rounded-xl overflow-hidden border border-neutral-800 bg-black ${isFullscreen ? 'border-none rounded-none' : ''}`}>
          
          {/* Error Handling / Open in New Tab */}
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-neutral-500 text-xs mb-4">Preview may be restricted by security policies.</p>
            <button 
              onClick={() => window.open(iframeUrl, '_blank')}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase rounded flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Open Bannon Engine in New Tab
            </button>
          </div>

          <iframe
            ref={iframeRef}
            key={key}
            src={iframeUrl}
            className={`absolute inset-0 z-10 w-full h-full border-0 transition-opacity duration-300 ${isInputCaptured ? 'opacity-40' : 'opacity-100'}`}
            title="Bannon Game Client"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>

          {/* Interactive HUD Overlay for Reversals, Drive & Lockups */}
          {isInputCaptured && (
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
              
              {/* Top HUD Row */}
              <div className="flex justify-between items-start w-full">
                
                {/* Reversal indicator panel */}
                <div className="bg-neutral-950/90 backdrop-blur-md p-3.5 rounded-xl border border-neutral-800 w-56">
                  <h3 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" /> REVERSAL BUFFERS
                  </h3>
                  <div className="space-y-1.5 text-[10px]">
                    {[
                      { label: 'Tap-Reversal', key: 'Y', type: 'Tap' },
                      { label: 'Breaker combo', key: 'X', type: 'Breaker' },
                      { label: 'Block/Guard', key: 'SPACE', type: 'Block' },
                      { label: 'Dodge/Sway', key: 'SHIFT', type: 'Dodge' },
                      { label: 'Mid-Move cue', key: 'R', type: 'MidMove' }
                    ].map(rev => {
                      const isActive = lastReversal?.type === rev.type && (Date.now() - lastReversal.time < 500);
                      return (
                        <div key={rev.type} className="flex items-center justify-between">
                          <span className="text-neutral-300 font-mono">{rev.label}</span>
                          <kbd className={`px-1 rounded text-[8px] font-bold font-mono border ${
                            isActive 
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.7)]' 
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                          }`}>
                            {rev.key}
                          </kbd>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated lock-up active hud button */}
                <div className="pointer-events-auto">
                  <button
                    onClick={() => {
                      setIsLockUpActive(!isLockUpActive);
                      setW2kHold('none');
                      setDriveDistance(0);
                      setDriveEnvironment('neutral');
                      setAkiDominance(0);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      isLockUpActive
                        ? 'bg-red-900/30 border-red-500 text-red-200'
                        : 'bg-indigo-900/20 border-indigo-500 text-indigo-200 hover:bg-indigo-900/30'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    {isLockUpActive ? 'Exit Lock-Up Mode' : 'Initiate Lock-Up Hub'}
                  </button>
                </div>
              </div>

              {/* CENTER SCREEN: Test of Strength / Grapple Hub HUD Simulation */}
              <AnimatePresence>
                {isLockUpActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-950/95 backdrop-blur-md p-5 rounded-2xl border border-neutral-850 w-[420px] pointer-events-auto shadow-2xl space-y-4"
                  >
                    
                    {/* Header Select Mode */}
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-2.5">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Wrestling Combat HUD
                      </span>
                      
                      <div className="flex gap-1.5 bg-neutral-900 p-0.5 rounded border border-neutral-800">
                        <button
                          onClick={() => setLockUpStyle('w2k26')}
                          className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded ${lockUpStyle === 'w2k26' ? 'bg-indigo-600 text-white' : 'text-neutral-500'}`}
                        >
                          WWE 2K26 Hub
                        </button>
                        <button
                          onClick={() => setLockUpStyle('aki')}
                          className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded ${lockUpStyle === 'aki' ? 'bg-indigo-600 text-white' : 'text-neutral-500'}`}
                        >
                          AKI Legacy
                        </button>
                      </div>
                    </div>

                    {/* LOCKUP SIMULATION CONTENT */}
                    {lockUpOutcome ? (
                      <div className="text-center py-6 space-y-2">
                        <Flame className="w-10 h-10 text-orange-500 animate-bounce mx-auto" />
                        <h4 className="text-sm font-bold uppercase text-white tracking-widest">{lockUpOutcome}</h4>
                        <p className="text-[10px] text-neutral-400 font-mono">Unreal Client AnimMontage Dispatched</p>
                      </div>
                    ) : lockUpStyle === 'aki' ? (
                      
                      /* AKI LEGACY SLIDING MINI-GAME */
                      <div className="space-y-4">
                        <div className="text-center">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Test of Strength: Slider Balance</h4>
                          <p className="text-[9px] text-neutral-400 mt-0.5">Press <kbd className="px-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-white text-[8px]">SPACE</kbd> or <kbd className="px-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-white text-[8px]">Y</kbd> in the GREEN zone!</p>
                        </div>

                        {/* Slider bar */}
                        <div className="h-4 bg-neutral-900 rounded-full border border-neutral-800 relative overflow-hidden">
                          {/* Green Zone (Sweet spot) */}
                          <div 
                            className="absolute top-0 bottom-0 bg-green-500/30 border-x border-green-400"
                            style={{ left: `${akiSweetSpot - 6}%`, width: '12%' }}
                          />
                          
                          {/* Sliding cursor */}
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white] transition-all"
                            style={{ left: `${akiSliderPos}%` }}
                          />
                        </div>

                        {/* Dominance Meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-mono font-bold text-neutral-400">
                            <span>OPPONENT</span>
                            <span className="text-indigo-400">PLAYER</span>
                          </div>
                          <div className="h-2 bg-neutral-900 rounded border border-neutral-850 relative overflow-hidden flex">
                            <div 
                              className={`h-full ${akiDominance >= 0 ? 'bg-indigo-500 ml-auto' : 'bg-red-500 mr-auto'}`}
                              style={{ width: `${Math.abs(akiDominance)}%`, marginLeft: akiDominance >= 0 ? '50%' : 'auto', marginRight: akiDominance < 0 ? '50%' : 'auto' }}
                            />
                          </div>
                        </div>

                        {/* Active Controls button */}
                        <button
                          onClick={handleAkiInput}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-lg transition-all"
                        >
                          Push / Match Timing
                        </button>

                      </div>

                    ) : (

                      /* WWE 2K26 MODERN GRA PPLE LOCK-UP HUB */
                      <div className="space-y-4">
                        <div className="text-center">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">WWE 2K26 Multi-Directional Hub</h4>
                          <p className="text-[9px] text-neutral-400 mt-0.5">Use <strong className="text-neutral-300">W/A/S/D or Arrows</strong> to change hold. Hold <strong className="text-indigo-400">Y</strong> to Drive opponent!</p>
                        </div>

                        {/* Multi directional indicators */}
                        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto text-center">
                          <div />
                          <div className={`p-2 rounded border flex flex-col items-center ${w2kHold === 'facelock' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-neutral-900/50 border-neutral-800 text-neutral-500'}`}>
                            <ArrowUp className="w-4 h-4" />
                            <span className="text-[8px] font-bold mt-1 uppercase">Facelock (W)</span>
                          </div>
                          <div />

                          <div className={`p-2 rounded border flex flex-col items-center ${w2kHold === 'hammerlock' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-neutral-900/50 border-neutral-800 text-neutral-500'}`}>
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-[8px] font-bold mt-1 uppercase">Hammer (A)</span>
                          </div>
                          <div className="flex items-center justify-center text-[9px] font-mono font-bold text-neutral-400 border border-neutral-800 rounded bg-neutral-900 uppercase">
                            LOCK-UP
                          </div>
                          <div className={`p-2 rounded border flex flex-col items-center ${w2kHold === 'headlock' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-neutral-900/50 border-neutral-800 text-neutral-500'}`}>
                            <ArrowRight className="w-4 h-4" />
                            <span className="text-[8px] font-bold mt-1 uppercase">Headlock (D)</span>
                          </div>

                          <div />
                          <div className={`p-2 rounded border flex flex-col items-center ${w2kHold === 'wrist_lock' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-neutral-900/50 border-neutral-800 text-neutral-500'}`}>
                            <ArrowDown className="w-4 h-4" />
                            <span className="text-[8px] font-bold mt-1 uppercase">Wrist (S)</span>
                          </div>
                          <div />
                        </div>

                        {/* Drive / Relocation physics state */}
                        <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 space-y-2">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="font-mono text-neutral-400">SPATIAL DRIVE DISTANCE</span>
                            <span className="font-mono text-white font-bold">{driveDistance.toFixed(1)} / 10.0m</span>
                          </div>

                          {/* Drive Bar */}
                          <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                            <div 
                              className={`h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all ${isDriving ? 'animate-pulse' : ''}`}
                              style={{ width: `${driveDistance * 10}%` }}
                            />
                          </div>

                          {/* Environmental collision trigger warnings */}
                          <div className="flex gap-2">
                            {[
                              { label: 'Ropes', id: 'ropes' },
                              { label: 'Turnbuckle', id: 'turnbuckle' },
                              { label: 'Steel Barricade', id: 'steel_barricade' }
                            ].map(env => (
                              <div 
                                key={env.id} 
                                className={`flex-1 text-center py-1 rounded text-[8px] font-mono font-bold uppercase transition-colors border ${
                                  driveEnvironment === env.id 
                                    ? 'bg-red-950 text-red-400 border-red-500 animate-pulse' 
                                    : 'bg-neutral-950 text-neutral-600 border-neutral-900'
                                }`}
                              >
                                {env.label}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Execute Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onMouseDown={() => {
                              if (w2kHold !== 'none') {
                                setIsDriving(true);
                                setDriveEnvironment('neutral');
                              } else {
                                addLog('Please select a hold style (W/A/S/D) first', 'warn');
                              }
                            }}
                            onMouseUp={() => setIsDriving(false)}
                            className="flex-1 py-1.5 bg-indigo-600/30 border border-indigo-500 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold uppercase rounded"
                          >
                            Hold Y to Drive
                          </button>
                          
                          <button
                            onClick={() => {
                              if (w2kHold === 'none') return;
                              const movesMap = {
                                facelock: 'DDT on the Mat',
                                wrist_lock: 'Northern Lights Suplex',
                                hammerlock: 'German Belly-to-Back',
                                headlock: 'Side Headlock Takeover'
                              };
                              triggerLockUpSuccess(movesMap[w2kHold]);
                            }}
                            disabled={w2kHold === 'none'}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded disabled:opacity-45"
                          >
                            Execute Move
                          </button>
                        </div>
                      </div>

                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom HUD: Player Vitals */}
              <div className="flex justify-between items-end w-full mt-auto">
                <div className="w-72 bg-neutral-950/90 backdrop-blur-md p-3.5 rounded-xl border border-neutral-800">
                  <div className="text-white font-bold text-xs tracking-wide mb-2 flex items-center justify-between">
                    <span>PLAYER 1</span>
                    <span className="text-[8px] text-green-400 font-mono bg-green-950/30 px-1.5 py-0.5 border border-green-800/40 rounded uppercase">BANNON_AI_READY</span>
                  </div>
                  
                  {/* Health */}
                  <div className="space-y-0.5 mb-2">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                      <span>VITAL CONDITION (HEALTH)</span>
                      <span>{health}%</span>
                    </div>
                    <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-200"
                        style={{ width: `${health}%` }}
                      />
                    </div>
                  </div>

                  {/* Stamina */}
                  <div className="space-y-0.5 mb-2">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                      <span>STAMINA RECOVERY</span>
                      <span className={stamina < 30 ? 'text-red-400 animate-pulse' : ''}>{stamina.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className={`h-full transition-all duration-75 ${stamina < 30 ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${stamina}%` }}
                      />
                    </div>
                  </div>

                  {/* Momentum */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                      <span>MOMENTUM MULTIPLIER</span>
                      <span>{momentum.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-200"
                        style={{ width: `${momentum}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Bottom HUD: Opponent Status */}
                <div className="w-52 bg-neutral-950/90 backdrop-blur-md p-3.5 rounded-xl border border-neutral-800 text-right">
                  <span className="text-[8px] font-mono text-neutral-500 block uppercase">OPPONENT CONDITION</span>
                  <span className="text-white font-bold text-xs uppercase">Bannon Bot (AI)</span>
                  <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden mt-2 border border-neutral-800">
                    <div className="h-full bg-red-600 w-[85%]" />
                  </div>
                </div>
              </div>

              {/* Captured input default prompt */}
              {!isLockUpActive && (
                <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-30 select-none">
                  <Activity className="w-16 h-16 text-neutral-400 mx-auto mb-2" />
                  <h1 className="text-xl font-bold text-white tracking-widest uppercase">INPUT CAPTURE BUFFER</h1>
                  <p className="text-[9px] text-neutral-400 font-mono mt-1">Press reversal bindings or tie-up locks to test dynamic HUD integrations</p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Right Column: LiveLink Command Deck & Logo Injector (Command center sidebar) */}
      <div className="w-full xl:w-[350px] space-y-4 flex flex-col justify-between">
        
        {/* Sync Controls Section */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Engine LiveLink Control Deck</h3>
            </div>
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
          </div>

          <div className="space-y-2.5">
            <button
              onClick={syncCharacterToEngine}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
            >
              <Cpu className="w-3.5 h-3.5" />
              Sync Character DNA
            </button>

            <button
              onClick={syncArenaToEngine}
              className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Layers className="w-3.5 h-3.5" />
              Sync Arena Blueprint
            </button>
          </div>

          {/* MediaPipe Video Stream Ingress & Bone Scaling */}
          <div className="pt-3 border-t border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" /> MediaPipe Camera Ingress
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setIsCalibrating(!isCalibrating);
                    if (!isCalibrating) {
                      addLog("Calibration Mode enabled. Select a joint anchor and click viewport to position.", "info");
                    }
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors border ${
                    isCalibrating 
                      ? 'bg-amber-950 text-amber-400 border-amber-500' 
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                  }`}
                  title="Calibrate skeletal alignment anchors"
                >
                  {isCalibrating ? 'Calibrating...' : 'Calibrate'}
                </button>
                <button
                  onClick={() => setIsMediaPipeActive(!isMediaPipeActive)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors border ${
                    isMediaPipeActive 
                      ? 'bg-green-950/40 text-green-400 border-green-500' 
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {isMediaPipeActive ? 'Streaming' : 'Off'}
                </button>
              </div>
            </div>

            {/* Calibration Control Deck */}
            {isCalibrating && (
              <div className="p-2.5 bg-neutral-950 border border-amber-500/30 rounded-lg space-y-2 animate-fadeIn text-[10px]">
                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-amber-400 animate-spin" /> Manual Anchor Calibration Step
                </div>
                <p className="text-[9px] text-neutral-400">
                  Select a reference joint, then click directly on the camera viewport to manually lock-in its baseline coordinate offset.
                </p>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {(['head', 'shoulder_l', 'shoulder_r', 'spine', 'hip'] as const).map(j => (
                    <button
                      key={j}
                      onClick={() => setSelectedCalibrateJoint(j)}
                      className={`py-1 rounded text-[8px] font-mono uppercase tracking-tight transition-all ${
                        selectedCalibrateJoint === j 
                          ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20' 
                          : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850'
                      }`}
                    >
                      {j === 'shoulder_l' ? 'SHLD_L' : j === 'shoulder_r' ? 'SHLD_R' : j}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500 border-t border-neutral-900 pt-2">
                  <span>Current {selectedCalibrateJoint.toUpperCase()} Offset:</span>
                  <span className="text-amber-400 font-bold">
                    X: {calibrationOffsets[selectedCalibrateJoint]?.x || 0}%, Y: {calibrationOffsets[selectedCalibrateJoint]?.y || 0}%
                  </span>
                  <button
                    onClick={() => {
                      setCalibrationOffsets({
                        head: { x: 0, y: 0 },
                        shoulder_l: { x: 0, y: 0 },
                        shoulder_r: { x: 0, y: 0 },
                        spine: { x: 0, y: 0 },
                        hip: { x: 0, y: 0 }
                      });
                      addLog("Reset all manual alignment calibration offsets to zero", "info");
                    }}
                    className="text-neutral-400 hover:text-white transition-colors bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {(isMediaPipeActive || isCalibrating) ? (
              <div className="space-y-2.5 animate-fadeIn">
                {/* Camera element container */}
                <div 
                  onClick={(e) => {
                    if (!isCalibrating) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
                    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    const defaults = {
                      head: { x: 48, y: 35 },
                      shoulder_l: { x: 40, y: 48 },
                      shoulder_r: { x: 56, y: 48 },
                      spine: { x: 48, y: 56 },
                      hip: { x: 48, y: 65 }
                    };

                    const currentDefault = defaults[selectedCalibrateJoint];
                    const newX = clickX - currentDefault.x;
                    const newY = clickY - currentDefault.y;

                    setCalibrationOffsets(prev => ({
                      ...prev,
                      [selectedCalibrateJoint]: { x: Math.round(newX), y: Math.round(newY) }
                    }));
                    
                    addLog(`Calibrated ${selectedCalibrateJoint.toUpperCase()} anchor node to offsets X:${Math.round(newX)}%, Y:${Math.round(newY)}%`, 'info');
                  }}
                  className={`relative aspect-video rounded-lg overflow-hidden border bg-black flex items-center justify-center transition-all ${
                    isCalibrating 
                      ? 'border-amber-500 cursor-crosshair ring-2 ring-amber-500/20' 
                      : 'border-indigo-500/30'
                  }`}
                >
                  {isMediaPipeActive ? (
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center space-y-1.5 p-4 text-center">
                      <Camera className="w-8 h-8 text-neutral-700 animate-pulse" />
                      <span className="text-[10px] text-neutral-400 font-bold">Calibration Reference Blueprint</span>
                      <span className="text-[8px] text-neutral-600 max-w-xs">Click-to-align anchors in canvas before turning camera stream on.</span>
                    </div>
                  )}

                  {/* Virtual overlay showing skeleton points */}
                  <div className="absolute inset-0 bg-indigo-950/20 flex flex-col justify-between p-2 pointer-events-none">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono font-bold bg-indigo-600 px-1 py-0.5 rounded text-white uppercase tracking-wider">
                        {isCalibrating ? 'CALIBRATION OVERLAY' : 'Live Joint Mapping'}
                      </span>
                      <span className={`text-[8px] font-mono font-bold ${isMediaPipeActive ? 'text-green-400 animate-pulse' : 'text-amber-400'}`}>
                        {isMediaPipeActive ? '● Rec: 30 FPS' : 'STANDBY'}
                      </span>
                    </div>

                    {/* Simulated skeletal rig with manual calibration offsets applied */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Head Joint Anchor */}
                      <div 
                        className={`w-2.5 h-2.5 rounded-full absolute transition-all flex items-center justify-center ${
                          selectedCalibrateJoint === 'head' && isCalibrating
                            ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] border border-white' 
                            : 'bg-indigo-400'
                        }`} 
                        style={{ 
                          top: `${35 + (calibrationOffsets.head?.y || 0)}%`, 
                          left: `${48 + (calibrationOffsets.head?.x || 0)}%` 
                        }} 
                      >
                        <span className="w-1 h-1 bg-white rounded-full" />
                      </div>

                      {/* Spine / Chest Joint Anchor */}
                      <div 
                        className={`w-2.5 h-2.5 rounded-full absolute transition-all flex items-center justify-center ${
                          selectedCalibrateJoint === 'spine' && isCalibrating
                            ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] border border-white' 
                            : 'bg-green-400'
                        }`} 
                        style={{ 
                          top: `${52 + (calibrationOffsets.spine?.y || 0)}%`, 
                          left: `${48 + (calibrationOffsets.spine?.x || 0)}%` 
                        }} 
                      >
                        <span className="w-1 h-1 bg-white rounded-full" />
                      </div>

                      {/* Shoulder L Joint Anchor */}
                      <div 
                        className={`w-2.5 h-2.5 rounded-full absolute transition-all flex items-center justify-center ${
                          selectedCalibrateJoint === 'shoulder_l' && isCalibrating
                            ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] border border-white' 
                            : 'bg-green-400'
                        }`} 
                        style={{ 
                          top: `${46 + (calibrationOffsets.shoulder_l?.y || 0)}%`, 
                          left: `${40 + (calibrationOffsets.shoulder_l?.x || 0)}%` 
                        }} 
                      >
                        <span className="w-1 h-1 bg-white rounded-full" />
                      </div>

                      {/* Shoulder R Joint Anchor */}
                      <div 
                        className={`w-2.5 h-2.5 rounded-full absolute transition-all flex items-center justify-center ${
                          selectedCalibrateJoint === 'shoulder_r' && isCalibrating
                            ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] border border-white' 
                            : 'bg-green-400'
                        }`} 
                        style={{ 
                          top: `${46 + (calibrationOffsets.shoulder_r?.y || 0)}%`, 
                          left: `${56 + (calibrationOffsets.shoulder_r?.x || 0)}%` 
                        }} 
                      >
                        <span className="w-1 h-1 bg-white rounded-full" />
                      </div>

                      {/* Pelvis / Hip Joint Anchor */}
                      <div 
                        className={`w-2.5 h-2.5 rounded-full absolute transition-all flex items-center justify-center ${
                          selectedCalibrateJoint === 'hip' && isCalibrating
                            ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] border border-white' 
                            : 'bg-indigo-400'
                        }`} 
                        style={{ 
                          top: `${65 + (calibrationOffsets.hip?.y || 0)}%`, 
                          left: `${48 + (calibrationOffsets.hip?.x || 0)}%` 
                        }} 
                      >
                        <span className="w-1 h-1 bg-white rounded-full" />
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-indigo-300">Outbound: /api/livelink/update</span>
                  </div>
                </div>

                {/* Realtime Bone Scaling Matrix Display */}
                <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-850 space-y-1.5">
                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest block border-b border-neutral-800 pb-1">Real-time Bone Scaling Matrix</span>
                  <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">HEAD</span>
                      <span className="text-indigo-400 font-bold">{boneScales.head}</span>
                    </div>
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">SPINE</span>
                      <span className="text-indigo-400 font-bold">{boneScales.spine}</span>
                    </div>
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">HIP</span>
                      <span className="text-indigo-400 font-bold">{boneScales.hip}</span>
                    </div>
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">SHLD_L</span>
                      <span className="text-indigo-400 font-bold">{boneScales.shoulder_l}</span>
                    </div>
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">ARM_L</span>
                      <span className="text-indigo-400 font-bold">{boneScales.arm_l}</span>
                    </div>
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">LEG_L</span>
                      <span className="text-indigo-400 font-bold">{boneScales.leg_l}</span>
                    </div>
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">SHLD_R</span>
                      <span className="text-indigo-400 font-bold">{boneScales.shoulder_r}</span>
                    </div>
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">ARM_R</span>
                      <span className="text-indigo-400 font-bold">{boneScales.arm_r}</span>
                    </div>
                    <div className="flex justify-between p-1 bg-neutral-900 rounded">
                      <span className="text-neutral-500">LEG_R</span>
                      <span className="text-indigo-400 font-bold">{boneScales.leg_r}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-neutral-800 p-4 text-center rounded-lg">
                <p className="text-[10px] text-neutral-500">MediaPipe camera ingress is offline. Activate to stream live bone scalings over WebSocket.</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-lg text-[10px] space-y-1 text-neutral-400">
            <span className="font-mono text-indigo-300 font-bold uppercase block">LiveLink Config Target:</span>
            <span className="block font-mono text-[9px]">Server API: <span className="text-white">localhost:3000/api/livelink</span></span>
            <span className="block font-mono text-[9px]">WebSocket: <span className="text-white">ws://localhost:3000/livelink</span></span>
          </div>
        </div>

        {/* Logo/Decal Injector Section */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-4 flex-1">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Image className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Titantron Decal Injector</h3>
          </div>

          {/* Preset Decal Selector */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold">Official Presentation Decals</span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(preset => {
                const isSelected = selectedDecalId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => selectPresetDecal(preset.id, preset.url)}
                    className={`p-1.5 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-600/10' 
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.name} 
                      className="w-full h-14 object-cover rounded-md mb-1.5"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[8px] font-bold text-neutral-300 uppercase block truncate leading-none">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom imagery upload */}
          <div className="space-y-2 pt-2 border-t border-neutral-850">
            <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold">Inject Custom Image File</span>
            <label className="w-full h-16 border-2 border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors p-2">
              <Upload className="w-4 h-4 text-neutral-400 mb-1" />
              <span className="text-[8px] font-bold text-neutral-400 uppercase">Upload Decal PNG/JPG</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleDecalUpload} 
                className="hidden" 
              />
            </label>

            {customDecal && (
              <div className="flex items-center gap-2 p-1.5 bg-neutral-950 border border-neutral-850 rounded-md">
                <img 
                  src={customDecal} 
                  alt="Custom Decal Preview" 
                  className="w-10 h-10 object-cover rounded border border-neutral-800" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase block">Custom Decal Loaded</span>
                  <span className="text-[7px] text-neutral-500 block">Injecting Base64 payload...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LiveLive Logging Console */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-3 h-48 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">LiveLink Diagnostics</h3>
            </div>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 text-[9px] font-mono space-y-1.5 max-h-32 no-scrollbar">
            {liveLinkLogs.map((log, idx) => (
              <div key={idx} className="leading-snug">
                <span className="text-neutral-500 mr-1.5">[{log.time}]</span>
                <span className={
                  log.status === 'success' ? 'text-green-400' :
                  log.status === 'warn' ? 'text-yellow-400' :
                  'text-neutral-300'
                }>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
