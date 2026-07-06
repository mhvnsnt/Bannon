import React, { useState } from 'react';
import { X, Keyboard, Mic, Settings } from 'lucide-react';
import { cn } from '../App';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceCommandModal({ isOpen, onClose }: VoiceCommandModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'commands' | 'history'>('commands');
  const [history] = useState(['Switch to Lab', 'Optimize', 'Switch to Lab']);

  const [commands, setCommands] = useState([
    { phrase: 'Switch to Lab', action: 'Go to Agent View' },
    { phrase: 'Switch to Projects', action: 'Go to Projects View' },
    { phrase: 'Switch to Tutorial', action: 'Go to Tutorial View' },
    { phrase: 'God Mode', action: 'Admin Access' },
    { phrase: 'Optimize', action: 'Trigger Codebase Optimizer' },
    { phrase: 'Ask Qwable', action: 'Route intent through Qwable assistant for high-level brainstorming' },
  ]);

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newPhrase, setNewPhrase] = useState('');

  const handleRebind = (idx: number) => {
    if (newPhrase.trim()) {
        const updated = [...commands];
        updated[idx].phrase = newPhrase;
        setCommands(updated);
        setEditingIdx(null);
        setNewPhrase('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-black/10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-black">Voice Command Reference</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-2 mb-4 border-b border-black/5 pb-2">
            <button onClick={() => setActiveTab('commands')} className={cn("text-xs font-bold uppercase", activeTab === 'commands' ? "text-indigo-600" : "text-slate-400")}>Commands</button>
            <button onClick={() => setActiveTab('history')} className={cn("text-xs font-bold uppercase", activeTab === 'history' ? "text-indigo-600" : "text-slate-400")}>History</button>
        </div>

        {activeTab === 'commands' ? (
            <div className="space-y-3">
            {commands.map((cmd, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-black/5 gap-3">
                {editingIdx === i ? (
                    <input 
                        autoFocus
                        value={newPhrase}
                        onChange={(e) => setNewPhrase(e.target.value)}
                        onBlur={() => handleRebind(i)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRebind(i)}
                        className="flex-1 text-xs font-mono p-1 rounded border border-indigo-200 outline-none"
                    />
                ) : (
                    <span className="font-mono text-xs font-bold text-indigo-600 cursor-pointer" onClick={() => { setEditingIdx(i); setNewPhrase(cmd.phrase); }}>
                        {cmd.phrase}
                    </span>
                )}
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{cmd.action}</span>
                </div>
            ))}
            </div>
        ) : (
            <div className="space-y-2">
                {history.map((h, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded font-mono text-xs font-bold">{h}</div>
                ))}
            </div>
        )}
        
        <div className="mt-6 pt-6 border-t border-black/5 text-[10px] text-slate-400 font-mono text-center">
            {activeTab === 'commands' ? 'Click a phrase to rebind it.' : 'Last 5 voice commands.'}
        </div>
      </div>
    </div>
  );
}
