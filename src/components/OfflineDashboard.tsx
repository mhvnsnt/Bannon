import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, CloudLightning, ArrowUpCircle, RefreshCw, Layers, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import { getFromIndexedDB, DBChatHistoryItem, deleteFromIndexedDB } from '../utils/indexedDB';

interface SyncQueueItem {
  id: string;
  type: 'prompt' | 'metadata_save' | 'snapshot';
  description: string;
  payload: any;
  queuedAt: string;
}

export default function OfflineDashboard() {
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(() => {
    return localStorage.getItem('orion-offline-mode') === 'true';
  });

  const [cachedItems, setCachedItems] = useState<DBChatHistoryItem[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    const saved = localStorage.getItem('orion-sync-queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Load IndexedDB cache items
  const loadCache = async () => {
    const userId = localStorage.getItem('codedummy-user-id') || 'local-user';
    const items = await getFromIndexedDB(userId);
    setCachedItems(items);
  };

  useEffect(() => {
    loadCache();
    localStorage.setItem('orion-offline-mode', isOfflineSimulated.toString());
  }, [isOfflineSimulated]);

  useEffect(() => {
    localStorage.setItem('orion-sync-queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Handle global online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!isOfflineSimulated) {
        triggerSync();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOfflineSimulated, syncQueue]);

  const triggerSync = async () => {
    if (syncQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(0);

    // Simulate progress bar sync
    for (let i = 1; i <= 4; i++) {
      await new Promise((res) => setTimeout(res, 400));
      setSyncProgress(i * 25);
    }

    // Process items (e.g. transfer to Supabase or logs)
    console.log(`Synced ${syncQueue.length} actions successfully.`);
    setSyncQueue([]);
    setIsSyncing(false);
    setSyncProgress(0);
    loadCache();
  };

  const handleSimulatedToggle = () => {
    const nextState = !isOfflineSimulated;
    setIsOfflineSimulated(nextState);
    if (!nextState) {
      triggerSync();
    }
  };

  const handleAddMockQueue = () => {
    const newItem: SyncQueueItem = {
      id: Date.now().toString(),
      type: 'prompt',
      description: `Pending search queue trigger for "Extract prices from stripe.com"`,
      payload: { prompt: 'Extract prices from stripe.com' },
      queuedAt: new Date().toLocaleTimeString()
    };
    setSyncQueue((prev) => [...prev, newItem]);
  };

  const handleDeleteCacheItem = async (id: string) => {
    await deleteFromIndexedDB(id);
    loadCache();
  };

  const handleClearQueue = () => {
    setSyncQueue([]);
  };

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Connectivity & Sync Engine</h4>
          </div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">IndexedDB Persistent Standby Node</p>
        </div>

        {/* Simulated Toggle */}
        <button
          type="button"
          onClick={handleSimulatedToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
            isOfflineSimulated
              ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {isOfflineSimulated ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Offline Mode (Forced Active)</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span>Online Mode (Live Sync)</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Offline Action Queue */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1 border-b border-black/5">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CloudLightning className="w-3.5 h-3.5 text-amber-500" />
              Sync Outbox ({syncQueue.length})
            </span>
            {syncQueue.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerSync}
                  disabled={isOfflineSimulated || isSyncing}
                  className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 uppercase disabled:text-slate-300 transition-colors"
                >
                  Sync Now
                </button>
                <span className="text-slate-300 font-normal">|</span>
                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase transition-colors"
                >
                  Clear Outbox
                </button>
              </div>
            )}
          </div>

          {isSyncing && (
            <div className="bg-slate-50 border border-indigo-100 rounded-xl p-3">
              <div className="flex justify-between items-center text-[10px] font-mono text-indigo-600 mb-1.5 font-bold">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Synchronizing outbox...
                </span>
                <span>{syncProgress}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${syncProgress}%` }} />
              </div>
            </div>
          )}

          {syncQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 border border-dashed border-black/10 rounded-xl bg-slate-50 text-slate-400">
              <CheckCircle className="w-6 h-6 text-slate-300 mb-1" />
              <p className="text-[10px] font-mono uppercase font-bold text-slate-500">Sync outbox is empty</p>
              <button
                type="button"
                onClick={handleAddMockQueue}
                className="mt-2 px-2 py-1 text-[9px] font-bold bg-white border border-black/5 hover:border-black/20 text-slate-600 hover:text-black rounded transition-all cursor-pointer shadow-sm"
              >
                + Queue Mock Action
              </button>
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {syncQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-slate-50 border border-black/5 p-2 rounded-lg text-[10px] font-mono">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.description}</p>
                    <p className="text-slate-400 text-[9px] mt-0.5">Queued: {item.queuedAt}</p>
                  </div>
                  <span className="shrink-0 px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold border border-amber-100 rounded text-[8px] uppercase uppercase-tracking-wider ml-2">
                    PENDING
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offline IndexedDB Resources */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1 border-b border-black/5">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              IndexedDB local storage ({cachedItems.length})
            </span>
            <button
              type="button"
              onClick={loadCache}
              className="text-[9px] font-bold text-slate-500 hover:text-black uppercase transition-colors"
            >
              Refresh DB
            </button>
          </div>

          {cachedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 border border-dashed border-black/10 rounded-xl bg-slate-50 text-slate-400">
              <Database className="w-6 h-6 text-slate-300 mb-1" />
              <p className="text-[10px] font-mono uppercase font-bold text-slate-500">No locally cached history items</p>
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {cachedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-slate-50 border border-black/5 p-2 rounded-lg text-[10px] font-mono">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{item.prompt}</p>
                    <p className="text-slate-400 text-[9px] mt-0.5">Cached: {new Date(item.created_at).toLocaleTimeString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCacheItem(item.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-2"
                    title="Delete local record"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
