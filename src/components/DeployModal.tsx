import React, { useState } from 'react';
import { Rocket, Copy, Check, ExternalLink, X } from 'lucide-react';

export default function DeployModal({ isOpen, onClose, deployUrl }: { isOpen: boolean, onClose: () => void, deployUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-black/10 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-black transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Rocket className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Deployment Successful!</h3>
          <p className="text-sm text-slate-500 mb-6">Your code is live. Anyone with the link can view your public sandbox.</p>
          
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center gap-2 mb-6">
            <div className="flex-1 overflow-x-auto whitespace-nowrap text-xs font-mono text-emerald-700 px-3 py-2 select-all no-scrollbar text-left">
              {deployUrl}
            </div>
            <button
              onClick={() => {
                if (deployUrl) navigator.clipboard.writeText(deployUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 shrink-0 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-black hover:bg-slate-100 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          
          <a
            href={deployUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-black text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            Open in New Tab
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
