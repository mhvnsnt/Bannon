import React, { useState } from 'react';

export function VoidMonitor() {
    const [tokenWeightAvoided, setTokenWeightAvoided] = useState("1.2M");
    const [compressionMode, setCompressionMode] = useState<'AUTO' | 'ALWAYS' | 'OFF'>('AUTO');
    const [fileChunks, setFileChunks] = useState([
        { id: 1, label: 'Header & Imports', lines: 45, active: true },
        { id: 2, label: 'class PhysicsEngine', lines: 120, active: false },
        { id: 3, label: 'function updatePhysics()', lines: 502, active: true },
        { id: 4, label: 'class CollisionResolver', lines: 340, active: false },
        { id: 5, label: 'function renderMat()', lines: 180, active: false },
        { id: 6, label: 'function applyImpact()', lines: 195, active: true },
        { id: 7, label: 'helper functions', lines: 250, active: false }
    ]);

    const toggleChunk = (id: number) => {
        setFileChunks(prev => prev.map(chunk => 
            chunk.id === id ? { ...chunk, active: !chunk.active } : chunk
        ));
    };

    return (
        <div id="void-monitor-panel" className="void-monitor bg-zinc-950 p-6 rounded-xl border border-green-500/40 shadow-lg shadow-green-950/20 max-w-2xl mx-auto font-mono text-xs text-green-400">
            <div className="flex items-center justify-between border-b border-green-500/20 pb-3 mb-4">
                <span className="text-sm font-bold tracking-wider uppercase">⚡ VOID COMPRESSION STATE MATRIX</span>
                <span className="bg-green-500/10 text-[10px] px-2 py-0.5 rounded border border-green-500/20 animate-pulse">SYSTEM ONLINE</span>
            </div>

            {/* Token avoided dial/meter */}
            <div className="mb-6 p-4 bg-zinc-900/60 rounded-lg border border-green-500/10 flex items-center justify-between">
                <div>
                    <div className="text-gray-400 text-[10px] uppercase mb-1">Token Weight Avoided</div>
                    <div className="text-xl font-bold text-green-300 font-sans tracking-tight">
                        Saved <span className="text-2xl text-green-400 font-bold font-mono">{tokenWeightAvoided}</span> tokens this session
                    </div>
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-green-500 border-t-transparent animate-spin"></div>
            </div>

            {/* File Map Visualizer (as a vertical bar of chunks) */}
            <div className="mb-6">
                <div className="text-gray-400 text-[10px] uppercase mb-3 flex justify-between">
                    <span>File Map Architecture</span>
                    <span className="text-green-500/60">Target: bannon.html (6,900 lines)</span>
                </div>
                
                <div className="flex flex-col gap-1.5 border border-zinc-800 p-3 rounded bg-zinc-900/40">
                    {fileChunks.map(chunk => (
                        <div 
                            key={chunk.id}
                            onClick={() => toggleChunk(chunk.id)}
                            className={`group relative flex items-center justify-between p-2.5 rounded cursor-pointer transition-all duration-200 border ${
                                chunk.active 
                                ? 'bg-green-500/10 border-green-500/40 hover:bg-green-500/20' 
                                : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`h-2 w-2 rounded-full ${chunk.active ? 'bg-green-400 border border-green-300' : 'bg-zinc-700'}`}></div>
                                <span className={`text-[11px] ${chunk.active ? 'text-green-300 font-bold' : 'text-gray-500'}`}>
                                    {chunk.label}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-mono">{chunk.lines} lines</span>
                                <span className={`text-[9px] uppercase px-1.5 rounded tracking-wide ${
                                    chunk.active 
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                    : 'bg-zinc-800 text-gray-500'
                                }`}>
                                    {chunk.active ? 'EXTRACTED' : 'VOID COMPRESSED'}
                                </span>
                            </div>

                            {/* Hover tooltip */}
                            <div className="absolute left-1/4 -top-8 hidden group-hover:block bg-zinc-950 border border-green-500/30 p-1 px-2 rounded text-[10px] text-white z-50 shadow">
                                {chunk.active 
                                    ? `Directly targetable in primary context` 
                                    : `Compressed into a 1-line skeletal stub`
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Direct Toggle of modes */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-green-500/10 pt-4">
                <span className="text-gray-400 text-[10px] uppercase">Compression Logic Boundary:</span>
                <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg border border-green-500/10 self-start sm:self-auto">
                    {(['AUTO', 'ALWAYS', 'OFF'] as const).map(mode => (
                        <button
                            key={mode}
                            id={`mode-toggle-${mode}`}
                            onClick={() => setCompressionMode(mode)}
                            className={`px-3 py-1.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                                compressionMode === mode 
                                ? 'bg-green-500 text-zinc-950 font-black shadow shadow-green-500/20' 
                                : 'text-gray-500 hover:text-green-400 hover:bg-zinc-800/40'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default VoidMonitor;
