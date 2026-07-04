import React, { useState, useRef, useEffect } from "react";
import { usePrimeStore } from "../lib/store";
import {
  ArmadaNode,
  ChatMessage,
  ToolCall,
  ChatSession,
  PROVIDERS,
  AttachedFile,
} from "../types";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Camera,
  Mic,
  Code2,
  Network,
  Zap,
  Loader2,
  GitCommit,
  PlaySquare,
  Orbit,
  ShieldAlert,
  Menu,
  Plus,
  MessageSquare,
  ChevronDown,
  Paperclip,
  X,
  Terminal,
  Radio,
  BookOpen,
  Activity,
  Box,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import SpatialSandbox from "./SpatialSandbox";
import { ArtifactRenderer } from "./ArtifactRenderer";
import CodeSurgeonPanel from "./CodeSurgeonPanel";
import {
  getChatSessions,
  getChatMessages,
  syncChatSession,
} from "../lib/persistence";
import { useHardwareActuator } from "../hooks/useHardwareActuator";
import ASTVisualizer from "./ASTVisualizer";
import { usePhoneDaemon } from '../hooks/usePhoneDaemon';
import { useLivingNexus } from "../hooks/useLivingNexus";

function ArtifactBlock({ codeContent, language, filename, onApply }: { codeContent: string; language: string; filename?: string; onApply?: (code: string) => void }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeExpanded, setCodeExpanded] = useState(false);
  
  const extMap: Record<string, string> = {
    html: 'html', js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts', 
    json: 'json', css: 'css', bash: 'sh', sh: 'sh', md: 'md', python: 'py'
  };
  const fileExt = extMap[language.toLowerCase()] || 'txt';
  const outputName = filename || `ouroboros_artifact_${Date.now()}.${fileExt}`;
  const isHtml = fileExt === 'html';

  const handleDownload = () => {
    const blob = new Blob([codeContent], { type: isHtml ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full border border-emerald-500/30 rounded-xl overflow-hidden bg-[#050505] mt-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-950/40 to-[#0a0a0a]/40 border-b border-emerald-500/20">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-300 font-bold">
          <Orbit className="w-4 h-4 text-emerald-500" />
          OUROBOROS ARTIFACT: {language.toUpperCase()}
        </div>
        <button
          onClick={() => setCodeExpanded(p => !p)}
          className="text-[10px] font-mono font-bold text-gray-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
        >
          {codeExpanded ? '▲ COLLAPSE CODE' : '▼ VIEW CODE'}
        </button>
      </div>

      {/* Collapsible code block */}
      {codeExpanded && (
        <div className="relative max-h-96 overflow-y-auto bg-black border-b border-emerald-900/30 custom-scrollbar">
          <pre className="p-4 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
            {codeContent}
          </pre>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 p-3 bg-[#0a0a0a] border-b border-[#1a1a1a] flex-wrap">
        {onApply && (
          <button
            onClick={() => onApply(codeContent)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 rounded-md text-[11px] font-mono font-bold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(79,70,229,0.3)] hover:shadow-[0_0_15px_rgba(79,70,229,0.5)]"
          >
            ⚡ APPLY CHUNK TO WORKSPACE
          </button>
        )}
        {isHtml && (
          <button
            onClick={() => setPreviewOpen(p => !p)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-widest transition-all border ${
              previewOpen
                ? 'bg-emerald-600 text-black border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-transparent text-emerald-500 border-emerald-500/40 hover:bg-emerald-950/40'
            }`}
          >
            <PlaySquare className="w-3.5 h-3.5" />
            {previewOpen ? '✕ CLOSE PREVIEW' : '▶ PREVIEW RENDER'}
          </button>
        )}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-transparent text-cyan-500 border border-cyan-500/40 hover:bg-cyan-950/40 rounded-md text-[11px] font-mono font-bold uppercase tracking-widest transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          DOWNLOAD FILE
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-transparent text-gray-400 border border-gray-600/40 hover:bg-gray-800/80 rounded-md text-[11px] font-mono font-bold uppercase tracking-widest transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'COPIED TO CLIPBOARD' : 'COPY DIRECTLY'}
        </button>
      </div>

      {/* Preview iframe */}
      {previewOpen && isHtml && (
        <div className="w-full h-[600px] bg-white relative">
          <iframe
            title="Artifact Preview"
            srcDoc={codeContent}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-popups opacity-100"
          />
        </div>
      )}
    </div>
  );
}

// ... rest of the file

const socket = io("");

// Helper to extract code strings for sandbox payload
function extractCodeBlock(content: string) {
  const match = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match ? match[1] : content;
}

// Regex-based stream filter to strip non-printable characters and force telemetry JSON structures into monospace blocks
function filterStreamContent(content: any): React.ReactNode {
  if (content === undefined || content === null) return "";
  let text = "";
  if (typeof content === "object") {
    try {
      text = JSON.stringify(content, null, 2);
    } catch (e) {
      text = String(content);
    }
  } else {
    text = String(content);
  }

  // Strip non-printable/control characters (keeping \n \r \t)
  const cleanText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

  const trimmed = cleanText.trim();
  const isJsonLike =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (isJsonLike) {
    return (
      <pre className="font-mono text-[10px] bg-[#050505] text-emerald-400 p-2 rounded border border-emerald-950/50 overflow-x-hidden max-w-full leading-normal whitespace-pre-wrap break-words">
        <code>{cleanText}</code>
      </pre>
    );
  }

  return <span className="whitespace-pre-wrap">{cleanText}</span>;
}

// ... (other components like CopyButton, IntentBadge, KineticExecutionHUD remain unchanged until OmniStrikeHUD)
function CopyButton({
  text,
  className,
  showLabel = false,
}: {
  text: string;
  className?: string;
  showLabel?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 p-1.5 text-xs text-gray-400 hover:text-white hover:bg-[#333] rounded-md transition-colors ${className || ""}`}
      title="Copy message"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {showLabel && <span>{copied ? "Copied!" : "Copy"}</span>}
    </button>
  );
}

function IntentBadge({
  intent,
}: {
  intent?: "strategy" | "code" | "build" | "deploy";
}) {
  if (!intent) return null;
  const config = {
    strategy: {
      icon: Network,
      color: "text-purple-400",
      bg: "bg-purple-900/20",
    },
    code: { icon: Code2, color: "text-emerald-400", bg: "bg-emerald-900/20" },
    build: { icon: Zap, color: "text-amber-400", bg: "bg-amber-900/20" },
    deploy: { icon: PlaySquare, color: "text-blue-400", bg: "bg-blue-900/20" },
  };
  const { icon: Icon, color, bg } = config[intent] || config.strategy;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono tracking-wider uppercase border border-[#333] ${bg} ${color}`}
    >
      <Icon className="w-3 h-3" />
      {intent} Route Executed
    </div>
  );
}

function KineticExecutionHUD({ tools }: { tools: ToolCall[] }) {
  if (!tools || tools.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2 w-full max-w-sm font-mono text-xs">
      {tools.map((tool) => (
        <div
          key={tool.id}
          className="bg-[#111] border border-[#222] rounded-lg overflow-hidden relative shadow-lg shadow-black/50"
        >
          <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-indigo-500/50" />
          <div className="p-2 flex items-center justify-between border-b border-[#222] bg-[#161616]">
            <div className="flex items-center gap-2">
              {tool.status === "running" && (
                <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
              )}
              {tool.status === "success" && (
                <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-2 h-2 text-black" />
                </div>
              )}
              {tool.status === "pending" && (
                <div className="w-3 h-3 rounded-full border border-gray-600" />
              )}
              <span
                className={`${tool.status === "success" ? "text-gray-300" : "text-gray-400"} font-semibold truncate`}
              >
                {tool.name}
              </span>
            </div>
            {tool.status === "running" && (
              <span className="text-[9px] text-indigo-400 animate-pulse uppercase">
                Execute
              </span>
            )}
            {tool.status === "success" && (
              <span className="text-[9px] text-emerald-500 uppercase flex items-center gap-1">
                <Check className="w-2 h-2" /> Locked
              </span>
            )}
          </div>

          <AnimatePresence>
            {tool.logs.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="p-2 bg-black/50 text-gray-500 whitespace-pre-wrap leading-relaxed border-t border-[#333] max-h-32 overflow-y-auto"
              >
                {tool.logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <GitCommit className="w-3 h-3 text-[#333] shrink-0 mt-0.5" />
                    <span className="truncate">{log}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function OmniStrikeHUD({ command }: { command: string }) {
  const [executionQueue, setExecutionQueue] = useState<any[]>([]);

  useEffect(() => {
    if (!command) return;

    const handleUpdate = (data: any) => {
      setExecutionQueue((prev) => {
        const newQueue = [...prev];
        const existingIdx = newQueue.findIndex(
          (item) => item.target === data.target && item.status !== "LOCKED",
        );
        if (existingIdx > -1) {
          newQueue[existingIdx] = data;
        } else {
          newQueue.push(data);
        }
        return newQueue;
      });

      if (data.status === "LOCKED" || data.status === "FRICTION_DETECTED") {
        // Optional: Trigger temporal vault storage visually or via fetch
        // Handled inside SSE
      }
    };

    socket.on("kinetic-update", handleUpdate);

    const eventSource = new EventSource(
      `/api/armada/omni-strike-stream?command=${encodeURIComponent(command)}&vectorType=CODE_GENERATION`,
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleUpdate(data);

      if (data.status === "LOCKED" || data.status === "FRICTION_DETECTED") {
        eventSource.close();
        fetch("/api/armada/vault-temporal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intelligencePayload: data.payload,
            category: "Omni align Execution",
            transits: {},
          }),
        });
      }
    };

    return () => {
      eventSource.close();
      socket.off("kinetic-update", handleUpdate);
    };
  }, [command]);

  if (executionQueue.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-black border border-[#333] rounded-xl font-mono text-xs w-full max-w-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-5">
        <Zap className="w-24 h-24 text-emerald-500" />
      </div>
      <div className="uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-2 border-b border-[#222] pb-2 relative z-10">
        <Network className="w-4 h-4 text-emerald-500" /> Omni-align Matrix
      </div>
      <div className="flex flex-col gap-2 relative z-10">
        {executionQueue.map((task, idx) => (
          <div
            key={idx}
            className="flex gap-3 items-start bg-[#111] p-2 rounded border border-[#222]"
          >
            <div className="shrink-0 mt-0.5">
              {task.status === "INGESTING" && (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              )}
              {task.status === "EXECUTING" && (
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
              )}
              {task.status === "SYNTHESIZING" && (
                <Orbit className="w-3 h-3 text-purple-400 animate-spin-slow" />
              )}
              {task.status === "LOCKED" && (
                <Check className="w-3 h-3 text-emerald-500" />
              )}
              {task.status === "FRICTION_DETECTED" && (
                <ShieldAlert className="w-3 h-3 text-red-500" />
              )}
            </div>
            <div className="flex flex-col gap-1 w-full overflow-hidden">
              <div className="flex justify-between items-center w-full">
                <span
                  className={`font-semibold truncate ${task.status === "LOCKED" ? "text-emerald-500" : "text-gray-300"}`}
                >
                  [{task.target}]
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-500">
                  {task.status}
                </span>
              </div>
              <span className="text-gray-400 leading-relaxed max-w-[280px] break-words">
                {filterStreamContent(task.payload || task.message)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ThoughtAccordion = ({ content, isStreaming = false }: { content: string, isStreaming?: boolean }) => {
  return (
    <details className="bg-white/5 border-l-2 border-[#ff7a1a] mb-3 px-2 py-1 rounded-r-md group" open>
      <summary className="font-mono text-[11px] text-gray-500 cursor-pointer select-none flex items-center gap-1.5 outline-none list-none marker:hidden [&::-webkit-details-marker]:hidden hover:text-gray-300">
        <span className={`w-1.5 h-1.5 rounded-full bg-[#ff7a1a] shadow-[0_0_8px_#ff7a1a] ${isStreaming ? 'animate-pulse opacity-100' : 'opacity-50 group-open:opacity-100 transition-opacity'}`}></span>
        Thinking Process / Ouroboros Logic
      </summary>
      <div className="font-mono text-[11px] text-gray-400 leading-relaxed pt-1.5 mt-1 border-t border-white/5 whitespace-pre-wrap break-words text-left custom-scrollbar overflow-x-hidden max-h-96">
        {content}
      </div>
    </details>
  );
};

const LOCAL_SWARM_MODELS = [
  { id: 'deepseek-v3', name: 'DeepSeek-v3' },
  { id: 'qwen-2.5-coder', name: 'Qwen-2.5-Coder' },
  { id: 'llama-3', name: 'Llama-3' },
  { id: 'qwable-3.6-27b', name: 'qwable-27b-abliterated' }
];

export default function QuantumChat() {
  const { isDaemonActive, startDaemon, stopDaemon } = usePhoneDaemon();
  const activeNode = usePrimeStore((state) => state.activeNode);
  const setActiveNode = usePrimeStore((state) => state.setActiveNode);
  const activeProvider = usePrimeStore((state) => state.activeProvider);
  const setActiveProvider = usePrimeStore((state) => state.setActiveProvider);
  const activeModelString = usePrimeStore((state) => state.activeModelString);
  const setActiveModelString = usePrimeStore(
    (state) => state.setActiveModelString,
  );
  const projectFiles = usePrimeStore((state) => state.projectFiles);
  const setProjectFiles = usePrimeStore((state) => state.setProjectFiles);

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isComputing, setIsComputing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(
    () => "session-" + Date.now(),
  );
  const [useTaxonomy, setUseTaxonomy] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // File Ingestion and Workspace Explorer State Setup
  const [sidebarTab, setSidebarTab] = useState<"orbits" | "forge" | "vault">("orbits");
  const [ingestLoading, setIngestLoading] = useState<string | null>(null);
  const [ingestFileStatus, setIngestFileStatus] = useState<string | null>(null);
  const ingestFileInputRef = useRef<HTMLInputElement>(null);

  // Triple-Layer Persistent Memory Vault State
  const [vaultDirectives, setVaultDirectives] = useState<string[]>([]);
  const [vaultLogs, setVaultLogs] = useState<any[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [newVaultDirective, setNewVaultDirective] = useState("");

  const fetchVaultData = async () => {
    setVaultLoading(true);
    try {
      const res = await fetch("/api/persistent-memory");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVaultDirectives(data.directives || []);
          setVaultLogs(data.logs || []);
        }
      }
    } catch (e) {
      console.error("Failed to load persistent memory from sqlite vector vault:", e);
    } finally {
      setVaultLoading(false);
    }
  };

  const handleAddVaultDirective = async () => {
    if (!newVaultDirective.trim()) return;
    try {
      const res = await fetch("/api/persistent-memory/directive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directive: newVaultDirective })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVaultDirectives(data.directives || []);
          setNewVaultDirective("");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVaultDirective = async (directiveText: string) => {
    try {
      const res = await fetch("/api/persistent-memory/directive/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directive: directiveText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVaultDirectives(data.directives || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (sidebarTab === "vault") {
      fetchVaultData();
    }
  }, [sidebarTab]);

  const {
    bridgeStatus,
    runSingleCommand,
    isMinimized,
    setIsMinimized,
    batteryLevel,
    triggerAutonomousAction,
    isSimulated,
    toggleSimulation,
  } = useHardwareActuator();

  const { bridgeStatus: liveBridgeStatus, socket: livingSocket } = useLivingNexus();

  // Listen to proactive streaming triggers from autonomous loop
  useEffect(() => {
    if (!livingSocket) return;

    const handleProactiveMsg = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PROACTIVE_ALERT') {
          setMessages((prev) => [
            ...prev,
            {
              id: "proact-" + Date.now().toString(),
              role: "armada",
              content: `[AUTONOMOUS INITIATIVE]: ${data.message}`,
              timestamp: data.timestamp,
              nodeUsed: "Background Swarm",
            }
          ]);
        }
      } catch (e) {}
    };

    livingSocket.addEventListener("message", handleProactiveMsg);
    return () => {
      livingSocket.removeEventListener("message", handleProactiveMsg);
    };
  }, [livingSocket]);
  const [showTermuxGuide, setShowTermuxGuide] = useState(false);

  // Trigger file ingestion inside memories database
  const ingestWorkspaceFile = async (filePath: string, content: string) => {
    setIngestLoading(filePath);
    setIngestFileStatus(`Slicin chunks for ${filePath}...`);
    try {
      const res = await fetch("/api/armada/ingest-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setIngestFileStatus(`Indexed ${data.chunkCount} chunks inside vault!`);
        setTimeout(() => {
          setIngestFileStatus(null);
          setIngestLoading(null);
        }, 3000);
      } else {
        setIngestFileStatus("Error ingestin file");
        setTimeout(() => setIngestLoading(null), 3000);
      }
    } catch (e: any) {
      setIngestFileStatus("Network error: " + e.message);
      setTimeout(() => setIngestLoading(null), 3000);
    }
  };

  // Process standard external file drop/upload and ingest into the SQLite memory matrix
  const handleDeviceFileIngestion = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIngestLoading(file.name);
    setIngestFileStatus(`Readin ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileContent = event.target?.result as string;
      await ingestWorkspaceFile(file.name, fileContent);
    };
    reader.readAsText(file);
    if (ingestFileInputRef.current) {
      ingestFileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              base64: event.target!.result as string,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: "Camera_Capture_" + Date.now() + ".jpg",
              type: file.type,
              base64: event.target!.result as string,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: "VoiceNote_" + Date.now() + ".webm",
              size: audioBlob.size,
              type: "audio/webm",
              base64: base64data,
            },
          ]);
        };
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Mic access denied or error:", e);
      alert("Microphone access is required for voice input.");
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const loadSessions = async () => {
    try {
      // First try to fetch from Firebase for cross-platform continuity
      const fmSessions = await getChatSessions();
      if (fmSessions && fmSessions.length > 0) {
        setSessions(fmSessions as ChatSession[]);
        return;
      }

      // Fallback
      const res = await fetch("/api/chats").catch(() => null);
      if (!res || !res.ok) return;
      const data = await res.json().catch(() => []);
      if (data && data.length > 0) {
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  const loadOlderMessages = async (sessionId: string, reset = false) => {
    if ((!hasMore && !reset) || loadingOlder) return;
    setLoadingOlder(true);

    const oldestTimestamp = reset
      ? new Date().toISOString()
      : messages[0]?.timestamp || new Date().toISOString();
    try {
      // Try fetching from Firebase
      const fmMessages = await getChatMessages(sessionId);
      if (fmMessages && fmMessages.length > 0) {
        setMessages(fmMessages);
        setHasMore(false);
        return;
      }

      // Fallback
      const res = await fetch(
        `/api/chats/${encodeURIComponent(sessionId)}/messages?limit=15&beforeTimestamp=${encodeURIComponent(oldestTimestamp)}`,
      ).catch(() => null);

      if (!res || !res.ok) {
        setHasMore(false);
        return;
      }

      const olderMsgs = await res.json().catch(() => []);

      if (!olderMsgs || olderMsgs.length < 15) setHasMore(false);
      if (!olderMsgs) return;

      const formatted = olderMsgs.map((msg: any) => ({
        id: msg.id,
        role:
          msg.role === "model" || msg.role === "armada" ? "armada" : msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      if (reset) {
        setMessages(formatted.reverse());
      } else {
        setMessages((prev) => [...formatted.reverse(), ...prev]);
      }
    } catch (e) {
      console.error("Failed to load older messages", e);
    } finally {
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadOlderMessages(currentSessionId, true);
  }, [currentSessionId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0 && hasMore) {
      loadOlderMessages(currentSessionId);
    }
  };

  useEffect(() => {
    // Scroll into view whenever messages change, BUT prevent infinite loops
    // by only scrolling if it's not from an "older messages load" (i.e. scrolling up)
    if (messages.length > 0) {
      // Small timeout to allow render
      setTimeout(() => {
        if (!loadingOlder) {
          endRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    }
  }, [messages.length, loadingOlder]);

  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  useEffect(() => {
    const handleVoiceCommand = (e: any) => {
      const text = e.detail;
      if (text) {
        setInput(""); 
        handleSendRef.current(text);
      }
    };
    window.addEventListener("insert-voice-command", handleVoiceCommand);
    return () => window.removeEventListener("insert-voice-command", handleVoiceCommand);
  }, []);

  async function handleSend(overrideInput?: any) {
    const textToSend = typeof overrideInput === "string" ? overrideInput : input;
    if (!textToSend.trim()) return;

    if (textToSend.startsWith("/generate-3d")) {
       const directive = textToSend.replace("/generate-3d", "").trim();
       
       let fileContentStr = "";
       if (attachedFiles.length > 0) {
         fileContentStr = attachedFiles[0].base64 || "";
       }

       const userMsg: ChatMessage = {
         id: Date.now().toString(),
         role: "user",
         content: `[3D KIRI/TRIPO MODEL PIPELINE INITIALIZED]: ${directive}`,
         timestamp: new Date().toISOString(),
         intent: "build",
         attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
       };
       
       const mockMsg: ChatMessage = {
         id: "3d-armada-" + Date.now().toString(),
         role: "armada",
         content: `[3D ENGINE STATUS: ACTIVE] 
Commencing photogrammetry & procedural mesh reconstruction via Tripo3D/Kiri protocols.

Extracting spatial depth...
Synthesizing GLB manifold from visual context...
*Generating vertex mapping...*

[Notice: GLB binary payload prepared. Model is ready for extraction to the Bannon physics viewport. Physical colliders will conform to generated manifold.]`,
         nodeUsed: "Tripo3D Node",
         timestamp: new Date().toISOString()
       };

       setMessages((prev: any) => [...prev, userMsg, mockMsg]);
       setInput("");
       setAttachedFiles([]);
       return;
    }

    if (textToSend.startsWith("/forge")) {
       const directive = textToSend.replace("/forge", "").trim();
       
       let fileContentStr = "";
       if (attachedFiles.length > 0) {
         fileContentStr = attachedFiles[0].base64 || "";
       }

       const forgeMsg: ChatMessage = {
         id: Date.now().toString(),
         role: "user",
         content: `[OMNI-COMPILER FORGE TRIGGERED]: ${directive}`,
         timestamp: new Date().toISOString(),
         intent: "build"
       };
       setMessages((prev: any) => [...prev, forgeMsg]);
       setInput("");
       setIsComputing(true);
       
       try {
         // Fetch the priority routing model identifier first
         let modelStr = "deepseek/deepseek-coder";
         try {
           const modelRes = await fetch("/api/forge/model");
           const modelData = await modelRes.json();
           modelStr = `${modelData.provider}/${modelData.model}`;
         } catch(e){}
         
         const armadaMsg: ChatMessage = {
           id: "forge-" + Date.now().toString(),
           role: "armada",
           content: `INITIALIZING FORGE [via ${modelStr}]...`,
           nodeUsed: "Apex-Core",
           timestamp: new Date().toISOString()
         };
         setMessages((prev: any) => [...prev, armadaMsg]);
         
         const res = await fetch("/api/forge/bannon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ directive, fileContent: fileContentStr })
         });
         const data = await res.json();
         
         if (data.jobId) {
             const pollInterval = setInterval(async () => {
                try {
                  const statusRes = await fetch("/api/forge/status/" + data.jobId);
                  const statusData = await statusRes.json();
                  setMessages(prev => {
                     const copy = [...prev];
                     const idx = copy.findIndex(m => m.id === armadaMsg.id);
                     if (idx >= 0) {
                         const progress = statusData.chunks_total > 0 ? `(${statusData.chunks_succeeded}/${statusData.chunks_total})` : "";
                         copy[idx] = { ...copy[idx], content: `[FORGE STATUS]: ${statusData.status} ${progress}` };
                         if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
                             clearInterval(pollInterval);
                             setIsComputing(false);
                             copy[idx].content += `\n\nResult: ${statusData.result || statusData.error || ''}`;
                         }
                     }
                     return copy;
                  });
                } catch(e) {
                   clearInterval(pollInterval);
                   setIsComputing(false);
                }
             }, 2000);
         } else {
             setIsComputing(false);
         }
       } catch (err: any) {
           setIsComputing(false);
           setMessages(prev => [...prev, {
             id: Date.now().toString(),
             role: "armada",
             content: `[FORGE ERROR]: ${err.message}`,
             timestamp: new Date().toISOString()
           }]);
       }
       return;
    }

    let intent: "strategy" | "code" | "build" | "deploy" = "strategy";
    const lowerInput = textToSend.toLowerCase();
    if (
      lowerInput.includes("code") ||
      lowerInput.includes("react") ||
      lowerInput.includes("script") ||
      lowerInput.includes("unity")
    )
      intent = "code";
    if (
      lowerInput.includes("build") ||
      lowerInput.includes("compile") ||
      lowerInput.includes("sandbox")
    )
      intent = "build";
    if (lowerInput.includes("deploy") || lowerInput.includes("publish"))
      intent = "deploy";

    const finalInput = useTaxonomy
      ? `[OMNI-TAXONOMY DIRECTIVE ACTIVE: Explain/Respond to the following according to the 4-layer taxonomy (Laymen, Physics, Quantum, OS)]\n${textToSend}`
      : textToSend;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: finalInput,
      timestamp: new Date().toISOString(),
      intent,
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    setMessages((prev) => {
      const newMsgs = [...prev, userMsg];
      syncChatSession(currentSessionId, newMsgs);
      return newMsgs;
    });
    setInput("");
    setAttachedFiles([]);
    setIsComputing(true);

    const { activeNode, activeProvider, activeModelString, openRouterApiKey } =
      usePrimeStore.getState();

    try {
      if (intent === "code" || intent === "build" || intent === "deploy") {
        socket.emit("omni-strike", input);
      }
      const fetchWithRetry = async (
        url: string,
        options: any,
        retries = 3,
      ): Promise<Response> => {
        for (let i = 0; i < retries; i++) {
          try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            if (i === retries - 1) return res;
          } catch (e) {
            if (i === retries - 1) throw e;
          }
          await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // exponential backoff
        }
        throw new Error("Unreachable");
      };

      const response = await fetchWithRetry("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": currentSessionId,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          targetNode: activeNode,
          intent,
          provider: activeProvider.id,
          modelString: activeModelString,
          openRouterApiKey:
            activeProvider.id === "openrouter" ? openRouterApiKey : undefined,
        }),
      });

      if (!response || !response.ok) {
        const errText = response ? await response.text() : "Network error";
        console.error(
          "Daemon returned unhandled error:",
          response?.status,
          errText,
        );
        throw new Error(`Daemon unreachable: ${response?.status} - ${errText}`);
      }

      // Handle JSON vs Stream response
      const tempId = "stream-" + Date.now();
      let streamContent = "";
      let nodeUsed = activeNode || "Apex-Core";
      let toolCalls: any[] | undefined = undefined;

      // Set up an optimistic message box for streaming content
      setMessages((prev) => {
        const initialArmadaMsg: ChatMessage = {
          id: tempId,
          role: "armada",
          content: "Computing...",
          nodeUsed,
          timestamp: new Date().toISOString()
        };
        const newMsgs = [...prev, initialArmadaMsg];
        syncChatSession(currentSessionId, newMsgs);
        return newMsgs;
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        if (json.reply) streamContent = json.reply;
        if (json.error) streamContent = `Error: ${json.error}`;
        
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === tempId);
          const updatedMsg: ChatMessage = {
            id: tempId,
            role: "armada",
            content: streamContent || "Processing...",
            nodeUsed,
            timestamp: new Date().toISOString(),
            toolCalls: toolCalls,
          };
          let msgs = [...prev];
          if (idx === -1) msgs.push(updatedMsg);
          else msgs[idx] = updatedMsg;
          syncChatSession(currentSessionId, msgs);
          return msgs;
        });
      } else {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        
        if (!reader) {
          throw new Error("Response body reader unavailable");
        }

        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const dataStr = trimmed.slice(6).trim();
                if (dataStr === "[DONE]") continue;
                const parsed = JSON.parse(dataStr);

                if (parsed.error) {
                  streamContent += `\nError: ${parsed.error}`;
                } else if (parsed.toolCalls) {
                  toolCalls = parsed.toolCalls;
                } else if (parsed.text) {
                  streamContent += parsed.text;
                } else if (parsed.done) {
                  if (parsed.node) nodeUsed = parsed.node;
                }

                // Update the active streaming message in real time
                setMessages((prev) => {
                  const idx = prev.findIndex((m) => m.id === tempId);
                  const updatedMsg: ChatMessage = {
                    id: tempId,
                    role: "armada",
                    content: streamContent || "Processing...",
                    nodeUsed,
                    timestamp: new Date().toISOString(),
                    toolCalls: toolCalls,
                  };
                  let msgs = [...prev];
                  if (idx === -1) {
                    msgs.push(updatedMsg);
                  } else {
                    msgs[idx] = updatedMsg;
                  }
                  syncChatSession(currentSessionId, msgs);
                  return msgs;
                });
              } catch (e) {
                // Ignore incomplete JSON chunks from split lines
              }
            }
          }
        }
      }

      // TRIGGER AUTONOMOUS TERMINAL HOOK HERE ON COMPLETED STREAM TEXT
      if (streamContent) {
        triggerAutonomousAction(streamContent).then((outputs: any[]) => {
          let hasSuccess = false;
          let hasError = false;
          for (const out of outputs) {
            if (
              out &&
              (out.includes("Error") ||
                out.includes("Exception") ||
                out.includes("error:"))
            ) {
              hasError = true;
              console.log("Syntax fault detected. Initiatin auto healin loop.");
              const healMessage = `The previous bash command failed wit this stack trace:\n\n${out}\n\nAnalyze the physics, rewrite the logic, and output the corrected bash block.`;
              setTimeout(() => {
                handleSend(healMessage);
              }, 1000);
            } else if (out) {
              hasSuccess = true;
            }
          }
          if (hasError && navigator.vibrate) {
            navigator.vibrate([50, 50, 50, 50, 50]); // Sharp pulse for errors
          } else if (hasSuccess && !hasError && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]); // Heavy wave for success
          }
        });
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => {
        const newMsgs = [
          ...prev,
          {
            id: Date.now().toString(),
            role: "system" as const,
            content:
              "There was an error communicating with the daemon at the specified URL.",
            timestamp: new Date().toISOString(),
          },
        ];
        syncChatSession(currentSessionId, newMsgs);
        return newMsgs;
      });
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="flex h-full w-full mx-auto overflow-hidden relative" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col shrink-0 overflow-hidden"
          >
            {/* Sidebar Tabs */}
            <div className="flex border-b border-[#1a1a1a] text-[10px] font-mono tracking-wider shrink-0 bg-[#070707]">
              <button
                onClick={() => setSidebarTab("orbits")}
                className={`flex-1 py-3 text-center uppercase border-b-2 font-semibold transition-all ${sidebarTab === "orbits" ? "border-blue-500 text-blue-400 bg-[#0c0c0c]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
              >
                Orbits
              </button>
              <button
                onClick={() => setSidebarTab("forge")}
                className={`flex-1 py-3 text-center uppercase border-b-2 font-semibold transition-all ${sidebarTab === "forge" ? "border-purple-500 text-purple-400 bg-[#0c0c0c]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
              >
                Forge FS
              </button>
              <button
                onClick={() => setSidebarTab("vault")}
                className={`flex-1 py-3 text-center uppercase border-b-2 font-semibold transition-all ${sidebarTab === "vault" ? "border-emerald-500 text-emerald-400 bg-[#0c0c0c]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
              >
                Memory Vault
              </button>
            </div>

            {sidebarTab === "orbits" ? (
              <>
                <div className="p-4 border-b border-[#1a1a1a] shrink-0">
                  <button
                    onClick={() => {
                      setCurrentSessionId("session-" + Date.now());
                      setMessages([]);
                      loadSessions();
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <span className="font-semibold text-sm tracking-wide flex items-center gap-2">
                      <Plus className="w-4 h-4" /> New Vector
                    </span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2 px-2">
                    Archived Orbits
                  </div>
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setCurrentSessionId(s.id);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-start gap-2 transition-colors ${currentSessionId === s.id ? "bg-[#222] text-white" : "text-gray-400 hover:bg-[#1a1a1a]"}`}
                    >
                      <MessageSquare className="w-4 h-4 mt-1 shrink-0" />
                      <div className="flex flex-col truncate w-full">
                        <span className="text-sm truncate">{s.title}</span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(s.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : sidebarTab === "forge" ? (
              <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
                <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold px-1 font-mono">
                  WORKSPACE FILES
                </div>

                {/* File Tree View */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {Object.keys(projectFiles).map((filePath) => (
                    <div
                      key={filePath}
                      className="group/file p-2 bg-[#111]/80 hover:bg-[#161616] border border-[#222] rounded-lg flex flex-col gap-2 transition-all"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span
                          className="text-xs font-mono text-gray-300 truncate font-semibold"
                          title={filePath}
                        >
                          {filePath}
                        </span>
                        <Code2 className="w-3.5 h-3.5 text-purple-400 shrink-0 opacity-60" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setInput(
                              (prev) =>
                                prev +
                                `\n\n[File Reference ${filePath}]:\n\`\`\`\n${projectFiles[filePath]}\n\`\`\`\n`,
                            );
                            if (window.innerWidth < 768) setSidebarOpen(false);
                          }}
                          className="flex-1 text-center py-1 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-[9px] font-mono font-semibold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 rounded transition-colors cursor-pointer"
                          title="Append file contents inside active Chat prompt"
                        >
                          Append
                        </button>
                        <button
                          onClick={() =>
                            ingestWorkspaceFile(
                              filePath,
                              projectFiles[filePath],
                            )
                          }
                          className="flex-1 text-center py-1 bg-purple-900/30 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-500/60 text-[9px] font-mono font-semibold uppercase tracking-wider text-purple-300 rounded transition-all cursor-pointer"
                          title="Chunk & ingest file inside local memory vault"
                          disabled={ingestLoading !== null}
                        >
                          Vault
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* File Ingestion System Zone */}
                <div className="border-t border-[#1a1a1a] pt-3 shrink-0 flex flex-col gap-2">
                  <div className="text-[10px] uppercase tracking-widest text-[#555] font-bold px-1 font-mono">
                    INGEST SYSTEM VAULT
                  </div>

                  <input
                    type="file"
                    ref={ingestFileInputRef}
                    onChange={handleDeviceFileIngestion}
                    className="hidden"
                  />

                  <button
                    onClick={() => ingestFileInputRef.current?.click()}
                    disabled={ingestLoading !== null}
                    className="w-full py-2 bg-gradient-to-r from-purple-950/20 to-indigo-950/20 hover:from-purple-900/30 hover:to-indigo-900/30 border border-dashed border-[#333] hover:border-purple-500/50 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300 hover:text-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {ingestLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5" />
                    )}
                    Upload to Memory
                  </button>

                  {ingestFileStatus && (
                    <div className="p-2.5 bg-black border border-[#222] rounded-lg text-[10px] font-mono text-cyan-400 break-words leading-relaxed animate-pulse text-center">
                      {ingestFileStatus}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold px-1 font-mono flex justify-between items-center">
                  <span>Absolute Directives</span>
                  <span className="text-[9px] text-emerald-500/50">Shield Active</span>
                </div>

                {/* Add Directive Box */}
                <div className="flex flex-col gap-2 bg-[#1c1c1c]/40 border border-[#222] p-2 rounded-lg shrink-0">
                  <textarea
                    value={newVaultDirective}
                    onChange={(e) => setNewVaultDirective(e.target.value)}
                    placeholder="Lock absolute directive (e.g., persistent physics constants, UX limits)..."
                    className="w-full text-[10px] font-mono bg-black text-emerald-300 placeholder-emerald-800 border border-[#333] p-1.5 rounded focus:outline-none focus:border-emerald-500 min-h-[45px] resize-none"
                  />
                  <button
                    onClick={handleAddVaultDirective}
                    className="w-full py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 hover:border-emerald-500/65 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Lock Directive
                  </button>
                </div>

                {/* Directives Lit list */}
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar shrink-0">
                  {vaultLoading && vaultDirectives.length === 0 ? (
                    <div className="text-[10px] font-mono text-gray-600 animate-pulse text-center p-2">
                      Compiling Absolute Directives...
                    </div>
                  ) : vaultDirectives.length === 0 ? (
                    <div className="text-[10px] font-mono text-gray-700 italic text-center p-2 border border-dashed border-[#1a1a1a] rounded">
                      No absolute custom directives locked.
                    </div>
                  ) : (
                    vaultDirectives.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-[#0c0c0c] border border-emerald-950/40 hover:border-emerald-500/20 rounded text-[9.5px] font-mono text-emerald-200/80 leading-relaxed group/dir flex justify-between gap-1.5 relative"
                      >
                        <span className="break-words max-w-[210px]">{d}</span>
                        <button
                          onClick={() => handleDeleteVaultDirective(d)}
                          className="text-gray-600 hover:text-red-400 p-0.5 rounded cursor-pointer self-start shrink-0"
                          title="Purge Directive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-[#1a1a1a] pt-2 shrink-0 flex flex-col min-h-0 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold px-1 font-mono mb-2">
                    Vector Memory Logs
                  </div>

                  {/* Vault Memories view */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {vaultLoading && vaultLogs.length === 0 ? (
                      <div className="text-[10px] font-mono text-gray-600 animate-pulse text-center p-4">
                        Scanning database sectors...
                      </div>
                    ) : vaultLogs.length === 0 ? (
                      <div className="text-[10px] font-mono text-gray-700 italic text-center p-4">
                        Vector memory ledger is currently empty.
                      </div>
                    ) : (
                      vaultLogs.map((log) => (
                        <div
                          key={log.rowid}
                          className="p-2 bg-[#080808]/80 hover:bg-[#0c0c0c] border border-[#181818] rounded-md font-mono text-[9px] text-gray-400 leading-snug flex flex-col gap-1 transition-colors"
                        >
                          <div className="flex justify-between items-center text-[7.5px] font-semibold tracking-wider text-indigo-400/50 border-b border-[#141414] pb-0.5 uppercase">
                            <span>Sect-Row {log.rowid} ({log.role})</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="break-words text-gray-400/80 max-h-[50px] overflow-hidden text-ellipsis line-clamp-3">
                            {log.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full w-full flex-1 overflow-hidden relative min-h-0">
        {/* Model Selector & Telemetry Header */}
        <div className="flex justify-between items-center py-3 px-4 shrink-0 bg-[#0a0a0a]/90 backdrop-blur z-20 w-full gap-2 border-b border-[#1a1a1a] sticky top-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="px-3 py-2 text-gray-300 hover:text-white rounded-lg border border-[#444] hover:bg-[#222] hover:border-[#555] transition-all shrink-0 flex items-center gap-2 shadow-sm font-bold text-[11px] tracking-widest uppercase focus:ring-2 focus:ring-purple-500/50"
              title="Toggle Quantum Chat Sidebar"
            >
              <Menu className="w-4 h-4 text-purple-400" />
              <span>SESSIONS</span>
            </button>
            <div className="flex items-center gap-2 select-none">
              <div className="w-6 h-6 rounded border border-emerald-500/50 bg-emerald-900/20 flex items-center justify-center">
                <Orbit className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-bold text-[11px] tracking-[0.25em] uppercase text-emerald-400 font-mono hidden sm:block">
                OUROBOROS ENGINE // LOCAL COGNITIVE SWARM
              </span>
            </div>
          </div>

          {/* Visual Daemon Status Indicator (Telemetry) */}
          <div className="flex gap-2 items-center">
            {/* Actuator Status Indicator */}
             {!isMinimized && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black text-[10px] font-mono select-none cursor-pointer hover:opacity-80 transition-opacity ${
                  bridgeStatus === "online" 
                    ? isSimulated ? "border-cyan-500/30 hover:border-cyan-400/50" : "border-emerald-500/30 hover:border-emerald-400/50"
                    : "border-red-500/30 hover:border-red-400/50"
                }`}
                onClick={() => {
                  if (bridgeStatus === "offline") {
                    toggleSimulation();
                  } else {
                    const confirmSim = window.confirm(
                      isSimulated 
                        ? "Simulation Bridge is active. Would you like to Turn Off Simulation and search for physical hardware?"
                        : "Physical Hardware Connection active. Would you like to Minimize this pill?"
                    );
                    if (confirmSim) {
                      if (isSimulated) {
                        toggleSimulation();
                      } else {
                        setIsMinimized(true);
                      }
                    }
                  }
                }}
                title={
                  bridgeStatus === "online" 
                    ? isSimulated ? "Simulated Bridge Active. Click to disconnect." : "Hardware Actuator Status Online. Click to control."
                    : "Bridge Offline. Click to toggle Simulation Mode."
                }
              >
                {bridgeStatus === "online" ? (
                  <>
                    <span className={`w-2 h-2 rounded-full ${isSimulated ? "bg-cyan-500 animate-pulse" : "bg-emerald-500"} inline-block`} />
                    <span className={`${isSimulated ? "text-cyan-400" : "text-emerald-400"} uppercase tracking-widest font-bold`}>
                      {isSimulated ? "BRIDGE SIMU" : "BRIDGE ONLINE"}
                      {batteryLevel !== null
                        ? ` | BAT: ${Math.round(batteryLevel * 100)}%`
                        : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
                    <span className="text-red-400 uppercase tracking-widest font-bold hover:underline">
                      Bridge Offline (Click to Simulate)
                    </span>
                  </>
                )}
              </div>
            )}
            {isMinimized && (
              <button
                onClick={() => setIsMinimized(false)}
                className={`w-6 h-6 rounded-full border ${bridgeStatus === "online" ? "bg-emerald-900/30 border-emerald-500/50" : "bg-red-900/30 border-red-500/50"} flex items-center justify-center`}
                title="Expand Bridge Status"
              >
                <Radio
                  className={`w-3 h-3 ${bridgeStatus === "online" ? "text-emerald-400" : "text-red-400"}`}
                />
              </button>
            )}
            <button
              onClick={() => {
                if (isDaemonActive) {
                  stopDaemon();
                } else {
                  startDaemon();
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black text-[10px] font-mono select-none transition-all cursor-pointer ${isDaemonActive ? 'border-purple-500/50 hover:bg-purple-900/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-[#222] hover:border-gray-500'}`}
              title="Toggle Background Daemon (Wakelock)"
            >
              {isComputing ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                  <span className="text-amber-400 font-bold uppercase tracking-widest animate-pulse">
                    DAEMON COGNITION
                  </span>
                </>
              ) : activeModelString?.includes("fable-5") || activeModelString?.includes("mythos-5") ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_8px_#d946ef] inline-block" />
                  <span className="text-fuchsia-400 font-bold uppercase tracking-[0.2em] animate-pulse drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">
                    MYTHOS CLASS
                  </span>
                </>
              ) : ingestLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span className="text-indigo-400 font-bold uppercase tracking-widest">
                    INGESTIN: {ingestLoading}
                  </span>
                </>
              ) : isDaemonActive ? (
                <>
                  <Activity className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span className="text-purple-400 font-bold uppercase tracking-widest">
                    HARDWARE DAEMON: ACTIVE
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span className="text-emerald-400 uppercase tracking-widest">
                    DAEMON: ALIGNED
                  </span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowTermuxGuide(!showTermuxGuide)}
              className="p-1.5 ml-2 rounded-lg bg-black hover:bg-[#222] border border-[#333] hover:border-blue-500/50 transition-colors"
              title="Termux & Actuator Quick Reference Guide"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Termux Guide Modal */}
        <AnimatePresence>
          {showTermuxGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 bg-[#0a0a0a] border-b border-[#222] overflow-hidden"
            >
              <div className="bg-[#111] border border-[#333] p-4 rounded-xl flex gap-6 text-xs text-gray-300 font-mono overflow-x-auto">
                <div className="flex-1 min-w-[280px]">
                  <h4 className="text-blue-400 uppercase tracking-widest font-bold mb-2">
                    1. Hardware Actuator Daemon
                  </h4>
                  <p className="mb-2 text-gray-400">
                    Keep the physical bridge running in background to execute{" "}
                    <code>Run on Hardware</code> blocks.
                  </p>
                  <pre className="bg-black p-2 rounded border border-[#222] text-amber-500 mb-2 whitespace-pre-wrap break-words">
                    npm install express cors{"\n"}
                    node actuator.js
                  </pre>
                  <p className="text-[10px] text-gray-500">
                    Wait for "Hardware Actuator online on local port 9999". Keep
                    Termux tab alive or use PM2.
                  </p>
                </div>

                <div className="flex-1 min-w-[280px]">
                  <h4 className="text-purple-400 uppercase tracking-widest font-bold mb-2">
                    2. Termux Resource Locks
                  </h4>
                  <p className="mb-2 text-gray-400">
                    Prevent Android from terminating the daemon while app is
                    backgrounded.
                  </p>
                  <pre className="bg-black p-2 rounded border border-[#222] text-amber-500 mb-2 whitespace-pre-wrap break-words">
                    termux-wake-lock{"\n"}
                    npm install -g pm2{"\n"}
                    pm2 start actuator.js --name "nexus-bridge"{"\n"}
                    pm2 status
                  </pre>
                  <p className="text-[10px] text-gray-500">
                    View real-time logs with: <code>pm2 logs nexus-bridge</code>
                  </p>
                </div>

                <div className="flex-1 min-w-[280px]">
                  <h4 className="text-emerald-400 uppercase tracking-widest font-bold mb-2">
                    3. Railway Failsafe Logic
                  </h4>
                  <p className="mb-2 text-gray-400">
                    Link your physical node directly to your cloud execution
                    infrastructure.
                  </p>
                  <pre className="bg-black p-2 rounded border border-[#222] text-amber-500 mb-2 whitespace-pre-wrap break-words">
                    pkg install nodejs git -y{"\n"}
                    npm install -g @railway/cli{"\n"}
                    railway login --browserless{"\n"}
                    railway link 7470a1
                  </pre>
                  <p className="text-[10px] text-gray-500">
                    Restart the daemon: <code>railway restart</code> | View
                    Logs: <code>railway logs</code>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 relative z-0"
          onScroll={handleScroll}
        >
          {loadingOlder && (
            <div className="text-center py-2 text-xs text-gray-500 font-mono animate-pulse">
              Loading older vectors...
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              key={msg.id}
              className={`flex gap-4 max-w-[95%] md:max-w-[85%] group ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === "user" ? "bg-blue-600" : "bg-gray-800"}`}
              >
                {msg.role === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-gray-200" />
                )}
              </div>

              <div
                className={`flex flex-col relative flex-1 min-w-0 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {msg.role === "armada" && msg.nodeUsed && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs text-gray-500 font-medium">
                      {msg.nodeUsed} Model
                    </div>
                  </div>
                )}
                {msg.role === "user" && msg.intent && (
                  <div className="mb-2">
                    <IntentBadge intent={msg.intent} />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-full">
                  {msg.toolCalls &&
                    msg.toolCalls.length > 0 &&
                    msg.role === "armada" && (
                      <KineticExecutionHUD tools={msg.toolCalls} />
                    )}
                  {msg.role === "user" && msg.intent === "deploy" && (
                    <OmniStrikeHUD command={msg.content} />
                  )}
                  {/* Render mediaUrls if present */}
                  {msg.mediaUrls &&
                    msg.mediaUrls.map((url, mediaIdx) => (
                      <div
                        key={mediaIdx}
                        className="mb-3 rounded-xl overflow-hidden border border-[#333] inline-block"
                      >
                        {url.startsWith("data:video") ||
                        url.endsWith(".mp4") ? (
                          <video
                            src={url}
                            controls
                            className="max-w-full max-h-80 object-contain bg-black"
                          />
                        ) : (
                          <img
                            src={url}
                            alt="Generated Media"
                            className="max-w-full max-h-80 object-contain bg-black"
                          />
                        )}
                        {url.startsWith("data:image") && (
                          <div className="bg-[#111] p-2 flex justify-end border-t border-[#333]">
                            <motion.a
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 10,
                              }}
                              href={url}
                              download="Generated_Construct.png"
                              className="text-xs text-cyan-300 font-semibold px-4 py-1.5 bg-cyan-900/40 border border-cyan-500/50 rounded shadow-[0_0_8px_rgba(34,211,238,0.3)] hover:bg-cyan-800/60 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all flex items-center gap-2"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              Save to Device
                            </motion.a>
                          </div>
                        )}
                      </div>
                    ))}
                  {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 justify-end">
                      {msg.attachedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex gap-2 p-2 bg-[#222] border border-[#333] rounded-lg items-center"
                        >
                          {f.type.startsWith("image/") ? (
                            <img
                              src={f.base64}
                              alt={f.name}
                              className="w-10 h-10 object-cover rounded bg-black"
                            />
                          ) : (
                            <Paperclip className="w-5 h-5 text-gray-400" />
                          )}
                          <span className="text-[10px] text-gray-300 font-mono truncate max-w-[120px]">
                            {f.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed max-w-full overflow-hidden ${
                      msg.role === "user"
                        ? "bg-[#262626] text-white rounded-tr-sm"
                        : "text-gray-100 bg-transparent"
                    }`}
                    style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
                  >
                    {msg.content.includes("FORGE STATUS") || msg.content.includes("INITIALIZING FORGE") ? (
                      <div className="flex flex-col gap-3 p-4 rounded-xl border bg-[#050505] shadow-[0_0_15px_rgba(0,0,0,0.5)] font-mono text-sm relative overflow-hidden">
                        {msg.content.includes("COMPLETED") ? (
                          <>
                            <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
                            <div className="border border-emerald-500/50 bg-emerald-950/40 p-3 rounded-lg flex flex-col gap-2 relative z-10">
                              <span className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Check className="w-5 h-5 text-emerald-400" />
                                OMNI-FORGE COMPILATION COMPLETE
                              </span>
                              <div className="text-emerald-200/70 text-xs break-words">
                                {msg.content.split("\n\nResult: ")[1] || "All target code logic surgically injected into live file. Real-time Bannon runtime has been updated."}
                              </div>
                              <button 
                                onClick={() => { console.log("Reload requested but blocked."); }} 
                                className="mt-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-widest rounded transition-colors w-max"
                              >
                                Reload Workspace
                              </button>
                            </div>
                          </>
                        ) : msg.content.includes("FAILED") ? (
                          <div className="border border-red-500/50 bg-red-950/40 p-3 rounded-lg flex flex-col gap-2">
                            <span className="text-red-400 font-bold uppercase tracking-widest flex items-center gap-2">
                              <X className="w-5 h-5" />
                              OMNI-FORGE COMPILATION FAILED
                            </span>
                            <div className="text-red-300 text-xs break-words whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          <div className="border border-cyan-500/40 bg-cyan-950/20 p-3 rounded-lg flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-5 h-5 animate-pulse" />
                                OMNI-FORGE SURGICAL COMPILER ACTIVE
                              </span>
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            </div>
                            <div className="text-cyan-200/80 text-xs flex gap-2 items-center">
                                <div className="h-1 flex-1 bg-cyan-950 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-400 animate-pulse w-full origin-left shrink-0" />
                                </div>
                                <span className="shrink-0">{msg.content.match(/\((.*?)\)/)?.[0] || '...'}</span>
                            </div>
                            <div className="text-cyan-500/60 text-[10px] uppercase truncate">
                              {msg.content.split('\n')[0]}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : msg.role === "armada" && msg.content.includes("new CANNON.Body") ? (
                      <div className="flex flex-col gap-4">
                        <div className="break-words max-w-full whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        <SpatialSandbox
                          codePayload={extractCodeBlock(msg.content)}
                        />
                      </div>
                    ) : (
                      <div className="break-words max-w-full whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          const thoughtRegex =
                            /<(?:thought_matrix|quantum_thought)>([\s\S]*?)<\/(?:thought_matrix|quantum_thought)>/;
                          const match = msg.content.match(thoughtRegex);

                          let thoughtContent = null;
                          let cleanText = msg.content;

                          if (match) {
                            thoughtContent = match[1].trim();
                            cleanText = msg.content
                              .replace(thoughtRegex, "")
                              .trim();
                          }

                          return (
                            <div className="flex flex-col gap-4">
                              {thoughtContent && (
                                <ThoughtAccordion content={thoughtContent} />
                              )}
                              {cleanText
                                .split(/(<(?:quantumArtifact|bannon_artifact)\s+id="[^"]*"\s+type="[^"]*"\s+title="[^"]*"[^>]*>[\s\S]*?<\/(?:quantumArtifact|bannon_artifact)>|```(?:html|js|javascript|ts|typescript|threejs|json|css|bash|sh|md|python)[\s\S]*?```)/gi)
                                .map((part, idx) => {
                                  if (!part) return null;

                                  // Handle Ouroboros <quantumArtifact> tags
                                  const artifactMatch = part.match(/<quantumArtifact\s+id="([^"]*)"\s+type="([^"]*)"\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/quantumArtifact>/i);
                                  if (artifactMatch) {
                                    const [, id, type, title, content] = artifactMatch;
                                    const langMap: Record<string, string> = {
                                      'text/html': 'html',
                                      'application/javascript': 'js',
                                      'application/json': 'json',
                                      'text/css': 'css'
                                    };
                                    return (
                                      <div className="w-full flex flex-col gap-2 mb-4" key={idx}>
                                        <div className="text-xs text-emerald-400 opacity-80 uppercase tracking-widest font-bold font-mono">
                                          [Attached Artifact: {title}]
                                        </div>
                                        <ArtifactBlock 
                                          codeContent={content.trim()} 
                                          language={langMap[type] || 'text'} 
                                          filename={id} 
                                          onApply={(code) => handleSend(`/forge Surgically apply this implementation logic directly into the active file structure:\n\n\`\`\`${langMap[type] || 'text'}\n${code}\n\`\`\``)}
                                        />
                                      </div>
                                    );
                                  }

                                  const bannonMatch = part.match(/<bannon_artifact\s+id="([^"]*)"\s+type="([^"]*)"\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/bannon_artifact>/i);
                                  if (bannonMatch) {
                                    const [, id, type, title, content] = bannonMatch;
                                    return (
                                      <div style={{ border: '1px solid #ff7a1a', padding: '12px', margin: '10px 0', borderRadius: '6px', background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} key={idx}>
                                        <div><span style={{ color: '#ff7a1a', marginRight: '8px' }}>[ARTIFACT]</span> {title}</div>
                                        <button 
                                          onClick={() => {
                                              const blob = new Blob([content.trim()], { type: type || 'text/html' });
                                              const url = window.URL.createObjectURL(blob);
                                              const a = document.createElement("a");
                                              a.href = url;
                                              a.download = id + ".html";
                                              a.click();
                                              window.URL.revokeObjectURL(url);
                                          }}
                                          style={{ background: '#ff7a1a', color: '#000', padding: '6px 12px', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                                        >
                                          DOWNLOAD
                                        </button>
                                      </div>
                                    );
                                  }

                                  if (part.startsWith('```') && !part.startsWith('```bash') && !part.startsWith('```sh') && !part.startsWith('```\n')) {
                                    const match = part.match(/```(\w+)\n?([\s\S]*?)```/i);
                                    if (match) {
                                      const lang = match[1] || 'text';
                                      const code = match[2].trim();
                                      return (
                                        <div className="flex flex-col gap-3 w-full" key={idx}>
                                          <div className="break-words max-w-full whitespace-pre-wrap leading-relaxed text-gray-200">
                                            {cleanText.split(part)[0]}
                                          </div>
                                          <ArtifactBlock 
                                            codeContent={code} 
                                            language={lang} 
                                            onApply={(code) => handleSend(`/forge Surgically apply this implementation logic directly into the active file structure:\n\n\`\`\`${lang}\n${code}\n\`\`\``)}
                                          />
                                        </div>
                                      );
                                    }
                                  }
                                  if (part.startsWith("```")) {
                                    const isBash = part.startsWith("```bash") || part.startsWith("```sh");
                                    if (isBash) {
                                      const command = part
                                        .replace(/```(?:bash|sh)|```/g, "")
                                        .trim();
                                      return (
                                        <div
                                          key={idx}
                                          className="my-2 border border-zinc-800 bg-black rounded p-2 text-left"
                                        >
                                          <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-2">
                                            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                                              BASH VECTOR BLOCK
                                            </span>
                                            <button
                                              onClick={async () => {
                                                try {
                                                  setIngestFileStatus &&
                                                    setIngestFileStatus(
                                                      "Routing block to Actuator...",
                                                    );
                                                  const out =
                                                    await runSingleCommand(
                                                      command,
                                                    );
                                                  if (
                                                    out &&
                                                    (out.includes("Error") ||
                                                      out.includes("Exception") ||
                                                      out.includes("error:"))
                                                  ) {
                                                    if (navigator.vibrate)
                                                      navigator.vibrate([
                                                        50, 50, 50, 50, 50,
                                                      ]); // Sharp dissonant pulse for errors
                                                    setIngestFileStatus &&
                                                      setIngestFileStatus(
                                                        "Actuator execution failed (Syntax error)",
                                                      );
                                                    const healMessage = `HARDWARE EXECUTION FAULT DETECTED:\nCommand: ${command}\nDiagnostics: ${out}\nAnalyze the syntax and output a corrected code block vector.`;
                                                    handleSend(healMessage);
                                                  } else {
                                                    setIngestFileStatus &&
                                                      setIngestFileStatus(
                                                        "Actuator execution successful",
                                                      );
                                                    if (navigator.vibrate)
                                                      navigator.vibrate([
                                                        200, 100, 200,
                                                      ]);
                                                  }
                                                } catch (e) {
                                                  setIngestFileStatus &&
                                                    setIngestFileStatus(
                                                      "Actuator node unreachable",
                                                    );
                                                }
                                                setTimeout(
                                                  () =>
                                                    setIngestFileStatus &&
                                                    setIngestFileStatus(null),
                                                  3000,
                                                );
                                              }}
                                              className="text-[10px] px-2 py-0.5 bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold hover:bg-emerald-900 transition-colors uppercase cursor-pointer"
                                              title="Execute directly on your Termux node"
                                            >
                                              RUN ON HARDWARE
                                            </button>
                                          </div>
                                          <pre className="text-[11px] text-emerald-500 font-mono overflow-x-hidden whitespace-pre-wrap break-words m-0 p-0 bg-transparent">
                                            <code>{command}</code>
                                          </pre>
                                        </div>
                                      );
                                    }
                                  }
                                  return <span key={idx} className="whitespace-pre-wrap break-words">{part}</span>;
                                })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <CopyButton text={msg.content} showLabel={true} />

                    {msg.role === "armada" && msg.content.includes("```") && (
                      <div className="flex flex-wrap gap-2 relative z-50 pointer-events-auto mt-2">
                        <button
                          onClick={() => {
                            const code = extractCodeBlock(msg.content);
                            if (setProjectFiles) {
                              const targetFile = code.includes("Fighter") || code.includes("CANVAS") || code.includes("ast/mutate") ? "/public/library/BANNON_SWARM_BUILDER_v47.html" : "/App.tsx";
                              setProjectFiles((prev) => ({
                                ...prev,
                                [targetFile]: code,
                              }));
                            }
                            setIngestFileStatus &&
                              setIngestFileStatus(
                                `Successfully synched code back to Forge Sandbox!`,
                              );
                            setTimeout(
                              () =>
                                setIngestFileStatus &&
                                setIngestFileStatus(null),
                              3000,
                            );
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-indigo-400 bg-indigo-900/20 border border-indigo-500/30 hover:bg-indigo-900/40 hover:text-indigo-300 rounded-md transition-all cursor-pointer font-mono"
                          title="Sync Code Block directly to active file inside Forge Studio"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Sync to Forge</span>
                        </button>
                        <button
                          onClick={async () => {
                            const code = extractCodeBlock(msg.content);
                            try {
                              setIngestFileStatus &&
                                setIngestFileStatus("Routing to Actuator...");
                              await runSingleCommand(code);
                              setIngestFileStatus &&
                                setIngestFileStatus(
                                  "Actuator execution successful",
                                );
                            } catch (e) {
                              setIngestFileStatus &&
                                setIngestFileStatus(
                                  "Actuator execution failed",
                                );
                            }
                            setTimeout(
                              () =>
                                setIngestFileStatus &&
                                setIngestFileStatus(null),
                              3000,
                            );
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-500/30 hover:bg-emerald-900/40 hover:text-emerald-300 rounded-md transition-all cursor-pointer font-mono"
                          title="Run this block on your local Motorola Node via Termux Actuator"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Run on Hardware</span>
                        </button>
                        <button
                          onClick={() => {
                            const code = extractCodeBlock(msg.content);
                            const isHtml = code.toLowerCase().includes('<!doctype html>') || code.toLowerCase().includes('<html');
                            const ext = isHtml ? 'html' : 'txt';
                            const blob = new Blob([code], { type: isHtml ? "text/html" : "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `iteration_artifact_${Date.now()}.${ext}`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-cyan-400 bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-900/40 hover:text-cyan-300 rounded-md transition-all cursor-pointer font-mono"
                          title="Download the code chunk directly to your device"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          <span>Download Artifact</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isComputing && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 max-w-[95%] md:max-w-[85%] mr-auto"
            >
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4 text-gray-400" />
              </div>
              <div className="px-5 py-3 text-gray-400 italic">Thinking...</div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#0a0a0a] border-t border-[#1a1a1a] shrink-0 w-full z-20 pb-safe md:pb-4 sticky bottom-0">
          <div className="w-full relative">
            <div className="mb-2 flex items-center justify-between relative">
              <div className="flex items-center">
                <button
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 font-mono hover:text-gray-200 transition-colors bg-[#111] border border-[#222] px-2 py-1 rounded-md"
                >
                  <span>{activeProvider.name}</span>
                  {activeModelString && (
                    <span className="text-gray-500">[{activeModelString}]</span>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {modelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-0 mb-1 w-64 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto"
                    >
                      {PROVIDERS.map((p) => (
                        <div
                          key={p.id}
                          className="border-b border-[#222] last:border-0"
                        >
                          <button
                            className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors flex flex-col hover:bg-[#222] ${activeProvider.id === p.id ? "text-indigo-400" : "text-gray-400"}`}
                            onClick={() => {
                              setActiveProvider(p);
                              setModelDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{p.name}</span>
                              {activeProvider.id === p.id && (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                            {p.endpoint && (
                              <span className="text-[9px] text-gray-600 block mt-0.5">
                                {p.endpoint}
                              </span>
                            )}
                          </button>
                          {activeProvider.id === p.id && (
                            <div className="bg-[#111] px-2 py-1 flex flex-wrap gap-1">
                              {(p.id === 'ouroboros_local' ? LOCAL_SWARM_MODELS.map(m => m.id) : p.models || []).map((m) => {
                                const displayName = p.id === 'ouroboros_local' ? LOCAL_SWARM_MODELS.find(x => x.id === m)?.name : m;
                                return (
                                <button
                                  key={m}
                                  onClick={() => {
                                    setActiveModelString(m);
                                    setModelDropdownOpen(false);
                                  }}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border ${activeModelString === m ? "bg-indigo-900 border-indigo-500 text-indigo-200" : "bg-[#222] border-[#333] text-gray-500 hover:text-gray-300"}`}
                                >
                                  {displayName}
                                </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setUseTaxonomy(!useTaxonomy)}
                  className={`ml-2 flex items-center gap-1.5 text-[10px] font-mono transition-colors border px-2 py-1 rounded-md uppercase tracking-widest ${useTaxonomy ? "bg-purple-900/40 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]" : "bg-[#111] text-gray-500 border-[#222] hover:text-gray-400 hover:border-[#333]"}`}
                  title="Force 4-Layer Taxonomy Response"
                >
                  <Orbit
                    className={`w-3 h-3 ${useTaxonomy ? "animate-spin-slow" : ""}`}
                  />
                  Omni-Taxonomy Force
                </button>
              </div>

              <div className="text-[10px] font-mono text-cyan-500/70 border border-cyan-900/30 bg-cyan-900/10 px-2 py-1 rounded uppercase tracking-[0.2em] animate-pulse">
                Omni-Compiler Target: Ready
              </div>
            </div>

            <div 
              className={`relative bg-[#1a1a1a] rounded-2xl border ${isDragOver ? 'border-blue-500 bg-[#1e2025]' : 'border-[#333]'} shadow-lg flex flex-col p-2 focus-within:border-blue-500/50 transition-colors duration-200`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const ev = { target: { files: e.dataTransfer.files } };
                  handleFileUpload(ev as any);
                }
              }}
            >
              {isDragOver && (
                <div className="absolute inset-0 z-50 bg-blue-500/10 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-widest font-bold shadow-lg shadow-blue-500/20">
                    Drop to Attach Context
                  </div>
                </div>
              )}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1">
                  {attachedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-[#222] border border-[#333] rounded-lg p-1.5 relative group"
                    >
                      {f.type.startsWith("image/") ? (
                        <img
                          src={f.base64}
                          alt={f.name}
                          className="w-8 h-8 object-cover rounded bg-black"
                        />
                      ) : (
                        <Paperclip className="w-4 h-4 text-gray-400 ml-1" />
                      )}
                      <span className="text-[10px] text-gray-300 font-mono truncate max-w-[100px]">
                        {f.name}
                      </span>
                      {f.type.startsWith("image/") && (
                        <button
                          onClick={() => {
                            setInput(`/generate-3d Construct a highly detailed GLB/Tripo 3D model base using this context visual. Activate Kiri Engine parameters for structural integrity.`);
                          }}
                          className="px-2 py-0.5 ml-1 bg-fuchsia-900/30 border border-fuchsia-500/50 hover:bg-fuchsia-900/60 rounded text-[9px] text-fuchsia-300 font-mono font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                          title="Generate 3D Model (Tripo / Kiri Engine)"
                        >
                          <Box className="w-3 h-3" />
                          3D
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  className="text-gray-400 hover:text-white p-3 rounded-xl transition-colors hover:bg-[#333] shrink-0 mb-1"
                  title="Attach Files"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="w-5 h-5" />
                </button>
                <textarea
                  className="w-full bg-transparent text-white px-3 py-3 max-h-48 min-h-[56px] focus:outline-none resize-none"
                  placeholder="Message your OS..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  onPaste={(e) => {
                    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                      e.preventDefault();
                      const ev = { target: { files: e.clipboardData.files } };
                      handleFileUpload(ev as any);
                    }
                  }}
                  rows={
                    input.split("\n").length > 1
                      ? Math.min(input.split("\n").length, 5)
                      : 1
                  }
                />
                <div className="flex items-center gap-1 mb-1 mr-1">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={handleCameraUpload}
                    className="hidden"
                  />
                  <button
                    className="text-gray-400 hover:text-white p-2 rounded-xl transition-colors hover:bg-[#333]"
                    title="Upload Media (Vision)"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button
                    className={`p-2 rounded-xl transition-colors z-20 hover:bg-[#333] ${isRecording ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-white"}`}
                    title="Voice Input (Hearing)"
                    onClick={toggleRecording}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={
                      (!input.trim() && attachedFiles.length === 0) ||
                      isRecording ||
                      isComputing
                    }
                    className="bg-white hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-700 text-black p-3 rounded-xl transition-colors flex-shrink-0 ml-1"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 mt-2 flex justify-center items-center gap-2">
              The AI can make mistakes. Consider verifying important
              information.
            </div>
          </div>
        </div>
      </div>
      <ASTVisualizer />
    </div>
  );
}
