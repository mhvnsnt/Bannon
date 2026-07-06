import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function AgentEfficacyDashboard() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const data = [
      { personality: 'Concise', time: 10 },
      { personality: 'Verbose', time: 25 },
      { personality: 'Socratic', time: 15 },
    ];

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const x = d3.scaleBand().domain(data.map(d => d.personality)).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([0, 30]).range([height, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.personality)!)
      .attr('y', d => y(d.time)!)
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.time)!)
      .attr('fill', '#6366f1');

    g.append('g').call(d3.axisBottom(x)).attr('transform', `translate(0,${height})`);
    g.append('g').call(d3.axisLeft(y));
  }, []);

  return <svg ref={svgRef} width="400" height="200" />;
}
