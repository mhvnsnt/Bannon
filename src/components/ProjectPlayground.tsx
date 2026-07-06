import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RefreshCw, Volume2, VolumeX, AlertCircle, 
  Activity, ArrowRight, Paintbrush, Sliders, Layout, 
  Sparkles, Key, Zap, Flame, Clock, Trophy, RefreshCw as LoopIcon,
  ChevronLeft, Code, Send
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface ProjectPlaygroundProps {
  projectId: string | null;
  onBackToSelector?: () => void;
}

export default function ProjectPlayground({ projectId, onBackToSelector }: ProjectPlaygroundProps) {
  const [activeProjId, setActiveProjId] = useState<string | null>(projectId);

  useEffect(() => {
    if (projectId) {
      setActiveProjId(projectId);
    }
  }, [projectId]);

  const selectables = [
    { id: 'audio_visualizer', name: 'The Audio Visualizer', color: 'from-purple-500 to-pink-500' },
    { id: 'crypto_ticker', name: 'The Crypto Panic Ticker', color: 'from-emerald-500 to-teal-500' },
    { id: 'micro_clicker', name: 'The 60-Second Micro-Clicker', color: 'from-orange-500 to-red-500' },
    { id: 'beat_pad', name: 'The Hertz Beat Pad', color: 'from-blue-500 to-indigo-500' },
    { id: 'matrix_scrambler', name: 'The Matrix Scrambler', color: 'from-green-500 to-emerald-600' },
    { id: 'physics_ball_pit', name: 'The Physics Ball Pit', color: 'from-cyan-500 to-blue-500' },
    { id: 'color_clock', name: 'The Color Clock', color: 'from-yellow-500 to-orange-500' },
    { id: 'paintbrush_tool', name: 'The Paintbrush Tool', color: 'from-pink-500 to-rose-500' },
    { id: 'css_3d_cube', name: 'The CSS 3D Cube', color: 'from-indigo-500 to-purple-500' },
    { id: 'password_cracker', name: 'The Password Cracker Simulator', color: 'from-slate-600 to-slate-800' },
    { id: 'god_build', name: 'The God Build (All-In-One Hybrid)', color: 'from-yellow-500 via-red-500 to-purple-600' },
  ];

  if (!activeProjId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border border-black/5 rounded-2xl max-w-4xl mx-auto my-8 font-sans">
        <Sparkles className="w-12 h-12 text-indigo-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-black text-black uppercase tracking-wider">Project Sandbox Launcher</h3>
        <p className="text-slate-500 text-xs mt-2 max-w-md leading-relaxed">
          No project is currently active or selected. Choose an unlocked capstone blueprint below to launch it directly in this live interactive simulation sandbox!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full mt-8">
          {selectables.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveProjId(item.id)}
              className="group relative flex flex-col text-left p-4 bg-white hover:bg-slate-50 border border-black/5 hover:border-black/25 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
            >
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color} mb-2`} />
              <span className="font-bold text-xs text-slate-800 group-hover:text-black transition-colors">{item.name}</span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">Launch →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-6 bg-white rounded-2xl border border-black/5 shadow-inner">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSelector || (() => setActiveProjId(null))}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-black transition-colors cursor-pointer"
            title="Back to blueprint menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">
                Sandbox Simulator Mode
              </span>
              {activeProjId && (
                <button
                  onClick={() => setActiveProjId(null)}
                  className="text-[9px] uppercase font-mono tracking-wider text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Change Project
                </button>
              )}
            </div>
            <h2 className="text-xl font-black text-black mt-1">
              {selectables.find(s => s.id === activeProjId)?.name || activeProjId.toUpperCase()}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase bg-slate-50 px-2.5 py-1 text-slate-500 rounded border">
            Engine: WASM-VM-Harness
          </span>
          <button 
            onClick={() => {
              // trigger hard refresh of sandbox
              const id = activeProjId;
              setActiveProjId(null);
              setTimeout(() => setActiveProjId(id), 100);
            }} 
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-black border transition-all cursor-pointer"
            title="Reset sandbox state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Sandbox Window */}
      <div className="flex-1 bg-slate-50 rounded-xl p-4 md:p-6 border border-black/5 shadow-inner min-h-[420px] flex flex-col justify-between">
        <div className="flex-1 w-full flex flex-col justify-center">
          <SandboxRouter id={activeProjId} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SANDBOX ROUTER
   ============================================================================ */
function SandboxRouter({ id }: { id: string }) {
  switch (id) {
    case 'audio_visualizer':
      return <AudioVisualizerSandbox />;
    case 'crypto_ticker':
      return <CryptoTickerSandbox />;
    case 'micro_clicker':
      return <MicroClickerSandbox />;
    case 'beat_pad':
      return <BeatPadSandbox />;
    case 'matrix_scrambler':
      return <MatrixScramblerSandbox />;
    case 'physics_ball_pit':
      return <PhysicsBallPitSandbox />;
    case 'color_clock':
      return <ColorClockSandbox />;
    case 'paintbrush_tool':
      return <PaintbrushSandbox />;
    case 'css_3d_cube':
      return <CssCubeSandbox />;
    case 'password_cracker':
      return <PasswordCrackerSandbox />;
    case 'god_build':
      return <GodBuildSandbox />;
    default:
      return (
        <div className="text-center text-slate-500 text-sm">
          Unknown template id.
        </div>
      );
  }
}

/* ============================================================================
   1. AUDIO VISUALIZER SANDBOX
   ============================================================================ */
function AudioVisualizerSandbox() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bassLevel, setBassLevel] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Synthesize dynamic synthetic frequency triggers to drive pulses
  const startAudioSynthesizer = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, ctx.currentTime); // Low bass A1 freq
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 500;
    let height = canvas.height = 300;

    let circles: { radius: number; opacity: number; color: string }[] = [];
    let angle = 0;

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        width = canvas.width;
      }
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      // Draw Pitch Black Canvas
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Pulse calculation
      const currentPulse = (isPlaying ? Math.sin(angle) * 15 : 0) + (bassLevel / 2.5);
      angle += isPlaying ? 0.12 : 0.02;

      // Draw expanding neon rings
      if (isPlaying && Math.random() > 0.85) {
        circles.push({
          radius: 30 + currentPulse,
          opacity: 1.0,
          color: `hsl(${Math.random() * 360}, 100%, 65%)`
        });
        startAudioSynthesizer();
      }

      circles.forEach((c, idx) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, c.radius, 0, Math.PI * 2);
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 4 * c.opacity;
        ctx.shadowBlur = 18;
        ctx.shadowColor = c.color;
        ctx.globalAlpha = c.opacity;
        ctx.stroke();
        
        c.radius += 2.5;
        c.opacity -= 0.015;
      });

      circles = circles.filter(c => c.opacity > 0);
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0; // reset shadow

      // Core pulsating circle
      const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 45 + currentPulse);
      gradient.addColorStop(0, '#f472b6');
      gradient.addColorStop(0.5, '#db2777');
      gradient.addColorStop(1, 'rgba(219, 39, 119, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 45 + currentPulse, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Equalizer bars around the ring
      const numBars = 64;
      for (let i = 0; i < numBars; i++) {
        const theta = (i / numBars) * Math.PI * 2;
        const offset = Math.sin(theta * 6 + angle) * (isPlaying ? 15 : 3);
        const startRad = 55 + currentPulse;
        const length = 12 + Math.max(0, offset) + (isPlaying ? (bassLevel / 6) : 0);

        const x1 = centerX + Math.cos(theta) * startRad;
        const y1 = centerY + Math.sin(theta) * startRad;
        const x2 = centerX + Math.cos(theta) * (startRad + length);
        const y2 = centerY + Math.sin(theta) * (startRad + length);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsl(${(i / numBars) * 360}, 100%, 70%)`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [isPlaying, bassLevel]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
        <canvas ref={canvasRef} className="w-full block" />
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-800 uppercase tracking-widest">
          {isPlaying ? "🎙️ Bass Pulse Active" : "🛑 Standby"}
        </div>
      </div>

      <div className="w-full bg-white border border-black/5 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Visualizer Controls</span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-white shadow transition-all ${isPlaying ? "bg-pink-600 hover:bg-pink-500" : "bg-black hover:bg-slate-800"}`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 animate-ping" />}
            {isPlaying ? "Pause Beat" : "Start Beat"}
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Bass Decibel Pulse:</span>
            <span>{bassLevel} dB</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            value={bassLevel}
            onChange={(e) => setBassLevel(Number(e.target.value))}
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
          />
        </div>
        
        <p className="text-[10px] text-slate-400 leading-normal font-mono">
          🎛️ Click **Start Beat** to begin the synthesis loop. Sound triggers low-frequency synth waves that dynamically pipe into the expander buffer!
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
   2. CRYPTO PANIC TICKER SANDBOX
   ============================================================================ */
