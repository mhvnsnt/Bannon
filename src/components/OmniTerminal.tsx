import React, { useState } from 'react';
import { OmniExecutionSandbox } from '../utils/OmniExecutionSandbox';

export const OmniTerminal: React.FC = () => {
    const [logs, setLogs] = useState<string[]>(["// OmniExecution Sandbox initializing..."]);
    const [language, setLanguage] = useState<'python' | 'node' | 'rust'>('python');
    const [code, setCode] = useState<string>('print("Hello World")');
    const [isBooted, setIsBooted] = useState(false);

    const log = (msg: string) => setLogs(l => [...l, msg]);

    const handleBoot = async () => {
        const success = await OmniExecutionSandbox.bootSandbox(log);
        setIsBooted(success);
    };

    const handleExecute = async () => {
        if (!isBooted) {
            log("[Error] Sandbox kernel not booted.");
            return;
        }
        log(`> Executing ${language} script...`);
        try {
            const output = await OmniExecutionSandbox.executeCode(language, code);
            log(output);
        } catch (e: any) {
            log(`[Crash] ${e.message}`);
        }
    };

    return (
        <div className="bg-black/90 p-4 border border-[#00F5D4] rounded-lg shadow-[0_0_20px_rgba(0,245,212,0.2)] max-w-2xl mx-auto my-8 font-mono">
            <div className="flex justify-between items-center mb-4 border-b border-[#00F5D4]/30 pb-2">
                <h3 className="text-[#00F5D4] font-bold text-sm uppercase tracking-widest flex items-center">
                    <span className="w-2 h-2 bg-[#00F5D4] rounded-full animate-pulse mr-2" />
                    WASM Omni-Sandbox
                </h3>
                <div className="space-x-2">
                    <select 
                        className="bg-slate-800 text-xs text-white border border-slate-600 rounded px-2 py-1 outline-none"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                    >
                        <option value="python">Python (Pyodide)</option>
                        <option value="rust">Rust (WASM)</option>
                        <option value="node">Node.js (WebContainer)</option>
                    </select>
                    {!isBooted ? (
                        <button onClick={handleBoot} className="bg-[#00F5D4]/20 hover:bg-[#00F5D4]/40 text-[#00F5D4] text-xs px-3 py-1 rounded transition-colors">
                            Boot Kernel
                        </button>
                    ) : (
                        <button onClick={handleExecute} className="bg-[#F15BB5]/20 hover:bg-[#F15BB5]/40 text-[#F15BB5] text-xs px-3 py-1 rounded transition-colors">
                            Execute Payload
                        </button>
                    )}
                </div>
            </div>

            <textarea 
                className="w-full h-32 bg-slate-900 text-[#00F5D4] text-xs p-3 rounded border border-slate-700 outline-none focus:border-[#00F5D4]/50 font-mono mb-4 resize-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
            />

            <div className="bg-[#0d1117] h-40 overflow-y-auto p-3 rounded border border-slate-800 text-[10px] space-y-1">
                {logs.map((l, i) => (
                    <div key={i} className={l.includes('Error') || l.includes('Crash') ? 'text-red-400' : 'text-slate-400'}>
                        {l}
                    </div>
                ))}
            </div>
        </div>
    );
};
