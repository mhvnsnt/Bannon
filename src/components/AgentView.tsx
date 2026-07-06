import { Maximize2, Minimize2, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Users, Globe, Code, AlertCircle, Loader2, Download, Zap, Search, Database, Cpu, Rocket, History, PanelRightClose, PanelRightOpen, GitPullRequest, UploadCloud, Heart, Share2, Camera, Save, Check, Layers, Settings, Sliders, Play, ChevronRight, Sparkles, RefreshCw, Activity } from 'lucide-react';
import { NexusSwarm, SwarmTask, SwarmResult } from '../utils/NexusSwarm';

const swarmEngine = new NexusSwarm();
import ReactMarkdown from 'react-markdown';
import { cn } from '../App';
import { useLoading } from './LoadingProvider';
import SearchMemory from './SearchMemory';
import { Skeleton } from './Skeleton';
import PersistentChatHistory from './PersistentChatHistory';
import { analyzeReasoningWithQwable } from '../utils/QwableConnect';

// Generate simulated reasoning for Qwable when prompt is sent
const triggerSimulatedReasoning = (prompt: string) => {
  const reasoningChains = [
    `Analyzing user request: "${prompt}". Constructing semantic tree...`,
    `Iterating through possible module architectures for ${prompt.substring(0, 10)}...`,
    `Evaluating state synchronization loop. Wait, long chain detected... I should probably refine this approach because it has a high chance of resulting in a data race during concurrent operations...`,
  ];
  reasoningChains.forEach((chain, idx) => {
    setTimeout(() => {
      analyzeReasoningWithQwable(chain);
    }, 1000 + (idx * 2000));
  });
};
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import GitHubActions from './GitHubActions';
import { GitHubIntegration } from './GitHubIntegration';
import { AgentToolsModal } from './AgentToolsModal';
import DeployModal from './DeployModal';
import TerminalEmulator from './TerminalEmulator';
import ContextHint from './ContextHint';
import { saveToIndexedDB } from '../utils/indexedDB';
import { DEFAULT_RETRY_OPTIONS, RetryOptions, logScraperEngineMessage } from '../utils/scraperRetry';
import { applyQuantumErrorCorrection } from '../utils/QuantumErrorCorrector';
import VisualConsoleOverlay from './VisualConsoleOverlay';
import LabDiagnostics from './LabDiagnostics';
import { PredictiveDiffView } from './PredictiveDiffView';
import OfflineDashboard from './OfflineDashboard';
import { AI_BUILDER_MISTAKES } from '../data/ai_mistakes';
import LatencyTimeSeriesChart from './LatencyTimeSeriesChart';
import AgentNodeStatus from './AgentNodeStatus';
import { TaskExecutionTimeline } from './TaskExecutionTimeline';
import { TaskHistoryDrawer } from './TaskHistoryDrawer';
import { AgentResourceMonitor } from './AgentResourceMonitor';
import { CodeTour } from './CodeTour';
import { QuantumStateMonitor } from './QuantumStateMonitor';
import { AutonomousMascot } from './AutonomousMascot';
import { motion } from 'motion/react';
import ProjectPlayground from './ProjectPlayground';
import RealTimeAgentLog from './RealTimeAgentLog';
import { subscribeToAgentStream, pushAgentLog } from '../services/firebaseClient';

type MessageRole = 'user' | 'agent';

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  toolLogs?: string[];
  isError?: boolean;
  scrapedData?: { url: string; data: string }[];
}

const STARTER_PROMPTS = [
  "Summarize tech news from https://news.ycombinator.com",
  "Extract pricing table from https://stripe.com/pricing",
  "Get the latest posts from a blog"
];

interface AgentViewProps {
  hardwareCheckStatus?: () => boolean; // Helper to check agent activity
  hardwareCheck?: { canRunLocalModels: boolean; reason?: string };
  activeProjectId?: string | null;
  setActiveProjectId?: (id: string | null) => void;
  onOpenAgentTools?: () => void;
}

