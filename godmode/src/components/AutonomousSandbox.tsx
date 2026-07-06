import React, { useState, useEffect, useRef } from 'react';
import { Play, Zap, Code2, Terminal, Box as BoxIcon, Database, Layers, Eye } from 'lucide-react';
import io from 'socket.io-client';
import SpatialSandbox, { SandboxErrorBoundary } from './SpatialSandbox';

const socket = io('');

export default function AutonomousSandbox({ tier }: { tier?: 'free' | 'Apex' }) {
  const [code, setCode] = useState<string>('// Core Body: Pelvis Manifestation\nconst pelvisShape = new CANNON.Box(new CANNON.Vec3(0.3, 0.2, 0.15));\nconst pelvisBody = new CANNON.Body({\n    mass: 15,\n    position: new CANNON.Vec3(0, 1, 0),\n    shape: pelvisShape\n});\nworld.addBody(pelvisBody);\n');
  const [output, setOutput] = useState<string>('Autonomous Compute Node standing by for payload...\n');
  const [isRunning, setIsRunning] = useState(false);
  const [showPhysics, setShowPhysics] = useState(false);
  const [omniPrompt, setOmniPrompt] = useState('Build a procedural ragdoll skeletal rig using Cannon.js');
  const [targetGrid, setTargetGrid] = useState('LOCAL_NODE');
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('sandbox-log', (msg) => {
      setOutput(prev => prev + msg);
      outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    socket.on('sandbox-success', (data) => {
      setIsRunning(false);
      setShowPhysics(true);
      setOutput(prev => prev + '\n[AUTONOMOUS NODE] Execution complete. WebGL Render active.\n');
    });

    socket.on('sandbox-error', (data) => {
      setIsRunning(false);
      setOutput(prev => prev + '\n[AUTONOMOUS NODE] Compilation Failure. Awaiting Architect corrections.\n');
    });

    return () => {
      socket.off('sandbox-log');
      socket.off('sandbox-success');
      socket.off('sandbox-error');
    };
  }, []);

  const handleRun = () => {
    setIsRunning(true);
    setShowPhysics(false);
    setOutput('');
    socket.emit('sandbox-execute', { code });
  };

  const handleOmniStrike = () => {
    setIsRunning(true);
    setShowPhysics(false);
    setOutput('');
    socket.emit('execute-omni', { prompt: omniPrompt, targetGrid });
  };

  const handleSaveToVault = () => {
    socket.emit('sandbox-save', { code });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200 relative">
       <div className="p-4 border-b border-[#222] bg-[#111] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-semibold text-emerald-500 flex items-center gap-2">
              <Code2 className="w-5 h-5" /> Autonomous Compute Node (Execution Sandbox)
            </h2>
            <p className="text-xs text-gray-400 mt-1">Full Circuit Autonomous Pipeline: Brain, Hands, Eyes, and Memory.</p>
          </div>
          <div className="flex items-center gap-2">
             <select 
               value={targetGrid} 
               onChange={e => setTargetGrid(e.target.value)}
               className="bg-[#1a1a1a] border border-[#333] text-xs text-emerald-400 p-1.5 rounded focus:outline-none focus:border-emerald-500 uppercase tracking-widest"
             >
               <option value="LOCAL_NODE">Local Node</option>
               <option value="GITHUB_PRODUCTION">GitHub Prod</option>
               <option value="VERCEL_EDGE">Vercel Edge</option>
             </select>
             <button 
                onClick={handleSaveToVault} 
                className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-400 px-3 py-1.5 rounded flex items-center gap-2 font-semibold transition-colors border border-indigo-500/30 text-xs uppercase tracking-widest"
                title="Save to Temporal Vault for recursive learning"
             >
               <Database className="w-3 h-3" /> Sink to RAG Vault
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden relative">
          
          <div className="flex-1 overflow-hidden flex flex-col gap-4 relative z-10 w-full mb-4 lg:mb-0">
             
             {/* Omni align Input Panel */}
             <div className="border border-[#333] rounded-xl overflow-hidden shadow-inner group w-full bg-[#0a0a0a] flex flex-col">
                <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#333] flex justify-between items-center text-xs text-emerald-500 tracking-widest uppercase font-bold">
                   <div className="flex items-center gap-2">
                     <Layers className="w-3 h-3" /> Execute Omni God Mode
                   </div>
                </div>
                <div className="p-4 flex gap-2">
                   <input 
                     type="text" 
                     value={omniPrompt}
                     onChange={e => setOmniPrompt(e.target.value)}
                     className="flex-1 bg-[#111] border border-[#333] p-2 text-sm text-gray-300 font-mono rounded focus:outline-none focus:border-emerald-500 placeholder-gray-600"
                     placeholder="Enter Prime Directive for full-circuit autonomous execution..."
                   />
                   <button 
                     onClick={handleOmniStrike} 
                     disabled={isRunning} 
                     className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white px-6 py-2 rounded flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50 tracking-widest uppercase text-xs"
                   >
                      {isRunning ? <Zap className="w-4 h-4 animate-pulse" /> : <Zap className="w-4 h-4" />} Kinetic Strike
                   </button>
                </div>
             </div>

             {/* Manual Code Editor */}
             <div className="flex-1 flex flex-col border border-[#333] rounded-xl overflow-hidden shadow-inner">
                <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#333] flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest">
                  <span>manifestation.js</span>
                  <div className="flex items-center gap-2 transition-opacity">
                    <button onClick={handleRun} disabled={isRunning} className="bg-[#222] hover:bg-[#333] text-gray-300 px-3 py-1 rounded flex items-center gap-1 font-semibold transition-colors disabled:opacity-50 text-[10px]">
                       <Play className="w-3 h-3" /> Test Sandbox
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col w-full relative">
                  <textarea 
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full h-1/2 bg-[#111] text-gray-300 p-4 resize-none focus:outline-none focus:border-none ring-0 leading-relaxed font-mono border-b border-[#333] text-sm"
                    spellCheck="false"
                  />
                  
                  <div className="flex-1 bg-black relative shadow-inner overflow-hidden flex items-center justify-center">
                    {showPhysics ? (
                        <div className="w-full h-full p-2">
                          <SandboxErrorBoundary>
                            <SpatialSandbox codePayload={code} />
                          </SandboxErrorBoundary>
                          <div className="absolute top-4 right-4 px-2 py-1 bg-black/80 backdrop-blur text-[10px] text-emerald-400 border border-emerald-500/30 rounded font-mono flex items-center gap-1 z-20 uppercase tracking-widest">
                            <BoxIcon className="w-3 h-3" /> WebGL Live Rig Active
                          </div>
                        </div>
                    ) : (
                        <div className="text-gray-600 font-mono text-xs text-center px-4 flex flex-col items-center gap-2">
                           <Eye className="w-6 h-6 text-[#333]" />
                           "Awaiting physics execution. Submit code payload to render Spatial Sandbox."
                        </div>
                    )}
                  </div>
                </div>
             </div>

          </div>

          <div className="w-full lg:w-1/3 bg-black border border-[#222] rounded-xl overflow-hidden flex flex-col font-mono text-xs shadow-inner relative shrink-0">
             <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#333] text-indigo-400 flex items-center gap-2 sticky top-0 uppercase tracking-widest text-[10px] font-bold">
               <Terminal className="w-3 h-3" /> Server WebSockets Telemetry
             </div>
             <div className="p-4 overflow-y-auto whitespace-pre-wrap text-emerald-400 leading-relaxed font-mono tracking-wider h-full custom-scrollbar text-[11px] bg-[#050505]">
               {output}
               <div ref={outputEndRef} />
             </div>
          </div>
       </div>
    </div>
  );
}
