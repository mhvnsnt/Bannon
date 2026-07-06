import React, { useState } from 'react';
import { Layers, Terminal, Database, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export default function UnifiedSessionsExplorer() {
  const [activeTab, setActiveTab] = useState('active_threads');
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`bg-[#111] border border-[#333] rounded-lg p-2 font-mono text-xs flex flex-col transition-all duration-300 ${isMinimized ? 'h-auto' : 'h-48'}`}>
      <div className="flex items-center gap-2 pb-2 border-[#333] border-b">
        <Layers className="w-4 h-4 text-pink-500 shrink-0" />
        <span className="text-gray-200 font-bold tracking-widest uppercase truncate select-none">Sessions Explorer</span>
        
        {isMinimized && (
          <span className="text-[10px] text-pink-500/80 bg-pink-500/10 px-1.5 py-0.5 rounded ml-2 font-semibold">
            3 Active
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!isMinimized && (
            <div className="flex gap-2">
               <button 
                 onClick={() => setActiveTab('active_threads')}
                 className={`px-2 py-1 rounded transition-colors text-[10px] ${activeTab === 'active_threads' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 Threads
               </button>
               <button 
                 onClick={() => setActiveTab('archived_logs')}
                 className={`px-2 py-1 rounded transition-colors text-[10px] ${activeTab === 'archived_logs' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 Logs
               </button>
            </div>
          )}
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"
            title={isMinimized ? "Expand Sessions Explorer" : "Minimize Sessions Explorer"}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto mt-2">
          {activeTab === 'active_threads' && (
            <div className="flex flex-col gap-1 space-y-1">
              <div className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] rounded cursor-pointer group">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span className="text-gray-300 group-hover:text-white transition-colors truncate">OS Root - Matrix Nav Node</span>
                <span className="ml-auto text-gray-600 text-[10px]">Active</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] rounded cursor-pointer group bg-[#1a1a1a]">
                <Database className="w-3 h-3 text-fuchsia-400 animate-pulse" />
                <span className="text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors truncate">BANNON Physics Scaffold V72</span>
                <span className="ml-auto text-fuchsia-600 text-[10px]">Editing</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] rounded cursor-pointer group">
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span className="text-gray-300 group-hover:text-white transition-colors truncate">Hardware Node Telemetry</span>
                <span className="ml-auto text-gray-600 text-[10px]">Idle</span>
              </div>
            </div>
          )}

          {activeTab === 'archived_logs' && (
            <div className="flex flex-col gap-1 space-y-1 opacity-60">
               <div className="flex items-center gap-2 p-2 rounded cursor-not-allowed">
                <span className="text-[10px] text-gray-500">No archived logs in memory.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
