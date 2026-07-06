import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Activity } from 'lucide-react';

export function QuantumTaskQueue() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 150;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Number of quantum nodes (tasks in superposition)
    const numNodes = 5;
    const nodes = Array.from({ length: numNodes }).map((_, i) => ({
      id: i,
      x: innerWidth / 2 + (Math.random() - 0.5) * 100,
      y: innerHeight / 2 + (Math.random() - 0.5) * 50,
      radius: Math.random() * 8 + 4,
      status: 'pending'
    }));

    // Draw links (entanglements)
    const links = [];
    for(let i = 0; i < numNodes; i++) {
        for(let j = i + 1; j < numNodes; j++) {
            if (Math.random() > 0.4) {
                links.push({ source: nodes[i], target: nodes[j] });
            }
        }
    }

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(168, 85, 247, 0.4)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("x1", d => (d.source as any).x)
      .attr("y1", d => (d.source as any).y)
      .attr("x2", d => (d.target as any).x)
      .attr("y2", d => (d.target as any).y);

    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.radius)
      .attr("fill", "rgba(168, 85, 247, 0.8)")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    const simulation = d3.forceSimulation(nodes as any)
      .force("charge", d3.forceManyBody().strength(-30))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + 5))
      .on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node
          .attr("cx", (d: any) => d.x)
          .attr("cy", (d: any) => d.y);
      });

    // Animate superposition state (pulsing radiuses)
    let animationFrame: number;
    const animate = () => {
        node.transition()
            .duration(1000)
            .attr("r", (d: any) => d.status === 'pending' ? d.radius + (Math.random() * 6 - 3) : d.radius)
            .attr("opacity", (d: any) => d.status === 'pending' ? (0.5 + Math.random() * 0.5) : 1)
            .on("end", animate);
    };
    animate();

    // Simulate task collapses
    const collapseInterval = setInterval(() => {
        const pendingNodes = nodes.filter(n => n.status === 'pending');
        if (pendingNodes.length > 0) {
            const randomNode = pendingNodes[Math.floor(Math.random() * pendingNodes.length)];
            randomNode.status = Math.random() > 0.3 ? 'success' : 'failed';
            
            node.filter((d: any) => d.id === randomNode.id)
                .transition()
                .duration(500)
                .attr("fill", (d: any) => d.status === 'success' ? "rgba(16, 185, 129, 0.9)" : "rgba(244, 63, 94, 0.9)")
                .attr("r", (d: any) => d.radius * 1.5)
                .transition()
                .duration(500)
                .attr("r", (d: any) => d.radius);
                
            // Remove links connected to this node
            link.filter((d: any) => d.source.id === randomNode.id || d.target.id === randomNode.id)
                .transition()
                .duration(500)
                .attr("opacity", 0)
                .remove();
        } else {
            // Reset all nodes
            nodes.forEach(n => n.status = 'pending');
            node.transition().duration(1000).attr("fill", "rgba(168, 85, 247, 0.8)");
        }
    }, 3000);

    return () => {
        simulation.stop();
        clearInterval(collapseInterval);
        if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="bg-slate-950 p-6 rounded-2xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] relative">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                Trauma-Bonded Task Queue
            </h3>
            <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-purple-500/30">Finsta Launching Active</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Checking main character vibes, trauma bonds, and cancel-risk outcomes.</p>
        <div className="h-[150px] w-full border border-purple-500/20 rounded-xl overflow-hidden bg-slate-900/50">
            <svg ref={svgRef} className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid meet" />
        </div>
    </div>
  );
}
