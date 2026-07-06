import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, RotateCcw, AlertTriangle, CheckCircle, 
  Clock, Layers, Timer, FileWarning, RefreshCw, Plus, Trash2, ChevronRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PromptQueuePanel() {
  const [inputText, setInputText] = useState('');
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<any | null>(null);
  const [queueHistory, setQueueHistory] = useState<any[]>([]);
  const [activeQueues, setActiveQueues] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  // Create Options
  const [stopOnFailure, setStopOnFailure] = useState(true);
  const [validationRequired, setValidationRequired] = useState(true);
  const [delayBetweenMs, setDelayBetweenMs] = useState(2000);

  // Analysis of current raw inputText
  const [analysis, setAnalysis] = useState<{ estimatedTokens: number; estimatedTimeMinutes: number; conflicts: string[]; segments: string[] }>({
    estimatedTokens: 0,
    estimatedTimeMinutes: 0,
    conflicts: [],
    segments: []
  });

  // Calculate live analysis of text inside textarea
  useEffect(() => {
    if (!inputText.trim()) {
      setAnalysis({ estimatedTokens: 0, estimatedTimeMinutes: 0, conflicts: [], segments: [] });
      return;
    }

    // Rough segmentation logic identical to parser
    const doubleNewlines = inputText.split(/\n\n+/);
    let segments = doubleNewlines.map(s => s.trim()).filter(Boolean);
    if (segments.length <= 1) {
      const lines = inputText.split('\n');
      const detected = lines.filter(l => l.startsWith('---') || l.startsWith('===') || /^(PROMPT|Prompt|Step|STEP)/i.test(l.trim()));
      if (detected.length > 0) {
        segments = detected;
      } else {
        segments = [inputText.trim()];
      }
    }

    // Conflict detection
    const fileTargets: string[] = [];
    const fileMatches = inputText.match(/[a-zA-Z0-9_\-\.]+\.(html|tsx|ts|js|jsx)/gi);
    if (fileMatches) {
      for (const f of fileMatches) {
        const lower = f.toLowerCase();
        if (!fileTargets.includes(lower)) fileTargets.push(lower);
      }
    }

    const calculatedTime = parseFloat((segments.length * 1.5).toFixed(1));
    const calculatedTokens = Math.ceil(inputText.length / 4);

    setAnalysis({
      estimatedTokens: calculatedTokens,
      estimatedTimeMinutes: calculatedTime,
      conflicts: fileTargets.length > 2 ? [`Warning: Current queue references ${fileTargets.length} working files simultaneously. Ensure sequential steps don't overwrite concurrent changes.`] : [],
      segments
    });
  }, [inputText]);

  // Load history & state
  const loadHistories = async () => {
    try {
      const res = await fetch('/api/armada/queue/history');
      if (res.ok) {
        const data = await res.json();
        setQueueHistory(data.history || []);
      }
      
      const actRes = await fetch('/api/armada/queue/active');
      if (actRes.ok) {
        const actData = await actRes.json();
        setActiveQueues(actData.active || []);
        
        // Auto-select latest active queue if none selected
        if (!selectedQueueId && actData.active && actData.active.length > 0) {
          setSelectedQueueId(actData.active[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistories();
    const inv = setInterval(loadHistories, 6000);
    return () => clearInterval(inv);
  }, []);

  // Poll status of selected queue
  useEffect(() => {
    if (!selectedQueueId) {
      setQueueStatus(null);
      return;
    }

    let activePolling = true;
    const fetchStatus = async () => {
      if (!selectedQueueId || !activePolling) return;
      try {
        const res = await fetch(`/api/armada/queue/status/${selectedQueueId}`);
        if (res.ok) {
          const data = await res.json();
          setQueueStatus(data);
          
          // Stop polling if queue is no longer running / failed / complete
          const hasRunningPrompt = data.prompts?.some((p: any) => p.status === 'RUNNING');
          const hasPending = data.prompts?.some((p: any) => p.status === 'PENDING');
          setIsPolling(hasRunningPrompt || hasPending);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 1500);

    return () => {
      activePolling = false;
      clearInterval(intervalId);
    };
  }, [selectedQueueId, isPolling]);

  // Handle creation of queue
  const handleCreateQueue = async () => {
    if (analysis.segments.length === 0) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/armada/queue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: analysis.segments,
          options: {
            stopOnFailure,
            validationRequired,
            autoAdvance: true,
            delayBetweenMs
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedQueueId(data.queueId);
        setInputText('');
        // Immediately start execution
        await fetch('/api/armada/queue/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queueId: data.queueId })
        });
        setIsPolling(true);
        loadHistories();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  // Queue physical actions
  const handlePause = async () => {
    if (!selectedQueueId) return;
    await fetch('/api/armada/queue/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: selectedQueueId })
    });
    setIsPolling(false);
  };

  const handleResume = async () => {
    if (!selectedQueueId) return;
    await fetch('/api/armada/queue/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: selectedQueueId })
    });
    setIsPolling(true);
  };

  const handleSkip = async (position: number) => {
    if (!selectedQueueId) return;
    await fetch('/api/armada/queue/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: selectedQueueId, position })
    });
    setIsPolling(true);
  };

  const handleRetry = async (position: number) => {
    if (!selectedQueueId) return;
    await fetch('/api/armada/queue/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: selectedQueueId, position })
    });
    setIsPolling(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-7xl mx-auto text-gray-200">
      
      {/* Left panel: Queue creation & instructions */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        
        {/* Creator block */}
        <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
          
          <h3 className="font-mono text-xs uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Spatial Prompt Vectorizer
          </h3>

          <div className="mb-4">
            <label className="block text-xs font-mono text-zinc-400 mb-2">Ingest Natural Language Prompt List (Multiline / Double newline blocks)</label>
            <textarea
              className="w-full h-44 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 resize-none text-zinc-100"
              placeholder="Example:&#10;1. Update physics parameters in CombatEngine.ts to reduce float on jumps.&#10;&#10;2. Refactor HUD indicator inside stability dashboard to display current planetary transit vectors."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* Quick Stats on Current Ingest block */}
          {analysis.segments.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950/60 p-4 border border-zinc-800/80 rounded-lg mb-4 text-xs font-mono flex flex-col gap-2"
            >
              <div className="flex justify-between">
                <span className="text-zinc-500">Segments Parsed:</span>
                <span className="text-amber-400 font-bold">{analysis.segments.length} prompt(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Estimated Core Footprint:</span>
                <span className="text-zinc-300">~{analysis.estimatedTokens} tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sequence Process Time:</span>
                <span className="text-zinc-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" /> ~{analysis.estimatedTimeMinutes} min
                </span>
              </div>

              {analysis.conflicts.map((conf, ci) => (
                <div key={ci} className="mt-2 text-rose-400 border border-rose-950 bg-rose-950/20 p-2.5 rounded-md flex items-start gap-2">
                  <FileWarning className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{conf}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Execution Options */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2.5 rounded border border-zinc-800 hover:border-zinc-700 transition-colors">
              <input 
                type="checkbox" 
                checked={stopOnFailure} 
                onChange={(e) => setStopOnFailure(e.target.checked)}
                className="rounded text-amber-500 accent-amber-500 bg-zinc-900 border-zinc-800"
              />
              <span className="text-zinc-400">Strict Stop Fail</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2.5 rounded border border-zinc-800 hover:border-zinc-700 transition-colors">
              <input 
                type="checkbox" 
                checked={validationRequired} 
                onChange={(e) => setValidationRequired(e.target.checked)}
                className="rounded text-amber-500 accent-amber-500 bg-zinc-900 border-zinc-800"
              />
              <span className="text-zinc-400">Challenger Check</span>
            </label>
          </div>

          <button
            onClick={handleCreateQueue}
            disabled={isCreating || analysis.segments.length === 0}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-mono font-bold uppercase tracking-wider py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-250 cursor-pointer"
          >
            {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Generate & Execute Queue
          </button>
        </div>

        {/* History / Active Select block */}
        <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 shadow-2xl">
          <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
            <Timer className="w-4 h-4" /> Prompt Transverse Streams
          </h3>
          
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {queueHistory.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono italic">No prior queue streams recorded.</p>
            ) : (
              queueHistory.map((q) => {
                const isActive = activeQueues.includes(q.queue_id);
                const isSelected = selectedQueueId === q.queue_id;
                
                return (
                  <button
                    key={q.queue_id}
                    onClick={() => setSelectedQueueId(q.queue_id)}
                    className={`w-full text-left p-3 rounded-lg border font-mono text-xs transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'bg-amber-950/20 border-amber-800 text-amber-400' 
                        : 'bg-zinc-950/60 border-zinc-850 hover:bg-zinc-950 text-zinc-300'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[11px] truncate w-40">Queue: {q.queue_id.slice(0, 18)}...</span>
                      <span className="text-[10px] text-zinc-500">Steps: {q.total} (Success: {q.success})</span>
                    </div>
                    {isActive ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-600">{q.last_completed ? new Date(q.last_completed).toLocaleTimeString() : 'Historic'}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Right panel: Live Queue Execution Monitoring */}
      <div className="lg:col-span-7">
        <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl h-full p-5 shadow-2xl flex flex-col justify-between overflow-hidden min-h-[500px]">
          
          <div>
            <div className="flex justify-between items-center mb-5 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-mono text-sm uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Stream Controller</span>
                  {selectedQueueId && <span className="text-xs text-amber-500/80 font-normal">#{selectedQueueId.slice(0, 8)}</span>}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">Continuous synthesis vector step progression</p>
              </div>

              {selectedQueueId && queueStatus && (
                <div className="flex gap-2">
                  {queueStatus.prompts?.some((p: any) => p.status === 'RUNNING') ? (
                    <button 
                      onClick={handlePause}
                      className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 p-2 rounded-lg text-amber-500 transition-colors"
                      title="Pause Queue"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleResume}
                      className="bg-amber-500 hover:bg-amber-600 p-2 rounded-lg text-zinc-950 font-bold transition-colors"
                      title="Resume Queue"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* If no selected queue */}
            {!selectedQueueId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <Layers className="w-12 h-12 text-zinc-700 stroke-[1.25]" />
                <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-500">Idle State Active</h4>
                <p className="text-sm text-zinc-600 max-w-sm font-sans">Submit a natural language prompt block on the left panel or select a prior historical stream to monitor the autonomous transverse compiler chain.</p>
              </div>
            ) : !queueStatus ? (
              <div className="flex justify-center items-center py-20">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                
                {/* Progress Bar */}
                <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1 text-xs font-mono">
                    <span className="text-zinc-400">Compiler Convergence:</span>
                    <span className="text-amber-400 font-bold">{queueStatus.percentComplete}% ({queueStatus.completedCount}/{queueStatus.totalCount} Steps)</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2.5 relative overflow-hidden">
                    <div 
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                      style={{ width: `${queueStatus.percentComplete}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-mono">
                    <span>Last Edit: {queueStatus.lastResultSummary}</span>
                  </div>
                </div>

                {/* Steps List */}
                <h4 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mt-2">Active Sequence Pipeline (Nine Protocol Applied)</h4>
                
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {queueStatus.prompts?.map((step: any) => {
                    const isPrereqMatch = step.prerequisite_position !== null;
                    const isPreregap = isPrereqMatch ? ` (after step ${step.prerequisite_position})` : '';

                    return (
                      <div 
                        key={step.id}
                        className={`p-3 rounded-lg border font-mono text-xs flex justify-between items-start gap-4 transition-all ${
                          step.status === 'RUNNING' 
                            ? 'bg-amber-950/15 border-amber-700 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]' 
                            : step.status === 'COMPLETE' 
                            ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400' 
                            : step.status === 'FAILED'
                            ? 'bg-rose-950/15 border-rose-905 text-zinc-200'
                            : 'bg-zinc-950/10 border-zinc-900/60 text-zinc-640'
                        }`}
                      >
                        <div className="flex-1 flex gap-3">
                          <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            step.status === 'RUNNING' 
                              ? 'bg-amber-500 text-zinc-950 animate-pulse' 
                              : step.status === 'COMPLETE' 
                              ? 'bg-zinc-800 text-zinc-400' 
                              : step.status === 'FAILED'
                              ? 'bg-rose-600 text-white'
                              : 'bg-zinc-900 text-zinc-500'
                          }`}>
                            {step.position}
                          </span>
                          <div className="flex flex-col gap-1">
                            <p className="text-zinc-300 leading-relaxed max-w-lg">{step.prompt_text}</p>
                            
                            {step.error && (
                              <div className="mt-2 text-[11px] leading-relaxed text-rose-400 bg-rose-950/20 border border-rose-900/40 p-2 rounded-md">
                                <span className="font-bold">Challenger Failure Blockage:</span> {step.error}
                              </div>
                            )}

                            {step.result && step.status === 'COMPLETE' && (
                              <span className="text-[10px] text-zinc-500 text-emerald-500/80 flex items-center gap-1 mt-1">
                                <Check className="w-3.5 h-3.5" /> Compiler verification pass.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* step action options */}
                        <div className="flex gap-1.5 shrink-0 mt-0.5">
                          {step.status === 'FAILED' && (
                            <button 
                              onClick={() => handleRetry(step.position)}
                              className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 py-1 px-2.5 rounded font-bold text-[10px] text-rose-400 transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Retry
                            </button>
                          )}
                          {(step.status === 'PENDING' || step.status === 'FAILED' || step.status === 'RUNNING') && (
                            <button 
                              onClick={() => handleSkip(step.position)}
                              className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 py-1 px-2.5 rounded font-bold text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                            >
                              <SkipForward className="w-3 h-3" /> Skip
                            </button>
                          )}
                          {step.status === 'COMPLETE' && (
                            <span className="text-emerald-500 bg-emerald-950/20 border border-emerald-900/30 p-1 rounded">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>

          {/* Integration Roadmap and Status block */}
          {selectedQueueId && queueStatus && (
            <div className="mt-4 pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-500 flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span>Active Connection Bridge:</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Active Spine Link
                </span>
              </div>
              <div className="flex justify-between">
                <span>Queue State Resolver:</span>
                <span>Auto-indexing to Semantic Memory and Roadmap.</span>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
