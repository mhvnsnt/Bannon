import React, { useState, useEffect } from 'react';
import { PANELS } from '../App';
import { motion } from 'framer-motion';
import { Activity, Shield, Terminal, Zap, Database, Cpu, Network, Workflow, Download } from 'lucide-react';
import { io } from 'socket.io-client';
import { usePrimeStore } from '../lib/store';

interface IPCLog {
  level: string;
  timestamp: number;
  source: string;
  message: string;
}

interface HardwareTelemetryState {
  vram_used: number;
  vram_total: number;
  gpu_util: number;
}

interface ASTEngineMetrics {
  nodeDelta: number;
  latency: number;
}

export default function GodModeOS({ onNavigate }: { onNavigate: (id: string, isRightPanel: boolean) => void }) {
  const [systemTime, setSystemTime] = useState("");
  const [activeTab, setActiveTab] = useState<'dashboard_monitor' | 'live_stream_logs' | 'modules'>('dashboard_monitor');
  const [ipcLogs, setIpcLogs] = useState<IPCLog[]>([]);
  const [hardwareState, setHardwareState] = useState<HardwareTelemetryState>({ vram_used: 0, vram_total: 16384, gpu_util: 0 });
  const [astEngineMetrics, setAstEngineMetrics] = useState<ASTEngineMetrics>({ nodeDelta: 0, latency: 0.4 });
  const { projectFiles } = usePrimeStore();

  const downloadArtifactZip = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();
      
      Object.entries(projectFiles).forEach(([path, content]) => {
         const relativePath = path.startsWith('/') ? path.substring(1) : path;
         zip.file(relativePath, content as string);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `GodModeOS_Artifact_${Date.now()}.zip`);
    } catch (e) {
      alert("Failed to package and download artifact.");
    }
  };
  
  useEffect(() => {
     const updateTime = () => {
         const now = new Date();
         setSystemTime(now.toLocaleTimeString('en-US', { hour12: false }) + '.' + now.getMilliseconds().toString().padStart(3, '0'));
     };
     const t = setInterval(updateTime, 50);
     return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Connect to local Daemon WebSocket
    const socket = io();

    socket.on("connect", () => {
      setIpcLogs((prev) => [...prev, { level: 'info', timestamp: Date.now(), source: 'system', message: 'Handshake successful with IPC core framework.' }]);
    });

    socket.on("ipc-log", (log: any) => {
      // Handle both string format and structured IPCLog format for compatibility
      let newLog: IPCLog;
      if (typeof log === 'string') {
        newLog = { level: 'info', timestamp: Date.now(), source: 'system', message: log };
      } else {
        newLog = log;
      }
      setIpcLogs(prev => {
        const newLogs = [...prev, newLog];
        if (newLogs.length > 100) newLogs.shift();
        return newLogs;
      });
    });

    socket.on("ast-stats", (stats: any) => {
      if (stats.latency !== undefined) {
         setAstEngineMetrics(stats);
      } else if (stats.compileHz !== undefined) {
         setAstEngineMetrics({ nodeDelta: stats.nodesCount, latency: 0.4 }); 
      }
    });

    socket.on('hardware-telemetry', (incomingHardwarePayload: HardwareTelemetryState) => {
      setHardwareState(incomingHardwarePayload);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col p-6 w-full h-full overflow-y-auto bg-[#070709] text-[#00ff66] font-mono box-border relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff66]/50 to-transparent shadow-[0_0_15px_#00ff66] opacity-50" />

      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full relative z-10 pb-20">
        
        {/* Superior Header */}
        <header style={{ borderBottom: '1px dashed #00ff66', paddingBottom: '14px', marginBottom: '24px' }}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
             <div className="flex flex-col gap-3">
               <div>
                  <h1 style={{ margin: 0, fontSize: '20px', letterSpacing: '1px' }}>
                    // GOD MODE OS v2.0 // OFFLINE ZERO-CONTEXT RUNTIME
                  </h1>
               </div>
             </div>

             <div className="flex gap-4 items-center">
                <div className="flex flex-col items-end">
                   <span className="text-[10px] text-gray-500 tracking-widest uppercase mb-1">LOCAL SIDEREAL TIME</span>
                   <span className="text-xl font-light tracking-[0.2em]">{systemTime}</span>
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', alignItems: 'center' }}>
            <button 
              onClick={() => setActiveTab('dashboard_monitor')} 
              style={{ background: activeTab === 'dashboard_monitor' ? '#00ff66' : 'transparent', color: activeTab === 'dashboard_monitor' ? '#000' : '#00ff66', border: '1px solid #00ff66', padding: '6px 16px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>
              [ DESKTOP MONITOR PANEL ]
            </button>
            <button 
              onClick={() => setActiveTab('live_stream_logs')} 
              style={{ background: activeTab === 'live_stream_logs' ? '#00ff66' : 'transparent', color: activeTab === 'live_stream_logs' ? '#000' : '#00ff66', border: '1px solid #00ff66', padding: '6px 16px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>
              [ SYSTEM STREAM LOGS ]
            </button>
            <button 
              onClick={() => setActiveTab('modules')} 
              style={{ background: activeTab === 'modules' ? '#00ff66' : 'transparent', color: activeTab === 'modules' ? '#000' : '#00ff66', border: '1px solid #00ff66', padding: '6px 16px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>
              [ SYSTEM MODULES ]
            </button>
            <div style={{ flex: 1 }}></div>
            <button 
              onClick={downloadArtifactZip}
              className="flex items-center gap-2"
              style={{ background: 'transparent', color: '#00cc55', border: '1px solid #00cc55', padding: '6px 16px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = '#00cc55'; e.currentTarget.style.color = '#000'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00cc55'; }}
            >
              <Download size={14} /> [ DOWNLOAD ARTIFACT ]
            </button>
          </div>
        </header>

        {activeTab === 'dashboard_monitor' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}
          >
            <div style={{ border: '1px solid #00ff66', padding: '20px', background: '#0c0c10' }}>
              <h3 style={{ margin: '0 0 14px 0', borderBottom: '1px solid #222', paddingBottom: '6px' }}>[ LOCAL PARSING ENGINE DATA ]</h3>
              <p>System Loop Execution Latency: <span style={{ color: '#fff' }}>{astEngineMetrics.latency}ms</span></p>
              <p>Active Node Delta Track: <span style={{ color: '#fff' }}>+{astEngineMetrics.nodeDelta} mutations/sec</span></p>
              <p>MemFS Virtual RAM Speed: <span style={{ color: '#fff' }}>14.2 GB/s</span></p>
            </div>
            
            <div style={{ border: '1px solid #00ff66', padding: '20px', background: '#0c0c10' }}>
              <h3 style={{ margin: '0 0 14px 0', borderBottom: '1px solid #222', paddingBottom: '6px' }}>[ GPU FOOTPRINT TELEMETRY ]</h3>
              <p>Swarm Computational Load: <span style={{ color: '#fff' }}>{hardwareState.gpu_util}%</span></p>
              <p>Allocated Local VRAM Matrix: <span style={{ color: '#fff' }}>{hardwareState.vram_used} MB / {hardwareState.vram_total} MB</span></p>
              <div style={{ width: '100%', background: '#14141a', height: '14px', marginTop: '14px', border: '1px solid #00ff66', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((hardwareState.vram_used / hardwareState.vram_total) * 100, 100)}%`, background: '#00ff66', height: '100%', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'live_stream_logs' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            style={{ border: '1px solid #00ff66', padding: '20px', height: '450px', overflowY: 'auto', background: '#030305', borderRadius: '3px', boxShadow: 'inset 0 0 10px rgba(0,255,102,0.1)' }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>[ HOT-RELOAD SOCKET STREAM BUS LOGLINES ]</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ipcLogs.map((log, i) => {
                const d = new Date(log.timestamp);
                const timeStr = d.toLocaleTimeString('en-US', { hour12: false }) + '.' + d.getMilliseconds().toString().padStart(3, '0');
                
                let textColor = "#aaa";
                if (log.level === "warn") textColor = "#ffb800";
                if (log.level === "error") textColor = "#ff3333";
                if (log.source === "GRAPHDB") textColor = "#00e5ff";
                if (log.source === "DAEMON") textColor = "#ff00e5";
                if (log.source === "system") textColor = "#00ff66";
                if (log.source === "PYTHON_DAEMON") textColor = "#7e57c2";
                if (log.message.includes('SUCCESS')) textColor = '#00ff66';
                if (log.message.includes('FAIL') || log.message.includes('Kernel error')) textColor = '#ff3333';
                
                return (
                  <div key={i} style={{ color: textColor, fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    . [{timeStr}] [{log.source || 'system'}] {log.message}
                  </div>
                );
              })}
              {ipcLogs.length === 0 && (
                 <div style={{ color: '#555', textAlign: 'center', marginTop: '20px' }}>
                   No AST mutations detected.<br/>Upload or modify a file in the Dev Library to trigger the real-time parser.
                 </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Modules Grid */}
        {activeTab === 'modules' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-4"
          >
            {PANELS.filter(p => p.id !== 'god_mode_os').map((p, idx) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => onNavigate(p.id, !p.isMain)}
                className={`flex flex-col items-start gap-4 p-5 border transition-all text-left group relative overflow-hidden backdrop-blur-sm
                   ${p.isMain ? 'bg-[#0a0a0f]/80 border-[#00ff66]/40 hover:bg-[#0f0f1a] hover:border-[#00ff66] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_30px_rgba(0,255,102,0.2)] rounded-lg' 
                   : 'bg-[#111111]/80 border-[#333] hover:bg-[#1a1a1a] hover:border-[#555] rounded-lg'}
                `}
              >
                {/* Decoration Line */}
                {p.isMain && (
                   <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00ff66]/50 to-[#00ff66] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                
                <div className="flex justify-between w-full items-start">
                   <div className={`p-3 rounded flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${p.isMain ? 'bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66]' : 'bg-[#222] border border-[#333] text-gray-400'}`}>
                     {p.icon}
                   </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <span className={`font-bold tracking-wide uppercase text-xs ${p.isMain ? 'text-[#00ff66]' : 'text-gray-300'}`}>{p.label}</span>
                  <span className={`text-[10px] tracking-widest uppercase font-mono ${p.isMain ? 'text-[#00ff66]/70' : 'text-gray-500'}`}>
                    {p.isMain ? "Prime Architecture Module" : "Secondary Workspace Panel"}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
