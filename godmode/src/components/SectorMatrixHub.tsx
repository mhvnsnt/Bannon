import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Network, Activity } from 'lucide-react';

interface MatrixNode {
  id: string;
  group: number;
  radius: number;
  label: string;
}

interface MatrixLink {
  source: string;
  target: string;
  value: number;
}

export default function SectorMatrixHub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let simulation: any;
    
    async function initVisualization() {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Clear previous
      d3.select(containerRef.current).selectAll("*").remove();

      // We generate spatial mapping based on some basic physics and network concepts
      const nodes: MatrixNode[] = [
        { id: "Core Engine", group: 1, radius: 25, label: "Prime Architect" },
        { id: "Digital Capital", group: 2, radius: 15, label: "Kinetic Wealth" },
        { id: "Reckon Combat", group: 2, radius: 12, label: "Interactive Territory" },
        { id: "Sonic Pulse", group: 2, radius: 10, label: "Sonic Architecture" },
        { id: "Local HQ", group: 3, radius: 20, label: "Sector Matrix Hub" },
        { id: "Dooly Anchor", group: 3, radius: 18, label: "Physical Dirt" },
        { id: "Vault Core", group: 3, radius: 14, label: "Generational Vault" }
      ];

      const links: MatrixLink[] = [
        { source: "Core Engine", target: "Digital Capital", value: 4 },
        { source: "Core Engine", target: "Local HQ", value: 6 },
        { source: "Digital Capital", target: "Reckon Combat", value: 2 },
        { source: "Digital Capital", target: "Sonic Pulse", value: 2 },
        { source: "Local HQ", target: "Dooly Anchor", value: 5 },
        { source: "Local HQ", target: "Vault Core", value: 4 },
        { source: "Reckon Combat", target: "Vault Core", value: 1 },
        { source: "Sonic Pulse", target: "Vault Core", value: 1 }
      ];

      if (db) {
          try {
               // Attempt to read recent vault nodes to augment graph
               const q = query(collection(db, 'vault'), orderBy('timestamp', 'desc'), limit(5));
               const snap = await getDocs(q);
               let extId = 1;
               snap.forEach(doc => {
                  const d = doc.data();
                  nodes.push({ id: `ext_${extId}`, group: 4, radius: 8, label: d.label?.substring(0,10) || "Vector" });
                  links.push({ source: "Core Engine", target: `ext_${extId}`, value: 1 });
                  extId++;
               });
          } catch (e) {
              console.error("Vault node fetch failed", e);
          }
      } else {
          console.log("[SectorMatrixHub] Running in offline fallback mode. Dynamic nodes skipped.");
      }

      const svg = d3.select(containerRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);

      // Adding subtle grid background lines dynamically
      const defs = svg.append("defs");
      const pattern = defs.append("pattern")
        .attr("id", "matrixGrid")
        .attr("width", 40)
        .attr("height", 40)
        .attr("patternUnits", "userSpaceOnUse");
        
      pattern.append("path")
        .attr("d", "M 40 0 L 0 0 0 40")
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.03)")
        .attr("stroke-width", 1);

      svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "url(#matrixGrid)");

      simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius((d: any) => d.radius + 10));

      const link = svg.append("g")
        .attr("stroke", "#333")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

      const nodeGroup = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag<any, any>()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            }));

      nodeGroup.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => {
            if (d.group === 1) return "#3b82f6"; // Blue core
            if (d.group === 2) return "#10b981"; // Emerald digital
            if (d.group === 3) return "#f59e0b"; // Amber physical
            return "#8b5cf6"; // Purple vectors
        })
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .attr("class", d => d.group === 1 ? "animate-pulse" : "");

      nodeGroup.append("text")
        .text(d => d.label)
        .attr("x", d => d.radius + 5)
        .attr("y", 3)
        .attr("font-size", "10px")
        .attr("fill", "#9ca3af")
        .attr("font-family", "mono");

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      setLoading(false);
    }

    initVisualization();
    
    const handleResize = () => {
        initVisualization();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
        if(simulation) simulation.stop();
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      <div className="flex items-center gap-2 p-4 border-b border-[#222] shrink-0">
        <Network className="w-5 h-5 text-indigo-400" />
        <h2 className="font-semibold text-gray-200">Sector Matrix Hub</h2>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden" ref={containerRef}>
         {loading && (
             <div className="absolute inset-0 flex items-center justify-center">
                 <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
             </div>
         )}
      </div>
      
      <div className="p-3 border-t border-[#222] bg-[#111] shrink-0 text-xs font-mono flex items-center justify-between text-gray-500">
         <span>STATUS: Node Authority Visualized</span>
         <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Kinetic Link Active</span>
      </div>
    </div>
  );
}
