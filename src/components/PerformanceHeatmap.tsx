import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function PerformanceHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const data = [
      { time: '10:00', personality: 'Concise', success: 0.8 },
      { time: '10:00', personality: 'Verbose', success: 0.6 },
      { time: '10:00', personality: 'Socratic', success: 0.9 },
      { time: '11:00', personality: 'Concise', success: 0.7 },
      { time: '11:00', personality: 'Verbose', success: 0.5 },
      { time: '11:00', personality: 'Socratic', success: 0.95 },
    ];

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const x = d3.scaleBand().domain(data.map(d => d.time)).range([0, width]).padding(0.1);
    const y = d3.scaleBand().domain(data.map(d => d.personality)).range([height, 0]).padding(0.1);
    const color = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.time)!)
      .attr('y', d => y(d.personality)!)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => color(d.success));

    g.append('g').call(d3.axisBottom(x)).attr('transform', `translate(0,${height})`);
    g.append('g').call(d3.axisLeft(y));
  }, []);

  return <svg ref={svgRef} width="400" height="200" />;
}
