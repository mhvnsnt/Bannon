import React, { useState, useEffect } from 'react';
import { Activity, Shield, Zap, Settings, TrendingUp, AlertTriangle } from 'lucide-react';

export default function LHCManager() {
  const [collisions, setCollisions] = useState(0);
  const [luminosity, setLuminosity] = useState(1);
  const [status, setStatus] = useState('OFFLINE - UPGRADE PHASE');
  
  // Upgrades
  const [magnets, setMagnets] = useState(0);
  const [atlas, setAtlas] = useState(0);
  const [cms, setCms] = useState(0);
  const [civilWork, setCivilWork] = useState(0);
  
  const [budget, setBudget] = useState(10000000);
  const [physicsDiscovered, setPhysicsDiscovered] = useState<string[]>([]);
  
  useEffect(() => {
    if (status === 'RUNNING') {
      const interval = setInterval(async () => {
        // Increment collisions continuously
        const newCollisions = Math.floor(Math.random() * 100 * luminosity);
        setCollisions(prev => prev + newCollisions);
        
        // Use real Quantum Routing logic occasionally to "discover" something based on quantum entanglement simulation
        if (Math.random() > 0.8) {
          try {
             const res = await fetch('/api/quantum/route', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ objective: `LHC_COLLISION_SWEEP_${Date.now()}` })
             });
             const data = await res.json();
             if (data.success && data.result) {
                const resultsStr = JSON.stringify(data.result.results);
                setPhysicsDiscovered(prev => [`Quantum Resonance (Job ${data.result.jobId.slice(0,8)}): ${resultsStr}`, ...prev].slice(0, 5));
             }
          } catch(e) {}
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status, luminosity]);

  const calculateLuminosity = () => {
    return 1 + (magnets * 0.5) + (atlas * 0.2) + (cms * 0.2) + (civilWork * 0.1);
  };

  useEffect(() => {
    setLuminosity(calculateLuminosity());
  }, [magnets, atlas, cms, civilWork]);

  const buyUpgrade = (type: string, cost: number) => {
    if (budget >= cost) {
      setBudget(prev => prev - cost);
      if (type === 'magnet') setMagnets(prev => prev + 1);
      if (type === 'atlas') setAtlas(prev => prev + 1);
      if (type === 'cms') setCms(prev => prev + 1);
      if (type === 'civil') setCivilWork(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-6 bg-slate-900 text-slate-100 font-mono overflow-y-auto">
      <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400 flex items-center gap-2">
            <Activity className="w-8 h-8" />
            LHC High-Luminosity Upgrade Control
          </h1>
          <p className="text-slate-400 mt-2">Target: 5x Collision Rate | Discover Higgs Boson Anomalies</p>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold px-4 py-2 rounded ${status === 'RUNNING' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
            STATUS: {status}
          </div>
          <p className="text-xl mt-2 text-emerald-400">Budget: ${budget.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-slate-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" /> Collisions
          </h3>
          <p className="text-3xl font-bold text-blue-400">{collisions.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-slate-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Luminosity Multiplier
          </h3>
          <p className="text-3xl font-bold text-purple-400">{luminosity.toFixed(2)}x</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg lg:col-span-2">
          <h3 className="text-slate-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" /> Operations
          </h3>
          <div className="flex gap-4">
            <button 
              onClick={async () => {
                setStatus('RUNNING');
                // Trigger the actual execution hub on the backend through the matrix
                try {
                  await fetch('/api/telegram-webhook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: { text: "execute collider sweep" }})
                  });
                } catch(e) {}
              }}
              disabled={status === 'RUNNING'}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors"
            >
              START COLLIDER (2030)
            </button>
            <button 
              onClick={() => setStatus('OFFLINE - UPGRADE PHASE')}
              disabled={status !== 'RUNNING'}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors"
            >
              SHUTDOWN FOR MAINTENANCE
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-slate-200">Engineering & Upgrades (HL-LHC)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center hover:border-blue-500 transition-colors">
          <div>
            <h3 className="text-xl font-bold text-blue-300">Superconducting Magnets</h3>
            <p className="text-slate-400 text-sm mt-1">Replace key magnets to squeeze the beam tighter.</p>
            <p className="text-emerald-400 font-bold mt-2">Cost: $250,000</p>
            <p className="text-slate-300 mt-1">Level: {magnets}</p>
          </div>
          <button onClick={() => buyUpgrade('magnet', 250000)} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold">Upgrade</button>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center hover:border-purple-500 transition-colors">
          <div>
            <h3 className="text-xl font-bold text-purple-300">ATLAS Detector Upgrade</h3>
            <p className="text-slate-400 text-sm mt-1">Enhance tracking and calorimetry for higher pile-up.</p>
            <p className="text-emerald-400 font-bold mt-2">Cost: $400,000</p>
            <p className="text-slate-300 mt-1">Level: {atlas}</p>
          </div>
          <button onClick={() => buyUpgrade('atlas', 400000)} className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-bold">Upgrade</button>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center hover:border-amber-500 transition-colors">
          <div>
            <h3 className="text-xl font-bold text-amber-300">CMS Detector Upgrade</h3>
            <p className="text-slate-400 text-sm mt-1">New silicon tracker and high-granularity endcap.</p>
            <p className="text-emerald-400 font-bold mt-2">Cost: $400,000</p>
            <p className="text-slate-300 mt-1">Level: {cms}</p>
          </div>
          <button onClick={() => buyUpgrade('cms', 400000)} className="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-lg font-bold">Upgrade</button>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center hover:border-stone-500 transition-colors">
          <div>
            <h3 className="text-xl font-bold text-stone-300">Civil Engineering (Shafts & Caverns)</h3>
            <p className="text-slate-400 text-sm mt-1">Excavate new service caverns and galleries.</p>
            <p className="text-emerald-400 font-bold mt-2">Cost: $600,000</p>
            <p className="text-slate-300 mt-1">Level: {civilWork}</p>
          </div>
          <button onClick={() => buyUpgrade('civil', 600000)} className="bg-stone-600 hover:bg-stone-500 px-6 py-3 rounded-lg font-bold">Excavate</button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-slate-200">New Physics & Discoveries</h2>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg min-h-[200px]">
        {physicsDiscovered.length === 0 ? (
          <p className="text-slate-500 italic">No new phenomena discovered yet. Increase luminosity and run the collider.</p>
        ) : (
          <ul className="space-y-2">
            {physicsDiscovered.map((discovery, idx) => (
              <li key={idx} className="flex items-center gap-2 text-cyan-300">
                <AlertTriangle className="w-4 h-4" /> {discovery}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
