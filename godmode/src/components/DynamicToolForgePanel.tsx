import React, { useState } from 'react';
import { Terminal, Code, Cpu } from 'lucide-react';

export default function DynamicToolForgePanel() {
  const [taskName, setTaskName] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [output, setOutput] = useState('');
  const [isForging, setIsForging] = useState(false);

  const handleForge = async () => {
    setIsForging(true);
    try {
      const response = await fetch('/api/dynamic-tool-forge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskName, scriptContent }),
      });
      const data = await response.json();
      setOutput(data.output || data.error || 'No output.');
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-emerald-500 font-mono p-4">
      <div className="flex items-center gap-3 mb-4">
        <Cpu className="text-emerald-400 w-6 h-6" />
        <h2 className="text-lg font-bold tracking-widest uppercase">Dynamic Tool Forge</h2>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div>
          <label className="block text-xs uppercase text-emerald-700 mb-1">Task / Tool Name</label>
          <input
            type="text"
            className="w-full bg-[#0a0a0a] border border-emerald-900 text-emerald-400 p-2 text-sm outline-none focus:border-emerald-500"
            placeholder="e.g. read_system_metrics"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <label className="block text-xs uppercase text-emerald-700 mb-1">Node.js Script Content</label>
          <textarea
            className="flex-1 w-full bg-[#0a0a0a] border border-emerald-900 text-emerald-400 p-2 text-sm outline-none focus:border-emerald-500 font-mono resize-none custom-scrollbar"
            placeholder="console.log('Actuator activated...');"
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
          />
        </div>

        <button
          onClick={handleForge}
          disabled={isForging || !taskName || !scriptContent}
          className="bg-emerald-900/40 border border-emerald-500/50 hover:bg-emerald-900/60 text-emerald-400 py-2 uppercase tracking-widest text-sm font-bold transition-colors disabled:opacity-50"
        >
          {isForging ? 'Synthesizing...' : 'Synthesize & Execute Actuator'}
        </button>

        <div className="h-48 border border-emerald-900/50 bg-[#020202] p-2 overflow-y-auto">
          <label className="block text-[10px] uppercase text-emerald-800 mb-2">Execution Output</label>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">{output}</pre>
        </div>
      </div>
    </div>
  );
}
