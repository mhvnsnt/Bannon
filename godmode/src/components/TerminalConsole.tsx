import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, Minimize2, Maximize2, Play, CircleDot, TerminalSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryItem {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export function TerminalConsole({ isExpanded, onToggleExpand, onClose }: { isExpanded: boolean, onToggleExpand: () => void, onClose: () => void }) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 'boot', type: 'system', content: 'Nexus Terminal Actuator [v9.0.0] online. Connected to bare metal hardware port.', timestamp: new Date() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const pushHistory = (type: HistoryItem['type'], content: string) => {
    setHistory(prev => [...prev, { id: Math.random().toString(), type, content, timestamp: new Date() }]);
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    if (cmd === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }

    pushHistory('input', cmd);
    setInput('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/armada/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      
      const data = await res.json();
      if (data.output?.trim()) pushHistory('output', data.output);
      if (data.errorOutput?.trim()) pushHistory('error', data.errorOutput);
      if (data.exitCode !== 0 && !data.errorOutput) pushHistory('error', `Command exited with code ${data.exitCode}`);
      
      if (!data.output && !data.errorOutput && data.exitCode === 0) {
        pushHistory('system', '[Process completed silently]');
      }
    } catch (e: any) {
      pushHistory('error', e.message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  return (
    <div className={`flex flex-col bg-[#050505] border-t border-white/10 transition-all duration-300 ease-in-out ${isExpanded ? 'h-80' : 'h-10'}`}>
      {/* Header bar */}
      <div 
        className="h-10 flex items-center justify-between px-4 bg-[#0a0a0a] cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest">Bare Metal Actuator</span>
          {isProcessing && <CircleDot className="w-3 h-3 text-amber-500 animate-pulse ml-2" />}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} 
            className="p-1 hover:bg-white/10 rounded text-gray-500 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded text-gray-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden flex flex-col font-mono text-[11px] p-2 text-gray-300">
          <div className="flex-1 overflow-y-auto px-2 space-y-1.5 no-scrollbar">
            {history.map(item => (
              <div key={item.id} className="flex gap-2 whitespace-pre-wrap word-break">
                {item.type === 'input' && <span className="text-emerald-500 shrink-0">nexus@root:~#</span>}
                {item.type === 'system' && <span className="text-blue-500 shrink-0">[-]</span>}
                <span className={`
                  ${item.type === 'error' ? 'text-rose-400' : ''}
                  ${item.type === 'input' ? 'text-white font-bold' : ''}
                  ${item.type === 'system' ? 'text-gray-500 italic' : ''}
                  ${item.type === 'output' ? 'text-gray-300' : ''}
                `}>
                  {item.content}
                </span>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleCommand} className="mt-2 flex items-center gap-2 px-2 pb-1 text-emerald-500">
            <span className="shrink-0 font-bold text-emerald-500">nexus@root:~#</span>
            <input 
              ref={inputRef}
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              className="flex-1 bg-transparent border-none outline-none text-white font-bold placeholder:text-gray-700"
              placeholder="Enter bash command (e.g., npm run lint, ls -la)"
              autoFocus
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        </div>
      )}
    </div>
  );
}
