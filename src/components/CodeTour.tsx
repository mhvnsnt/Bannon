import React from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

export function CodeTour({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-2">Codebase Tour</h3>
        <p className="text-xs text-slate-600 mb-6">Welcome! This project uses a modular architecture. The core logic resides in <code>/src</code>. The agent actively parses these files to help you code.</p>
        <button onClick={onComplete} className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
            Next Step <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
