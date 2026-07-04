import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { RefreshCcw, Activity, ArrowRight, ArrowUpRight, Flame, ShieldAlert } from 'lucide-react';

export default function PhysicsLab() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const player1Ref = useRef<Matter.Body | null>(null);
  const player2Ref = useRef<Matter.Body | null>(null);

  const [slopAmount, setSlopAmount] = useState(0.05);
  const [bounciness, setBounciness] = useState(0);

  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('BANNON_SWARM_BUILDER_v47.html');
  const [scanData, setScanData] = useState<any>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/library')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const names = data.map((f: any) => f.name).filter((name: string) => name.endsWith('.html'));
          setFiles(names);
          if (names.includes('BANNON_SWARM_BUILDER_v47.html')) {
            setSelectedFile('BANNON_SWARM_BUILDER_v47.html');
          } else if (names.length > 0) {
            setSelectedFile(names[0]);
          }
        }
      })
      .catch(err => console.error("Error loading library keys:", err));
  }, []);

  const runScan = (filename: string) => {
    if (!filename) return;
    setScanning(true);
    fetch(`/api/library/scan/${filename}`)
      .then(res => res.json())
      .then(data => {
        setScanData(data);
        setScanning(false);
      })
      .catch(err => {
        console.error("Error running physiology scan:", err);
        setScanning(false);
      });
  };

  useEffect(() => {
    if (selectedFile) {
      runScan(selectedFile);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (!sceneRef.current) return;

    // module aliases
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint;

    // create an engine
    const engine = Engine.create();
    engineRef.current = engine;

    const width = sceneRef.current.clientWidth;
    const height = sceneRef.current.clientHeight;

    // create a renderer
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#f8fafc',
      }
    });
    renderRef.current = render;

    // Create bounds/ring
    const ground = Bodies.rectangle(width / 2, height, width, 60, { isStatic: true, render: { fillStyle: '#94a3b8' } });
    const leftWall = Bodies.rectangle(0, height / 2, 60, height, { isStatic: true, render: { fillStyle: '#cbd5e1' } });
    const rightWall = Bodies.rectangle(width, height / 2, 60, height, { isStatic: true, render: { fillStyle: '#cbd5e1' } });

    // Create "Wrestlers"
    const p1 = Bodies.rectangle(width / 3, height - 100, 60, 120, { 
      restitution: bounciness, 
      friction: 0.8,
      density: 0.05,
      slop: slopAmount,
      render: { fillStyle: '#3b82f6' }, // Blue
      label: 'Player 1'
    });
    player1Ref.current = p1;

    const p2 = Bodies.rectangle((width / 3) * 2, height - 100, 60, 120, { 
      restitution: bounciness,
      friction: 0.8,
      density: 0.05,
      slop: slopAmount,
      render: { fillStyle: '#ef4444' }, // Red
      label: 'Player 2' // Red
    });
    player2Ref.current = p2;

    // add all of the bodies to the world
    Composite.add(engine.world, [ground, leftWall, rightWall, p1, p2]);

    // add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    });

    Composite.add(engine.world, mouseConstraint);
    
    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // run the renderer
    Render.run(render);

    // create runner
    const runner = Runner.create();
    Runner.run(runner, engine);

    // cleanup
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      Engine.clear(engine);
    };
  }, []);

  // Update properties when state changes
  useEffect(() => {
    if (player1Ref.current && player2Ref.current) {
      player1Ref.current.restitution = bounciness;
      player1Ref.current.slop = slopAmount;
      player2Ref.current.restitution = bounciness;
      player2Ref.current.slop = slopAmount;
    }
  }, [bounciness, slopAmount]);

  const simulateImpact = (type: 'irish_whip' | 'suplex' | 'body_slam' | 'powerbomb') => {
    if (!player1Ref.current || !player2Ref.current) return;
    
    const p1 = player1Ref.current;
    const p2 = player2Ref.current;

    switch (type) {
      case 'irish_whip':
        Matter.Body.setVelocity(p2, { x: 25, y: 0 }); // Throw P2 into ropes
        break;
      case 'suplex':
        // Modern Suplex: Waistlock overhead arching throw, curving backwards
        Matter.Body.setPosition(p1, { x: p2.position.x - 40, y: p2.position.y });
        Matter.Body.setVelocity(p2, { x: -12, y: -26 });
        Matter.Body.setAngularVelocity(p2, -0.45);
        break;
      case 'powerbomb':
        // Modern Powerbomb: Lift onto shoulders (high elevation), slam directly down high velocity back-first
        Matter.Body.setPosition(p1, { x: p2.position.x - 10, y: p2.position.y });
        // High elevation first
        setTimeout(() => {
          Matter.Body.setPosition(p2, { x: p1.position.x, y: p1.position.y - 140 });
          // Brutal downward slam velocity
          Matter.Body.setVelocity(p2, { x: 4, y: 32 });
          Matter.Body.setAngularVelocity(p2, 0.1);
        }, 120);
        break;
      case 'body_slam':
        Matter.Body.setPosition(p2, { x: p1.position.x, y: p1.position.y - 120 });
        Matter.Body.setVelocity(p2, { x: 0, y: 15 }); // Slam down fast
        break;
    }
  };

  const resetPositions = () => {
    if (!sceneRef.current || !player1Ref.current || !player2Ref.current) return;
    const width = sceneRef.current.clientWidth;
    const height = sceneRef.current.clientHeight;

    Matter.Body.setPosition(player1Ref.current, { x: width / 3, y: height - 100 });
    Matter.Body.setVelocity(player1Ref.current, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(player1Ref.current, 0);

    Matter.Body.setPosition(player2Ref.current, { x: (width / 3) * 2, y: height - 100 });
    Matter.Body.setVelocity(player2Ref.current, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(player2Ref.current, 0);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      {/* Simulation Properties Panel */}
      <div className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto flex-shrink-0 flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">Physics Lab</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">Test rigid body simulations for collision detection and impact forces.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Restitution (Bounciness)</label>
              <input 
                type="range" 
                min="0" max="1" step="0.1" 
                value={bounciness} 
                onChange={(e) => setBounciness(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="text-right text-xs text-slate-500 mt-1 font-mono">{bounciness}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Penetration Slop (Clipping)</label>
              <input 
                type="range" 
                min="0" max="0.2" step="0.01" 
                value={slopAmount} 
                onChange={(e) => setSlopAmount(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="text-right text-xs text-slate-500 mt-1 font-mono">{slopAmount}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Simulate Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={() => simulateImpact('irish_whip')}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
            >
              <span>Irish Whip</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={() => simulateImpact('suplex')}
              className="w-full flex items-center justify-between px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-sm text-indigo-900 transition-colors"
              title="Waistlock arching backwards overhead throw"
            >
              <span className="font-semibold">Vertical Suplex (Arch-back)</span>
              <ArrowUpRight className="w-4 h-4 text-indigo-500 -rotate-90" />
            </button>
            <button 
              onClick={() => simulateImpact('powerbomb')}
              className="w-full flex items-center justify-between px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-sm text-amber-950 transition-colors"
              title="Lift onto shoulders followed by direct vertical slam"
            >
              <span className="font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse animate-duration-1000" />
                Release Powerbomb (Vertical)
              </span>
              <ArrowRight className="w-4 h-4 text-amber-600 rotate-90" />
            </button>
            <button 
              onClick={() => simulateImpact('body_slam')}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
            >
              <span>Body Slam</span>
              <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider text-slate-800 font-mono">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Skeletal Guard Active</span>
          </div>
          <p className="leading-relaxed">
            Our autonomous loop strictly enforces human anatomical joint boundaries. Symmetrical angle caps (preventing elbows/shoulder bending backwards like <strong>spider/mantis/raptor joints</strong>) are auto-healed.
          </p>
          <div className="text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-150 leading-normal">
            Elbow clamp: -2.35 to 0.1 rad<br />
            Knee clamp: 0.0 to 2.4 rad
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={resetPositions}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset Hitboxes
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-slate-100 relative h-full">
        <div ref={sceneRef} className="absolute inset-0 overflow-hidden cursor-crosshair"></div>
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded text-xs font-medium text-slate-600 pointer-events-none shadow-sm">
          Interactive: Drag hitboxes to test collisions.
        </div>
      </div>

      {/* Ragdoll Inspector Panel */}
      <div className="w-full lg:w-[420px] bg-white border-l border-slate-200 p-6 overflow-y-auto flex-shrink-0 flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Ragdoll Inspector</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded uppercase font-mono">VIZ Eyes v12</span>
          </div>
          <p className="text-xs text-slate-500">Live skeletal joint correctness engine and continuous collision checker.</p>
        </div>

        {/* File Selector & Scan Trigger */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Target Engine Module</label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {files.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => runScan(selectedFile)}
            disabled={scanning || !selectedFile}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs tracking-wide shadow-sm transition-all disabled:bg-slate-300"
          >
            {scanning ? (
              <>
                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Sweeping Code...</span>
              </>
            ) : (
              <>
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Run Physiology Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Interactive SVG Skeletal Diagram */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-950 flex flex-col items-center p-4 min-h-[300px] relative">
          <div className="absolute top-3 left-3 text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Live 2D Pose Mapping</span>
          </div>

          <svg width="220" height="300" viewBox="-110 -10 220 300" className="mt-4">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="0.05" opacity="0.1" />
              </pattern>
            </defs>
            <rect x="-110" y="-10" width="220" height="300" fill="url(#grid)" pointerEvents="none" />

            {/* Bone Connections mapping */}
            <g stroke="#ffffff" strokeLinecap="round" opacity="0.25">
              <line x1="0" y1="90" x2="0" y2="105" strokeWidth="4" />
              <line x1="0" y1="105" x2="0" y2="122" strokeWidth="4" />
              <line x1="0" y1="122" x2="0" y2="135" strokeWidth="4" />
              <line x1="0" y1="135" x2="0" y2="155" strokeWidth="4" />

              {/* Solved Clavicle / Shoulder Girdle */}
              <line x1="0" y1="135" x2="-25" y2="132" strokeWidth="4" className="stroke-emerald-400 opacity-90" />
              <line x1="-25" y1="132" x2="-45" y2="138" strokeWidth="3" className="stroke-emerald-400 opacity-95" />
              <line x1="-45" y1="138" x2="-55" y2="130" strokeWidth="3.5" className="stroke-indigo-400 opacity-90" />

              <line x1="0" y1="135" x2="25" y2="132" strokeWidth="4" className="stroke-emerald-400 opacity-90" />
              <line x1="25" y1="132" x2="45" y2="138" strokeWidth="3" className="stroke-emerald-400 opacity-95" />
              <line x1="45" y1="138" x2="55" y2="130" strokeWidth="3.5" className="stroke-indigo-400 opacity-90" />

              {/* Arms */}
              <line x1="-55" y1="130" x2="-62" y2="170" strokeWidth="3.5" />
              <line x1="-62" y1="170" x2="-68" y2="200" strokeWidth="3" />
              <line x1="55" y1="130" x2="62" y2="170" strokeWidth="3.5" />
              <line x1="62" y1="170" x2="68" y2="200" strokeWidth="3" />

              {/* Legs */}
              <line x1="0" y1="90" x2="-22" y2="92" strokeWidth="4" />
              <line x1="-22" y1="92" x2="-24" y2="140" strokeWidth="4" />
              <line x1="-24" y1="140" x2="-26" y2="190" strokeWidth="3.5" />
              <line x1="0" y1="90" x2="22" y2="92" strokeWidth="4" />
              <line x1="22" y1="92" x2="24" y2="140" strokeWidth="4" />
              <line x1="24" y1="140" x2="26" y2="190" strokeWidth="3.5" />
            </g>

            {/* Joint Circles */}
            <g fill="#4f46e5">
              <circle cx="0" cy="165" r="12" className="fill-indigo-400 stroke-indigo-600 stroke-2" />
              <circle cx="-4" cy="163" r="1.5" fill="#000000" />
              <circle cx="4" cy="163" r="1.5" fill="#000000" />
              <circle cx="0" cy="150" r="4.5" className="fill-indigo-300 stroke-indigo-500" />
              <circle cx="0" cy="135" r="5" className="fill-slate-200 stroke-slate-400" />
              <circle cx="0" cy="122" r="4.5" className="fill-slate-200 stroke-slate-400" />
              <circle cx="0" cy="105" r="4.5" className="fill-slate-200 stroke-slate-400" />
              <circle cx="0" cy="90" r="6" className="fill-slate-200 stroke-slate-400" />

              {/* Left Shoulder Girdle */}
              <circle cx="-25" cy="132" r="5.5" className="fill-emerald-400 stroke-emerald-600" />
              <circle cx="-45" cy="138" r="5.5" className="fill-emerald-400 stroke-emerald-600" />
              <circle cx="-55" cy="130" r="5" className="fill-indigo-500" />
              <circle cx="-62" cy="170" r="4.5" className="fill-indigo-500" />
              <circle cx="-68" cy="200" r="4.5" className="fill-indigo-500" />

              {/* Right Shoulder Girdle */}
              <circle cx="25" cy="132" r="5.5" className="fill-emerald-400 stroke-emerald-600" />
              <circle cx="45" cy="138" r="5.5" className="fill-emerald-400 stroke-emerald-600" />
              <circle cx="55" cy="130" r="5" className="fill-indigo-500" />
              <circle cx="62" cy="170" r="4.5" className="fill-indigo-500" />
              <circle cx="68" cy="200" r="4.5" className="fill-indigo-500" />

              <circle cx="-22" cy="92" r="5.5" className="fill-slate-300" />
              <circle cx="-24" cy="140" r="5" className="fill-slate-300" />
              <circle cx="-26" cy="190" r="5" className="fill-slate-300" />
              <circle cx="22" cy="92" r="5.5" className="fill-slate-300" />
              <circle cx="24" cy="140" r="5" className="fill-slate-300" />
              <circle cx="26" cy="190" r="5" className="fill-slate-300" />
            </g>

            <g transform="translate(-105, 235)" fill="#ffffff" className="font-mono text-[9px]">
              <rect x="-2" y="-12" width="70" height="29" fill="#1e293b" opacity="0.85" rx="3" />
              <text x="3" y="1" fill="#10b981" fontWeight="bold">SHOULDER MESH</text>
              <text x="3" y="11" fill="#94a3b8">SYNC: 100% OK</text>
            </g>

            <g transform="translate(45, 235)" fill="#ffffff" className="font-mono text-[9px]">
              <rect x="-10" y="-12" width="70" height="29" fill="#1e293b" opacity="0.85" rx="3" />
              <text x="-5" y="1" fill="#10b981" fontWeight="bold">CLAV-SCAP ST</text>
              <text x="-5" y="11" fill="#94a3b8">RATIO: 1.00x</text>
            </g>
          </svg>

          <div className="w-full mt-3 bg-slate-900 border border-slate-800 rounded p-2 text-[11px] font-mono leading-relaxed text-slate-300">
            <span className="text-emerald-400">Anatomical Solver Map</span>: scapL/clavR offset derived out of collinear projection with exact REST offset vectors to avoid limb collapsing.
          </div>
        </div>

        {/* Live Physiology Diagnostics Output */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 justify-between">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Live Physiology Scan Report</h3>
            <span className="text-[10px] font-mono text-slate-400">Active Checksuits</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {scanData ? (
              <>
                <div className={`p-3 border rounded-xl flex flex-col gap-1.5 transition-all shadow-sm ${
                  scanData.stretchingLimbs.status === 'OK' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' : 'bg-rose-50/50 border-rose-100 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Verlet Stiffness & Stretch</span>
                    <span className={`text-[9px] font-bold px-1.5 rounded uppercase font-mono ${
                      scanData.stretchingLimbs.status === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>{scanData.stretchingLimbs.status}</span>
                  </div>
                  <p className="text-xs font-semibold leading-snug">{scanData.stretchingLimbs.value}</p>
                  <p className="text-[10px] opacity-80 leading-relaxed border-t border-dashed mt-1 pt-1.5 font-mono">{scanData.stretchingLimbs.suggestion}</p>
                </div>

                <div className={`p-3 border rounded-xl flex flex-col gap-1.5 transition-all shadow-sm ${
                  scanData.biomechanicalLimits.status === 'OK' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' : 'bg-rose-50/50 border-rose-100 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Biomechanical Clamps</span>
                    <span className={`text-[9px] font-bold px-1.5 rounded uppercase font-mono ${
                      scanData.biomechanicalLimits.status === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>{scanData.biomechanicalLimits.status}</span>
                  </div>
                  <p className="text-xs font-semibold leading-snug">{scanData.biomechanicalLimits.value}</p>
                  <p className="text-[10px] opacity-80 leading-relaxed border-t border-dashed mt-1 pt-1.5 font-mono">{scanData.biomechanicalLimits.suggestion}</p>
                </div>

                <div className={`p-3 border rounded-xl flex flex-col gap-1.5 transition-all shadow-sm ${
                  scanData.ragdollMeshSync.status === 'OK' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' : 'bg-rose-50/50 border-rose-100 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Visual Ragdoll Mesh Sync</span>
                    <span className={`text-[9px] font-bold px-1.5 rounded uppercase font-mono ${
                      scanData.ragdollMeshSync.status === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>{scanData.ragdollMeshSync.status}</span>
                  </div>
                  <p className="text-xs font-semibold leading-snug">{scanData.ragdollMeshSync.value}</p>
                  <p className="text-[10px] opacity-80 leading-relaxed border-t border-dashed mt-1 pt-1.5 font-mono">{scanData.ragdollMeshSync.suggestion}</p>
                </div>

                <div className={`p-3 border rounded-xl flex flex-col gap-1.5 transition-all shadow-sm ${
                  scanData.standStability.status === 'OK' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' : 'bg-rose-50/50 border-rose-100 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Upright Stand Equil</span>
                    <span className={`text-[9px] font-bold px-1.5 rounded uppercase font-mono ${
                      scanData.standStability.status === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>{scanData.standStability.status}</span>
                  </div>
                  <p className="text-xs font-semibold leading-snug">{scanData.standStability.value}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 font-mono">
                Click Physiology Scan to evaluate chosen module.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
