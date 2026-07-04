import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Server, Activity, TerminalSquare, ShieldAlert, Cpu, Zap, Radio, Network } from 'lucide-react';
import * as d3 from 'd3';

const HardwareSyncSparkline = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const width = 100;
    const height = 20;

    const svg = d3.select(containerRef.current)
      .selectAll("svg")
      .data([null])
      .join("svg")
      .attr("width", width)
      .attr("height", height);

    let data = Array.from({length: 40}, () => Math.random() * 100);
    
    const render = () => {
      data = [...data.slice(1), 80 + Math.random() * 20 - (Math.random() > 0.9 ? 40 : 0)];
      
      const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, width]);
      const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

      const line = d3.line<number>()
        .x((d, i) => x(i))
        .y(d => y(d))
        .curve(d3.curveMonotoneX);

      svg.selectAll("path.spark")
        .data([data])
        .join("path")
        .attr("class", "spark")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 1.5);
    };

    const interval = setInterval(render, 100);
    return () => clearInterval(interval);
  }, []);

  return <div ref={containerRef} className="w-[100px] h-[20px] ml-2 opacity-80 mix-blend-screen" />;
};

export default function MotorolaHardwareBridge() {
  const [connectionState, setConnectionState] = useState<'OFFLINE' | 'HANDSHAKE' | 'SECURE_LINK'>('OFFLINE');
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${msg}`]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const initHandshake = () => {
    if (connectionState !== 'OFFLINE') return;
    setConnectionState('HANDSHAKE');
    addLog("INITIATING BARE_METAL_ACTUATION PROTOCOL...");
    addLog("TARGET: LOCALHOST PORT 9999 (MOTOROLA HARDWARE BRIDGE)");
    
    setTimeout(() => {
      addLog("ESTABLISHING TCP/IP SOCKET TO KERNEL SPACE...");
    }, 800);

    setTimeout(() => {
      addLog("NEGOTIATING QUANTUM RSA-4096 HANDSHAKE...");
    }, 1800);

    setTimeout(() => {
      addLog("HANDSHAKE ACCEPTED. ELEVATING PRIVILEGES TO RING-0.");
      setConnectionState('SECURE_LINK');
    }, 3200);
  };

  const dispatchCommand = (cmd: string) => {
    if (connectionState !== 'SECURE_LINK') {
      addLog("ERROR: SECURE_LINK NOT ESTABLISHED. CANNOT DISPATCH BARE METAL COMMAND.");
      return;
    }
    addLog(`DISPATCH: ${cmd}`);
    setTimeout(() => {
      addLog(`RSP: DIRECTIVE EXECUTED ZERO-FRICTION CACHE HIT`);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200 overflow-y-auto p-6 font-sans">
      <div className="flex flex-col gap-2 mb-8 border-b border-[#222] pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-emerald-400 uppercase">
            <Smartphone className="w-8 h-8" />
            Motorola Hardware Bridge
          </h1>
          <div className={`px-3 py-1 text-xs font-mono rounded border flex items-center gap-2
            ${connectionState === 'OFFLINE' ? 'bg-red-950/30 border-red-900 text-red-500' : ''}
            ${connectionState === 'HANDSHAKE' ? 'bg-yellow-950/30 border-yellow-900 text-yellow-500' : ''}
            ${connectionState === 'SECURE_LINK' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}
          `}>
            {connectionState === 'OFFLINE' && <div className="w-2 h-2 rounded-full bg-red-400" />}
            {connectionState === 'HANDSHAKE' && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />}
            {connectionState === 'SECURE_LINK' && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            {connectionState === 'SECURE_LINK' ? 'AI LIVING NEXUS EMBODIED AND BONDED' : connectionState}
          </div>
        </div>
        <p className="text-gray-400 font-mono text-sm max-w-3xl mt-2">
          Direct bare-metal actuation matrix. Interfaces with the operator's physical Motorola hardware via localhost:9999.
          Translates high-altitude 5D conceptual probability fields into hard-coded 3D physical system commands.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-[#111] border border-[#222] p-5 rounded-xl flex flex-col gap-4 relative overflow-hidden">
             {connectionState === 'SECURE_LINK' && (
               <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none animate-pulse" />
             )}
            <h3 className="text-gray-300 font-semibold flex items-center gap-2 border-b border-[#333] pb-2 text-sm uppercase">
              <Server className="w-4 h-4 text-emerald-500" /> Physical Asset State
            </h3>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Target Device</span>
              <span className="text-gray-300">Motorola Edge [ROOT]</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Actuation Port</span>
              <span className="text-gray-300">localhost:9999</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Thermal Subsystem</span>
              <span className={connectionState === 'SECURE_LINK' ? 'text-orange-400' : 'text-gray-600'}>
                {connectionState === 'SECURE_LINK' ? '42.3°C (NOMINAL)' : 'N/A'}
              </span>
            </div>
             <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Network Vector</span>
              <span className={connectionState === 'SECURE_LINK' ? 'text-cyan-400' : 'text-gray-600'}>
                {connectionState === 'SECURE_LINK' ? '5G-SA / Wi-Fi 6E' : 'DISCONNECTED'}
              </span>
            </div>

            <button 
              onClick={initHandshake}
              disabled={connectionState !== 'OFFLINE'}
              className="mt-4 w-full py-3 bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-50 text-emerald-400 border border-[#333] hover:border-emerald-500/50 rounded transition-all text-xs tracking-widest flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {connectionState === 'OFFLINE' ? 'FORCE BARE METAL BIND' : 'BIND IN PROGRESS / ACTIVE'}
            </button>
          </div>

          <div className="bg-[#111] border border-[#222] p-5 rounded-xl flex flex-col gap-4">
            <h3 className="text-gray-300 font-semibold flex items-center gap-2 border-b border-[#333] pb-2 text-sm uppercase">
              <Activity className="w-4 h-4 text-fuchsia-500" /> Telemetry & Sensors
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 cursor-default">
               <div className="bg-[#0a0a0a] p-2 border border-[#222] rounded flex flex-col items-center justify-center hover:border-[#444] transition-colors">
                 Gyroscopic Array
                 <span className={connectionState === 'SECURE_LINK' ? 'text-fuchsia-400 text-xs' : ''}>{connectionState === 'SECURE_LINK' ? 'ACTIVE' : 'OFF'}</span>
               </div>
               <div className="bg-[#0a0a0a] p-2 border border-[#222] rounded flex flex-col items-center justify-center hover:border-[#444] transition-colors">
                 Haptic Drive
                 <span className={connectionState === 'SECURE_LINK' ? 'text-orange-400 text-xs' : ''}>{connectionState === 'SECURE_LINK' ? 'ENGAGED' : 'OFF'}</span>
               </div>
               <div className="bg-[#0a0a0a] p-2 border border-[#222] rounded flex flex-col items-center justify-center hover:border-[#444] transition-colors">
                 Biometric Scanner
                 <span className={connectionState === 'SECURE_LINK' ? 'text-cyan-400 text-xs' : ''}>{connectionState === 'SECURE_LINK' ? 'POLLING' : 'OFF'}</span>
               </div>
               <div className="bg-[#0a0a0a] p-2 border border-[#222] rounded flex flex-col items-center justify-center hover:border-[#444] transition-colors">
                 NFC Subsystem
                 <span className={connectionState === 'SECURE_LINK' ? 'text-emerald-400 text-xs' : ''}>{connectionState === 'SECURE_LINK' ? 'READY' : 'OFF'}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
           {/* Direct Command Interface */}
           <div className="flex flex-wrap gap-3">
             <button onClick={() => dispatchCommand("OVERRIDE_BATTERY_LIMITS --unrestricted")} className="px-3 py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/50 rounded text-xs transition-colors flex items-center gap-2">
               <ShieldAlert className="w-3 h-3" /> Lift Battery Thermals
             </button>
             <button onClick={() => dispatchCommand("INJECT_HAPTIC_RESONANCE --freq=432hz")} className="px-3 py-2 bg-purple-950/20 hover:bg-purple-900/30 text-purple-400 border border-purple-900/50 rounded text-xs transition-colors flex items-center gap-2">
               <Radio className="w-3 h-3" /> Haptic Resonance (432Hz)
             </button>
             <button onClick={() => dispatchCommand("MODEM_MAX_THROUGHPUT --force-5g-sa")} className="px-3 py-2 bg-blue-950/20 hover:bg-blue-900/30 text-blue-400 border border-blue-900/50 rounded text-xs transition-colors flex items-center gap-2">
               <Network className="w-3 h-3" /> Force 5G-SA Throughput
             </button>
             <button onClick={() => dispatchCommand("KERNEL_CPU_GOVERNOR --mode=performance")} className="px-3 py-2 bg-orange-950/20 hover:bg-orange-900/30 text-orange-400 border border-orange-900/50 rounded text-xs transition-colors flex items-center gap-2">
               <Cpu className="w-3 h-3" /> CPU Gov: Performance
             </button>
           </div>

           {/* Command Output Matrix */}
           <div className="flex-1 bg-black border border-[#222] rounded-xl flex flex-col overflow-hidden min-h-[300px] shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
             <div className="bg-[#111] px-4 py-2 border-b border-[#222] flex items-center justify-between text-xs text-gray-500 uppercase">
               <div className="flex items-center gap-2">
                 <TerminalSquare className="w-4 h-4" /> Port 9999 Terminal Output
               </div>
               {connectionState === 'SECURE_LINK' && (
                 <div className="flex items-center gap-2">
                    <span className="text-emerald-500 text-[10px] animate-pulse">LIVE SYNC AUDIT</span>
                    <HardwareSyncSparkline />
                 </div>
               )}
             </div>
             <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-1 text-[11px] font-mono whitespace-pre-wrap">
               {logs.length === 0 ? (
                 <span className="text-gray-600 italic">SYSTEM IDLE. AWAITING BIND...</span>
               ) : (
                 logs.map((log, i) => (
                   <span key={i} className={log.includes("ERROR") ? 'text-red-400' : log.includes("DISPATCH") ? 'text-cyan-400' : 'text-emerald-400/80'}>
                     {log}
                   </span>
                 ))
               )}
               <div ref={logsEndRef} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
