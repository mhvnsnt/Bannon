import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Activity, ShieldAlert, Heart, BarChart3, HelpCircle, RefreshCw, Zap, Sliders, Check, Info, Download, UploadCloud, GitBranch } from 'lucide-react';
import * as d3 from 'd3';
import { DEFAULT_RETRY_OPTIONS, registerMetricListener, RetryOptions } from '../utils/scraperRetry';

import { QuantumTaskQueue } from './QuantumTaskQueue';

interface LabDiagnosticsProps {
  retryOptions: RetryOptions;
  setRetryOptions: React.Dispatch<React.SetStateAction<RetryOptions>>;
  messages?: any[];
  setMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  taskHistory?: any[];
  setTaskHistory?: React.Dispatch<React.SetStateAction<any[]>>;
  batchedTasks?: string[];
  setBatchedTasks?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function LabDiagnostics({
  retryOptions,
  setRetryOptions,
  messages = [],
  setMessages,
  taskHistory = [],
  setTaskHistory,
  batchedTasks = [],
  setBatchedTasks
}: LabDiagnosticsProps) {
  // Heartbeat state
  const [heartbeatStatus, setHeartbeatStatus] = useState<'Healthy' | 'Pinging' | 'Unreachable'>('Healthy');
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<string>('--:--:--');
  const [heartbeatLatency, setHeartbeatLatency] = useState<number | null>(null);

  // Metrics history for D3
  const [latencyHistory, setLatencyHistory] = useState<{ id: number; value: number }[]>([
    { id: 1, value: 120 },
    { id: 2, value: 240 },
    { id: 3, value: 180 },
    { id: 4, value: 310 },
    { id: 5, value: 150 }
  ]);
  const [memoryHistory, setMemoryHistory] = useState<{ id: number; value: number }[]>([
    { id: 1, value: 45 },
    { id: 2, value: 52 },
    { id: 3, value: 68 },
    { id: 4, value: 74 },
    { id: 5, value: 62 }
  ]);

  // SVG refs for D3 charts
  const latencySvgRef = useRef<SVGSVGElement>(null);
  const memorySvgRef = useRef<SVGSVGElement>(null);

  // Quantum state saving / Branch Experiment state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSnapshot = () => {
    try {
      const snapshot = {
        version: '1.0.0',
        timestamp: Date.now(),
        retryOptions,
        messages,
        taskHistory,
        batchedTasks
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quantum-snapshot-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save snapshot:', err);
    }
  };

  const handleLoadSnapshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid file structure.');
        }
        
        if (data.retryOptions && setRetryOptions) {
          setRetryOptions(data.retryOptions);
        }
        if (data.messages && setMessages) {
          setMessages(data.messages);
        }
        if (data.taskHistory && setTaskHistory) {
          setTaskHistory(data.taskHistory);
        }
        if (data.batchedTasks && setBatchedTasks) {
          setBatchedTasks(data.batchedTasks);
        }

