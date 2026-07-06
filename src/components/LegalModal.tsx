import React from 'react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

export default function LegalModal({ isOpen, onClose, title, content }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="panel relative z-10 w-full max-w-2xl max-h-[80vh] flex flex-col p-8 md:p-10 rounded-2xl shadow-2xl animate-in zoom-in duration-500 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors font-bold text-xl px-2">
            ×
          </button>
        </div>
        
        <div className="overflow-y-auto pr-4 text-sm text-slate-700 leading-relaxed flex-1 space-y-4">
          {content}
        </div>
      </div>
    </div>
  );
}
