import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, ShieldCheck, Cpu, HardDrive, RefreshCw, Layers } from 'lucide-react';

interface AgentNode {
  id: string;
  name: string;
  status: 'online' | 'idle' | 'offline';
  threads: number;
  queueDepth: number;
  pingMs: number;
}

export default function AgentNodeStatus() {
  const [nodes, setNodes] = useState<AgentNode[]>([
    { id: 'node-alpha', name: 'Scraper Engine Alpha', status: 'online', threads: 4, queueDepth: 2, pingMs: 12 },
    { id: 'node-beta', name: 'Headless Chromedriver Pool', status: 'online', threads: 8, queueDepth: 5, pingMs: 24 },
    { id: 'node-gamma', name: 'Static Extractor Module', status: 'idle', threads: 2, queueDepth: 0, pingMs: 18 },
  ]);

  const [activeTab, setActiveTab] = useState<'topology' | 'queue' | 'threads'>('topology');

  const svgRef = useRef<SVGSVGElement>(null);

  // Periodic mock fluctuation of metrics to make the D3 viz feel alive!
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.status === 'offline') return node;
          
          // Randomly fluctuate queue depth and thread activity slightly
          const queueDelta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const threadDelta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const pingDelta = Math.round((Math.random() - 0.5) * 4);

          return {
            ...node,
            queueDepth: Math.max(0, Math.min(15, node.queueDepth + queueDelta)),
            threads: Math.max(1, Math.min(12, node.threads + threadDelta)),
            pingMs: Math.max(5, Math.min(120, node.pingMs + pingDelta)),
            status: Math.random() > 0.95 ? (node.status === 'online' ? 'idle' : 'online') : node.status
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Main D3 Drawing logic based on activeTab
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear current drawing

    const width = 280;
    const height = 180;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };

    if (activeTab === 'topology') {
      // 1. TOPOLOGY VIEW (Connection Health)
      // Visual network nodes connected to a central orchestrator hub.
      
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw connection lines from center to nodes
      nodes.forEach((node, idx) => {
        const angle = (idx * (2 * Math.PI)) / nodes.length - Math.PI / 2;
        const targetX = centerX + Math.cos(angle) * 70;
        const targetY = centerY + Math.sin(angle) * 55;

        // Draw connection path
        svg.append('line')
          .attr('x1', centerX)
          .attr('y1', centerY)
          .attr('x2', targetX)
          .attr('y2', targetY)
          .attr('stroke', node.status === 'online' ? '#6366f1' : node.status === 'idle' ? '#94a3b8' : '#ef4444')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', node.status === 'idle' ? '3,3' : 'none')
          .attr('class', 'transition-all duration-500');
      });

      // Draw central Orchestrator hub node
      const hubG = svg.append('g').attr('transform', `translate(${centerX}, ${centerY})`);
      
      hubG.append('circle')
        .attr('r', 16)
        .attr('fill', '#4f46e5')
        .attr('class', 'animate-pulse')
        .attr('filter', 'url(#glow)');

      hubG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .attr('fill', '#ffffff')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text('HUB');

      // Add filter definitions for glowing effect
      const defs = svg.append('defs');
      const filter = defs.append('filter').attr('id', 'glow');
      filter.append('feGaussianBlur')
        .attr('stdDeviation', '2.5')
        .attr('result', 'coloredBlur');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      // Draw agent nodes
      nodes.forEach((node, idx) => {
        const angle = (idx * (2 * Math.PI)) / nodes.length - Math.PI / 2;
        const targetX = centerX + Math.cos(angle) * 70;
        const targetY = centerY + Math.sin(angle) * 55;

        const nodeColor = node.status === 'online' ? '#10b981' : node.status === 'idle' ? '#e2e8f0' : '#ef4444';
        const nodeTextColor = node.status === 'online' ? '#047857' : '#475569';

        const nodeG = svg.append('g')
          .attr('transform', `translate(${targetX}, ${targetY})`);

        // Pulsing outer ring for active nodes
        if (node.status === 'online') {
          nodeG.append('circle')
            .attr('r', 14)
            .attr('fill', 'none')
            .attr('stroke', nodeColor)
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.6)
            .append('animate')
            .attr('attributeName', 'r')
            .attr('values', '10;15;10')
            .attr('dur', '2s')
            .attr('repeatCount', 'indefinite');
        }

        nodeG.append('circle')
          .attr('r', 9)
          .attr('fill', nodeColor)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);

        // Name labels
        nodeG.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 20)
          .attr('fill', '#334155')
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'sans-serif')
          .text(node.name.split(' ')[0]);

        // Small indicator text inside or next to circle
        nodeG.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -12)
          .attr('fill', '#64748b')
          .attr('font-size', '7px')
          .attr('font-family', 'monospace')
          .text(`${node.pingMs}ms`);
      });

    } else if (activeTab === 'queue') {
      // 2. TASK QUEUE DEPTH BAR CHART
      // Displaying current queue workloads for each agent node
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom - 20;

      const x = d3.scaleBand()
        .domain(nodes.map(d => d.id))
        .range([margin.left, chartWidth])
        .padding(0.4);

      const maxQueue = d3.max(nodes, d => d.queueDepth) || 10;
      const y = d3.scaleLinear()
        .domain([0, Math.max(10, maxQueue + 2)])
        .range([chartHeight, margin.top]);

      // Draw axis / background bars
      svg.selectAll('.bg-bar')
        .data(nodes)
        .enter()
        .append('rect')
        .attr('class', 'bg-bar')
        .attr('x', d => x(d.id) || 0)
        .attr('y', margin.top)
        .attr('width', x.bandwidth())
        .attr('height', chartHeight - margin.top)
        .attr('fill', '#f1f5f9')
        .attr('rx', 4);

      // Draw value bars
      svg.selectAll('.val-bar')
        .data(nodes)
        .enter()
        .append('rect')
        .attr('class', 'val-bar')
        .attr('x', d => x(d.id) || 0)
        .attr('y', d => y(d.queueDepth))
        .attr('width', x.bandwidth())
        .attr('height', d => chartHeight - y(d.queueDepth))
        .attr('fill', 'url(#queue-bar-grad)')
        .attr('rx', 4);

      // Add gradients
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient')
        .attr('id', 'queue-bar-grad')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#4f46e5');
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#818cf8');

      // Labels on top of bars
      svg.selectAll('.val-label')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'val-label')
        .attr('x', d => (x(d.id) || 0) + x.bandwidth() / 2)
        .attr('y', d => y(d.queueDepth) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#334155')
        .attr('font-size', '9px')
        .attr('font-weight', 'black')
        .attr('font-family', 'monospace')
        .text(d => d.queueDepth);

      // Labels below bars
      svg.selectAll('.name-label')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'name-label')
        .attr('x', d => (x(d.id) || 0) + x.bandwidth() / 2)
        .attr('y', chartHeight + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .text(d => d.name.split(' ')[0]);

    } else if (activeTab === 'threads') {
      // 3. ACTIVE THREAD COUNT
      // Radial or donut sections showing active execution threads per node
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom - 10;
      const radius = Math.min(chartWidth, chartHeight) / 2.3;
      const centerX = width / 2;
      const centerY = height / 2;

      const pie = d3.pie<AgentNode>()
        .value(d => d.threads)
        .sort(null);

      const arc = d3.arc<d3.PieArcDatum<AgentNode>>()
        .innerRadius(radius - 12)
        .outerRadius(radius);

      const color = d3.scaleOrdinal<string>()
        .domain(nodes.map(n => n.id))
        .range(['#06b6d4', '#10b981', '#6366f1']);

      const arcs = svg.append('g')
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .selectAll('.arc')
        .data(pie(nodes))
        .enter()
        .append('g')
        .attr('class', 'arc');

      arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.id))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

      // Label inside center
      const centerLabel = svg.append('g')
        .attr('transform', `translate(${centerX}, ${centerY})`);

      const totalThreads = d3.sum(nodes, d => d.threads);

      centerLabel.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('fill', '#1e293b')
        .attr('font-size', '14px')
        .attr('font-weight', 'black')
        .attr('font-family', 'monospace')
        .text(totalThreads);

      centerLabel.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.1em')
        .attr('fill', '#94a3b8')
        .attr('font-size', '7px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text('THREADS');

      // Thread keys/legend
      const legend = svg.append('g')
        .attr('transform', `translate(${centerX - 120}, ${centerY - radius})`);

      nodes.forEach((node, idx) => {
        const legG = legend.append('g')
          .attr('transform', `translate(0, ${idx * 13})`);

        legG.append('circle')
          .attr('r', 4)
          .attr('fill', color(node.id));

        legG.append('text')
          .attr('x', 8)
          .attr('y', 3)
          .attr('fill', '#475569')
          .attr('font-size', '8px')
          .attr('font-family', 'sans-serif')
          .text(`${node.name.split(' ')[0]}: ${node.threads}`);
      });
    }

  }, [nodes, activeTab]);

  const totalTasks = nodes.reduce((sum, n) => sum + n.queueDepth, 0);

  return (
    <div className="bg-slate-50 border border-black/5 rounded-2xl p-4 flex flex-col gap-3 font-sans shadow-sm select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            Agent Status Matrix
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('topology')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
              activeTab === 'topology' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Topology
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
              activeTab === 'queue' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Queue ({totalTasks})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('threads')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
              activeTab === 'threads' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Threads
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white border border-black/5 rounded-xl h-48 w-full overflow-hidden">
        <svg ref={svgRef} width="280" height="180" className="overflow-visible" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-bold text-slate-600">
        <div className="bg-white border border-black/5 rounded-lg p-1.5 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-wider text-slate-400">Connection</p>
          <p className="text-emerald-600 font-black mt-0.5">98.4% OK</p>
        </div>
        <div className="bg-white border border-black/5 rounded-lg p-1.5 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-wider text-slate-400">Task Latency</p>
          <p className="text-indigo-600 font-black mt-0.5">14ms AVG</p>
        </div>
        <div className="bg-white border border-black/5 rounded-lg p-1.5 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-wider text-slate-400">Memory Load</p>
          <p className="text-purple-600 font-black mt-0.5">142 MB</p>
        </div>
      </div>
    </div>
  );
}
