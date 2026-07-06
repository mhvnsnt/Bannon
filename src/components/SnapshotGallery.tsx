import React from 'react';
import { Camera, RefreshCcw, GitMerge, AlertCircle } from 'lucide-react';

interface Snapshot {
  id: string;
  timestamp: string;
  previewUrl: string;
  hasConflict?: boolean;
}

export function SnapshotGallery() {
  // Mock data for now
  const snapshots: Snapshot[] = [
    { id: '1', timestamp: '2026-07-04 10:00', previewUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' },
    { id: '2', timestamp: '2026-07-04 09:30', previewUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=300&q=80', hasConflict: true },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
          <Camera className="w-4 h-4" /> Snapshot Gallery
        </h3>
        <button className="text-xs font-mono text-indigo-600 flex items-center gap-1 hover:underline">
          <RefreshCcw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {snapshots.map(s => (
          <div key={s.id} className="relative group cursor-pointer border rounded-lg overflow-hidden">
            {s.hasConflict && (
                <div className="absolute top-1 left-1 z-10 bg-red-500 text-white p-0.5 rounded"><AlertCircle className="w-3 h-3"/></div>
            )}
            <img src={s.previewUrl} alt="Snapshot" className="w-full h-24 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
              <button className="bg-white text-[10px] font-bold px-2 py-1 rounded">RESTORE</button>
              {s.hasConflict && (
                  <button className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><GitMerge className="w-3 h-3"/> MERGE</button>
              )}
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-1 px-1">{s.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
