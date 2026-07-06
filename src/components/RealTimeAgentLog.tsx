import React, { useEffect, useState } from 'react';
import { Activity, PanelRightClose } from 'lucide-react';
import { subscribeToAgentStream } from '../services/firebaseClient';

interface RealTimeAgentLogProps {
  sessionId: string;
  onClose: () => void;
}

export default function RealTimeAgentLog({ sessionId, onClose }: RealTimeAgentLogProps) {
  const [agentStream, setAgentStream] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAgentStream(sessionId, (data) => {
      if (Array.isArray(data)) {
        setAgentStream(data);
      } else {
        setAgentStream((prev) => [...prev, { id: Math.random().toString(), text: data.text }]);
      }
    });
    return () => unsubscribe();
  }, [sessionId]);

  return (
    <aside className="w-80 border-l border-emerald-500/20 bg-slate-950 flex flex-col h-full overflow-hidden select-none shrink-0 text-emerald-400">
      <div className="p-4 border-b border-emerald-900/40 bg-slate-900 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <div>
            <h3 className="text-xs font-black text-emerald-300 uppercase tracking-widest">
              Live Stream
            </h3>
            <p className="text-[9px] font-mono uppercase tracking-wider text-emerald-600/70">
              Firebase Firestore
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-emerald-600/50 hover:text-emerald-400 hover:bg-emerald-900/20 transition-colors"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-2">
        {agentStream.length === 0 ? (
          <div className="text-emerald-700/50 text-center mt-10">Awaiting thought process...</div>
        ) : (
          agentStream.map((log) => (
            <div key={log.id} className="pb-2 border-b border-emerald-900/20 break-words leading-relaxed">
              <span className="text-emerald-600/60 mr-2">{'>'}</span>
              {log.text}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