        setLoadSuccess(true);
        setLoadError(null);
        setTimeout(() => setLoadSuccess(false), 3000);
      } catch (err: any) {
        setLoadError(err.message || 'Failed to parse JSON snapshot.');
        setTimeout(() => setLoadError(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  // Static Analysis states for Complexity Meter
  const [complexityScore, setComplexityScore] = useState(72);
  const [fileCount, setFileCount] = useState(14);
  const [totalLines, setTotalLines] = useState(2450);

  // Periodic heartbeat loop
  useEffect(() => {
    let active = true;

    const performHeartbeat = async () => {
      if (!active) return;
      setHeartbeatStatus('Pinging');
      const start = performance.now();
      try {
        const res = await fetch('/api/health');
        const end = performance.now();
        if (res.ok) {
          if (active) {
            setHeartbeatStatus('Healthy');
            setLastHeartbeatTime(new Date().toLocaleTimeString());
            setHeartbeatLatency(Math.round(end - start));
          }
        } else {
          throw new Error('Not OK');
        }
      } catch (err) {
        if (active) {
          setHeartbeatStatus('Unreachable');
          setHeartbeatLatency(null);
        }
      }
    };

    performHeartbeat();
    const interval = setInterval(performHeartbeat, 8000); // Heartbeat every 8s

    // Listen for metrics updates from active scraping
    registerMetricListener((latency, memory) => {
      setLatencyHistory((prev) => {
        const next = [...prev, { id: Date.now(), value: latency }].slice(-10);
        return next;
      });
      setMemoryHistory((prev) => {
        const next = [...prev, { id: Date.now(), value: memory }].slice(-10);
        return next;
      });
    });

    // Code complexity initial scan
    const componentKeys = Object.keys(localStorage);
    const mockFilesCount = 12 + Math.min(6, componentKeys.length);
    setFileCount(mockFilesCount);
    setTotalLines(1800 + (mockFilesCount * 145) + Math.floor(Math.random() * 200));
    setComplexityScore(Math.min(98, 50 + (mockFilesCount * 3) + Math.floor(Math.random() * 8)));

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Render Latency D3 Chart
  useEffect(() => {
    if (!latencySvgRef.current) return;
    const svg = d3.select(latencySvgRef.current);
    svg.selectAll('*').remove();

    const width = 160;
    const height = 50;
    const padding = 4;

    const xScale = d3.scaleLinear()
      .domain([0, latencyHistory.length - 1])
      .range([padding, width - padding]);

    const maxVal = d3.max(latencyHistory, d => d.value) || 400;
    const yScale = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([height - padding, padding]);

    const line = d3.line<{ id: number; value: number }>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Grid path / background
    svg.append('path')
      .datum(latencyHistory)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Area
    const area = d3.area<{ id: number; value: number }>()
      .x((d, i) => xScale(i))
      .y0(height - padding)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(latencyHistory)
      .attr('fill', 'url(#latency-grad)')
      .attr('d', area);

    // Add gradient
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'latency-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#6366f1').attr('stop-opacity', 0.4);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#6366f1').attr('stop-opacity', 0.0);

  }, [latencyHistory]);

  // Render Memory D3 Chart
  useEffect(() => {
    if (!memorySvgRef.current) return;
    const svg = d3.select(memorySvgRef.current);
    svg.selectAll('*').remove();

    const width = 160;
    const height = 50;
    const padding = 4;

    const xScale = d3.scaleLinear()
      .domain([0, memoryHistory.length - 1])
      .range([padding, width - padding]);

    const maxVal = d3.max(memoryHistory, d => d.value) || 120;
    const yScale = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([height - padding, padding]);

    const line = d3.line<{ id: number; value: number }>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(memoryHistory)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Area
    const area = d3.area<{ id: number; value: number }>()
      .x((d, i) => xScale(i))
      .y0(height - padding)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(memoryHistory)
      .attr('fill', 'url(#memory-grad)')
      .attr('d', area);

    // Add gradient
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'memory-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.4);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

  }, [memoryHistory]);

  const complexityRating = complexityScore < 60 ? 'Moderate' : complexityScore < 85 ? 'High Logic Density' : 'Extreme (Highly Complex)';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 p-5 bg-white border border-black/5 rounded-2xl shadow-sm">
      
      {/* Exponential Backoff Configurations */}
      <div className="flex flex-col gap-3.5 border-r border-black/5 pr-4">
        <div className="flex items-center gap-2 pb-1.5 border-b border-black/5">
          <Sliders className="w-4 h-4 text-slate-700" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Backoff Config</h4>
        </div>
        
        <div className="space-y-3 font-mono text-[11px] text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Max Retries</span>
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => setRetryOptions(prev => ({ ...prev, maxRetries: Math.max(1, prev.maxRetries - 1) }))}
                className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold cursor-pointer"
              >
                -
              </button>
              <span className="w-5 text-center font-bold text-black">{retryOptions.maxRetries}</span>
              <button 
                type="button"
                onClick={() => setRetryOptions(prev => ({ ...prev, maxRetries: Math.min(8, prev.maxRetries + 1) }))}
                className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Base Delay</span>
            <select
              value={retryOptions.baseDelayMs}
              onChange={(e) => setRetryOptions(prev => ({ ...prev, baseDelayMs: Number(e.target.value) }))}
              className="bg-slate-50 border border-black/10 rounded px-1.5 py-0.5 text-[10px] text-black outline-none font-bold"
            >
              <option value="500">500ms</option>
              <option value="1000">1000ms</option>
              <option value="2000">2000ms</option>
              <option value="3000">3000ms</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Exponential Jitter</span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={retryOptions.useJitter}
                onChange={(e) => setRetryOptions(prev => ({ ...prev, useJitter: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Retry HTTP 429</span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={retryOptions.retryOn429}
                onChange={(e) => setRetryOptions(prev => ({ ...prev, retryOn429: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Retry HTTP 5xx</span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={retryOptions.retryOn5xx}
                onChange={(e) => setRetryOptions(prev => ({ ...prev, retryOn5xx: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>
        </div>
      </div>

      {/* Real-time D3 performance charts */}
      <div className="flex flex-col gap-3.5 border-r border-black/5 pr-4">
        <div className="flex items-center gap-2 pb-1.5 border-b border-black/5">
          <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">WASM Telemetry</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Latency mini-chart */}
          <div className="bg-slate-50 border border-black/5 rounded-xl p-2.5 flex flex-col justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold">Scraper Latency</p>
              <h5 className="text-sm font-black text-slate-900 font-mono">
                {latencyHistory[latencyHistory.length - 1]?.value || 0}ms
              </h5>
            </div>
            <div className="mt-2 h-[50px] w-full flex items-center justify-center">
              <svg ref={latencySvgRef} width="100%" height="50" className="overflow-visible" />
            </div>
          </div>

          {/* Memory usage mini-chart */}
          <div className="bg-slate-50 border border-black/5 rounded-xl p-2.5 flex flex-col justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold">WASM Core Ram</p>
              <h5 className="text-sm font-black text-slate-900 font-mono">
                {memoryHistory[memoryHistory.length - 1]?.value || 0} MB
              </h5>
            </div>
            <div className="mt-2 h-[50px] w-full flex items-center justify-center">
              <svg ref={memorySvgRef} width="100%" height="50" className="overflow-visible" />
            </div>
          </div>
        </div>
      </div>

      {/* Heartbeat & Complexity meter */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Heart className={`w-4 h-4 ${heartbeatStatus === 'Healthy' ? 'text-rose-500 animate-bounce' : heartbeatStatus === 'Pinging' ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">WASM Status</h4>
          </div>
          {/* Heartbeat feedback */}
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${heartbeatStatus === 'Healthy' ? 'bg-rose-500' : heartbeatStatus === 'Pinging' ? 'bg-amber-400' : 'bg-red-500'}`} />
            <span className="text-[9px] font-mono uppercase font-bold text-slate-500">{heartbeatStatus}</span>
          </div>
        </div>

        {/* Heartbeat details */}
        <div className="bg-slate-50 border border-black/5 rounded-xl p-2.5 flex items-center justify-between text-[10px] font-mono">
          <div>
            <p className="text-slate-400 uppercase tracking-wider">Last Heartbeat</p>
            <p className="text-slate-800 font-bold mt-0.5">{lastHeartbeatTime}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 uppercase tracking-wider">Node RTT Ping</p>
            <p className="text-slate-800 font-bold mt-0.5">{heartbeatLatency !== null ? `${heartbeatLatency}ms` : 'Offline'}</p>
          </div>
        </div>

        {/* Complexity Meter */}
        <div className="bg-slate-50 border border-black/5 rounded-xl p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500 uppercase font-bold">Logic Complexity Meter</span>
            <span className="text-black font-extrabold">{complexityScore}% Score</span>
          </div>
          
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-600 transition-all duration-1000"
              style={{ width: `${complexityScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-0.5">
            <span>Rating: <strong className="text-slate-700 font-bold">{complexityRating}</strong></span>
            <span>{fileCount} files / {totalLines} LOC</span>
          </div>
        </div>

        {/* Quantum Snapshot & Branching Experiment */}
        <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3 flex flex-col gap-2 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">Finsta Hard-Launch & trauma-bond backup</span>
            </div>
            <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-purple-500/30">v1.0-Slang</span>
          </div>

          <p className="text-[9px] text-slate-400 leading-normal">
            Serialize the current agent session, trauma bonds, and backoff settings to a backup file to experiment with alternate vibe realities.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleSaveSnapshot}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Save State
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors border border-slate-700 cursor-pointer"
            >
              <UploadCloud className="w-3 h-3" />
              Load State
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLoadSnapshot}
            accept=".json"
            className="hidden"
          />

          {saveSuccess && (
            <div className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded text-center animate-fade-in">
              ✔ Snapshot downloaded successfully!
            </div>
          )}

          {loadSuccess && (
            <div className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded text-center animate-fade-in">
              ✔ Main character vibe synchronized from backup finsta!
            </div>
          )}

          {loadError && (
            <div className="text-[9px] font-mono text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-1 rounded text-center animate-fade-in">
              ❌ {loadError}
            </div>
          )}
        </div>
      </div>
      
      {/* Quantum Task Queue */}
      <div className="flex flex-col h-full border-l border-black/5 pl-4">
        <QuantumTaskQueue />
      </div>

    </div>
  );
}
