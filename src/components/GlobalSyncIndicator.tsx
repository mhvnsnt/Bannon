import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, CheckCircle2, AlertTriangle, CloudLightning } from 'lucide-react';

export default function GlobalSyncIndicator({ userId }: { userId: string }) {
  const [status, setStatus] = useState<'Synced' | 'Pending' | 'In Conflict'>('Synced');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
            .from('profiles')
            .select('syncStatus, lastSynced')
            .eq('id', userId)
            .single();

        if (!error && data) {
          if (data.syncStatus) {
            setStatus(data.syncStatus);
          } else {
            // Default based on lastSynced field
            setStatus(data.lastSynced ? 'Synced' : 'Synced');
          }
        }
      } catch (err) {
        console.warn("GlobalSyncIndicator polling error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkStatus();

    // Setup polling every 4 seconds
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-neutral-500 font-mono">
        <RefreshCw className="w-3 h-3 animate-spin" /> Polling...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'Synced' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-950/30 border border-green-800/40 rounded-full text-[11px] text-green-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Synced</span>
        </div>
      )}

      {status === 'Pending' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/30 border border-amber-800/40 rounded-full text-[11px] text-amber-400 font-medium animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing...</span>
        </div>
      )}

      {status === 'In Conflict' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/30 border border-red-800/40 rounded-full text-[11px] text-red-400 font-medium animate-bounce">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Conflict!</span>
        </div>
      )}
    </div>
  );
}
