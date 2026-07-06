import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Pause, Play, Download, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info, AlertTriangle, Brain, Zap, GitMerge, Share2 } from 'lucide-react';
import * as d3 from 'd3';
import { registerScraperLogger } from '../utils/scraperRetry';
import { cn } from '../App';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'reasoning';
  text: string;
}

export default function VisualConsoleOverlay() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeView, setActiveView] = useState<'logs' | 'reasoning'>('logs');
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [stickToBottom, setStickToBottom] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const entangleRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (activeView !== 'reasoning' || !entangleRef.current || !isExpanded) return;

    const svg = d3.select(entangleRef.current);
    svg.selectAll('*').remove();

    const width = entangleRef.current.clientWidth || 240;
    const height = entangleRef.current.clientHeight || 180;

    const nodes = [
      { id: 'parser', label: 'Semantic Parser', status: 'completed', radius: 5 },
      { id: 'query', label: 'Query Solver', status: 'completed', radius: 5 },
      { id: 'wasm', label: 'WASM Compiler', status: 'active', radius: 7 },
      { id: 'sync', label: 'Memory DB Sync', status: 'pending', radius: 5 },
      { id: 'render', label: 'HTML Render', status: 'pending', radius: 5 },
      { id: 'validate', label: 'State Validator', status: 'pending', radius: 5 }
    ];

    const links = [
      { source: 'parser', target: 'query' },
      { source: 'query', target: 'wasm' },
      { source: 'wasm', target: 'sync' },
      { source: 'sync', target: 'render' },
      { source: 'render', target: 'validate' }
    ];

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(30))
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', 'rgba(168, 85, 247, 0.4)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2');

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g');

    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow-reasoning');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    node.append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => {
        if (d.status === 'completed') return '#10b981';
        if (d.status === 'active') return '#06b6d4';
        return '#8b5cf6';
      })
      .attr('filter', (d: any) => d.status === 'active' ? 'url(#glow-reasoning)' : null);

    node.append('text')
      .text((d: any) => d.label)
      .attr('dx', 10)
      .attr('dy', 3)
      .attr('fill', 'rgba(255,255,255,0.75)')
      .attr('font-size', '7.5px')
      .attr('font-family', 'monospace');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    const interval = setInterval(() => {
      const activeIdx = nodes.findIndex(n => n.status === 'active');
      if (activeIdx !== -1) {
        nodes[activeIdx].status = 'completed';
        const nextIdx = (activeIdx + 1) % nodes.length;
        nodes[nextIdx].status = 'active';
        
        node.selectAll('circle')
          .transition()
          .duration(300)
          .attr('fill', (d: any) => {
            if (d.status === 'completed') return '#10b981';
            if (d.status === 'active') return '#06b6d4';
            return '#8b5cf6';
          })
          .attr('r', (d: any) => d.status === 'active' ? 8 : 5)
          .attr('filter', (d: any) => d.status === 'active' ? 'url(#glow-reasoning)' : null);
      }
    }, 3000);

    return () => {
      simulation.stop();
      clearInterval(interval);
    };
  }, [activeView, logs, isExpanded]);

  // ... (keep useEffect and other existing functions, update to use activeView)

  useEffect(() => {
    // Add default initial system logs
    setLogs([
      {
        id: 'init-1',
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        text: 'System: Virtual Headless Browser logging channel active.'
      },
      {
        id: 'init-2',
        timestamp: new Date().toLocaleTimeString(),
        type: 'success',
        text: 'System: Chrome CDP interface initialized on isolated port 9222.'
      }
    ]);

    // Register to scraper backoff system logs
    registerScraperLogger((log) => {
      if (isPaused) return;
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now().toString() + Math.random().toString(36).substring(4),
          timestamp: new Date().toLocaleTimeString(),
          type: log.type,
          text: log.text
        }
      ].slice(-150)); // Limit to last 150 entries
    });
  }, [isPaused]);

  useEffect(() => {
    if (isExpanded && stickToBottom) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded, stickToBottom]);

  const handleClear = () => {
    setLogs([]);
  };

  const handleExport = () => {
    if (activeView === 'reasoning') {
        const reasoningLogs = logs.filter(l => l.type === 'reasoning');
        const content = JSON.stringify(reasoningLogs, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-reasoning-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } else {
        const content = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `headless-browser-console-${Date.now()}.log`;
        a.click();
        URL.revokeObjectURL(url);
    }
  };

  // Helper to trigger dummy mock event for visual testing
  const triggerMockLog = () => {
    const types: ('info' | 'warn' | 'error' | 'success')[] = ['info', 'warn', 'error', 'success'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    let text = '';
    
    if (selectedType === 'info') text = 'HeadlessBrowser: GET https://example.com/api/v1/resource - 200 OK';
    else if (selectedType === 'warn') text = 'HeadlessBrowser: Slow network connection detected. DomContentLoaded took 2841ms.';
    else if (selectedType === 'error') text = 'HeadlessBrowser: DOM element "#pricing-table" not found. Selector extraction aborted.';
    else text = 'HeadlessBrowser: Parsing finished. Extracted 12 nodes successfully.';

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: selectedType,
        text
      }
    ]);
  };

  return (
    <div className="border border-black/10 bg-slate-950 text-slate-100 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs flex flex-col transition-all duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-900 border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200 tracking-tight text-[11px] uppercase hidden sm:inline">
            Console Stream
          </span>
          <div className="flex bg-slate-800 rounded p-0.5">
            <button 
              onClick={() => setActiveView('logs')}
              className={cn("text-[10px] px-2 py-0.5 rounded font-bold transition-colors", activeView === 'logs' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white")}
            >
              Logs
            </button>
            <button 
              onClick={() => setActiveView('reasoning')}
              className={cn("text-[10px] px-2 py-0.5 rounded font-bold transition-colors", activeView === 'reasoning' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white")}
            >
              Reasoning
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={triggerMockLog}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded hover:text-white transition-colors border border-slate-700"
            title="Simulate browser log"
          >
            Simulate Log
          </button>
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title={isPaused ? "Resume logging" : "Pause logging"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-500" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors"
            title="Clear Terminal logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExport}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors"
            title="Download log file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setStickToBottom(!stickToBottom)}
            className={cn("p-1 hover:bg-slate-800 rounded transition-colors", stickToBottom ? "text-indigo-400" : "text-slate-400")}
            title={stickToBottom ? "Disable auto-scroll" : "Enable auto-scroll to bottom"}
          >
            {stickToBottom ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Logs container */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-950/95 border-t border-slate-800">
          <div className={cn("h-48 overflow-y-auto p-4 flex flex-col gap-1.5 font-mono selection:bg-white/15", activeView === 'reasoning' ? "md:col-span-2 border-r border-slate-800" : "md:col-span-3")}>
            {logs.filter(l => {
                const isSmartTip = l.type === 'success' && l.text.includes('Qwable Smart Tip');
                if (activeView === 'logs') return l.type !== 'reasoning';
                return l.type === 'reasoning' || isSmartTip;
            }).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <Terminal className="w-8 h-8 opacity-40 text-slate-400" />
                <p className="text-[10px] uppercase tracking-wider">No active logs in stream buffer</p>
              </div>
            ) : (
              logs.filter(l => {
                  const isSmartTip = l.type === 'success' && l.text.includes('Qwable Smart Tip');
                  if (activeView === 'logs') return l.type !== 'reasoning';
                  return l.type === 'reasoning' || isSmartTip;
              }).map((log) => {
                let icon = <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />;
                let colorClass = 'text-slate-300';
                if (log.type === 'warn') {
                  icon = <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />;
                  colorClass = 'text-amber-300 bg-amber-500/10 border-l-2 border-amber-500 pl-2 py-0.5 rounded-r';
                } else if (log.type === 'error') {
                  icon = <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />;
                  colorClass = 'text-red-300 bg-red-500/10 border-l-2 border-red-500 pl-2 py-0.5 rounded-r';
                } else if (log.type === 'success') {
                  icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />;
                  colorClass = 'text-emerald-300 pl-2 border-l-2 border-emerald-400';
                } else if (log.type === 'reasoning') {
                  icon = <Brain className="w-3.5 h-3.5 shrink-0 text-indigo-400" />;
                  colorClass = 'text-indigo-300 pl-2 border-l-2 border-indigo-400';
                }

                const isSmartTip = activeView === 'reasoning' && log.type === 'success' && log.text.includes('Qwable Smart Tip');
                if (isSmartTip) {
                    icon = <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />;
                    colorClass = 'text-amber-200 pl-2 border-l-2 border-amber-400 bg-amber-500/10 py-0.5 rounded-r';
                }

                return (
                  <div key={log.id} className={`flex items-start gap-2 text-[11px] leading-relaxed font-mono ${colorClass}`}>
                    <span className="text-[9px] text-slate-500 select-none shrink-0">{log.timestamp}</span>
                    {icon}
                    <span className="break-all">{isSmartTip ? <span className="font-bold">{log.text}</span> : log.text}</span>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>

          {activeView === 'reasoning' && (
            <div className="md:col-span-1 h-48 bg-slate-950 p-3 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-white/5 pb-1 select-none">
                <span className="text-purple-400 font-extrabold flex items-center gap-1 uppercase tracking-wider">
                  <GitMerge className="w-3 h-3" />
                  Subtask Entanglement
                </span>
                <span className="text-slate-500 text-[8px]">D3 ENGINE</span>
              </div>
              <div className="w-full h-full min-h-0 relative flex items-center justify-center">
                <svg ref={entangleRef} className="w-full h-full pointer-events-none overflow-visible" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