function CryptoTickerSandbox() {
  const [ticker, setTicker] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [alertThreshold, setAlertThreshold] = useState(0.85); // % change alert
  const [panicState, setPanicState] = useState<'STABLE' | 'PANIC_DIP' | 'PUMP_MOON'>('STABLE');

  const basePrices = { BTC: 88500, ETH: 3250, SOL: 185 };

  useEffect(() => {
    // Generate initial history
    let price = basePrices[ticker];
    const initialHistory = Array.from({ length: 15 }).map((_, i) => {
      const change = (Math.random() - 0.5) * 1.5; // -0.75% to +0.75%
      price = price * (1 + change / 100);
      return { time: `${i + 1}s`, price: Math.round(price * 100) / 100 };
    });
    setPriceHistory(initialHistory);

    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const lastPrice = prev[prev.length - 1].price;
        const isCrash = Math.random() > 0.85; // 15% chance of sudden collapse
        const isMoon = Math.random() > 0.90; // 10% chance of sudden spike
        let percentChange = (Math.random() - 0.48) * 1.0; // organic drift

        if (isCrash) {
          percentChange = -3.5 - Math.random() * 3; // -3.5% to -6.5% Crash
          setPanicState('PANIC_DIP');
          setTimeout(() => setPanicState('STABLE'), 3000);
        } else if (isMoon) {
          percentChange = 2.5 + Math.random() * 2.5; // Moon
          setPanicState('PUMP_MOON');
          setTimeout(() => setPanicState('STABLE'), 3000);
        }

        const nextPrice = Math.round(lastPrice * (1 + percentChange / 100) * 100) / 100;
        const nextHistory = [...prev.slice(1), { time: 'Now', price: nextPrice }];
        return nextHistory;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [ticker]);

  const activePrice = priceHistory[priceHistory.length - 1]?.price || basePrices[ticker];
  const firstPrice = priceHistory[0]?.price || basePrices[ticker];
  const diffPercent = ((activePrice - firstPrice) / firstPrice) * 100;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className={`rounded-xl p-5 border transition-all duration-300 relative overflow-hidden ${
        panicState === 'PANIC_DIP' 
          ? "bg-red-500/10 border-red-500 animate-pulse" 
          : panicState === 'PUMP_MOON' 
            ? "bg-emerald-500/10 border-emerald-500 animate-pulse" 
            : "bg-slate-950 border-slate-800"
      }`}>
        <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">
          Update Interval: 4,000ms
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-bold font-mono text-xs uppercase">{ticker} / USD</span>
          {panicState === 'PANIC_DIP' && (
            <span className="bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded animate-bounce">
              ⚠️ PANIC SELLING DETECTED
            </span>
          )}
          {panicState === 'PUMP_MOON' && (
            <span className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded animate-bounce">
              🚀 LIQUIDITY ROCKET UNLEASHED
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-3xl font-black text-white tracking-tight font-mono">
            ${activePrice.toLocaleString()}
          </span>
          <span className={`text-xs font-bold font-mono ${diffPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {diffPercent >= 0 ? "+" : ""}{diffPercent.toFixed(2)}%
          </span>
        </div>

        {/* Real-time chart */}
        <div className="h-40 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory}>
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={diffPercent >= 0 ? "#10b981" : "#ef4444"} 
                strokeWidth={3} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-black/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border">
          {(['BTC', 'ETH', 'SOL'] as const).map(t => (
            <button
              key={t}
              onClick={() => {
                setTicker(t);
                setPriceHistory([]);
              }}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all cursor-pointer ${ticker === t ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-black"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-mono text-center sm:text-right">
          ⚙️ Live stream active. Simulated blockchain drift with crash alerts.
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. 60-SECOND MICRO-CLICKER SANDBOX
   ============================================================================ */
function MicroClickerSandbox() {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('micro-clicker-highscore') || '0'));
  const [timeLeft, setTimeLeft] = useState(60);
  const [boxPosition, setBoxPosition] = useState({ x: 50, y: 50 }); // percentages

  const timerRef = useRef<number | null>(null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameState('PLAYING');
    teleportBox();
  };

  const teleportBox = () => {
    const rx = Math.floor(Math.random() * 80) + 10; // keep padding
    const ry = Math.floor(Math.random() * 80) + 10;
    setBoxPosition({ x: rx, y: ry });
  };

  const handleBoxClick = () => {
    if (gameState !== 'PLAYING') return;
    setScore(s => {
      const ns = s + 1;
      if (ns > highScore) {
        setHighScore(ns);
        localStorage.setItem('micro-clicker-highscore', ns.toString());
      }
      return ns;
    });
    teleportBox();
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setGameState('GAME_OVER');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="flex w-full justify-between items-center bg-slate-900 text-white rounded-xl p-3 border border-slate-800 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>Timer: <strong className="text-orange-400">{timeLeft}s</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <span>Score: <strong className="text-yellow-400">{score}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Record: <strong className="text-amber-400">{highScore}</strong></span>
        </div>
      </div>

      <div className="relative w-full h-[320px] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        {gameState === 'IDLE' && (
          <div className="text-center p-6 animate-in fade-in duration-300">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
            <h4 className="text-base font-black text-white uppercase tracking-wider">60s Micro-Clicker</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mb-4 leading-normal">
              A frantic speed reflex test! A neon teleporter box will materialize. Click it as fast as you can.
            </p>
            <button
              onClick={startGame}
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-lg shadow cursor-pointer transition-all active:scale-95"
            >
              Start Game (Reflex)
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <button
            onClick={handleBoxClick}
            className="absolute w-12 h-12 bg-orange-500 hover:bg-orange-400 text-white rounded-lg border-2 border-white cursor-pointer flex items-center justify-center font-bold font-mono transition-transform duration-75 active:scale-90 shadow-[0_0_15px_rgba(249,115,22,0.6)]"
            style={{
              left: `${boxPosition.x}%`,
              top: `${boxPosition.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            🎯
          </button>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="text-center p-6 animate-in zoom-in duration-300">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h4 className="text-base font-black text-white uppercase tracking-wider">Time's Up!</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mb-4 leading-normal">
              Reflex test concluded. You achieved a score of <strong className="text-yellow-400">{score} clicks</strong>.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={startGame}
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg shadow cursor-pointer transition-all active:scale-95"
              >
                Retry Test
              </button>
              <button
                onClick={() => setGameState('IDLE')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg shadow cursor-pointer transition-all"
              >
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   4. HERTZ BEAT PAD SANDBOX
   ============================================================================ */
function BeatPadSandbox() {
  const [activePad, setActivePad] = useState<number | null>(null);
  const [bgColor, setBgColor] = useState('#0f172a');
  const [synthDecay, setSynthDecay] = useState(0.8);

  const pads = [
    { id: 1, freq: 55, name: '808 Sub A1', color: '#db2777' },
    { id: 2, freq: 65, name: '808 Sub C2', color: '#4f46e5' },
    { id: 3, freq: 73, name: '808 Sub D2', color: '#06b6d4' },
    { id: 4, freq: 82, name: 'Synth E2', color: '#10b981' },
    { id: 5, freq: 110, name: 'Lead A2', color: '#f59e0b' },
    { id: 6, freq: 220, name: 'Saw A3', color: '#ec4899' },
    { id: 7, freq: 330, name: 'Square E4', color: '#8b5cf6' },
    { id: 8, freq: 440, name: 'Sine A4', color: '#3b82f6' },
    { id: 9, freq: 880, name: 'Vibe A5', color: '#10b981' },
  ];

  const playHertz = (freq: number, color: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = freq < 100 ? 'sawtooth' : freq < 300 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Low pass filter for deep bass pads
      if (freq < 100) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, ctx.currentTime);
        osc.connect(filter);
        filter.connect(gainNode);
      } else {
        osc.connect(gainNode);
      }

      gainNode.connect(ctx.destination);

      // Amplitude Envelope
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + synthDecay);

      osc.start();
      osc.stop(ctx.currentTime + synthDecay + 0.1);

      setBgColor(color);
      setTimeout(() => setBgColor('#0f172a'), 250);
    } catch (err) {
      console.warn("Audio Context launch failed:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full items-center transition-all duration-300" style={{ backgroundColor: bgColor + "15" }}>
      <div className="flex justify-between items-center w-full bg-white border border-black/5 p-4 rounded-xl">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Bass & Hertz Control</h4>
          <span className="text-[10px] text-slate-400 font-mono">Resonance decay: {synthDecay}s</span>
        </div>
        <input 
          type="range" 
          min="0.2" 
          max="2.5" 
          step="0.1"
          value={synthDecay} 
          onChange={(e) => setSynthDecay(Number(e.target.value))}
          className="h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-indigo-600 w-36"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm aspect-square p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl">
        {pads.map((pad) => (
          <button
            key={pad.id}
            onMouseDown={() => {
              setActivePad(pad.id);
              playHertz(pad.freq, pad.color);
            }}
            onMouseUp={() => setActivePad(null)}
            onTouchStart={() => {
              setActivePad(pad.id);
              playHertz(pad.freq, pad.color);
            }}
            onTouchEnd={() => setActivePad(null)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all font-mono select-none duration-75 text-white cursor-pointer border ${
              activePad === pad.id 
                ? "scale-95 shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                : "hover:border-white/30"
            }`}
            style={{ 
              backgroundColor: activePad === pad.id ? pad.color : '#1e293b',
              borderColor: activePad === pad.id ? '#ffffff' : '#334155'
            }}
          >
            <span className="text-xs font-black">{pad.id}</span>
            <span className="text-[8px] opacity-60 mt-2 truncate max-w-full font-bold">{pad.name}</span>
            <span className="text-[7px] opacity-40 font-bold">{pad.freq}Hz</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   5. MATRIX SCRAMBLER SANDBOX
   ============================================================================ */
function MatrixScramblerSandbox() {
  const [inputText, setInputText] = useState('Welcome to the Orion developer nexus matrix.');
  const [translatedText, setTranslatedText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const applyLeetTranslation = () => {
    const leetMap: Record<string, string> = {
      'a': '4', 'b': '8', 'e': '3', 'g': '9', 'i': '1', 'o': '0', 's': '5', 't': '7', 'z': '2',
      'A': '4', 'B': '8', 'E': '3', 'G': '9', 'I': '1', 'O': '0', 'S': '5', 'T': '7', 'Z': '2'
    };
    const translated = inputText.split('').map(char => leetMap[char] || char).join('');
    setTranslatedText(translated);
  };

  const applyVowelScramble = () => {
    const vowels = ['A', 'E', 'I', 'O', 'U', 'a', 'e', 'i', 'o', 'u'];
    const shuffled = [...vowels].sort(() => Math.random() - 0.5);
    const mapped = inputText.split('').map(char => {
      const idx = vowels.indexOf(char);
      if (idx !== -1) {
        return shuffled[idx];
      }
      return char;
    }).join('');
    setTranslatedText(mapped);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 250;
    canvas.height = 140;

    const columns = Math.floor(canvas.width / 10);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f0';
      ctx.font = '8px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(Math.floor(Math.random() * 33) + 33);
        ctx.fillText(text, i * 10, drops[i] * 10);

        if (drops[i] * 10 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-5 w-full">
      <div className="flex-1 flex flex-col gap-3">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste standard text to translate..."
          className="w-full bg-slate-900 border border-slate-800 text-green-400 font-mono text-xs p-3 rounded-xl outline-none resize-none h-24"
        />

        <div className="flex gap-2">
          <button
            onClick={applyLeetTranslation}
            className="flex-1 bg-black hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg shadow cursor-pointer"
          >
            Leet Translation
          </button>
          <button
            onClick={applyVowelScramble}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg shadow cursor-pointer"
          >
            Vowel Scrambler
          </button>
        </div>

        <div className="bg-slate-100 p-3 rounded-xl border border-black/5 min-h-[60px] font-mono text-xs">
          <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Output stream:</span>
          <p className="text-slate-800 leading-relaxed font-semibold break-all">{translatedText || "Ready for transcription..."}</p>
        </div>
      </div>

      <div className="w-full md:w-56 shrink-0 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-44 md:h-auto">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-2.5">
          <span className="text-[8px] font-mono text-green-500 font-bold tracking-widest uppercase animate-pulse">DRIP_AST_DECODING</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   6. PHYSICS BALL PIT SANDBOX
   ============================================================================ */
interface PhysicsBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

function PhysicsBallPitSandbox() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gravity, setGravity] = useState(0.4);
  const [elasticity, setElasticity] = useState(0.75); // bounce retention
  const animationRef = useRef<number | null>(null);
  const ballsRef = useRef<PhysicsBall[]>([]);

  const spawnBall = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];
    const newBall: PhysicsBall = {
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 4,
      radius: Math.floor(Math.random() * 12) + 8,
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    ballsRef.current.push(newBall);
  };

  const clearBalls = () => {
    ballsRef.current = [];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 500;
    let height = canvas.height = 240;

    const render = () => {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      ballsRef.current.forEach(ball => {
        // Gravitational pull acceleration
        ball.vy += gravity;
        
        // Kinematic offset updates
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Collision with floor
        if (ball.y + ball.radius > height) {
          ball.y = height - ball.radius;
          ball.vy = -ball.vy * elasticity;
          // Apply friction damping on rolling contact
          ball.vx *= 0.98;
        }

        // Collision with ceiling
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = -ball.vy * elasticity;
        }

        // Collision with walls
        if (ball.x + ball.radius > width) {
          ball.x = width - ball.radius;
          ball.vx = -ball.vx * elasticity;
        } else if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = -ball.vx * elasticity;
        }

        // Draw Ball body
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = ball.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gravity, elasticity]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl">
        <canvas 
          ref={canvasRef} 
          onClick={spawnBall}
          className="w-full block cursor-crosshair" 
        />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-[8px] font-mono text-slate-400 border border-slate-800 tracking-widest uppercase">
          🔴 Click on canvas to drop balls
        </div>
      </div>

      <div className="bg-white border border-black/5 p-4 rounded-xl flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="flex flex-col gap-1 w-full md:w-44">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Gravity pull: {gravity}</span>
          <input 
            type="range" 
            min="0" 
            max="1.5" 
            step="0.05"
            value={gravity} 
            onChange={(e) => setGravity(Number(e.target.value))}
            className="h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <div className="flex flex-col gap-1 w-full md:w-44">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Elastic Restitution: {elasticity}</span>
          <input 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.05"
            value={elasticity} 
            onChange={(e) => setElasticity(Number(e.target.value))}
            className="h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <button
          onClick={clearBalls}
          className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer w-full md:auto shrink-0"
        >
          Reset Pit
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   7. COLOR CLOCK SANDBOX
   ============================================================================ */
function ColorClockSandbox() {
  const [time, setTime] = useState(new Date());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSegment = (val: number) => val.toString().padStart(2, '0');

  const hh = formatSegment(time.getHours());
  const mm = formatSegment(time.getMinutes());
  const ss = formatSegment(time.getSeconds());

  // Derive hex hash
  const hexColor = `#${hh}${mm}${ss}`;

  const handleCopyHex = () => {
    navigator.clipboard.writeText(hexColor);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="w-full p-8 rounded-xl flex flex-col items-center justify-center min-h-[250px] transition-all duration-1000 relative overflow-hidden border border-black/10 shadow-2xl"
      style={{ backgroundColor: hexColor }}
    >
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10 text-center text-white">
        <span className="text-[10px] uppercase font-mono tracking-widest text-white/60 font-bold block mb-2">
          HH : MM : SS Color Space Conversion
        </span>
        
        <h1 className="text-5xl md:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
          {hh}:{mm}:{ss}
        </h1>

        <button
          onClick={handleCopyHex}
          className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow backdrop-blur"
        >
          <span>{hexColor}</span>
          <span>{copied ? "✓ Copied" : "📋 Copy HEX"}</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   8. PAINTBRUSH TOOL SANDBOX
   ============================================================================ */
function PaintbrushSandbox() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [brushColor, setBrushColor] = useState('#db2777');
  const [brushSize, setBrushSize] = useState(6);
  const [useRainbow, setUseRainbow] = useState(true);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = 240;

    // Fill white backdrop initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let hue = 0;

    const startDraw = (e: any) => {
      isDrawingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: any) => {
      if (!isDrawingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

      ctx.lineTo(x, y);
      ctx.strokeStyle = useRainbow ? `hsl(${hue}, 100%, 50%)` : brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      hue = (hue + 1.5) % 360;
    };

    const endDraw = () => {
      isDrawingRef.current = false;
      ctx.closePath();
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);

    // Touch support for mobile layouts
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', endDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', endDraw);
      canvas.removeEventListener('mouseleave', endDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', endDraw);
    };
  }, [brushColor, brushSize, useRainbow]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative w-full rounded-xl overflow-hidden border border-black/10 shadow bg-white">
        <canvas ref={canvasRef} className="w-full block bg-white cursor-pointer" />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[8px] font-mono text-slate-300 tracking-widest uppercase">
          🎨 Drag to paint canvas
        </div>
      </div>

      <div className="bg-white border border-black/5 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={useRainbow} 
              onChange={(e) => setUseRainbow(e.target.checked)}
              className="rounded" 
            />
            <span>RAINBOW SPECTRUM</span>
          </label>
          
          {!useRainbow && (
            <input 
              type="color" 
              value={brushColor} 
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded-full border border-black/10 outline-none cursor-pointer"
            />
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>Brush Size:</span>
          <input 
            type="range" 
            min="2" 
            max="24" 
            value={brushSize} 
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-indigo-600 w-24"
          />
        </div>

        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition-colors"
        >
          Clear Board
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   9. CSS 3D CUBE SANDBOX
   ============================================================================ */
function CssCubeSandbox() {
  const [rotationSpeed, setRotationSpeed] = useState(8); // in seconds per rotation

  const speedUp = () => {
    setRotationSpeed(prev => Math.max(1.5, prev - 1.5));
  };

  const resetSpeed = () => {
    setRotationSpeed(8);
  };

  return (
    <div className="flex flex-col gap-6 w-full items-center">
      <div className="h-[240px] w-full flex items-center justify-center bg-slate-900 rounded-xl relative overflow-hidden shadow-2xl">
        
        {/* CSS 3D perspective cube view */}
        <div 
          className="relative w-28 h-28 pointer-events-auto cursor-pointer"
          style={{ perspective: '800px' }}
          onClick={speedUp}
          title="Click cube to accelerate rotation!"
        >
          <div 
            className="w-full h-full relative"
            style={{ 
              transformStyle: 'preserve-3d',
              animation: `spinCube ${rotationSpeed}s linear infinite`,
            }}
          >
            {/* Front */}
            <div className="absolute inset-0 border border-indigo-400/80 bg-indigo-600/30 text-white flex items-center justify-center font-bold text-base shadow-[inset_0_0_20px_rgba(129,140,248,0.5)]" style={{ transform: 'rotateY(0deg) translateZ(56px)', backdropFilter: 'blur(2px)' }}>1</div>
            {/* Back */}
            <div className="absolute inset-0 border border-pink-400/80 bg-pink-600/30 text-white flex items-center justify-center font-bold text-base shadow-[inset_0_0_20px_rgba(244,114,182,0.5)]" style={{ transform: 'rotateY(180deg) translateZ(56px)', backdropFilter: 'blur(2px)' }}>2</div>
            {/* Top */}
            <div className="absolute inset-0 border border-cyan-400/80 bg-cyan-600/30 text-white flex items-center justify-center font-bold text-base shadow-[inset_0_0_20px_rgba(34,211,238,0.5)]" style={{ transform: 'rotateX(90deg) translateZ(56px)', backdropFilter: 'blur(2px)' }}>3</div>
            {/* Bottom */}
            <div className="absolute inset-0 border border-emerald-400/80 bg-emerald-600/30 text-white flex items-center justify-center font-bold text-base shadow-[inset_0_0_20px_rgba(52,211,153,0.5)]" style={{ transform: 'rotateX(-90deg) translateZ(56px)', backdropFilter: 'blur(2px)' }}>4</div>
            {/* Right */}
            <div className="absolute inset-0 border border-amber-400/80 bg-amber-600/30 text-white flex items-center justify-center font-bold text-base shadow-[inset_0_0_20px_rgba(251,191,36,0.5)]" style={{ transform: 'rotateY(90deg) translateZ(56px)', backdropFilter: 'blur(2px)' }}>5</div>
            {/* Left */}
            <div className="absolute inset-0 border border-purple-400/80 bg-purple-600/30 text-white flex items-center justify-center font-bold text-base shadow-[inset_0_0_20px_rgba(167,139,250,0.5)]" style={{ transform: 'rotateY(-90deg) translateZ(56px)', backdropFilter: 'blur(2px)' }}>6</div>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[8px] font-mono text-slate-400">
          Rotation: {rotationSpeed.toFixed(1)}s / revolution
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spinCube {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
        }
      `}} />

      <div className="bg-white border border-black/5 p-4 rounded-xl flex gap-3 w-full justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800">3D Matrix Transforms</span>
          <p className="text-[10px] text-slate-400 leading-normal font-mono">Accelerate cube velocity by clicking or clicking button below.</p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button
            onClick={speedUp}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition-colors"
          >
            Spin Faster
          </button>
          <button
            onClick={resetSpeed}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-lg border transition-colors"
          >
            Reset Speed
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   10. PASSWORD CRACKER SIMULATOR SANDBOX
   ============================================================================ */
function PasswordCrackerSandbox() {
  const [password, setPassword] = useState('DUMMY55');
  const [isCracking, setIsCracking] = useState(false);
  const [crackOutput, setCrackOutput] = useState<string[]>([]);
  const [entropy, setEntropy] = useState({ poolSize: 0, combinations: '0', timeEstimate: '0 seconds' });

  const stopSignalRef = useRef(false);

  useEffect(() => {
    // Calculate basic passwords entropy statistics
    const len = password.length;
    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(password)) pool += 32;

    if (len === 0 || pool === 0) {
      setEntropy({ poolSize: 0, combinations: '0', timeEstimate: '0 seconds' });
      return;
    }

    const combinations = Math.pow(pool, len);
    const hashesPerSecond = 1000000; // 1 Million guesses / second simulated
    const seconds = combinations / hashesPerSecond;

    let timeEstimate = '';
    if (seconds < 1) timeEstimate = 'Instant (< 1 millisecond)';
    else if (seconds < 60) timeEstimate = `${seconds.toFixed(2)} seconds`;
    else if (seconds < 3600) timeEstimate = `${(seconds / 60).toFixed(1)} minutes`;
    else if (seconds < 86400) timeEstimate = `${(seconds / 3600).toFixed(1)} hours`;
    else if (seconds < 31536000) timeEstimate = `${(seconds / 86400).toFixed(1)} days`;
    else timeEstimate = `${(seconds / 31536000).toFixed(1)} years`;

    setEntropy({
      poolSize: pool,
      combinations: combinations.toExponential(2),
      timeEstimate
    });
  }, [password]);

  const runCrackSimulation = async () => {
    if (isCracking) {
      stopSignalRef.current = true;
      setIsCracking(false);
      return;
    }

    setIsCracking(true);
    stopSignalRef.current = false;
    setCrackOutput([
      `🛡️ Establishing Brute-Force Thread Pool (WASM Matrix)`,
      `🔐 Target entropy calculated: ${entropy.combinations} operations.`,
      `🧬 Guess loop initialized...`
    ]);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

    let crackedString = '';
    for (let charIndex = 0; charIndex < password.length; charIndex++) {
      if (stopSignalRef.current) break;

      const targetChar = password[charIndex];
      let cycles = 0;

      while (cycles < 45) {
        if (stopSignalRef.current) break;
        cycles++;
        const randChar = chars[Math.floor(Math.random() * chars.length)];
        
        setCrackOutput(prev => [
          ...prev.slice(-10),
          `⚡ GUESS [Index ${charIndex}] => ${crackedString}${randChar}... (Cycle ${cycles})`
        ]);

        await delay(20);
      }

      crackedString += targetChar;
      setCrackOutput(prev => [
        ...prev.slice(-10),
        `✅ SUCCESS [Index ${charIndex}] => '${targetChar}' locked! String state: "${crackedString}"`
      ]);
      await delay(150);
    }

    if (!stopSignalRef.current) {
      setCrackOutput(prev => [
        ...prev,
        `🎉 CRACK CONCLUDED! Password parsed successfully in WASM heap!`,
        `📦 Dumped memory: "${crackedString}" matches target.`
      ]);
    }
    setIsCracking(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Configure Target Password</span>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value.substring(0, 16))}
              disabled={isCracking}
              className="w-full bg-slate-900 text-white font-mono text-sm px-4 py-2.5 rounded-xl border border-slate-800 outline-none"
              placeholder="Enter simple word..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] bg-white border border-black/5 p-3 rounded-xl shadow-sm">
            <div>
              <span className="text-slate-400 block">CHAR POOL:</span>
              <span className="text-slate-800 font-bold">{entropy.poolSize} chars</span>
            </div>
            <div>
              <span className="text-slate-400 block">COMBINATIONS:</span>
              <span className="text-slate-800 font-bold">{entropy.combinations}</span>
            </div>
            <div className="col-span-2 border-t border-black/5 pt-2 mt-1">
              <span className="text-slate-400 block">TIME AT 1M H/s:</span>
              <span className="text-indigo-600 font-bold text-xs">{entropy.timeEstimate}</span>
            </div>
          </div>

          <button
            onClick={runCrackSimulation}
            className={`w-full py-3 rounded-lg text-white font-bold text-xs uppercase tracking-wider shadow cursor-pointer transition-colors ${
              isCracking ? "bg-red-600 hover:bg-red-500" : "bg-black hover:bg-slate-800"
            }`}
          >
            {isCracking ? "Halt Brute-Force" : "Trigger WASM Brute-Force"}
          </button>
        </div>

        <div className="w-full md:w-64 bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between h-48 md:h-auto font-mono text-[9px] text-green-400 overflow-y-auto max-h-[180px] md:max-h-none">
          <div className="space-y-1">
            <span className="text-slate-500 font-bold block mb-2">// HIGH-SPEED GUESS THREAD OUTPUT:</span>
            {crackOutput.map((out, idx) => (
              <div key={idx} className={out.startsWith('✅') ? 'text-yellow-400 font-bold' : out.startsWith('🎉') ? 'text-teal-400 font-bold' : 'text-slate-300'}>
                {out}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   11. GOD BUILD HYBRID SANDBOX
   ============================================================================ */
function GodBuildSandbox() {
  const [clickCount, setClickCount] = useState(0);
  const [priceHistory, setPriceHistory] = useState<{ time: string, price: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'OVER'>('IDLE');
  const [boxPosition, setBoxPosition] = useState({ x: 50, y: 50 });

  const timerRef = useRef<number | null>(null);

  // Sound generator
  const trigger808SynthClick = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65, ctx.currentTime); // C2 frequency
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  const startGame = () => {
    setClickCount(0);
    setTimeLeft(60);
    setGameState('PLAYING');
    teleportBox();
  };

  const teleportBox = () => {
    const rx = Math.floor(Math.random() * 80) + 10;
    const ry = Math.floor(Math.random() * 80) + 10;
    setBoxPosition({ x: rx, y: ry });
  };

  const handleBoxClick = () => {
    if (gameState !== 'PLAYING') return;
    setClickCount(c => c + 1);
    trigger808SynthClick();
    teleportBox();
  };

  useEffect(() => {
    // Hydrate crypto prices
    let price = 85000;
    const initialHistory = Array.from({ length: 20 }).map((_, i) => {
      price = price * (1 + (Math.random() - 0.5) * 0.4 / 100);
      return { time: `${i}s`, price };
    });
    setPriceHistory(initialHistory);

    const priceInterval = setInterval(() => {
      setPriceHistory(prev => {
        const last = prev[prev.length - 1].price;
        const drift = (Math.random() - 0.48) * 0.5;
        const next = Math.round(last * (1 + drift / 100) * 100) / 100;
        return [...prev.slice(1), { time: 'Now', price: next }];
      });
    }, 2500);

    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setGameState('OVER');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const activePrice = priceHistory[priceHistory.length - 1]?.price || 85000;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Ticker Metric */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 flex items-center justify-between font-mono text-[10px]">
          <div className="flex flex-col">
            <span className="text-slate-500">LIVE COIN:</span>
            <span className="font-bold text-xs text-emerald-400">BTC/USD</span>
          </div>
          <span className="text-sm font-black">${activePrice.toLocaleString()}</span>
        </div>

        {/* Reflex click metric */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 flex items-center justify-between font-mono text-[10px]">
          <div className="flex flex-col">
            <span className="text-slate-500">CLICK HITS:</span>
            <span className="font-bold text-xs text-orange-400">808 Synced</span>
          </div>
          <span className="text-sm font-black text-yellow-400">{clickCount} HITS</span>
        </div>

        {/* Timer metric */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 flex items-center justify-between font-mono text-[10px]">
          <div className="flex flex-col">
            <span className="text-slate-500">TIMER REMAINING:</span>
            <span className="font-bold text-xs text-indigo-400">Reflex Game</span>
          </div>
          <span className="text-sm font-black text-red-400">{timeLeft}s</span>
        </div>
      </div>

      <div className="relative w-full h-[300px] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        {/* Background Ticker Line Chart */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory}>
              <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {gameState === 'IDLE' && (
          <div className="text-center p-6 relative z-10 animate-in fade-in">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-pulse" />
            <h4 className="text-base font-black text-white uppercase tracking-wider">THE GOD BUILD HYBRID</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mb-4 leading-normal">
              Reflex clicker matching background crypto price tickers and 808 sine frequency generators on hits!
            </p>
            <button
              onClick={startGame}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-lg shadow cursor-pointer transition-all active:scale-95"
            >
              Start God Mode
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <button
            onClick={handleBoxClick}
            className="absolute w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black rounded-full border border-white cursor-pointer flex items-center justify-center text-xs shadow-[0_0_20px_rgba(234,179,8,0.7)]"
            style={{
              left: `${boxPosition.x}%`,
              top: `${boxPosition.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            808
          </button>
        )}

        {gameState === 'OVER' && (
          <div className="text-center p-6 relative z-10 animate-in zoom-in">
            <h4 className="text-base font-black text-white uppercase tracking-wider">Session Concluded</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mb-4 leading-normal">
              You registered a final tally of <strong className="text-yellow-400">{clickCount} hits</strong> while Bitcoin priced at ${activePrice.toLocaleString()}.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={startGame}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg shadow cursor-pointer transition-all active:scale-95"
              >
                Replay God Session
              </button>
              <button
                onClick={() => setGameState('IDLE')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg shadow cursor-pointer transition-all"
              >
                Exit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
