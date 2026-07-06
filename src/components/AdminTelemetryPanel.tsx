import React, { useState, useEffect, useRef } from 'react';
import { GhostWriter } from '../utils/GhostWriter';
import { GitDeploymentManager } from '../utils/GitDeploymentManager';
import { AssetVault } from '../services/AssetVault';
import { PanopticonSpectator } from './PanopticonSpectator';
import { Panopticon } from '../utils/Panopticon';

export const AdminTelemetryPanel: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [spectatingUser, setSpectatingUser] = useState<string | null>(null);
    const [isGhostActive, setIsGhostActive] = useState(false);
    const [activeTarget, setActiveTarget] = useState<string | null>(null);
    const [terminalOutput, setTerminalOutput] = useState<string[]>(['> CODEDUMMY SYSTEM ONLINE', '> WAITING FOR FS DIRECTIVE...']);
    const [inputValue, setInputValue] = useState('');
    const endOfTerminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const toggle = () => setIsVisible(v => !v);
        const onGhostActive = (e: any) => { 
            setIsGhostActive(true); 
            setActiveTarget(e.detail?.filePath || null); 
            logToTerminal(`[MUTATION ENGINE] Active: Morphing AST of ${e.detail?.filePath}...`);
        };
        const onGhostIdle = () => {
            setIsGhostActive(false);
            logToTerminal(`[MUTATION ENGINE] Hot-swap complete. System idle.`);
        };
        
        window.addEventListener('toggle-autonomous-shell', toggle);
        window.addEventListener('ghost-writer-active', onGhostActive);
        window.addEventListener('ghost-writer-idle', onGhostIdle);
        return () => {
            window.removeEventListener('toggle-autonomous-shell', toggle);
            window.removeEventListener('ghost-writer-active', onGhostActive);
            window.removeEventListener('ghost-writer-idle', onGhostIdle);
        };
    }, []);

    useEffect(() => {
        if (endOfTerminalRef.current) {
            endOfTerminalRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [terminalOutput]);

    const logToTerminal = (msg: string) => {
        setTerminalOutput(prev => [...prev, `> ${msg}`]);
    };

    const handleGrantFSAccess = async () => {
        const success = await GhostWriter.requestProjectAccess();
        if (success) {
            logToTerminal("[SYSTEM] Root filesystem access GRANTED.");
            logToTerminal("[SYSTEM] GhostWriter mutation APIs are now unlocked.");
        } else {
            logToTerminal("[ERROR] Filesystem access DENIED.");
        }
    };

    const handleTriggerSelfImprovement = () => {
        window.dispatchEvent(new CustomEvent('trigger-self-mutation'));
    };

    const handleTerminalCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const cmd = inputValue.trim();
            setInputValue('');
            logToTerminal(cmd);
            
            if (cmd.startsWith('mutate ')) {
                const target = cmd.split(' ')[1];
                logToTerminal(`[TARGET LOCK] Directing mutation engine to ${target}...`);
                window.dispatchEvent(new CustomEvent('trigger-targeted-mutation', { detail: { target } }));
            } else if (cmd === 'scan') {
                logToTerminal("[SCANNER] Deep-scanning local file structure for performance bottlenecks...");
                setTimeout(() => logToTerminal("[SCANNER] Found 3 degradation signatures in src/App.tsx"), 800);
            } else if (cmd === 'clear') {
                setTerminalOutput([]);
            } else {
                logToTerminal(`[ERROR] Unknown command '${cmd}'. Try: scan, mutate <file.tsx>, clear`);
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/95 border border-slate-700 p-6 rounded-xl pointer-events-auto shadow-2xl backdrop-blur-xl w-full max-w-4xl text-white font-mono flex flex-col h-[80vh]">
                
                {/* HEADER */}
                <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-700 pb-4">
                    <h2 className="text-xl font-bold text-[#FFB703] uppercase tracking-widest flex items-center">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-3"></span>
                        God-Mode OS Shell // CodeDummy Integration
                    </h2>
                    <button onClick={() => setIsVisible(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>
                
                {/* METRICS & GRIDS */}
                <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-sm text-slate-400 mb-2 uppercase tracking-wider">Memory Matrix</h3>
                        <div className="flex justify-between text-sm">
                            <span>V8 Heap</span>
                            <span className="text-green-400">STABLE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Leak Detect</span>
                            <span className="text-[#2EC4B6] font-bold">ACTIVE</span>
                        </div>
                    </div>
                    
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-sm text-slate-400 mb-2 uppercase tracking-wider">Cloud Grid Sync</h3>
                        <div className="flex justify-between text-sm">
                            <span>Active Peers</span>
                            <span className="text-blue-400">0</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>CRDT Rate</span>
                            <span className="text-[#FF9F1C] font-bold">60Hz</span>
                        </div>
                    </div>
                </div>

                {/* TERMINAL ENCLOSURE */}
                <div className="flex-1 bg-black rounded-lg border border-slate-800 p-4 font-mono text-sm overflow-hidden flex flex-col mb-6 relative">
                    <div className="absolute top-2 right-4 text-xs text-slate-500 uppercase">Self-Mutation CLI</div>
                    <div className="flex-1 overflow-y-auto space-y-1 mb-4 text-[#00F5D4]">
                        {terminalOutput.map((line, i) => (
                            <div key={i} className={line.includes('[ERROR]') ? 'text-red-400' : line.includes('[MUTATION ENGINE]') ? 'text-[#F15BB5]' : ''}>
                                {line}
                            </div>
                        ))}
                        <div ref={endOfTerminalRef} />
                    </div>
                    <div className="flex items-center text-[#FFB703] shrink-0 border-t border-slate-800 pt-2">
                        <span className="mr-2">root@codedummy:~#</span>
                        <input 
                            type="text" 
                            className="bg-transparent border-none outline-none flex-1 text-[#FFB703]" 
                            autoFocus
                            spellCheck={false}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleTerminalCommand}
                        />
                    </div>
                </div>

                
                
                {/* GOD-MODE SURVEILLANCE & ASSETS */}
                <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                    <button 
                        onClick={async () => {
                            const assets = await AssetVault.getGlobalAssetRegistry();
                            logToTerminal(`[PANOPTICON] Global assets hijacked: ${JSON.stringify(assets)}`);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-[#F15BB5] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Hijack Global Assets
                    </button>
                    <button 
                        onClick={() => {
                            const p = new Panopticon();
                            setSpectatingUser('target_user_882');
                            logToTerminal("[PANOPTICON] Initializing Spectator Canvas for target_user_882...");
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-[#00F5D4] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Spectate User (Shadow Clone)
                    </button>
                </div>

                {/* DEPLOYMENT CONTROLS */}
                <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                    <button 
                        onClick={() => GitDeploymentManager.connectOAuth('github')}
                        className="bg-slate-800 hover:bg-slate-700 text-[#00F5D4] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Auth GitHub
                    </button>
                    <button 
                        onClick={() => GitDeploymentManager.connectOAuth('railway')}
                        className="bg-slate-800 hover:bg-slate-700 text-[#FF9F1C] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Auth Railway
                    </button>
                    <button 
                        onClick={async () => {
                             await GitDeploymentManager.pushToGitHub("Auto-mutated codebase via God-Mode");
                             await GitDeploymentManager.deployToRailway();
                        }}
                        className="col-span-2 bg-slate-800 hover:bg-slate-700 text-[#F15BB5] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Push to GitHub & Railway Deploy
                    </button>
                </div>

                {/* ACTION CONTROLS */}
                <div className="grid grid-cols-4 gap-4 shrink-0">
                    <button 
                        onClick={handleGrantFSAccess}
                        className="bg-slate-800 hover:bg-slate-700 text-[#F15BB5] px-4 py-3 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700">
                        Grant FS Access
                    </button>
                    <button 
                        onClick={handleTriggerSelfImprovement}
                        className="bg-slate-800 hover:bg-slate-700 text-[#00F5D4] px-4 py-3 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 relative overflow-hidden flex items-center justify-center">
                        {isGhostActive ? (
                           <span className="animate-pulse">Mutating {activeTarget}...</span>
                        ) : (
                           <span>Auto-Upgrade Mascot</span>
                        )}
                        {isGhostActive && <div className="absolute bottom-0 left-0 h-1 bg-[#00F5D4] animate-pulse w-full"></div>}
                    </button>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('trigger-heap-profile'))}
                        className="bg-slate-800 hover:bg-slate-700 text-[#FFB703] px-4 py-3 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700">
                        Run Heap Profile
                    </button>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('trigger-ast-synth'))}
                        className="bg-slate-800 hover:bg-slate-700 text-[#2EC4B6] px-4 py-3 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700">
                        Synthesize AST
                    </button>
                </div>
            </div>
        </div>
    );
};
