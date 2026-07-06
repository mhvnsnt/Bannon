import React from 'react';
import { X, Trash2 } from 'lucide-react';

export function OfflineLogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl">
        <div className="flex justify-between mb-4">
            <h3 className="font-bold">Offline Action Log</h3>
            <button onClick={onClose}><X/></button>
        </div>
        <div className="h-64 overflow-y-auto space-y-2">
            <div className="flex justify-between p-2 border rounded"><span>Action A</span><Trash2 className="w-4 h-4 text-red-500 cursor-pointer"/></div>
        </div>
      </div>
    </div>
  );
}
