import React from 'react';
import { Sparkles } from 'lucide-react';

export function CoachIcon({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-10 right-6 z-[95] w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer animate-bounce"
    >
        <Sparkles className="w-6 h-6" />
    </button>
  );
}
