import React, { useEffect } from 'react';
import { X, Command, Code, MessageSquare, Compass, Maximize } from 'lucide-react';

export function ShortcutHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && e.target instanceof HTMLElement && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (!isOpen) {
          e.preventDefault();
          // We need a way to open it... App.tsx should handle the global ? key.
        }
      }
    };
    // Let App.tsx handle it since it controls state, just do escape to close here
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 dark:text-white p-8 rounded-3xl w-full max-w-xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-black mb-2 flex items-center gap-2"><Command className="w-6 h-6"/> Keyboard Shortcuts</h2>
        <p className="text-slate-500 mb-8 text-sm">Navigate and control the workspace with these hotkeys.</p>
        
        <div className="space-y-4">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <span className="font-bold flex items-center gap-2"><Command className="w-4 h-4 text-slate-400"/> Command Palette</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-bold">Cmd + K</kbd>
            </div>
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <span className="font-bold flex items-center gap-2"><Code className="w-4 h-4 text-slate-400"/> Toggle Code Editor (Agent)</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-bold">Cmd + E</kbd>
            </div>
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <span className="font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4 text-slate-400"/> Focus Chat Input</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-bold">/</kbd>
            </div>
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <span className="font-bold flex items-center gap-2"><Compass className="w-4 h-4 text-slate-400"/> Navigate Views</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-bold">Cmd + 1-4</kbd>
            </div>
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <span className="font-bold flex items-center gap-2"><Maximize className="w-4 h-4 text-slate-400"/> Fullscreen Mode</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-bold">F11</kbd>
            </div>
        </div>
      </div>
    </div>
  );
}
