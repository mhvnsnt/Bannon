import React, { useEffect, useState, useRef } from 'react';
import { Search, MonitorPlay, Zap, LogOut, RotateCcw, FolderGit2, X } from 'lucide-react';
import { cn } from '../App';
import { supabase } from '../services/supabaseClient';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setCurrentView: (view: 'tutorial' | 'projects' | 'agent' | 'analytics') => void;
  resetProgress: () => void;
}

export default function CommandPalette({ isOpen, setIsOpen, setCurrentView, resetProgress }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('codedummy-user-email');
    localStorage.removeItem('codedummy-is-buyer');
    window.location.reload();
  };

  const commands = [
    { id: 'view-lab', name: 'Open Lab (Agent View)', icon: MonitorPlay, action: () => setCurrentView('agent') },
    { id: 'view-projects', name: 'Open Projects', icon: FolderGit2, action: () => setCurrentView('projects') },
    { id: 'view-tutorial', name: 'Open Tutorial', icon: Zap, action: () => setCurrentView('tutorial') },
    { id: 'view-analytics', name: 'Open Analytics', icon: Search, action: () => setCurrentView('analytics') },
    { id: 'reset', name: 'Reset All Progress', icon: RotateCcw, action: () => { resetProgress(); setIsOpen(false); } },
    { id: 'signout', name: 'Sign Out', icon: LogOut, action: handleSignOut },
  ];

  const filteredCommands = commands.filter(cmd => cmd.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-black/10">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none px-3 py-1 text-slate-900 placeholder:text-slate-400"
          />
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">No commands found.</p>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors active:bg-slate-100"
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">{cmd.name}</span>
                </button>
              );
            })
          )}
        </div>
        
        <div className="bg-slate-50 border-t border-black/5 px-4 py-2.5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">Use <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">↑↓</kbd> to navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
