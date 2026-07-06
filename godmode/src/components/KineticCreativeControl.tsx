import React, { useState, useEffect } from 'react';
import { Settings, Droplet, Move, Zap, Crosshair } from 'lucide-react';
import { KineticStrikeEngine, CombatState, GrappleEngine, AnatomicalRigBridge } from '../physics/CombatEngine';

export function KineticCreativeControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'strikes' | 'grapples' | 'physics'>('strikes');
  
  // Strike Parameters
  const [strikeType, setStrikeType] = useState('cross');
  const [overrideForce, setOverrideForce] = useState(1400);
  const [recoveryTime, setRecoveryTime] = useState(500);

  // Grapple Parameters
  const [grapplePosition, setGrapplePosition] = useState('STANDARD');
  const [liftingForce, setLiftingForce] = useState(1.0);

  // System Setup (Mocks for UI bindings)
  const [mockRig] = useState(() => new AnatomicalRigBridge());
  const [strikeEngine] = useState(() => new KineticStrikeEngine(mockRig));
  const [grappleEngine] = useState(() => new GrappleEngine(mockRig));

  useEffect(() => {
    const data = strikeEngine.getStrikeParameters(strikeType);
    if (data) {
        setOverrideForce(data.force);
        setRecoveryTime(data.recoveryTime);
    }
  }, [strikeType, strikeEngine]);

  const handleTestStrike = () => {
    console.log(`Testing strike with overwritten parameters: ${overrideForce}N, ${recoveryTime}ms recovery`);
    strikeEngine.executeStrike(strikeType, {x: 1, y: 1.5, z: 0}, 1.2);
  };

  const handleTestGrapple = () => {
    grappleEngine.initiateGrapple(grapplePosition);
    setTimeout(() => {
        grappleEngine.executeThrow(grapplePosition, liftingForce * 1000);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500 text-amber-500 p-3 rounded-full shadow-lg backdrop-blur-md transition-all z-50 flex items-center justify-center pointer-events-auto"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-zinc-950/95 border border-amber-500/50 shadow-2xl rounded-xl backdrop-blur-xl z-50 flex flex-col pointer-events-auto overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-black/40">
        <h3 className="text-amber-500 text-sm font-bold tracking-widest flex items-center gap-2">
          <Zap className="w-4 h-4" />
          KINETIC CREATIVE CONTROL
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
          ×
        </button>
      </div>

      <div className="flex border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('strikes')}
          className={`flex-1 p-2 text-xs uppercase tracking-wider font-semibold ${activeTab === 'strikes' ? 'text-amber-400 bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Strikes
        </button>
        <button 
          onClick={() => setActiveTab('grapples')}
          className={`flex-1 p-2 text-xs uppercase tracking-wider font-semibold ${activeTab === 'grapples' ? 'text-indigo-400 bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Grapples
        </button>
        <button 
          onClick={() => setActiveTab('physics')}
          className={`flex-1 p-2 text-xs uppercase tracking-wider font-semibold ${activeTab === 'physics' ? 'text-emerald-400 bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Physics
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'strikes' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Target Strike Vector</label>
              <select 
                value={strikeType}
                onChange={e => setStrikeType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-amber-500 text-xs p-2 rounded focus:outline-none"
              >
                <option value="jab">Lead Jab (Distance)</option>
                <option value="cross">Rear Cross (Heavy Mass)</option>
                <option value="hook_l">Lead Hook (Angular)</option>
                <option value="uppercut_r">Rear Uppercut (Vertical)</option>
                <option value="roundhouse_r">Roundhouse Kick (Whip)</option>
                <option value="superman_punch">Superman Punch (Flying)</option>
              </select>
            </div>
            
            <div>
              <label className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Impact Force Density</span>
                <span className="text-amber-500">{overrideForce}N</span>
              </label>
              <input 
                type="range" 
                min="300" max="3000" step="50"
                value={overrideForce}
                onChange={e => setOverrideForce(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
              />
            </div>

            <div>
              <label className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Recovery Latency</span>
                <span className="text-amber-500">{recoveryTime}ms</span>
              </label>
              <input 
                type="range" 
                min="100" max="1500" step="50"
                value={recoveryTime}
                onChange={e => setRecoveryTime(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
              />
            </div>

            <button 
              onClick={handleTestStrike}
              className="w-full mt-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/50 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Crosshair className="w-4 h-4" />
              Test Strike Payload
            </button>
          </div>
        )}

        {activeTab === 'grapples' && (
          <div className="space-y-4">
             <div>
              <label className="text-xs text-zinc-400 block mb-1">MDickie Wrestling Position</label>
              <select 
                value={grapplePosition}
                onChange={e => setGrapplePosition(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-indigo-400 text-xs p-2 rounded focus:outline-none"
              >
                <option value="STANDARD">Collar and Elbow</option>
                <option value="SUPLEX">German Suplex</option>
                <option value="POWERBOMB">Powerbomb</option>
                <option value="DDT">DDT / Front Facelock</option>
                <option value="CHOKESLAM">Throat Grip</option>
              </select>
            </div>
            
            <div>
              <label className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Lifting Force multiplier</span>
                <span className="text-indigo-400">{liftingForce.toFixed(2)}x</span>
              </label>
              <input 
                type="range" 
                min="0.1" max="3.0" step="0.1"
                value={liftingForce}
                onChange={e => setLiftingForce(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>

            <button 
              onClick={handleTestGrapple}
              className="w-full mt-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/50 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Move className="w-4 h-4" />
              Test Grapple Entanglement
            </button>
          </div>
        )}

        {activeTab === 'physics' && (
          <div className="space-y-4">
            <p className="text-xs text-emerald-400/80 leading-relaxed italic">
              Absolute command over real Rapier active-ragdoll constraints.
            </p>
            <div>
              <label className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Anatomical Rig Damping</span>
                <span className="text-emerald-500">2.8x</span>
              </label>
              <input type="range" disabled className="w-full opacity-50" />
            </div>
            <div>
              <label className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Core Structural Integrity</span>
                <span className="text-emerald-500">Unshakeable</span>
              </label>
              <input type="range" disabled className="w-full opacity-50" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
