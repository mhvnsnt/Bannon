import React from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export function TaskHistoryDrawer({ history, onRetry }: { history: { id: string; step: string; status: 'completed' | 'failed'; duration: number }[], onRetry: (id: string) => void }) {
  return (
    <div className="bg-white border-l border-black/5 p-4 w-64 h-full shadow-sm">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-4">Task History</h2>
      <div className="flex flex-col gap-2">
        {history.map(task => (
          <div key={task.id} className="p-2 border rounded-lg flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
                {task.status === 'completed' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                <span className="font-bold">{task.step}</span>
            </div>
            {task.status === 'failed' && (
                <button onClick={() => onRetry(task.id)}><RefreshCw className="w-3 h-3 text-slate-400"/></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
