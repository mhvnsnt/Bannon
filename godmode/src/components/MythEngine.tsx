import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Network, Database, Shield, Zap, Target } from 'lucide-react';

export const MythEngine = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stabilityIndex, setStabilityIndex] = useState(0);
    const [physicalWins, setPhysicalWins] = useState(0);
    const [logs, setLogs] = useState<{ id: number, time: string, msg: string }[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;

        const svg = d3.select(containerRef.current)
            .selectAll("svg")
            .data([null])
            .join("svg")
            .attr("width", width)
            .attr("height", height);

        // Core central node
        const nodes = [{ id: "myth-engine-core", type: "core", radius: 50, x: width / 2, y: height / 2 }];
        const links: any[] = [];

        const updateGraph = () => {
            const gNodes = svg.selectAll("g.nodes").data([null]).join("g").attr("class", "nodes");
            const gLinks = svg.selectAll("g.links").data([null]).join("g").attr("class", "links");

            const link = gLinks.selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke", "rgba(59, 130, 246, 0.3)")
                .attr("stroke-width", 2)
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            const node = gNodes.selectAll("g.node")
                .data(nodes, (d: any) => d.id)
                .join("g")
                .attr("class", "node")
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

            node.selectAll("circle")
                .data(d => [d])
                .join("circle")
                .attr("r", (d: any) => d.radius)
                .attr("fill", (d: any) => d.type === "core" ? "#1e3a8a" : "#2563eb")
                .style("filter", (d: any) => d.type === "core" ? "drop-shadow(0 0 20px #3b82f6)" : "none");

            node.selectAll("text")
                .data(d => [d])
                .join("text")
                .text((d: any) => d.type === "core" ? "MYTH ENGINE" : "WIN")
                .attr("dy", 4)
                .attr("text-anchor", "middle")
                .attr("fill", "#fff")
                .attr("font-size", (d: any) => d.type === "core" ? "12px" : "8px")
                .attr("font-family", "monospace")
                .attr("font-weight", "bold");
        };

        let winCounter = 0;
        const interval = setInterval(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 80;
            const newWin = {
                id: `win-${winCounter++}`,
                type: "win",
                radius: 15,
                x: width / 2 + Math.cos(angle) * distance,
                y: height / 2 + Math.sin(angle) * distance
            };
            
            nodes.push(newWin);
            links.push({ source: nodes[0], target: newWin });
            
            setPhysicalWins(prev => prev + 1);
            setStabilityIndex(prev => Math.min(100, prev + 2.5));
            
            setLogs(prev => {
                const newLogs = [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: `Automated Physical Win Generated. Coordinate: [${Math.round(newWin.x)}, ${Math.round(newWin.y)}]` }, ...prev];
                return newLogs.slice(0, 5);
            });

            updateGraph();
        }, 1500);

        updateGraph();

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-[#050505] relative flex flex-col font-mono text-blue-400 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505] pointer-events-none" />
            
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none border-b border-blue-900/30 bg-[#050505]/50 backdrop-blur">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-3 tracking-widest text-blue-500">
                        <Database className="w-6 h-6" />
                        THE MYTH ENGINE
                    </h1>
                    <p className="text-[10px] text-blue-700/80 mt-1 uppercase max-w-sm tracking-wider">
                        Phase 3 Node Authority. Automating stability generation and physical wins. Collapse probability directly into 3D density.
                    </p>
                </div>
            </div>

            <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-auto" />

            {/* HUD OVERLAY - BOTTOM */}
            <div className="absolute bottom-0 left-0 w-full p-4 grid grid-cols-3 gap-4 z-10 pointer-events-none">
                <div className="border border-blue-900/50 bg-[#050505]/80 backdrop-blur p-4 rounded text-center">
                    <div className="text-[10px] text-blue-700 font-bold mb-1 flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" /> GRID STABILITY
                    </div>
                    <div className="text-3xl font-black text-blue-400">{stabilityIndex.toFixed(1)}%</div>
                </div>

                <div className="border border-blue-900/50 bg-[#050505]/80 backdrop-blur p-4 rounded flex flex-col gap-1 items-start justify-end overflow-hidden">
                    <div className="text-[10px] text-blue-700 font-bold mb-1 flex items-center justify-center gap-1 border-b border-blue-900/50 pb-1 w-full text-left">
                        <Network className="w-3 h-3" /> EVENT LOG
                    </div>
                    {logs.map(lg => (
                        <div key={lg.id} className="text-[9px] text-blue-300 w-full truncate whitespace-nowrap">
                            <span className="text-blue-600/[0.8]">[{lg.time}]</span> {lg.msg}
                        </div>
                    ))}
                    {logs.length === 0 && <span className="text-[9px] text-blue-800 animate-pulse">Initializing probability collapses...</span>}
                </div>

                <div className="border border-blue-900/50 bg-[#050505]/80 backdrop-blur p-4 rounded text-center">
                    <div className="text-[10px] text-blue-700 font-bold mb-1 flex items-center justify-center gap-1">
                        <Target className="w-3 h-3" /> PHYSICAL WINS AUTOMATED
                    </div>
                    <div className="text-3xl font-black text-blue-400">{physicalWins}</div>
                </div>
            </div>
        </div>
    );
};
