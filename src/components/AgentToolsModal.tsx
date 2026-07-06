import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minimize2, Maximize2, Zap } from 'lucide-react';
import { GitHubIntegration } from './GitHubIntegration';
 // wait, cn might be in a different path. It's usually imported from lib/utils.ts or from App.tsx. I'll just copy it or import from App.tsx.

interface AgentToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function AgentToolsModal({ isOpen, onClose, userId }: AgentToolsModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 z-[110] flex flex-col bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden"
          style={{ width: '90vw', maxWidth: '400px', maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800 cursor-move shrink-0">
            <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wider uppercase">
              <Zap className="w-4 h-4 text-indigo-400" />
              Agent Tools
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)} 
                className="p-1.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={onClose} 
                className="p-1.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 bg-slate-900">
              <GitHubIntegration userId={userId} />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
