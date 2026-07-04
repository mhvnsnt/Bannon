import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, Upload, Layers, Play, ExternalLink, Download, 
  Send, ChevronRight, Activity, ShieldAlert, Cpu, Check, X,
  FileCheck, RotateCcw, AlertTriangle, CpuIcon, AlertCircle, Eye,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { WorkspaceExplorer } from './WorkspaceExplorer';
import { PromptQueuePanel } from './PromptQueuePanel';
import { TerminalConsole } from './TerminalConsole';

export function QuantumBuildChat() {
  const [file, setFile] = useState<{ id: string; filename: string; content: string; version_number: number; token_count?: number } | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isQueueMode, setIsQueueMode] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activePreview, setActivePreview] = useState<'preview' | 'code'>('preview');

  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substr(2, 9));
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [modelPreference, setModelPreference] = useState<'standard' | 'creative'>('standard');
  const [providers, setProviders] = useState<any[]>([]);
  
  // Autonomous & Permission gate state
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [trustMind, setTrustMind] = useState(false);
  const [useRazor, setUseRazor] = useState(true);
  const [pendingDirectives, setPendingDirectives] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/armada/model_router/check');
      if (res.ok) {
        setProviders(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    if (!file) return;
    try {
      const res = await fetch(`/api/armada/quantum/versions/${file.id}`);
      if (res.ok) {
        const data = await res.json();
        setVersionHistory(data.versions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await fetch(`/api/armada/quantum/pending/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setPendingDirectives(data.pending || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProviders();
    const interval = setInterval(() => {
      fetchProviders();
      if (file) {
        fetchPending();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [file]);

  useEffect(() => {
    if (file) {
      fetchHistory();
      // Load current session messages
      fetch(`/api/armada/quantum/session/${sessionId}/${file.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(e => console.error("Session load failed:", e));
    }
  }, [file?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Autonomously handle pending countdowns
  useEffect(() => {
    if (pendingDirectives.length === 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        const next = { ...prev };
        let changed = false;

        for (const dir of pendingDirectives) {
          if (next[dir.id] === undefined) {
            next[dir.id] = 30;
            changed = true;
          } else if (next[dir.id] > 0) {
            next[dir.id] -= 1;
            changed = true;
          } else if (next[dir.id] === 0) {
            // Trigger Auto-Approve!
            handleResolveDirective(dir.id, true);
            delete next[dir.id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingDirectives]);

  const handleFileUpload = async (filename: string, content: string) => {
    try {
      const res = await fetch('/api/armada/quantum/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content })
      });
      if (res.ok) {
        const data = await res.json();
        setFile({
          id: data.fileId,
          filename,
          content,
          version_number: 1,
          token_count: data.tokenCount
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      const f = files[0];
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleFileUpload(f.name, evt.target.result as string);
        }
      };
      reader.readAsText(f);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      const f = files[0];
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleFileUpload(f.name, evt.target.result as string);
        }
      };
      reader.readAsText(f);
    }
  };

  const handleRollback = async (verNum: number) => {
    if (!file) return;
    try {
      const res = await fetch('/api/armada/quantum/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, versionNumber: verNum })
      });
      if (res.ok) {
        const data = await res.json();
        // Reload current state
        const fileRes = await fetch(`/api/armada/quantum/file/${data.fileId}`);
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          setFile({
            id: data.fileId,
            filename: fileData.filename,
            content: fileData.content,
            version_number: fileData.version_number,
            token_count: Math.ceil(fileData.content.length / 4)
          });
          setShowHistory(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveDirective = async (dirId: string, approve: boolean) => {
    try {
      await fetch('/api/armada/quantum/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directiveId: dirId, approve })
      });
      setPendingDirectives(prev => prev.filter(p => p.id !== dirId));
      if (approve && file) {
        // Reload active file details
        setTimeout(async () => {
          const fileRes = await fetch(`/api/armada/quantum/file/${file.id}`);
          if (fileRes.ok) {
            const fileData = await fileRes.json();
            setFile(prev => prev ? {
              ...prev,
              content: fileData.content,
              version_number: fileData.version_number,
              token_count: Math.ceil(fileData.content.length / 4)
            } : null);
          }
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !file || isSending) return;
    setIsSending(true);
    const textToSend = inputMessage;
    setInputMessage('');

    try {
      const res = await fetch('/api/armada/quantum/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fileId: file.id,
          message: textToSend,
          modelPreference,
          useRazor
        })
      });

      if (res.ok) {
        const data = await res.json();
        const nextVer = (file ? file.version_number : 0) + 1;
        setFile(prev => prev ? {
          ...prev,
          id: data.fileId,
          version_number: nextVer,
          content: data.newFileContent || prev.content,
          token_count: Math.ceil((data.newFileContent || prev.content).length / 4)
        } : null);

        // Fetch refreshed chat messages
        const chatRes = await fetch(`/api/armada/quantum/session/${sessionId}/${data.fileId}`);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setMessages(chatData.messages);
        }

        // PHYSICAL ARTIFACT AUTO-DOWNLOAD VECTOR
        if (!autonomousMode && data.newFileContent) {
          try {
            const blob = new Blob([data.newFileContent], { type: 'text/html' });
            const link = document.createElement('a');
            
            // Format filename to include active version identifier (e.g., bannon v3.html)
            const currentFilename = file ? file.filename : 'bannon.html';
            const dotIndex = currentFilename.lastIndexOf('.');
            const downloadFilename = dotIndex !== -1
              ? `${currentFilename.slice(0, dotIndex)} v${nextVer}${currentFilename.slice(dotIndex)}`
              : `${currentFilename} v${nextVer}`;

            link.href = URL.createObjectURL(blob);
            link.download = downloadFilename;
            link.click();
            URL.revokeObjectURL(link.href);
            console.log(`[QuantumBuildChat] Successfully downloaded auto-artifact: ${downloadFilename}`);
          } catch (err) {
            console.error("Auto-download trigger failed:", err);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const downloadFile = () => {
    if (!file) return;
    const blob = new Blob([file.content], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.filename;
    link.click();
  };

  // Compute metrics
  const maxTokens = 120000;
  const currentTokens = file?.token_count || 0;
  const tokenPercent = Math.min(100, Math.round((currentTokens / maxTokens) * 100));

  const isHtml = file?.filename.endsWith('.html');

  const handleWorkspaceFileSelect = async (path: string, content: string) => {
    try {
      const parts = path.split('/');
      const name = parts[parts.length - 1];
      const res = await fetch('/api/armada/quantum/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: name, content })
      });
      if (res.ok) {
        const data = await res.json();
        setFile({ id: data.fileId, filename: data.filename, content, version_number: 1, token_count: Math.ceil(content.length / 4) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-black text-white font-mono rounded-xl border border-white/10 overflow-hidden relative" style={{ height: 'calc(100vh - 100px)' }}>

      {isWorkspaceOpen && (
        <div className="w-[260px] flex-shrink-0 border-r border-white/10 overflow-hidden flex flex-col">
          <WorkspaceExplorer onFileSelect={handleWorkspaceFileSelect} />
        </div>
      )}

      {/* File & Workspace Pane */}
      <div className="flex-1 flex flex-col border-r border-white/10 h-full overflow-hidden relative">
        {/* Top workspace toolbar */}
        <div className="px-4 py-3 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className="p-1 hover:bg-white/5 rounded text-gray-400 transition-colors"
            >
              <FileCode className="w-5 h-5 text-amber-500" />
            </button>
            {file ? (
              <div>
                <div className="font-bold text-xs text-white max-w-[180px] sm:max-w-xs truncate">{file.filename}</div>
                <div className="text-[9px] text-gray-500">VERSION {file.version_number} • {file.token_count || 0} TOKENS</div>
              </div>
            ) : (
              <span className="text-gray-400 text-xs">No Workspace File Uploaded</span>
            )}
          </div>

          {file && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsQueueMode(!isQueueMode)}
                className={`text-xs px-2.5 py-1 rounded transition-colors font-bold ${isQueueMode ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-white/10 text-gray-400 hover:border-white/30'}`}
              >
                PROMPT QUEUE ENGINE
              </button>

              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="bg-zinc-900 border border-white/10 hover:border-white/30 text-xs px-2.5 py-1 rounded transition-colors text-gray-400"
              >
                Version History
              </button>

              <button 
                onClick={downloadFile}
                className="p-1 px-2.5 text-xs text-amber-500 bg-amber-500/10 hover:bg-amber-500/25 rounded flex items-center gap-1.5 transition-all"
                title="Download HTML Output"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              <div className="flex border border-white/10 rounded overflow-hidden">
                <button 
                  onClick={() => setActivePreview('preview')}
                  className={`px-2.5 py-1 text-[10px] uppercase font-bold transition-all ${activePreview === 'preview' ? 'bg-amber-500 text-black' : 'bg-transparent text-gray-400'}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setActivePreview('code')}
                  className={`px-2.5 py-1 text-[10px] uppercase font-bold transition-all ${activePreview === 'code' ? 'bg-amber-500 text-black' : 'bg-transparent text-gray-400'}`}
                >
                  Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Workspace Display Slot */}
        <div className="flex-1 bg-[#111] relative overflow-hidden flex flex-col">
          {!file ? (
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed mx-6 my-6 rounded-xl transition-all ${
                isDragging ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 bg-black/40'
              }`}
            >
              <Upload className="w-12 h-12 text-gray-600 mb-4 animate-bounce" />
              <h3 className="font-bold text-sm text-gray-300 mb-1">Upload to Ouroboros Local Swarm Matrix</h3>
              <p className="text-[10px] text-gray-500 mb-4 max-w-xs text-center leading-relaxed">
                Unlock instant physical rendering, local recursive compilation, and unlimited Ouroboros execution loops.
              </p>
              <button 
                onClick={triggerFileInput}
                className="bg-amber-600 hover:bg-amber-500 text-black px-4 py-2 rounded text-xs font-bold transition-all"
              >
                Select File Manually
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                className="hidden" 
                accept=".html,.js,.jsx,.ts,.tsx"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col dynamic-window flex-1 relative overflow-hidden">
              {/* Version history overlay */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div 
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="absolute inset-y-0 left-0 w-80 bg-black/95 border-r border-white/10 z-20 p-4 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                       <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Version Archives</h3>
                       <button onClick={() => setShowHistory(false)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                       {versionHistory.map((ver, idx) => (
                         <div key={idx} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 flex flex-col gap-1 text-[11px]">
                           <div className="flex items-center justify-between">
                             <span className="font-bold text-amber-400">v{ver.version_number}</span>
                             <span className="text-[9px] text-gray-500">{new Date(ver.timestamp).toLocaleTimeString()}</span>
                           </div>
                           <p className="text-gray-300 italic">"{ver.change_summary || 'Auto transformation'}"</p>
                           <button 
                             onClick={() => handleRollback(ver.version_number)}
                             className="mt-2 text-[9px] bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black py-1 px-2 rounded font-bold transition-all flex items-center justify-center gap-1"
                           >
                             <RotateCcw className="w-3 h-3" />
                             Restore Version
                           </button>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {activePreview === 'preview' && isHtml ? (
                <iframe 
                  srcDoc={file.content}
                  className="w-full h-full bg-white flex-1"
                  title="Canvas Sandbox Rendering"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <pre className="w-full h-full overflow-auto p-4 text-[11px] text-gray-300 bg-black/50 select-text flex-1 whitespace-pre">
                  <code>{file.content}</code>
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Persistent Build Controller Panel */}
      <div className="lg:w-96 flex flex-col bg-[#050505] h-full overflow-hidden">
        
        {/* Token Status bar */}
        {file && (
          <div className="px-4 py-2 border-b border-white/5 bg-[#0a0a0a] text-[10px]">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span>CONTEXT COMPRESSION ENVELOPE</span>
              <span className={tokenPercent > 80 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                 {tokenPercent}% USED ({currentTokens} / {maxTokens})
              </span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${tokenPercent > 80 ? 'bg-red-500' : tokenPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
            {tokenPercent > 60 && (
              <div className="text-[9px] text-amber-400 bg-amber-500/5 border border-amber-500/10 p-1 px-2 rounded mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <span>History condensing triggers under active compression to safe-keep space.</span>
              </div>
            )}
          </div>
        )}

        {/* Model Route Controls */}
        <div className="px-4 py-3 border-b border-white/5 bg-[#0a0a0a] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest flex items-center gap-2">
              <Cpu className="w-3 h-3" />
              Ouroboros Swarm
            </span>
            <div className="flex border border-emerald-900/50 rounded overflow-hidden">
               <button 
                 onClick={() => setModelPreference('standard')}
                 className={`px-2 py-0.5 text-[9px] font-bold ${modelPreference === 'standard' ? 'bg-emerald-500 text-black' : 'bg-black text-emerald-600 hover:text-emerald-400'}`}
               >
                 Local Fast
               </button>
               <button 
                 onClick={() => setModelPreference('creative')}
                 className={`px-2 py-0.5 text-[9px] font-bold ${modelPreference === 'creative' ? 'bg-emerald-500 text-black' : 'bg-black text-emerald-600 hover:text-emerald-400'}`}
               >
                 DeepSeek V3
               </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-1">
             <div className="text-[8px] p-2 rounded bg-emerald-950/30 border border-emerald-900/50 flex flex-col items-center gap-1 justify-center shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="text-emerald-400 text-[9px] font-bold">DeepSeek V3</span>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[7px] text-gray-500">ACTIVE</span></div>
             </div>
             <div className="text-[8px] p-2 rounded bg-[#111] border border-[#222] flex flex-col items-center gap-1 justify-center">
                <span className="text-gray-500 text-[9px]">Qwen 2.5</span>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-900" /><span className="text-[7px] text-gray-700">IDLE</span></div>
             </div>
             <div className="text-[8px] p-2 rounded bg-[#111] border border-[#222] flex flex-col items-center gap-1 justify-center">
                <span className="text-gray-500 text-[9px]">Llama 3</span>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-900" /><span className="text-[7px] text-gray-700">IDLE</span></div>
             </div>
             <div className="text-[8px] p-2 rounded bg-[#111] border border-[#222] flex flex-col items-center gap-1 justify-center">
                <span className="text-gray-500 text-[9px]">Gemini 2.0</span>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-900" /><span className="text-[7px] text-red-900/50">OFFLINE</span></div>
             </div>
          </div>

          {/* Let Nexus Drive Toggle & Trust Toggle */}
          <div className="flex flex-col gap-2 mt-1 border-t border-white/5 pt-2">
            <div className="flex items-center justify-between">
               <label className="text-[10px] text-gray-400 flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autonomousMode} 
                    onChange={async (e) => {
                      setAutonomousMode(e.target.checked);
                      if (file) {
                        await fetch('/api/armada/quantum/config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sessionId, fileId: file.id, autonomous: e.target.checked, trust: trustMind })
                        });
                      }
                    }} 
                    className="accent-amber-500 rounded" 
                  />
                  <span>Let Nexus Drive</span>
               </label>

               {autonomousMode && (
                 <label className="text-[10px] text-gray-400 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={trustMind} 
                      onChange={async (e) => {
                        setTrustMind(e.target.checked);
                        if (file) {
                          await fetch('/api/armada/quantum/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId, fileId: file.id, autonomous: autonomousMode, trust: e.target.checked })
                          });
                        }
                      }}
                      className="accent-amber-500 rounded" 
                    />
                    <span className="text-amber-500 font-bold">Trust Mind (Un-gated)</span>
                 </label>
               )}
            </div>

            <div className="flex items-center justify-between mt-1 border-t border-white/5 pt-1.5 pb-1">
               <label className="text-[10px] text-gray-400 flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useRazor} 
                    onChange={(e) => setUseRazor(e.target.checked)} 
                    className="accent-amber-500 rounded" 
                  />
                  <span>Context Slicing (Razor Engine)</span>
               </label>
            </div>
            {file && (
              <button
                onClick={downloadFile}
                className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black rounded text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-[0.98]"
                title="Force raw download of the latest game build state from quantum vault"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download Latest Artifact</span>
              </button>
            )}
          </div>
        </div>

        {/* Pending approvals notifications */}
        {pendingDirectives.length > 0 && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-[10px] space-y-2">
             <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldAlert className="w-4 h-4 animate-pulse text-amber-500" />
                <span>PENDING NEXUS AUTONOMOUS PROPOSAL</span>
             </div>
             {pendingDirectives.map((dir, i) => (
                <div key={i} className="bg-black/40 border border-white/5 p-2 rounded relative">
                   <p className="text-gray-300 italic mb-2">"Mind wants to: {dir.intent}"</p>
                   <div className="flex items-center justify-between">
                      <span className="text-gray-500">Auto-Approve in: {countdown[dir.id] ?? 30}s</span>
                      <div className="flex items-center gap-1">
                         <button 
                           onClick={() => handleResolveDirective(dir.id, false)}
                           className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 p-1 px-2.5 rounded text-[9px] font-bold transition-all"
                         >
                           Block
                         </button>
                         <button 
                           onClick={() => handleResolveDirective(dir.id, true)}
                           className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 p-1 px-2.5 rounded text-[9px] font-bold transition-all"
                         >
                           Approve
                         </button>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        )}

        {isQueueMode ? (
          <div className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full flex flex-col bg-black">
            <PromptQueuePanel />
          </div>
        ) : (
          <>
            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
               {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 px-6">
                     <Cpu className="w-8 h-8 text-white/5 mb-3" />
                     <p className="text-xs">No active conversation.</p>
                     <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        Upload an HTML/JS template, and chat here to apply robust surgical modifications with precise diff patches.
                     </p>
                  </div>
               ) : (
                  messages.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col max-w-[90%] gap-1.5 p-3 rounded-lg border text-[11px] leading-relaxed ${
                        m.role === 'user' 
                        ? 'self-end ml-auto bg-amber-500/5 border-amber-500/20 text-amber-400' 
                        : 'self-start mr-auto bg-white/5 border-white/10 text-gray-100'
                      }`}
                    >
                      <div className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">
                        {m.role === 'user' ? 'USER DIRECTIVE' : 'NEXUS INTELLECT'}
                      </div>
                      <div>
                        {m.content}
                      </div>
                    </div>
                  ))
               )}
               {isSending && (
                  <div className="bg-white/5 border border-white/10 p-3 rounded-lg self-start mr-auto max-w-[60%] flex items-center gap-3 text-[11px] text-gray-400">
                     <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                     <span>Thinking & applying diff code modifications...</span>
                  </div>
               )}
               <div ref={chatEndRef} />
            </div>

            {/* Input Interface */}
            <div className="p-3 bg-[#0a0a0a] border-t border-white/10 flex items-center gap-2">
               <input 
                 type="text" 
                 className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-[11px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500"
                 placeholder={file ? "Request surgical improvements..." : "Upload files first to initiate session"}
                 value={inputMessage}
                 onChange={(e) => setInputMessage(e.target.value)}
                 disabled={!file || isSending}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
               />
               <button 
                 onClick={handleSendMessage}
                 disabled={!file || isSending || !inputMessage.trim()}
                 className="p-2 text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-black rounded transition-all disabled:opacity-40 shrink-0"
               >
                 <Send className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setShowTerminal(!showTerminal)}
                 className={`p-2 rounded border transition-colors shrink-0 flex items-center justify-center ${showTerminal ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-zinc-900 border-white/10 text-gray-500 hover:text-gray-300'}`}
                 title="Toggle Bare Metal Actuator"
               >
                 <Terminal className="w-4 h-4" />
               </button>
            </div>
          </>
        )}

        {showTerminal && (
          <TerminalConsole 
            isExpanded={terminalExpanded} 
            onToggleExpand={() => setTerminalExpanded(!terminalExpanded)} 
            onClose={() => setShowTerminal(false)} 
          />
        )}
      </div>
    </div>
  );
}
