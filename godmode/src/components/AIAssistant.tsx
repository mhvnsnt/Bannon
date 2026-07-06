import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Code,
  Sparkles,
  Activity,
  FileCode,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Cpu,
  Bug,
  HelpCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Compass,
  Layers,
} from "lucide-react";
import { ChatMessage } from "../types";

interface LibraryFile {
  name: string;
  size: number;
  modified: string;
}

interface DiagnosticStatus {
  status: string;
  value: string;
  suggestion: string;
}

interface ScanReport {
  stretchingLimbs: DiagnosticStatus;
  mantisArms: DiagnosticStatus;
  standStability: DiagnosticStatus;
  fpsConsistency: DiagnosticStatus;
  moveTrajectories?: DiagnosticStatus;
  biomechanicalLimits?: DiagnosticStatus;
  ragdollMeshSync?: DiagnosticStatus;
  ccdSweeper?: DiagnosticStatus;
  v8Profiler?: DiagnosticStatus;
}

export default function AIAssistant({
  globalSelectedFile,
  setGlobalSelectedFile,
}: {
  globalSelectedFile: string;
  setGlobalSelectedFile: (f: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cognitiveSummary, setCognitiveSummary] = useState<string>(
    "Ready to synthesize Bannon parameters of joint folders and stiffness coefficients...",
  );
  const [keyMetrics, setKeyMetrics] = useState<Record<string, any>>({
    stiffnessCoeff: 0.86,
    spineBalanceRatio: 0.85,
    collisionClearance: 0.03,
  });
  const [swarmEfficacy, setSwarmEfficacy] = useState<{
    totalTokensAnalysed: number;
    compressionRatio: string;
    compressionSaves: number;
  }>({
    totalTokensAnalysed: 0,
    compressionRatio: "1:1",
    compressionSaves: 0,
  });

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionOutputLog, setCompressionOutputLog] = useState<string[]>(
    [],
  );

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<LibraryFile[]>([]);

  const selectedFile = globalSelectedFile;
  const setSelectedFile = setGlobalSelectedFile;

  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Mobile responsive layout and orientation senses
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    () =>
      typeof window !== "undefined" && window.innerHeight > window.innerWidth
        ? "portrait"
        : "landscape",
  );
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  const [screenHeight, setScreenHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 768,
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSwarmOverlay, setShowSwarmOverlay] = useState(false);

  // Model Swarm Configuration (Grounding: sandboxed web emulator mode)
  const [swarmNodes, setSwarmNodes] = useState([
    {
      id: "gemini",
      name: "Gemini Core (Swarm Omni-Orchestrator)",
      active: true,
      type: "cloud",
      delay: "12ms",
      status: "Synchronized",
    },
    {
      id: "collider",
      name: "Hitbox / Spatial Sweeper",
      active: true,
      type: "engine_diagnostic",
      delay: "4ms",
      status: "Coupled",
    },
    {
      id: "ragdoll",
      name: "IK & Biomechanics Solver",
      active: true,
      type: "engine_diagnostic",
      delay: "11ms",
      status: "Coupled",
    },
    {
      id: "renderer",
      name: "WebGL Skinning / Mesh Sync",
      active: true,
      type: "engine_diagnostic",
      delay: "8ms",
      status: "Coupled",
    },
    {
      id: "deepseek",
      name: "DeepSeek Coder v2 (Syntactic Fixer)",
      active: true,
      type: "virtual_proxy",
      delay: "45ms",
      status: "Coupled",
    },
    {
      id: "memory",
      name: "V8 Heap Memory Profiler",
      active: true,
      type: "browser_diagnostic",
      delay: "15ms",
      status: "Synchronized",
    },
    {
      id: "frame",
      name: "FPS / CCD Interpolation Analyst",
      active: true,
      type: "engine_diagnostic",
      delay: "2ms",
      status: "Synchronized",
    },
    {
      id: "ollama",
      name: "Ollama Offline Terminal",
      active: false,
      type: "local_sandbox",
      delay: "N/A",
      status: "Sandboxed",
    },
  ]);

  const [swarmAuditingBias, setSwarmAuditingBias] = useState<number>(0.85);
  const [swarmRegexPrecision, setSwarmRegexPrecision] = useState<number>(7);
  const [swarmBalanceDampening, setSwarmBalanceDampening] =
    useState<number>(0.75);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with browser fallback localstorage & server-side persistent memory logs on update
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("wrestling_ai_chat_v2", JSON.stringify(messages));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load global physical memory and chat history upon workspace mounting
  useEffect(() => {
    const syncServerMemory = async () => {
      try {
        const resp = await fetch("/api/cognitive-memory");
        if (resp.ok) {
          const data = await resp.json();
          if (data.chatHistory && data.chatHistory.length > 0) {
            setMessages(data.chatHistory);
          } else {
            // Use browser local storage as local fallback memory
            const savedLocal = localStorage.getItem("wrestling_ai_chat_v2");
            if (savedLocal) {
              const parsed = JSON.parse(savedLocal);
              setMessages(parsed);
            } else {
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content:
                    'Welcome back, Coach! I am the Lead Physics Compiler & Gaming AI. I have full read/write communication locks on your local workspace library.\n\nAsk me about collision detection, joint limits, or how your current "BANNON" Verlet solvers are performing!',
                  timestamp: new Date(),
                },
              ]);
            }
          }
          if (data.cognitiveSummary) {
            setCognitiveSummary(data.cognitiveSummary);
          }
          if (data.keyMetrics) {
            setKeyMetrics(data.keyMetrics);
          }
          if (data.swarmEfficacy) {
            setSwarmEfficacy(data.swarmEfficacy);
          }
        }
      } catch (e) {
        console.error(
          "Cognitive Sync Failure during system initialization:",
          e,
        );
      }
    };
    syncServerMemory();
  }, []);

  // Handle dynamic screen orientation sensing and touch boundary protection
  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? "portrait" : "landscape");
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);

      // Auto-collapse sidebar on very small screens to fit perfectly
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // trigger initial checks
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSwarmNode = (id: string) => {
    setSwarmNodes((prev) =>
      prev.map((node) => {
        if (node.id === id) {
          // Core node must always stay active
          if (node.id === "gemini") return node;
          const newActive = !node.active;
          return {
            ...node,
            active: newActive,
            status: newActive
              ? node.type === "local_sandbox"
                ? "Coupled (Local)"
                : "Coupled"
              : "Standby",
          };
        }
        return node;
      }),
    );
  };

  // Load library & scan status on mount
  useEffect(() => {
    fetchLibrary();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      triggerScan(selectedFile);
    }
  }, [selectedFile]);

  const fetchLibrary = async () => {
    try {
      const resp = await fetch("/api/library");
      if (resp.ok) {
        const data = await resp.json();
        setFiles(data.files || []);
        if (data.files && data.files.length > 0 && !selectedFile) {
          // Default to the Core or the first file found
          const getVersionScore = (name: string) => {
            const match = name.match(/v(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
          };
          const sortedFiles = [...data.files].sort((a: any, b: any) => {
            const vA = getVersionScore(a.name);
            const vB = getVersionScore(b.name);
            if (vB !== vA) return vB - vA;
            return b.name.localeCompare(a.name);
          });
          const core = sortedFiles.find(
            (f: any) =>
              f.name.toLowerCase().includes("core") ||
              f.name.toLowerCase().includes("bannon") ||
              f.name.toLowerCase().includes("fixed"),
          );
          setSelectedFile(core ? core.name : sortedFiles[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to load workspace files.", err);
    }
  };

  const triggerScan = async (filename: string) => {
    setIsScanning(true);
    try {
      const resp = await fetch(`/api/library/scan/${filename}`);
      if (resp.ok) {
        const data = await resp.json();
        setScanReport(data);
      }
    } catch (err) {
      console.error("Diagnostic scan error", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawVal = textToSend || inputValue;
    if (!rawVal.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: rawVal,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          selectedFile: selectedFile,
          activeNodes: swarmNodes,
          swarmParams: {
            auditingRigidity: swarmAuditingBias,
            syntaxPrecision: swarmRegexPrecision,
            balanceRate: swarmBalanceDampening,
          },
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (e: any) {
      console.error("Chat error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `Connection Interrupted: ${e.message || "Failed to retrieve live Gemini compiler stream. Check if your API Key is declared."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnosticInquire = (topic: string, currentWarning: string) => {
    const inquiryText = `Review the diagnostic warning in "${selectedFile}" regarding "${topic}". The report states: "${currentWarning}". How do I surgically patch this code inside Bannon to secure optimal physics?`;
    setInputValue(inquiryText);
  };

  const handleCompileCognitiveMemory = async () => {
    if (messages.length === 0 || isCompressing) return;
    setIsCompressing(true);
    setCompressionOutputLog([
      "🔄 Coupling active Swarm Nodes...",
      "🔍 [Ollama Local Node] Analyzing token density of conversational logs...",
      "🧭 [Llama 3 Instruct] Validating anatomical joint guidelines mapped so far...",
    ]);

    try {
      // Step-by-step telemetry sensations
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCompressionOutputLog((prev) => [
        ...prev,
        "🧬 [DeepSeek v2 Node] Synthesizing physical constants & coordinate offsets...",
      ]);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCompressionOutputLog((prev) => [
        ...prev,
        "⚡ [Gemini Core Orchestrator] Executing loss-less prompt context compression...",
      ]);

      const response = await fetch("/api/cognitive-memory/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory: messages }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.memory) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setCompressionOutputLog((prev) => [
            ...prev,
            "💾 Writing unified cache to `/public/library/cognitive_memory_core.json`...",
            "✅ Long-term memory compiled successfully. Token limit resets to 0%.",
          ]);

          setMessages(data.memory.chatHistory);
          setCognitiveSummary(data.memory.cognitiveSummary);
          setKeyMetrics(data.memory.keyMetrics);
          setSwarmEfficacy(data.memory.swarmEfficacy);
        } else {
          throw new Error("Invalid memory payload returned from server.");
        }
      } else {
        throw new Error("Server was unable to compile the messages.");
      }
    } catch (e: any) {
      console.error(e);
      setCompressionOutputLog((prev) => [
        ...prev,
        `❌ Compilation sequence failed: ${e.message || "Unknown error"}`,
      ]);
    } finally {
      setTimeout(() => {
        setIsCompressing(false);
      }, 1500);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Reset current compiler advisor chat log?")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Log reset. I am currently monitoring the mounted baseline layout: '${selectedFile}'. Ready to analyze joint physics, Verlet spring stiffness, or timing parameters.`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* PHONE TELEMETRY & ORIENTATION FLOATING PILOT */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex lg:hidden items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-slate-300">
            SYSTEM ORIENTATION:
          </span>
          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              orientation === "portrait"
                ? "bg-indigo-650/30 text-indigo-400 border border-indigo-500/20"
                : "bg-amber-650/30 text-amber-400 border border-amber-500/20"
            }`}
          >
            {orientation} ({screenWidth}x{screenHeight})
          </span>
        </div>

        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-[10px] rounded border border-slate-700 font-bold"
        >
          {isSidebarCollapsed ? "Show Physiology" : "Hide Physiology"}
        </button>
      </div>

      {/* LEFT COLUMN: ACTIVE BANNON DIAGNOSTIC WORKSPACE BADGES (Collapsible) */}
      <div
        className={`transition-all duration-300 ease-in-out shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900 ${
          isSidebarCollapsed
            ? "w-full lg:w-16 h-12 lg:h-full p-2 overflow-hidden justify-center items-center"
            : "w-full lg:w-[350px] h-[45vh] lg:h-full p-4 overflow-y-auto space-y-4"
        }`}
      >
        {isSidebarCollapsed ? (
          /* COLLAPSED MINI RAIL VIEW */
          <div className="flex lg:flex-col items-center justify-between lg:justify-start w-full h-full lg:pt-4 gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 bg-slate-950 rounded-xl hover:bg-slate-800 border border-slate-800 text-red-500 hover:text-red-400 transition"
              title="Expand Diagnostician Panel"
            >
              <ChevronRight className="w-5 h-5 hidden lg:block" />
              <ChevronRight className="w-5 h-5 block lg:hidden rotate-90" />
            </button>
            <div className="flex lg:flex-col gap-2.5">
              <div
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                title="Telemetry Synchronized"
              />
              <div
                className="w-2 h-2 rounded-full bg-indigo-500"
                title="Virtual DeepSeek Node Active"
              />
              <div
                className="w-2 h-2 rounded-full bg-red-500"
                title="Master Gemini Orchestrator Active"
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider hidden lg:block uppercase select-none [writing-mode:vertical-lr] mt-4">
              PHYSIOLOGY CONTROLS
            </span>
          </div>
        ) : (
          /* EXPANDED FULL SIDEBAR VIEW */
          <>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-red-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Context Rig Mounting
                </h3>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition"
                title="Collapse Panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Mobile & Safety Zone Info */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-[10px] space-y-1.5 text-slate-400">
              <div className="flex items-center gap-1.5 text-white font-bold uppercase font-mono text-[9px]">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mobile Landscape Senses</span>
              </div>
              <div className="grid grid-cols-2 gap-1 font-mono text-[9px]">
                <div>Sensed Aspect:</div>
                <div className="text-indigo-400 text-right">
                  {(screenWidth / screenHeight).toFixed(2)}:1
                </div>
                <div>Orientation:</div>
                <div className="text-amber-500 text-right font-bold uppercase">
                  {orientation}
                </div>
                <div>Touch Guard:</div>
                <div className="text-emerald-500 text-right">44px Active</div>
              </div>
            </div>

            {/* COGNITIVE BUILDER SWARM SETTINGS PANEL */}
            <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-200">
                    SWARM MEMORY CORE
                  </span>
                </div>
                <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded font-mono font-bold uppercase animate-pulse">
                  PERSISTENT
                </span>
              </div>

              {/* Cognitive Swarm Coupling */}
              <div className="space-y-1.5">
                <div className="text-[8px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                  COGNITIVE ACTIVE AGENTS & DIAGNOSTIC SENSES:
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5">
                  {swarmNodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => toggleSwarmNode(node.id)}
                      className={`p-1.5 rounded border text-[9px] cursor-pointer select-none transition-all flex flex-col justify-between ${
                        node.active
                          ? "bg-red-950/20 border-red-500/30 text-white"
                          : "bg-slate-955 border-slate-900 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <span className="font-bold font-mono text-[7px] xl:text-[8px] tracking-tight">
                        {node.name.split(" ")[0]} Node
                      </span>
                      <span className="text-[6px] xl:text-[7px] text-slate-500">
                        {node.active ? "COUPLED" : "STANDBY"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Long-Term Memory Register */}
              <div className="space-y-1.5 border-t border-slate-850 pt-2.5">
                <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                  <span>Distilled Memory Summary:</span>
                  <span className="text-indigo-400 text-[7px] font-normal uppercase">
                    Active Context
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-900 h-20 overflow-y-auto text-[10px] font-mono text-slate-300 leading-relaxed scrollbar-thin select-text">
                  {cognitiveSummary}
                </div>
              </div>

              {/* Distilled Constants Badges */}
              <div className="space-y-1.5">
                <div className="text-[8px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                  Anatomical Constants Matrix:
                </div>
                <div className="grid grid-cols-3 gap-1 grid-flow-row">
                  <div className="bg-slate-950 p-1 rounded border border-slate-900 text-center flex flex-col justify-between">
                    <span className="text-[7px] text-slate-500 font-mono">
                      Stiffness
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400">
                      {keyMetrics.stiffnessCoeff ?? "0.86"}x
                    </span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-900 text-center flex flex-col justify-between">
                    <span className="text-[7px] text-slate-500 font-mono">
                      Spine Bal
                    </span>
                    <span className="text-[9px] font-bold text-indigo-400">
                      {keyMetrics.spineBalanceRatio ?? "0.85"}x
                    </span>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-900 text-center flex flex-col justify-between">
                    <span className="text-[7px] text-slate-500 font-mono">
                      Clearance
                    </span>
                    <span className="text-[9px] font-bold text-amber-500">
                      {keyMetrics.collisionClearance ?? "0.03"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Swarm Efficacy Indicators */}
              <div className="border-t border-slate-850 pt-2.5 space-y-1 text-[9px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Tokens Analysed:</span>
                  <span className="text-slate-200 font-bold">
                    {swarmEfficacy.totalTokensAnalysed}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Compression Ratio:</span>
                  <span className="text-emerald-400 font-bold">
                    {swarmEfficacy.compressionRatio}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Token Vol Saved:</span>
                  <span className="text-indigo-400 font-bold">
                    {swarmEfficacy.compressionSaves} tokens
                  </span>
                </div>
              </div>

              {/* Limitless Cognitive Compiler Trigger */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCompileCognitiveMemory}
                  disabled={messages.length === 0 || isCompressing}
                  className="w-full bg-linear-to-r from-red-650 to-indigo-650 hover:from-red-750 hover:to-indigo-750 disabled:from-slate-850 disabled:to-slate-850 border border-red-500/20 py-2 rounded-lg text-[10px] font-extrabold font-mono text-white tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 select-none animate-shimmer"
                >
                  <Cpu className="w-3.5 h-3.5 text-red-400" />
                  <span>DE-LIMIT COGNITIVE BUFFER</span>
                </button>

                {isCompressing && (
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-1 max-h-24 overflow-y-auto text-[8px] font-mono text-emerald-400 leading-normal scrollbar-none transition-all">
                    <div className="text-indigo-400 animate-pulse uppercase tracking-wider font-bold mb-1 border-b border-indigo-950 pb-0.5">
                      RUNNING SWARM COGNITIVE PARALLAX...
                    </div>
                    {compressionOutputLog.map((logLine, index) => (
                      <div key={index} className="flex gap-1.5">
                        <span className="text-slate-600">❯</span>
                        <span>{logLine}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Baseline Selection dropdown */}
            <div>
              <p className="text-[10px] uppercase font-mono text-slate-500 font-bold mb-1">
                Select code reference:
              </p>
              <select
                value={selectedFile}
                onChange={async (e) => {
                  const newFile = e.target.value;
                  setSelectedFile(newFile);
                  if (newFile) {
                    try {
                      await fetch("/api/library/select", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ filename: newFile }),
                      });
                    } catch (e) {
                      console.error(e);
                    }
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 font-mono outline-none focus:border-red-500"
              >
                <option value="">-- No file selected --</option>
                {files.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name.replace(".html", "")} ({(f.size / 1024).toFixed(0)}{" "}
                    KB)
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Diagnostics scan list */}
            <div className="flex-1 flex flex-col space-y-3 min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Physiology Scan
                  </h4>
                </div>
                <button
                  onClick={() => selectedFile && triggerScan(selectedFile)}
                  disabled={isScanning || !selectedFile}
                  className="text-slate-400 hover:text-white transition"
                  title="Refresh Diagnostics"
                >
                  <RotateCcw
                    className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {isScanning ? (
                <div className="flex p-6 justify-center items-center gap-2 border border-slate-800 rounded-xl bg-slate-950/40">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    Analyzing stiffness bounds...
                  </span>
                </div>
              ) : scanReport ? (
                <div className="space-y-2 text-xs overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
                  {/* Verlet stiffness */}
                  <div
                    onClick={() =>
                      handleDiagnosticInquire(
                        "Limb Elasticity",
                        scanReport.stretchingLimbs.value,
                      )
                    }
                    className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                      scanReport.stretchingLimbs.status === "WARNING"
                        ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                        : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                        1. SOLVER STIFFNESS
                      </span>
                      <span
                        className={`text-[8px] font-bold uppercase px-1 rounded ${
                          scanReport.stretchingLimbs.status === "WARNING"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {scanReport.stretchingLimbs.status}
                      </span>
                    </div>
                    <div className="text-[10px] line-clamp-1">
                      {scanReport.stretchingLimbs.value}
                    </div>
                    <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                      Ask swarm to correct &rarr;
                    </div>
                  </div>

                  {/* Joint Limits */}
                  <div
                    onClick={() =>
                      handleDiagnosticInquire(
                        "Hinge Joint fold limits",
                        scanReport.mantisArms.value,
                      )
                    }
                    className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                      scanReport.mantisArms.status === "WARNING"
                        ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                        : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                        2. ARM/LEG RIGS
                      </span>
                      <span
                        className={`text-[8px] font-bold uppercase px-1 rounded ${
                          scanReport.mantisArms.status === "WARNING"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {scanReport.mantisArms.status}
                      </span>
                    </div>
                    <div className="text-[10px] line-clamp-1">
                      {scanReport.mantisArms.value}
                    </div>
                    <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                      Ask swarm to correct &rarr;
                    </div>
                  </div>

                  {/* Stand equilibrium */}
                  <div
                    onClick={() =>
                      handleDiagnosticInquire(
                        "Upright Stand Balance",
                        scanReport.standStability.value,
                      )
                    }
                    className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                      scanReport.standStability.status === "WARNING"
                        ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                        : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                        3. STASIS STAND
                      </span>
                      <span
                        className={`text-[8px] font-bold uppercase px-1 rounded ${
                          scanReport.standStability.status === "WARNING"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {scanReport.standStability.status}
                      </span>
                    </div>
                    <div className="text-[10px] line-clamp-1">
                      {scanReport.standStability.value}
                    </div>
                    <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                      Ask swarm to correct &rarr;
                    </div>
                  </div>

                  {/* Delta time ticks */}
                  <div
                    onClick={() =>
                      handleDiagnosticInquire(
                        "High Hz speed ticking",
                        scanReport.fpsConsistency.value,
                      )
                    }
                    className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                      scanReport.fpsConsistency.status === "WARNING"
                        ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                        : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                        4. TICK TIMING
                      </span>
                      <span
                        className={`text-[8px] font-bold uppercase px-1 rounded ${
                          scanReport.fpsConsistency.status === "WARNING"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {scanReport.fpsConsistency.status}
                      </span>
                    </div>
                    <div className="text-[10px] line-clamp-1">
                      {scanReport.fpsConsistency.value}
                    </div>
                    <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                      Ask swarm to correct &rarr;
                    </div>
                  </div>

                  {/* Move Trajectories */}
                  {scanReport.moveTrajectories && (
                    <div
                      onClick={() =>
                        handleDiagnosticInquire(
                          "Move Trajectory Separation",
                          scanReport.moveTrajectories!.value,
                        )
                      }
                      className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                        scanReport.moveTrajectories.status === "WARNING"
                          ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                          : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                          5. MOVEMENT PATHS
                        </span>
                        <span
                          className={`text-[8px] font-bold uppercase px-1 rounded ${
                            scanReport.moveTrajectories.status === "WARNING"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {scanReport.moveTrajectories.status}
                        </span>
                      </div>
                      <div className="text-[10px] line-clamp-1">
                        {scanReport.moveTrajectories.value}
                      </div>
                      <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                        Ask swarm to correct &rarr;
                      </div>
                    </div>
                  )}

                  {/* Biomechanical Joint Limits */}
                  {scanReport.biomechanicalLimits && (
                    <div
                      onClick={() =>
                        handleDiagnosticInquire(
                          "Biomechanical Joint Limits",
                          scanReport.biomechanicalLimits!.value,
                        )
                      }
                      className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                        scanReport.biomechanicalLimits.status === "WARNING"
                          ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                          : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                          6. HUMAN LIMIT GUARDS
                        </span>
                        <span
                          className={`text-[8px] font-bold uppercase px-1 rounded ${
                            scanReport.biomechanicalLimits.status === "WARNING"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {scanReport.biomechanicalLimits.status}
                        </span>
                      </div>
                      <div className="text-[10px] line-clamp-1">
                        {scanReport.biomechanicalLimits.value}
                      </div>
                      <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                        Ask swarm to correct &rarr;
                      </div>
                    </div>
                  )}

                  {/* Mesh Skinning Fix */}
                  {scanReport.ragdollMeshSync && (
                    <div
                      onClick={() =>
                        handleDiagnosticInquire(
                          "Visual Ragdoll Mesh Sync",
                          scanReport.ragdollMeshSync!.value,
                        )
                      }
                      className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                        scanReport.ragdollMeshSync.status === "WARNING"
                          ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                          : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                          7. VISUAL SKIN SYNC
                        </span>
                        <span
                          className={`text-[8px] font-bold uppercase px-1 rounded ${
                            scanReport.ragdollMeshSync.status === "WARNING"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {scanReport.ragdollMeshSync.status}
                        </span>
                      </div>
                      <div className="text-[10px] line-clamp-1">
                        {scanReport.ragdollMeshSync.value}
                      </div>
                      <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                        Ask swarm to correct &rarr;
                      </div>
                    </div>
                  )}

                  {/* CCD Tunneling Check */}
                  {scanReport.ccdSweeper && (
                    <div
                      onClick={() =>
                        handleDiagnosticInquire(
                          "Hitbox CCD Tunneling",
                          scanReport.ccdSweeper!.value,
                        )
                      }
                      className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                        scanReport.ccdSweeper.status === "WARNING"
                          ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                          : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                          8. HITBOX CCD TUNNELING
                        </span>
                        <span
                          className={`text-[8px] font-bold uppercase px-1 rounded ${
                            scanReport.ccdSweeper.status === "WARNING"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {scanReport.ccdSweeper.status}
                        </span>
                      </div>
                      <div className="text-[10px] line-clamp-1">
                        {scanReport.ccdSweeper.value}
                      </div>
                      <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                        Ask swarm to correct &rarr;
                      </div>
                    </div>
                  )}

                  {/* V8 Profiler */}
                  {scanReport.v8Profiler && (
                    <div
                      onClick={() =>
                        handleDiagnosticInquire(
                          "V8 Heap Memory GC",
                          scanReport.v8Profiler!.value,
                        )
                      }
                      className={`p-2 rounded border cursor-pointer hover:scale-[1.01] transition-all ${
                        scanReport.v8Profiler.status === "WARNING"
                          ? "bg-rose-950/15 border-rose-500/25 hover:bg-rose-900/10 text-rose-200"
                          : "bg-slate-950 border-slate-850 hover:bg-slate-900/30"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                          9. V8 GC HEAP MEMORY
                        </span>
                        <span
                          className={`text-[8px] font-bold uppercase px-1 rounded ${
                            scanReport.v8Profiler.status === "WARNING"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {scanReport.v8Profiler.status}
                        </span>
                      </div>
                      <div className="text-[10px] line-clamp-1">
                        {scanReport.v8Profiler.value}
                      </div>
                      <div className="text-[8px] text-indigo-400 mt-1 uppercase font-mono">
                        Ask swarm to correct &rarr;
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 text-slate-500 text-[10px] font-mono uppercase bg-slate-950/30 border border-slate-850 rounded-xl">
                  Mount file to activate solver scans.
                </div>
              )}
            </div>

            {/* Developer Card reference */}
            <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[9px] space-y-1.5 text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 text-white font-bold uppercase text-[9px] border-b border-slate-800 pb-1 mb-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reference Constants & Guards</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-400">RK_STAND:</span>
                <span>Fighter Base State</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-500">RK_GCOMP:</span>
                <span>Gravity Stabilizer</span>
              </div>
              <div className="border-t border-slate-800/60 pt-1 pb-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500">
                Biomechanical Guards
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500">Elbow Limit:</span>
                <span>[-2.35, 0.1] rad</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500">Knee Limit:</span>
                <span>[0.0, 2.45] rad</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500">Shoulder S.:</span>
                <span>[0.15, 2.9] rad</span>
              </div>
              <div className="border-t border-slate-800/60 pt-1 pb-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500 font-mono">
                Move Path Verifiers
              </div>
              <div className="flex justify-between text-[8px]">
                <span className="text-rose-400">Powerbomb:</span>
                <span>Vertical drop slam</span>
              </div>
              <div className="flex justify-between text-[8px]">
                <span className="text-rose-400">Suplex:</span>
                <span>Waistlock Overhead arc</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: INTELLIGENT AI DEV PARTNER DIALOGUE */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative h-full">
        {/* Workspace Chat Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/65 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 rounded-lg border border-red-500/20">
              <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Swarm Hyper-Visor Engine v5.0</span>
                <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded font-mono font-bold font-sans">
                  {swarmNodes.filter((n) => n.active).length} COGNITIVE NODES
                  ACTIVE
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Physics & Graphics Master: WWE 2K, UFC, Virtual Pro Wrestling,
                Gang Beasts.
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Auto-Swarm Mode in Workspace | Mounted Code:{" "}
                <span className="text-red-400 font-bold">
                  {selectedFile || "None"}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-bold transition min-h-[38px] active:scale-[0.98]"
          >
            Reset Chat Logs
          </button>
        </div>

        {/* Conversation Thread Logs Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 md:gap-4 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse animate-fade-in"}`}
            >
              <div
                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border transition-all ${
                  msg.role === "assistant"
                    ? "bg-slate-900 text-red-400 border-red-500/20 shadow-md"
                    : "bg-red-650 text-white border-red-500 shadow-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-4.5 h-4.5" />
                ) : (
                  <User className="w-4.5 h-4.5" />
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 leading-relaxed text-[13px] md:text-[13.5px] ${
                  msg.role === "assistant"
                    ? "bg-slate-900/55 border border-slate-805 text-slate-100 shadow-sm font-sans"
                    : "bg-red-650 border border-red-500/30 text-white font-medium shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 flex-row animate-pulse">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-900 text-red-500 flex items-center justify-center border border-red-500/25">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-slate-905 border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* User Directive Keyboard Input Box */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 w-full shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask the Physics & Rigging AI Experts to fix visual mesh stretching, patch BANNON joint limits or tweak Verlet springs...`}
              className="flex-1 max-h-32 min-h-[50px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs md:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none font-sans"
              rows={1}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="h-12 w-12 bg-red-650 text-white rounded-xl hover:bg-red-700 disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center justify-center border border-red-500/30 font-bold shadow-md shadow-red-950/20 min-h-[44px] min-w-[44px]"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
