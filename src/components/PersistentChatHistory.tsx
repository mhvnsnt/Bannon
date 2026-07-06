import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { History, Play, Trash2, Clock, Search, Copy, Check, Database } from 'lucide-react';
import { cn } from '../App';
import { getFromIndexedDB, deleteFromIndexedDB } from '../utils/indexedDB';

interface ChatHistoryItem {
  id: string;
  prompt: string;
  created_at: string;
}

interface Props {
  onRerun: (prompt: string) => void;
  userId: string;
}

export default function PersistentChatHistory({ onRerun, userId }: Props) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isIndexedDbActive, setIsIndexedDbActive] = useState(false);
  
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured");
      }
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setHistory(data || []);
      setError(null);
      setIsIndexedDbActive(false);
    } catch (err: any) {
      console.warn("Could not fetch from Supabase chat_history table, falling back to IndexedDB:", err.message);
      // Fallback to IndexedDB
      const offlineItems = await getFromIndexedDB(userId);
      if (offlineItems && offlineItems.length > 0) {
        setHistory(offlineItems);
      } else {
        // Fallback to localStorage
        const local = localStorage.getItem('codedummy-local-chat-history');
        if (local) {
          setHistory(JSON.parse(local));
        }
      }
      setIsIndexedDbActive(true);
      setError("Using Local IndexedDB Mode");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    if (!isSupabaseConfigured) {
      return;
    }
    // Setup realtime subscription
    const subscription = supabase
      .channel('chat_history_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_history' }, () => {
        fetchHistory();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const handleDelete = async (id: string) => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from('chat_history').delete().eq('id', id);
      }
      setHistory(prev => prev.filter(h => h.id !== id));
      // Delete from IndexedDB
      await deleteFromIndexedDB(id);
      // Local fallback
      const local = JSON.parse(localStorage.getItem('codedummy-local-chat-history') || '[]');
      localStorage.setItem('codedummy-local-chat-history', JSON.stringify(local.filter((h: any) => h.id !== id)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = history.filter(item => 
    item.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 border-l border-slate-200">
      <div className="p-4 border-b border-slate-200 flex flex-col gap-3 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Prompt History</h3>
          </div>
          {isIndexedDbActive && (
            <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider animate-pulse">
              <Database className="w-3 h-3 text-amber-600" />
              <span>Offline DB</span>
            </div>
          )}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search past prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && history.length === 0 ? (
          <p className="text-xs text-slate-400">Loading history...</p>
        ) : filteredHistory.length === 0 ? (
          <p className="text-xs text-slate-400">
            {searchQuery ? "No matching prompts found." : "No past prompts found."}
          </p>
        ) : (
          filteredHistory.map(item => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm group hover:border-slate-300 transition-colors">
              <p className="text-sm text-slate-700 line-clamp-4 mb-2 whitespace-pre-wrap">{item.prompt}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleCopy(item.id, item.prompt)}
                    className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    title="Copy Prompt"
                  >
                    {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button 
                    onClick={() => onRerun(item.prompt)}
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                    title="Re-run Prompt"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
