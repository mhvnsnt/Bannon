import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Timer, TrendingDown, HelpCircle } from 'lucide-react';

interface LatencyLog {
  timestamp: string;
  latencyMs: number;
}

interface LatencyTimeSeriesChartProps {
  logs: LatencyLog[];
}

export default function LatencyTimeSeriesChart({ logs }: LatencyTimeSeriesChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || logs.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous rendering

    const width = 280;
    const height = 140;
    const margin = { top: 15, right: 15, bottom: 25, left: 35 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create Scales
    const xScale = d3.scaleLinear()
      .domain([0, logs.length - 1])
      .range([0, chartWidth]);

    const maxLatency = d3.max(logs, d => d.latencyMs) || 1500;
    const yScale = d3.scaleLinear()
      .domain([0, Math.max(1000, maxLatency * 1.15)])
      .range([chartHeight, 0]);

    // Graph grouping
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add Gridlines
    const yGrid = d3.axisLeft(yScale)
      .tickSize(-chartWidth)
      .tickFormat(() => '')
      .ticks(4);

    g.append('g')
      .attr('class', 'grid')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-opacity', 0.5)
      .call(yGrid)
      .selectAll('.tick line')
      .attr('stroke', '#f1f5f9');

    // Gradient definitions
    const defs = svg.append('defs');
    const areaGrad = defs.append('linearGradient')
      .attr('id', 'latency-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    areaGrad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.3);
    
    areaGrad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.0);

    // Line Generator
    const line = d3.line<LatencyLog>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.latencyMs))
      .curve(d3.curveMonotoneX);

    // Area Generator
    const area = d3.area<LatencyLog>()
      .x((_, i) => xScale(i))
      .y0(chartHeight)
      .y1(d => yScale(d.latencyMs))
      .curve(d3.curveMonotoneX);

    // Draw Area
    g.append('path')
      .datum(logs)
      .attr('fill', 'url(#latency-area-gradient)')
      .attr('d', area);

    // Draw Line
    g.append('path')
      .datum(logs)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Draw Interactive Data Points (Dots)
    g.selectAll('.dot')
      .data(logs)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (_, i) => xScale(i))
      .attr('cy', d => yScale(d.latencyMs))
      .attr('r', 3)
      .attr('fill', '#ffffff')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1.5)
      .attr('opacity', (_, i) => i === logs.length - 1 ? 1 : 0.6);

    // Add X-Axis Labels (first, middle, last)
    const xAxisTicks = [0, Math.floor(logs.length / 2), logs.length - 1];
    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`);

    xAxisTicks.forEach(tickIdx => {
      const log = logs[tickIdx];
      if (log) {
        xAxisGroup.append('text')
          .attr('x', xScale(tickIdx))
          .attr('y', 15)
          .attr('text-anchor', tickIdx === 0 ? 'start' : tickIdx === logs.length - 1 ? 'end' : 'middle')
          .attr('fill', '#64748b')
          .attr('font-size', '8px')
          .attr('font-family', 'monospace')
          .text(log.timestamp);
      }
    });

    // Add Y-Axis Labels
    const yAxisTicks = yScale.ticks(4);
    const yAxisGroup = g.append('g');
    yAxisTicks.forEach(val => {
      yAxisGroup.append('text')
        .attr('x', -8)
        .attr('y', yScale(val) + 3)
        .attr('text-anchor', 'end')
        .attr('fill', '#64748b')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .text(val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${val}ms`);
    });

  }, [logs]);

  const latestLatency = logs[logs.length - 1]?.latencyMs || 0;
  const avgLatency = Math.round(d3.mean(logs, d => d.latencyMs) || 0);

  return (
    <div className="bg-slate-50 border border-black/5 rounded-2xl p-4 flex flex-col gap-2 font-sans shadow-sm">
      <div className="flex items-center justify-between pb-1 border-b border-black/5">
        <div className="flex items-center gap-1.5">
          <Timer className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            Agent Response Latency
          </span>
        </div>
        <span className="text-[8px] font-mono uppercase bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black">
          60m History
        </span>
      </div>

      <div className="flex items-center justify-center bg-white border border-black/5 rounded-xl h-[140px] w-full overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-[10px] font-mono text-slate-400">Waiting for agent request...</div>
        ) : (
          <svg ref={svgRef} width="280" height="140" className="overflow-visible" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono font-bold">
        <div className="bg-white border border-black/5 rounded-lg p-1.5">
          <p className="text-[8px] uppercase tracking-wider text-slate-400">Latest Run</p>
          <p className="text-blue-600 font-black mt-0.5">{latestLatency >= 1000 ? `${(latestLatency / 1000).toFixed(2)}s` : `${latestLatency}ms`}</p>
        </div>
        <div className="bg-white border border-black/5 rounded-lg p-1.5">
          <p className="text-[8px] uppercase tracking-wider text-slate-400">Average RTT</p>
          <p className="text-slate-800 font-black mt-0.5">{avgLatency >= 1000 ? `${(avgLatency / 1000).toFixed(2)}s` : `${avgLatency}ms`}</p>
        </div>
      </div>
    </div>
  );
}
