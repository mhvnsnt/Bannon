import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Orbit } from 'lucide-react';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

const NODES = [
  { id: 'output', label: 'Value Output Density', x: 200, y: 50 },
  { id: 'capture', label: 'Network Asset Capture', x: 400, y: 150 },
  { id: 'dist', label: 'Continuous Distribution', x: 200, y: 250 },
  { id: 'reset', label: 'Zero Friction Reset', x: 50, y: 150 },
];

const LINKS = [
  { source: 'output', target: 'capture' },
  { source: 'capture', target: 'dist' },
  { source: 'dist', target: 'reset' },
  { source: 'reset', target: 'output' },
];

export default function D3FlowVisualizer() {
  const d3Container = useRef<SVGSVGElement | null>(null);
  const [latestLog, setLatestLog] = useState<any>(null);

  useEffect(() => {
    if (!db) {
      setLatestLog({
        action: 'System Vector Initialized Offline',
        timestamp: new Date().toISOString()
      });
      return;
    }
    // Listen to real-time activity logs
    const logsRef = collection(db, 'logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            setLatestLog(data);
        }
    }, (error) => {
        console.warn("[D3FlowVisualizer] Firestore listener failed, using offline stats:", error);
        setLatestLog({
            action: 'System Vector Initialized Offline',
            timestamp: new Date().toISOString()
        });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!d3Container.current) return;

    // Clear existing
    d3.select(d3Container.current).selectAll('*').remove();

    const width = 500;
    const height = 300;

    const svg = d3.select(d3Container.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', '100%');

    // Draw Links
    svg.selectAll('line.link')
      .data(LINKS)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', d => NODES.find(n => n.id === d.source)!.x)
      .attr('y1', d => NODES.find(n => n.id === d.source)!.y)
      .attr('x2', d => NODES.find(n => n.id === d.target)!.x)
      .attr('y2', d => NODES.find(n => n.id === d.target)!.y)
      .style('stroke', '#333')
      .style('stroke-width', 2);

    // Draw Nodes
    const nodeGroups = svg.selectAll('g.node')
        .data(NODES)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

    nodeGroups.append('circle')
        .attr('r', 8)
        .style('fill', '#10b981')
        .style('filter', 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))');

    nodeGroups.append('text')
        .attr('y', d => (d.y > 150 ? 25 : -15))
        .attr('text-anchor', 'middle')
        .style('fill', '#9ca3af')
        .style('font-size', '10px')
        .style('font-family', 'monospace')
        .style('font-weight', 'bold')
        .style('text-transform', 'uppercase')
        .text(d => d.label);

    // Animate Particles
    function emitParticle() {
      const link = LINKS[Math.floor(Math.random() * LINKS.length)];
      const sourceNode = NODES.find(n => n.id === link.source)!;
      const targetNode = NODES.find(n => n.id === link.target)!;

      const particle = svg.append('circle')
        .attr('r', 3)
        .attr('cx', sourceNode.x)
        .attr('cy', sourceNode.y)
        .style('fill', '#818cf8')
        .style('filter', 'drop-shadow(0 0 6px rgba(129, 140, 248, 0.8))');

      particle.transition()
        .duration(2000 + Math.random() * 1000)
        .ease(d3.easeLinear)
        .attr('cx', targetNode.x)
        .attr('cy', targetNode.y)
        .on('end', () => {
             particle.remove();
        });
    }

    const interval = setInterval(() => {
        emitParticle();
    }, 400);

    return () => clearInterval(interval);

  }, []);

  // Emit a burst of particles when a new log arrives
  useEffect(() => {
       if (latestLog && d3Container.current) {
          const svg = d3.select(d3Container.current);
          const link = LINKS[0]; 
          const sourceNode = NODES.find(n => n.id === link.source)!;
          const targetNode = NODES.find(n => n.id === link.target)!;

          for(let i=0; i<3; i++) {
              const particle = svg.append('circle')
              .attr('r', 4)
              .attr('cx', sourceNode.x)
              .attr('cy', sourceNode.y)
              .style('fill', '#f43f5e') // Burst color
              .style('filter', 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.9))');
      
            particle.transition()
              .duration(1000 + Math.random() * 500)
              .ease(d3.easeExpOut)
              .attr('cx', targetNode.x)
              .attr('cy', targetNode.y)
              .on('end', () => {
                   particle.remove();
              });
          }
       }
  }, [latestLog]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-[#222] rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden h-full"
    >
      <h3 className="text-gray-400 font-medium text-xs uppercase tracking-widest flex items-center gap-2">
        <Orbit className="w-4 h-4 text-emerald-500" />
        Infinite Flow Loop Visualizer
      </h3>
      <div className="w-full h-[250px] relative">
          <svg ref={d3Container} className="w-full h-full" />
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="text-[9px] text-gray-500 uppercase font-mono max-w-[70%] truncate">
              {latestLog ? `LATEST INGESTION: ${latestLog.action || 'Unknown Action'}` : 'AWAITING NETWORK DATA...'}
          </div>
          <div className="text-[10px] text-gray-600 font-mono">
             Autonomous Flow State Locked.
          </div>
      </div>
    </motion.div>
  );
}
