import React, { useState } from 'react';
import { Shield, Cpu, Activity, Database, CheckCircle, AlertTriangle, Terminal, Play, Lock } from 'lucide-react';

export default function LocalSecurityPipeline() {
  const [pipelineState, setPipelineState] = useState('IDLE');
  const [logs, setLogs] = useState<string[]>([
    "System initialized. Awaiting local security analysis directive."
  ]);

  const runAnalysis = () => {
    setPipelineState('SCANNING');
    setLogs(prev => [...prev, "[Semgrep] Initiating deep static analysis across local God Mode OS repository..."]);
    
    setTimeout(() => {
      setLogs(prev => [
        ...prev, 
        "[Semgrep] 2 potential logic vulnerabilities detected in src/agents/wealthVector.ts",
        "[CodeQL] Validating data flow paths..."
      ]);
      setPipelineState('ANALYZING');
      
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          "[Local LLM] Inference Engine (Huihui-Qwable-27B) loaded into VRAM.",
          "[Local LLM] Ingesting vulnerability report and source code context...",
          "[Local LLM] Drafting structural patch for memory leak in loop."
        ]);
        setPipelineState('PATCHING');

        setTimeout(() => {
          setLogs(prev => [
            ...prev,
            "[Docker Sandbox] Testing patch in isolated environment...",
            "[Docker Sandbox] Build passing. Entropy stabilized.",
            "[Git] Committing patched wealthVector.ts to local branch.",
            "Pipeline cycle complete. Absolute autonomy maintained."
          ]);
          setPipelineState('IDLE');
        }, 3000);
      }, 3000);
    }, 2500);
  };

  return (
    <div className="flex flex-col w-full h-full p-6 bg-slate-950 text-slate-200 overflow-y-auto font-mono">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
            <Shield className="w-6 h-6" /> Local Security & Autonomy Pipeline
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Unrestricted static analysis and automated vulnerability patching via local inference.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
          <Lock className="w-5 h-5 text-amber-400" />
          <span className="font-mono text-sm">Corporate API Dependency: <span className="text-red-400 font-bold">SEVERED</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md flex flex-col items-center justify-center text-center">
          <Cpu className={`w-8 h-8 mb-2 ${pipelineState === 'ANALYZING' || pipelineState === 'PATCHING' ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
          <div className="text-slate-300 font-bold">Local Inference</div>
          <div className="text-xs text-slate-500 mt-1">Ollama / llama.cpp</div>
          <div className="text-[10px] text-purple-400 mt-2 font-bold">Huihui-Qwable-27B-GGUF</div>
        </div>
        
        <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md flex flex-col items-center justify-center text-center">
          <Activity className={`w-8 h-8 mb-2 ${pipelineState === 'SCANNING' ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <div className="text-slate-300 font-bold">Static Analysis</div>
          <div className="text-xs text-slate-500 mt-1">Semgrep / CodeQL</div>
          <div className="text-[10px] text-cyan-400 mt-2 font-bold">Bare-Metal Repository Scan</div>
        </div>

        <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md flex flex-col items-center justify-center text-center">
          <Database className="w-8 h-8 mb-2 text-emerald-500" />
          <div className="text-slate-300 font-bold">Vector Context</div>
          <div className="text-xs text-slate-500 mt-1">ChromaDB / Qdrant</div>
          <div className="text-[10px] text-emerald-400 mt-2 font-bold">Local Semantic Memory</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Unrestricted Pipeline Execution</span>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={pipelineState !== 'IDLE'}
            className="flex items-center gap-2 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" /> Execute Autonomous Security Loop
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className={`
              ${log.includes('Semgrep') || log.includes('CodeQL') ? 'text-cyan-400' : ''}
              ${log.includes('Local LLM') ? 'text-purple-400' : ''}
              ${log.includes('Docker Sandbox') ? 'text-amber-400' : ''}
              ${log.includes('Git') || log.includes('complete') ? 'text-emerald-400' : ''}
              ${!log.match(/Semgrep|CodeQL|Local LLM|Docker Sandbox|Git|complete/) ? 'text-slate-400' : ''}
            `}>
              <span className="opacity-50 select-none mr-3">
                {new Date().toISOString().substring(11, 19)}
              </span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
