import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface Gate {
  type: string;
  target: number;
  control?: number;
  theta?: number;
  cbit?: number;
}

export interface CircuitData {
  numQubits: number;
  numClassicalBits: number;
  gates: Gate[];
}

interface QuantumCircuitDebuggerProps {
  circuitData?: CircuitData | null;
}

export function QuantumCircuitDebugger({ circuitData }: QuantumCircuitDebuggerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!circuitData || !svgRef.current) return;

    const { numQubits, gates } = circuitData;
    
    // Clear previous renders
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 30, left: 50 };
    const width = Math.max(600, gates.length * 60 + margin.left + margin.right);
    const height = Math.max(200, numQubits * 50 + margin.top + margin.bottom);

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw Qubit lines
    for (let i = 0; i < numQubits; i++) {
      const y = i * 50;
      svg.append("line")
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", width - margin.left - margin.right)
        .attr("y2", y)
        .attr("stroke", "#4b5563")
        .attr("stroke-width", 2);

      svg.append("text")
        .attr("x", -10)
        .attr("y", y + 5)
        .attr("text-anchor", "end")
        .attr("fill", "#9ca3af")
        .attr("font-family", "monospace")
        .text(`q[${i}]`);
    }

    // Draw gates
    gates.forEach((gate, stepIndex) => {
      const x = stepIndex * 60 + 30;
      
      if (gate.type === 'cx') {
        const targetY = gate.target * 50;
        const controlY = gate.control! * 50;
        
        // Control line
        svg.append("line")
          .attr("x1", x)
          .attr("y1", Math.min(targetY, controlY))
          .attr("x2", x)
          .attr("y2", Math.max(targetY, controlY))
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 2);
          
        // Control dot
        svg.append("circle")
          .attr("cx", x)
          .attr("cy", controlY)
          .attr("r", 5)
          .attr("fill", "#06b6d4");

        // Target target symbol
        svg.append("circle")
          .attr("cx", x)
          .attr("cy", targetY)
          .attr("r", 10)
          .attr("fill", "#111827")
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 2);
          
        svg.append("line")
          .attr("x1", x - 10)
          .attr("y1", targetY)
          .attr("x2", x + 10)
          .attr("y2", targetY)
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 2);
          
        svg.append("line")
          .attr("x1", x)
          .attr("y1", targetY - 10)
          .attr("x2", x)
          .attr("y2", targetY + 10)
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 2);

      } else {
        const y = gate.target * 50;
        
        // Draw gate box
        svg.append("rect")
          .attr("x", x - 15)
          .attr("y", y - 15)
          .attr("width", 30)
          .attr("height", 30)
          .attr("fill", "#1f2937")
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 2)
          .attr("rx", 4);

        // Gate label
        let label = gate.type.toUpperCase();
        if (gate.type === 'rx' && gate.theta !== undefined) {
          label = `Rx(${gate.theta})`;
        } else if (gate.type === 'measure') {
          label = 'M';
        }

        svg.append("text")
          .attr("x", x)
          .attr("y", y + 5)
          .attr("text-anchor", "middle")
          .attr("fill", "#22d3ee")
          .attr("font-family", "monospace")
          .attr("font-size", gate.type === 'rx' ? "10px" : "12px")
          .attr("font-weight", "bold")
          .text(label);
          
        // Classical output indicator for measurement
        if (gate.type === 'measure') {
           svg.append("line")
             .attr("x1", x)
             .attr("y1", y + 15)
             .attr("x2", x)
             .attr("y2", y + 30)
             .attr("stroke", "#9ca3af")
             .attr("stroke-width", 2)
             .attr("stroke-dasharray", "4");
             
           svg.append("text")
             .attr("x", x)
             .attr("y", y + 42)
             .attr("text-anchor", "middle")
             .attr("fill", "#9ca3af")
             .attr("font-family", "monospace")
             .attr("font-size", "10px")
             .text(`c[${gate.cbit}]`);
        }
      }
    });

  }, [circuitData]);

  if (!circuitData) {
    return (
      <div className="w-full h-40 flex items-center justify-center border border-dashed border-[#333] rounded-lg bg-[#050505] text-gray-500 font-mono text-xs">
        [NO CIRCUIT DATA LOADED]
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-[#333] rounded-lg bg-[#050505] p-4 custom-scrollbar">
      <div className="text-[10px] uppercase text-cyan-500 font-mono font-bold mb-2 tracking-widest border-b border-[#222] pb-2">
        Quantum Circuit Visualizer (D3 Timeline)
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
}
