import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function TaskExecutionTimeline() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const data = [
      { step: 'Initialization', status: 'completed' },
      { step: 'DOM Extraction', status: 'completed' },
      { step: 'Agent Analysis', status: 'active' },
      { step: 'Finalizing', status: 'pending' },
    ];

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 200 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleBand().domain(data.map(d => d.step)).range([0, height]).padding(0.8);

    g.append('line')
      .attr('x1', 10)
      .attr('y1', 0)
      .attr('x2', 10)
      .attr('y2', height)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 2);

    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', 10)
      .attr('cy', d => yScale(d.step)! + yScale.bandwidth() / 2)
      .attr('r', 8)
      .attr('fill', d => d.status === 'completed' ? '#10b981' : d.status === 'active' ? '#f59e0b' : '#e2e8f0')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    g.selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .attr('x', 25)
      .attr('y', d => yScale(d.step)! + yScale.bandwidth() / 2 + 5)
      .text(d => d.step)
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');
  }, []);

  return <svg ref={svgRef} width="200" height="300" />;
}
