import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../App';

interface SyncStatusProps {
  pendingCount: number;
  isConnected: boolean;
  onFlush: () => void;
  onViewLogs: () => void;
}

export function SyncStatus({ pendingCount, isConnected, onFlush, onViewLogs }: SyncStatusProps) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border bg-white">
      <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
      <span onClick={onViewLogs} className="cursor-pointer">{isConnected ? "Cloud Sync" : "Local-First"}</span>
      
      {pendingCount > 0 && (
        <>
          <span className="text-slate-300">|</span>
          <button 
            onClick={onFlush}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors font-bold uppercase"
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            {pendingCount} Pending
          </button>
        </>
      )}
    </div>
  );
}