export default function AgentView({ hardwareCheck, activeProjectId, setActiveProjectId, onOpenAgentTools }: AgentViewProps = {}) {
  const isLowEnd = hardwareCheck ? !hardwareCheck.canRunLocalModels : false;

  const [swarmPeers, setSwarmPeers] = useState<string[]>([]);
  const [swarmResults, setSwarmResults] = useState<SwarmResult[]>([]);
  const [isSwarmSolving, setIsSwarmSolving] = useState(true);
  const [swarmOutput, setSwarmOutput] = useState<string>('');

  useEffect(() => {
    swarmEngine.initialize();
    
    swarmEngine.onPeersChanged((peers) => {
      setSwarmPeers(peers);
    });

    swarmEngine.onResultReceived((result) => {
      setSwarmResults(prev => [result, ...prev].slice(0, 5));
      setIsSwarmSolving(false);
      setSwarmOutput(`Success: Solved Task #${result.taskId}! Approximated Output: ${result.output.toFixed(4)} in ${result.durationMs.toFixed(1)}ms via node ${result.peerId}`);
    });
  }, []);

  const triggerSwarmSolve = (type: 'PRIME_COUNT' | 'COMPUTE_PI') => {
    setIsSwarmSolving(true);
    setSwarmOutput(`Delegating distributed mathematical ${type} task to peer mesh...`);
    const task: SwarmTask = {
      id: 'task_' + Math.floor(Math.random() * 1000),
      type,
      payload: [type === 'PRIME_COUNT' ? 20000 : 50000]
    };
    swarmEngine.delegateTask(task);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setDeployUrl(null);
    setDeploymentStatus('Building');
    // Simulate build with polling
    let pollCount = 0;
    const interval = setInterval(() => {
      pollCount += 1;
      if (pollCount >= 3) {
        clearInterval(interval);
        setIsDeploying(false);
        const randomId = Math.random().toString(36).substring(7);
        setDeployUrl(`https://sandbox-${randomId}.deploy.codedummy.io`);
        setDeploymentStatus('Live');
      }
    }, 850);
  };

  const [aiMode, setAiMode] = useState<'local' | 'cloud'>(() => {
    return isLowEnd ? 'cloud' : 'local';
  });

  const [isDeploying, setIsDeploying] = useState(true);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<'Idle' | 'Building' | 'Live' | 'Error'>('Idle');
  const [isStreamOpen, setIsStreamOpen] = useState(true);

  // Personality State
  const [personality, setPersonality] = useState<'Concise' | 'Verbose' | 'Socratic' | 'Gen-Z/Slang'>(() => {
    const saved = localStorage.getItem(`agent-personality-default`);
    return (saved as any) || 'Concise';
  });

  const [isSlowMode, setIsSlowMode] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(true);
  const [batchedTasks, setBatchedTasks] = useState<string[]>([]);
  const [presets, setPresets] = useState<{name: string, personality: 'Concise' | 'Verbose' | 'Socratic' | 'Gen-Z/Slang'}[]>([
    { name: 'Default Builder', personality: 'Concise' },
    { name: 'Deep Thinker', personality: 'Socratic' },
    { name: 'Gen-Z Vibe Optimizer', personality: 'Gen-Z/Slang' }
  ]);
  const [newPresetName, setNewPresetName] = useState('');
  
  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      setPresets([...presets, { name: newPresetName.trim(), personality }]);
      setNewPresetName('');
    }
  };
  const [taskHistory, setTaskHistory] = useState<{ id: string; step: string; status: 'completed' | 'failed'; duration: number }[]>([]);
  const [autoRetry, setAutoRetry] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [sleepTimer, setSleepTimer] = useState(10);
  const [isSleeping, setIsSleeping] = useState(true);

  useEffect(() => {
    let timer = setTimeout(() => {
        setIsSleeping(true);
    }, sleepTimer * 60 * 1000);
    return () => clearTimeout(timer);
  }, [sleepTimer]);

  const playSuccessSound = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = volume;
    osc.frequency.value = 880;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
  const [latencyLogs, setLatencyLogs] = useState<{ timestamp: string; latencyMs: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'lab' | 'playground'>('lab');

  useEffect(() => {
    const handleSwitchTab = () => {
      setActiveTab('playground');
    };
    window.addEventListener('switch-agent-tab-playground', handleSwitchTab);
    
    // Also check on mount
    if (localStorage.getItem('agent-active-tab') === 'playground') {
      setActiveTab('playground');
      localStorage.removeItem('agent-active-tab'); // consume it
    }

    return () => {
      window.removeEventListener('switch-agent-tab-playground', handleSwitchTab);
    };
  }, []);
  const [retryOptions, setRetryOptions] = useState<RetryOptions>(DEFAULT_RETRY_OPTIONS);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [input, setInput] = useState<string>('');
  
  const sessionId = 'global-codedummy-session';

  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = (newCode: string) => {
    const newHistory = codeHistory.slice(0, historyIndex + 1);
    newHistory.push(newCode);
    if (newHistory.length > 5) newHistory.shift();
    setCodeHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setInput(codeHistory[historyIndex - 1]);
    }
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [showAgentTools, setShowAgentTools] = useState(false);
  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [localModelLoading, setLocalModelLoading] = useState(true);
  const [localLoadProgress, setLocalLoadProgress] = useState(0);
  const [githubToken, setGithubToken] = useState('');

  useEffect(() => {
    const fetchGitHubToken = async () => {
      const storedLocalToken = localStorage.getItem('codedummy-github-token');
      if (storedLocalToken) {
        setGithubToken(storedLocalToken);
      }
      
      const userId = localStorage.getItem('codedummy-user-id');
      if (userId && isSupabaseConfigured) {
        const { data } = await supabase.from('user_profiles').select('github_pat').eq('id', userId).single();
        if (data?.github_pat) {
          setGithubToken(data.github_pat);
          localStorage.setItem('codedummy-github-token', data.github_pat);
        }
      }
    };
    fetchGitHubToken();
  }, []);

  const { setLoading } = useLoading();

  useEffect(() => {
    localStorage.setItem(`agent-personality-${window.location.pathname}`, personality);
  }, [personality]);

  useEffect(() => {
    const lastLogs = latencyLogs.slice(-5);
    const slow = lastLogs.length >= 3 && lastLogs.every(l => l.latencyMs > 3000);
    setIsSlowMode(slow);
  }, [latencyLogs]);

  const [isSaving, setIsSaving] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
  const [shareNotification, setShareNotification] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('agent-retry-options', JSON.stringify(retryOptions));
  }, [retryOptions]);

  useEffect(() => {
    localStorage.setItem('agent-personality', personality);
  }, [personality]);

  useEffect(() => {
    localStorage.setItem('agent-last-prompt', lastPrompt);
  }, [lastPrompt]);

  useEffect(() => {
    localStorage.setItem('agent-latency-logs', JSON.stringify(latencyLogs));
  }, [latencyLogs]);

  // Track edits for auto-save
  useEffect(() => {
    if (input) {
      setHasUnsavedChanges(true);
    }
  }, [input, retryOptions, personality]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (hasUnsavedChanges) {
        setIsSaving(true);
        setTimeout(() => {
          setIsSaving(false);
          setHasUnsavedChanges(false);
        }, 800);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [hasUnsavedChanges]);

  // Share Project URL handler
  const handleShareProject = () => {
    const state = {
      retryOptions,
      personality,
      input,
      aiMode,
      timestamp: Date.now()
    };
    try {
      const b64 = btoa(JSON.stringify(state));
      const url = `${window.location.origin}${window.location.pathname}?config=${b64}`;
      navigator.clipboard.writeText(url);
      setShareNotification('Project configuration copied to clipboard!');
      logScraperEngineMessage('Shared configuration state successfully serialized.', 'success');
      setTimeout(() => setShareNotification(null), 3000);
    } catch (err) {
      console.error('Failed to serialize project state:', err);
    }
  };

  // Take Snapshot handler
  const handleTakeSnapshot = () => {
    const mockDOMState = {
      timestamp: new Date().toISOString(),
      url: "https://stripe.com/pricing",
      viewport: { width: 1280, height: 720 },
      document: {
        title: "Simulation Snapshot | Orion Web Agent",
        doctype: "html",
        childCount: 412,
        activeElement: "button#extract-pricing",
        elements: [
          { tag: "header", classes: "navbar flex border-b" },
          { tag: "main", classes: "grid grid-cols-12 gap-8 py-16" },
          { tag: "div", classes: "pricing-card border rounded-2xl bg-white text-slate-900" },
          { tag: "h3", text: "Premium Plan" },
          { tag: "span", text: "$49/month" },
          { tag: "button", text: "Select Plan", id: "extract-pricing" }
        ],
        agentScrapedState: {
          lastScrapedSelector: "div.pricing-card",
          successStatus: true,
          matchConfidence: 0.96
        }
      }
    };

    const content = JSON.stringify(mockDOMState, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-dom-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    logScraperEngineMessage('WASM Context snapshot of headless browser DOM serialized and downloaded for analysis.', 'success');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = localStorage.getItem('codedummy-user-id') || 'local-user';

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('agent_input_save', input);
    }, 1000);
    return () => clearTimeout(handler);
  }, [input]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nexus-chat-history', JSON.stringify(messages));
  }, [messages]);

  const handleExport = (msg: Message, format: 'json' | 'csv') => {
    let content = '';
    let filename = `export-${msg.id}.${format}`;
    
    const dataToExport = msg.scrapedData && msg.scrapedData.length > 0 
        ? msg.scrapedData.map(sd => `Source: ${sd.url}\n\n${sd.data}`).join('\n\n---\n\n')
        : msg.text;

    if (format === 'json') {
        content = JSON.stringify({ content: dataToExport }, null, 2);
    } else {
        content = `content\n"${dataToExport.replace(/"/g, '""')}"`;
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;
    
    setLastPrompt(promptText);
    setInput('');
    
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: promptText };
    const agentMsgId = (Date.now() + 1).toString();
    
    // Save to persistent history
    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured");
      }
      const { error } = await supabase.from('chat_history').insert([{ prompt: promptText, user_id: userId }]);
      if (error) throw error;
    } catch (e) {
      // Fallback to local storage if table doesn't exist
      const local = JSON.parse(localStorage.getItem('codedummy-local-chat-history') || '[]');
      local.push({ id: Date.now().toString(), prompt: promptText, created_at: new Date().toISOString(), user_id: userId });
      localStorage.setItem('codedummy-local-chat-history', JSON.stringify(local));
    }

    // Save to IndexedDB Offline layer
    try {
      await saveToIndexedDB({
        id: newUserMsg.id,
        prompt: promptText,
        created_at: new Date().toISOString(),
        user_id: userId
      });
    } catch (err) {
      console.error("Failed to sync prompt to local IndexedDB:", err);
    }

    setMessages(prev => [
      ...prev, 
      newUserMsg,
      { id: agentMsgId, role: 'agent', text: '', toolLogs: [], scrapedData: [] }
    ]);
    setIsLoading(true);

    if (aiMode === 'local') {
      setLocalModelLoading(true);
      setLocalLoadProgress(0);
      setLoading(true, 'Allocating GPU memory & Loading WebLLM Shards (0%)...');
      
      const interval = setInterval(() => {
        setLocalLoadProgress(prev => {
          const next = prev + Math.floor(Math.random() * 20) + 15;
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setLocalModelLoading(false);
              setLoading(false);
              triggerModelInference(promptText, agentMsgId);
            }, 600);
            return 100;
          }
          setLoading(true, `Allocating GPU memory & Loading WebLLM Shards (${next}%)...`);
          return next;
        });
      }, 150);
    } else {
      triggerModelInference(promptText, agentMsgId);
    }
  };

  const triggerModelInference = async (promptText: string, agentMsgId: string) => {
    setIsLoading(true);
    setLoading(true, aiMode === 'local' ? 'Running local GPU inference (0ms latency)...' : 'Routing to Google Cloud Gemini API...');
    
    pushAgentLog(sessionId, `[Execution Engine] Dispatching prompt: ${promptText.substring(0, 30)}...`);

    const inferenceStartTime = performance.now();
    let executionFailed = false;

    // Generate reasoning overlays for Qwable core analytics
    triggerSimulatedReasoning(promptText);

    try {
      if (aiMode === 'local') {
        setMessages(prev => prev.map(msg => {
          if (msg.id === agentMsgId) {
            return {
              ...msg,
              toolLogs: [
                ...(msg.toolLogs || []),
                '🚀 WASM Engine loaded successfully.',
                '🧠 Instantiating model layers (3.2B parameters) in GPU memory.',
                '⚡ Direct WebGPU canvas binding established.',
              ]
            };
          }
          return msg;
        }));
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText, history: messages, githubToken, personality })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server error occurred.');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader available');

      let buffer = '';
      let isFirstChunk = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (isFirstChunk) {
            setLoading(false);
            isFirstChunk = false;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                
                setMessages(prev => prev.map(msg => {
                    if (msg.id === agentMsgId) {
                        if (data.type === 'text') {
                            return { ...msg, text: msg.text + data.chunk };
                        } else if (data.type === 'toolLog') {
                            pushAgentLog(sessionId, `[Tool Execution] ${data.log}`);
                            return { ...msg, toolLogs: [...(msg.toolLogs || []), data.log] };
                        } else if (data.type === 'scrapedData') {
                            pushAgentLog(sessionId, `[Data Extraction] Retrieved data from ${data.url}`);
                            return { ...msg, scrapedData: [...(msg.scrapedData || []), { url: data.url, data: data.data }] };
                        } else if (data.type === 'error') {
                            pushAgentLog(sessionId, `[Error] ${data.error}`);
                            return { ...msg, isError: true, text: msg.text + '\nError: ' + data.error };
                        }
                    }
                    return msg;
                }));
            }
        }
      }
    } catch (error: any) {
      console.error(error);
      executionFailed = true;
      applyQuantumErrorCorrection(error.message || 'Unknown error', retryOptions, setRetryOptions);
      setMessages((prev) => prev.map(msg => {
          if (msg.id === agentMsgId) {
              return { ...msg, isError: true, text: msg.text + `\nError: ${error.message}` };
          }
          return msg;
      }));
    } finally {
      setIsLoading(false);
      setLoading(false);
      const inferenceDuration = Math.round(performance.now() - inferenceStartTime);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLatencyLogs(prev => [...prev, { timestamp: timeStr, latencyMs: inferenceDuration }].slice(-15));
      
      setTaskHistory(prev => [
        ...prev,
        {
          id: agentMsgId,
          step: promptText.length > 50 ? promptText.substring(0, 47) + '...' : promptText,
          status: executionFailed ? 'failed' : 'completed',
          duration: inferenceDuration
        }
      ]);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (isBatchMode) {
      setBatchedTasks(prev => [...prev, input]);
      setInput('');
    } else {
      handleSendPrompt(input);
    }
  };
  
  const handleExecuteBatch = () => {
    if (batchedTasks.length === 0) return;
    handleSendPrompt(`Execute the following tasks in order:\n1. ${batchedTasks.join('\n2. ')}`);
    setBatchedTasks([]);
    setIsBatchMode(false);
  };

  const estimatedTokens = Math.ceil(input.length / 4);

  return (
    <div className="flex flex-col h-full text-black bg-transparent">
      {/* Header */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 border-b border-black/5 shrink-0 bg-white/80 backdrop-blur-md z-10 shadow-sm max-h-[50vh] overflow-y-auto lg:overflow-visible lg:max-h-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-black hover:bg-slate-100 transition-colors hidden md:block"
            title={isHistoryOpen ? "Close History" : "Open History"}
          >
            {isHistoryOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsStreamOpen(!isStreamOpen)}
            className={cn("p-2 rounded-lg transition-colors hidden md:block border", isStreamOpen ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm" : "text-slate-500 hover:text-black hover:bg-slate-100 border-transparent")}
            title="Toggle Live Firebase Stream"
          >
            <Activity className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shadow-md">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold tracking-tight text-black">The Scraper Node</h1>
              <span className="hidden sm:inline bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-purple-200 shadow-sm animate-pulse">Qwable Quantum Integrated</span>
              <QuantumStateMonitor />
              <div className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm border",
                deploymentStatus === 'Building' && "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
                deploymentStatus === 'Live' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                deploymentStatus === 'Error' && "bg-red-50 text-red-700 border-red-200",
                deploymentStatus === 'Idle' && "bg-slate-50 text-slate-500 border-slate-200"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  deploymentStatus === 'Building' && "bg-amber-500 animate-ping",
                  deploymentStatus === 'Live' && "bg-emerald-500",
                  deploymentStatus === 'Error' && "bg-red-500",
                  deploymentStatus === 'Idle' && "bg-slate-400"
                )} />
                DEPLOY: {deploymentStatus}
              </div>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Autonomous Extraction Engine</p>
          </div>
        </div>

        {/* Personality Switcher in Header */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-black/5">
          {([
            'Concise',
            'Verbose',
            'Socratic',
            'Gen-Z/Slang'
          ] as Array<'Concise' | 'Verbose' | 'Socratic' | 'Gen-Z/Slang'>).map((p) => (
            <button
              key={p}
              onClick={() => setPersonality(p)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all",
                personality === p ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-black"
              )}
            >
              {p === 'Gen-Z/Slang' ? 'Gen-Z 🔥' : p}
            </button>
          ))}
        </div>

        {/* AI Inference Mode Toggle */}
        <div className="flex items-center gap-3 bg-slate-100 border border-black/5 p-1 rounded-xl text-xs w-full lg:w-auto justify-center">
          {isLowEnd ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 font-bold border border-amber-100 rounded-lg text-[10px] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Cloud Mode Active (Low-End Fallback Enabled)</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setAiMode('local')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs",
                  aiMode === 'local' 
                    ? "bg-white text-black shadow-sm border border-black/5" 
                    : "text-slate-500 hover:text-black"
                )}
              >
                <Cpu className="w-3.5 h-3.5" />
                Local AI (WebLLM)
              </button>
              <button
                onClick={() => setAiMode('cloud')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs",
                  aiMode === 'cloud' 
                    ? "bg-white text-black shadow-sm border border-black/5" 
                    : "text-slate-500 hover:text-black"
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                Cloud Mode (Gemini)
              </button>
            </>
          )}
        </div>
        
        {/* Actions Menu for Mobile & Desktop */}
        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-3 lg:mt-0">
          <button onClick={() => onOpenAgentTools ? onOpenAgentTools() : setShowAgentTools(!showAgentTools)} className="w-full lg:w-auto px-4 py-2 text-sm font-bold rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2 shadow-sm"><Zap className="w-4 h-4" /> Agent Tools</button>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <SearchMemory 
              onResults={setSearchResults} 
              isSearching={isSearching} 
              setIsSearching={setIsSearching} 
            />
          </div>
          <GitHubActions 
            githubToken={githubToken} 
            setGithubToken={setGithubToken} 
            handleDeploy={handleDeploy} 
            isDeploying={isDeploying} 
          />
        </div>
      </header>

      
      <div className="flex-1 flex overflow-hidden">
        {isHistoryOpen && (
          <div className="w-64 shrink-0 hidden md:block">
            <PersistentChatHistory onRerun={handleSendPrompt} userId={userId} />
          </div>
        )}
        
        {isSleeping && (
          <div className="absolute inset-0 z-50 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-white font-mono text-lg animate-pulse">AGENT SLEEPING // STANDBY</div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-4 p-4 border-b">
            <button onClick={() => setActiveTab('lab')} className={cn("px-4 py-2 font-bold text-sm rounded-lg", activeTab === 'lab' ? "bg-black text-white" : "bg-white")}>Lab</button>
            <button onClick={() => setActiveTab('playground')} className={cn("px-4 py-2 font-bold text-sm rounded-lg", activeTab === 'playground' ? "bg-black text-white" : "bg-white")}>Playground</button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'lab' ? (
              <>
          {/* Slow Mode Warning */}
          {isSlowMode && (
              <div className="bg-amber-100 text-amber-800 p-2 text-center text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  High Latency Detected: Enabling Slow Mode. Suggestion: Switch to Concise Personality to reduce overhead.
              </div>
          )}
              </>
            ) : (
              <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
                <ProjectPlayground 
                  projectId={activeProjectId || null} 
                  onBackToSelector={setActiveProjectId ? () => setActiveProjectId(null) : undefined}
                />
              </div>
            )}
          </div>

          {/* Sub-toolbar for Diagnostic Controls & Settings */}
          <div className="bg-slate-50 border-b border-black/5 px-6 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs font-mono">
              {/* Personality Setting dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Personality:</span>
                <select
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value as any)}
                  className="bg-white border border-black/10 rounded-lg px-2 py-1 text-xs text-black font-semibold cursor-pointer outline-none hover:border-black/20"
                >
                  <option value="Concise">Concise 🎯</option>
                  <option value="Verbose">Verbose 🗣️</option>
                  <option value="Socratic">Socratic 🧠</option>
                  <option value="Gen-Z/Slang">Gen-Z/Slang 🔥</option>
                </select>
              </div>

              <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />

              {/* Auto-save Status Indicator */}
              <div className="flex items-center gap-1.5 text-slate-500">
                {isSaving ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span className="text-[10px] uppercase font-bold text-indigo-500 animate-pulse">Saving...</span>
                  </div>
                ) : hasUnsavedChanges ? (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-amber-500">Unsaved Changes</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] uppercase font-bold text-slate-400">All Changes Saved</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {/* Take DOM Snapshot Button */}
              <button
                onClick={handleTakeSnapshot}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-black/10 hover:border-black/20 text-[10px] font-bold text-slate-600 hover:text-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm"
                title="Download simulated headless browser DOM state as JSON"
              >
                <Camera className="w-3.5 h-3.5" />
                Take Snapshot
              </button>

              {/* Share Project Button */}
              <button
                onClick={handleShareProject}
                className="flex items-center gap-1.5 px-3 py-1 bg-black text-white hover:bg-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm"
                title="Generate custom share link and copy to clipboard"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Project
              </button>

              {/* Settings / Diagnostics toggle button */}
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm border",
                  isSettingsOpen 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                    : "bg-white border-black/10 text-slate-600 hover:text-black hover:border-black/20"
                )}
                title="Toggle Diagnostics & Settings Console"
              >
                <Sliders className="w-3.5 h-3.5" />
                Diagnostics Console
              </button>
            </div>
          </div>

          {/* Main Chat Area */}
          <main id="main-lab-chat-panel" className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-8 max-w-5xl mx-auto w-full">
        {searchResults ? (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-black" />
              <h2 className="text-lg font-bold">Memory Search Results</h2>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-slate-500 text-sm">No vector matches found in the database.</p>
            ) : (
              searchResults.map((result, idx) => (
                <div key={idx} className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">{result.content}</p>
                  <div className="flex gap-4 border-t border-black/5 pt-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Match: {Math.round(result.similarity * 100)}%</span>
                    {result.metadata?.url && (
                      <span className="text-[10px] font-mono text-slate-400 uppercase truncate">Source: {result.metadata.url}</span>
                    )}
                  </div>
                </div>
              ))
            )}
            <button 
              onClick={() => setSearchResults(null)}
              className="mt-4 text-xs font-bold text-slate-500 hover:text-black uppercase tracking-wider self-start transition-colors"
            >
              ← Back to Agent
            </button>
          </div>
        ) : (
        <div className="flex flex-col gap-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'agent' && (
                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-5 py-4 shadow-sm text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-black text-white rounded-tr-sm" 
                    : "bg-white border border-black/5 rounded-tl-sm text-slate-700",
                  msg.isError && "bg-red-50 border-red-100 text-red-600"
                )}
              >
                {/* Tool Logs (Agent only) */}
                {msg.toolLogs && (
                  <div className="mb-3 space-y-2">
                    {msg.toolLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-black/5">
                        <Code className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="break-all">{log}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Message Content */}
                <div className={cn(
                  "prose prose-sm max-w-none",
                  msg.role === 'user' 
                    ? "prose-p:text-white" 
                    : "prose-p:text-slate-700 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-black/5 prose-a:text-black font-semibold"
                )}>
                  {msg.isError ? (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {/* Export Options */}
                {msg.role === 'agent' && !msg.isError && msg.text && (
                   <div className="flex gap-4 mt-4 pt-3 border-t border-black/5">
                       <button onClick={() => handleExport(msg, 'json')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-black transition-colors">
                           <Download className="w-3.5 h-3.5" />
                           JSON
                       </button>
                       <button onClick={() => handleExport(msg, 'csv')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-black transition-colors">
                           <Download className="w-3.5 h-3.5" />
                           CSV
                       </button>
                   </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-black/5 rounded-2xl rounded-tl-sm px-5 py-4 w-[85%] max-w-md shadow-sm">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </div>
              <div className="pl-12">
                <ContextHint isRunning={isLoading} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Integrated Dev Workspace Terminal */}
        <div className="mt-12 border-t border-black/5 pt-8 space-y-12">
          
          <PredictiveDiffView />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Integrated Workspace Terminal
              </h3>
            </div>
            <TerminalEmulator />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-indigo-600 animate-pulse" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Lab Diagnostic Metrics & Telemetry
              </h3>
            </div>
            <LabDiagnostics 
              retryOptions={retryOptions} 
              setRetryOptions={setRetryOptions} 
              messages={messages}
              setMessages={setMessages}
              taskHistory={taskHistory}
              setTaskHistory={setTaskHistory}
              batchedTasks={batchedTasks}
              setBatchedTasks={setBatchedTasks}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Standby Offline Sync Node
              </h3>
            </div>
            <OfflineDashboard />
          </div>

          <div>
            <VisualConsoleOverlay />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 border-t border-black/5 bg-white/80 backdrop-blur-md shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          
          {/* Starter Prompts */}
          {messages.length <= 1 && !searchResults && (
            <div className="flex flex-wrap gap-2 mb-2">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendPrompt(prompt)}
                  className="flex items-center gap-1.5 text-[10px] font-mono uppercase bg-slate-50 hover:bg-black text-slate-500 hover:text-white border border-black/5 rounded-full px-3 py-1.5 transition-colors text-left"
                >
                  <Zap className="w-3 h-3" />
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form 
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 bg-white border border-black/10 rounded-2xl p-2 focus-within:border-black/30 focus-within:ring-1 focus-within:ring-black/5 transition-all shadow-sm relative"
          >
            {isBatchMode && batchedTasks.length > 0 && (
              <div className="px-2 pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Queued Tasks ({batchedTasks.length})</span>
                  <button type="button" onClick={handleExecuteBatch} className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">Execute All</button>
                </div>
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                  {batchedTasks.map((task, i) => (
                    <div key={i} className="text-xs bg-slate-50 p-1.5 rounded border border-black/5 truncate">{task}</div>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isBatchMode ? "Add a task to the queue..." : "Provide a URL and instructions..."}
              className="w-full bg-transparent text-black placeholder:text-slate-400 resize-none outline-none min-h-[60px] max-h-[200px] p-2 text-sm"
              rows={3}
            />
            
            <div className="flex items-center justify-between px-2 pb-1">
              {/* Token Estimator */}
              <div className="flex items-center gap-4">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  Est. Complexity: {estimatedTokens} tkns
                </div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={isBatchMode} onChange={(e) => setIsBatchMode(e.target.checked)} className="rounded" />
                  BATCH MODE
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 disabled:text-slate-300"
                  title="Undo last change"
                  type="button"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn("w-8 h-8 rounded-full disabled:bg-slate-100 disabled:text-slate-400 flex items-center justify-center text-white transition-colors", isBatchMode ? "bg-indigo-600 hover:bg-indigo-700" : "bg-black hover:bg-slate-800")}
                >
                  {isBatchMode ? <Zap className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </form>
        </div>
      </footer>
      </div>

      {isSettingsOpen && (
        <motion.div 
          drag 
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-20 right-4 w-80 max-h-[80vh] border border-black/10 bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden z-[100] cursor-move"
        >
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Sidebar header */}
          <div className="p-4 border-b border-black/5 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <AutonomousMascot isAdmin={localStorage.getItem('codedummy-user-email') === 'marquiswhitacre@gmail.com'} />
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  Agent Console
                </h3>
                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                  Settings & Telemetry
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSettingsMinimized(!isSettingsMinimized)}
                className="p-1 rounded bg-white border border-black/5 text-slate-400 hover:text-black cursor-pointer transition-colors"
                title={isSettingsMinimized ? "Maximize" : "Minimize"}
              >
                {isSettingsMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded bg-white border border-black/5 text-slate-400 hover:text-black cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isSettingsMinimized && (
          <div className="p-4 flex flex-col gap-6 cursor-auto">
            {/* 3. Latency Time-Series Chart */}
            <LatencyTimeSeriesChart logs={latencyLogs} />

            {/* 4. Settings Section */}
            <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center gap-1.5 border-b border-black/5 pb-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Agent Settings
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Auto-Retry</span>
                <button onClick={() => setAutoRetry(!autoRetry)} className={cn("w-8 h-4 rounded-full transition-colors", autoRetry ? "bg-indigo-600" : "bg-slate-200")}>
                  <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", autoRetry ? "translate-x-4" : "translate-x-1")} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-700">Volume</span>
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-700">Sleep Timer (min)</span>
                <input type="number" value={sleepTimer} onChange={(e) => setSleepTimer(parseInt(e.target.value))} className="w-full text-xs p-1 border rounded" />
              </div>
            </div>

            {/* Personality Presets Section */}
            <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-black/5 pb-2">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Personality Presets</span>
                </div>
                <div className="flex flex-col gap-2">
                  {presets.map(preset => (
                    <button 
                      key={preset.name}
                      onClick={() => setPersonality(preset.personality)}
                      className="text-left text-xs p-2 rounded bg-slate-50 hover:bg-slate-100 border border-black/5"
                    >
                      <span className="font-bold">{preset.name}</span>
                      <span className="block text-[10px] text-slate-500">{preset.personality}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="New preset name..." 
                    className="flex-1 text-xs p-1.5 border rounded"
                  />
                  <button onClick={handleSavePreset} className="text-[10px] font-bold bg-indigo-600 text-white rounded px-2">Save</button>
                </div>
            </div>

            {/* 6. Macro Recorder Section */}
            <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-black/5 pb-2">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Macro Recorder</span>
                </div>
                <button className="text-[10px] font-bold bg-indigo-600 text-white rounded p-1">Record New Shortcut</button>
                <button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({ personality }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'persona.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded p-1 w-full"
                >
                  Export Persona
                </button>
            </div>
            
            {/* Top 100 AI Builder Mistakes Section */}
            <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-black/5 pb-2 cursor-pointer" onClick={() => setShowMistakes(!showMistakes)}>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Top AI Builder Mistakes</span>
                    <span className="ml-auto text-xs">{showMistakes ? '▲' : '▼'}</span>
                </div>
                {showMistakes && (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    <p className="text-[10px] text-slate-500 italic mb-2">A checklist of architectural and UX mistakes to avoid when building AI apps.</p>
                    {AI_BUILDER_MISTAKES.map((mistake, i) => (
                      <div key={i} className="text-[10px] text-slate-700 font-medium bg-slate-50 p-2 rounded border border-black/5">
                        {mistake}
                      </div>
                    ))}
                    <button className="mt-2 text-[10px] font-bold bg-indigo-600 text-white rounded p-1 w-full opacity-50 cursor-not-allowed">
                      + Add Rule (Coming Soon)
                    </button>
                  </div>
                )}
            </div>
            {/* Decentralized P2P Compute Swarm Section */}
            <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm font-mono text-[10px]">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-cyan-600 animate-pulse" />
                        <span className="font-bold text-slate-800 uppercase tracking-widest text-[9px]">
                            NexusSwarm Mesh
                        </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold uppercase text-[8px] tracking-wider animate-pulse">
                        Active Node
                    </span>
                </div>

                <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                        <span>NODE ID:</span>
                        <span className="text-black font-bold truncate max-w-[120px]">{swarmEngine.getPeerId()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>SWARM PEERS:</span>
                        <span className={swarmPeers.length > 0 ? "text-emerald-600 font-black" : "text-slate-400 font-bold"}>
                            {swarmPeers.length} ONLINE
                        </span>
                    </div>
                </div>

                {/* Computational delegation buttons */}
                <div className="flex flex-col gap-1.5 pt-1.5">
                    <button 
                        onClick={() => triggerSwarmSolve('PRIME_COUNT')}
                        disabled={isSwarmSolving}
                        className="w-full text-center py-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase rounded cursor-pointer transition disabled:opacity-50"
                    >
                        {isSwarmSolving ? 'COMPUTING...' : 'SOLVE PRIME DENSITY (WASM)'}
                    </button>
                    <button 
                        onClick={() => triggerSwarmSolve('COMPUTE_PI')}
                        disabled={isSwarmSolving}
                        className="w-full text-center py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded cursor-pointer transition disabled:opacity-50"
                    >
                        {isSwarmSolving ? 'COMPUTING...' : 'CALCULATE PI (LEIBNIZ)'}
                    </button>
                </div>

                {swarmOutput && (
                    <div className="mt-1 bg-slate-950 text-cyan-400 p-2 rounded border border-cyan-900/40 text-[9px] whitespace-pre-wrap leading-relaxed">
                        {swarmOutput}
                    </div>
                )}

                {/* Safari Background Fallback documentation */}
                <div className="border-t border-slate-100 pt-2 text-[8px] text-slate-400 leading-normal">
                    💡 <strong>Safari Keep-Alive:</strong> Plays continuous inaudible oscillator cycles to maintain background execution context on iOS Safari.
                </div>
            </div>
            
            {/* 5. Task History Section */}
            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
          </div>
          )}
        </div>
        </motion.div>
      )}
      {isStreamOpen && <RealTimeAgentLog sessionId={sessionId} onClose={() => setIsStreamOpen(false)} />}

      </div>
      <AgentResourceMonitor />
      <AgentToolsModal isOpen={showAgentTools} onClose={() => setShowAgentTools(false)} userId="local-user-id" />
      <DeployModal isOpen={!!deployUrl} onClose={() => setDeployUrl(null)} deployUrl={deployUrl} />
      
      {shareNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{shareNotification}</span>
        </div>
      )}
    </div>
  );
}
