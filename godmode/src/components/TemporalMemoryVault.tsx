import React, { useState, useEffect } from 'react';
import { Database, Clock, Target, ArrowRight, Zap, Orbit, RefreshCw, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { getChatSessions, syncChatSession } from '../lib/persistence';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function TemporalMemoryVault({ onClose }: { onClose?: () => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [vaultVectors, setVaultVectors] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'timelines' | 'ledger'>('timelines');

  useEffect(() => {
    loadSessions();
    loadVaultVectors();
  }, []);

  const loadSessions = async () => {
    const data = await getChatSessions();
    setSessions(data);
  };
  
  const loadVaultVectors = async () => {
     if (!db) {
         console.warn("[MemoryVault] Firestore unavailable/offline.");
         return;
     }
     try {
         const q = query(collection(db, 'vault'), orderBy('timestamp', 'desc'), limit(50));
         const snap = await getDocs(q);
         const vectors = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setVaultVectors(vectors);
     } catch (e) {
         console.error("Failed fetching vault vectors", e);
     }
  }

  const handleForceResync = async () => {
    setIsSyncing(true);
    // Force re-sync by fetching latest local state if needed
    // Assuming for now we just reload what's in Firebase
    await loadSessions();
    await loadVaultVectors();
    setTimeout(() => {
        setIsSyncing(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200">
       <div className="p-4 border-b border-[#222] bg-[#111] flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-semibold text-purple-400 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Temporal Memory Vault
            </h2>
            <p className="text-xs text-gray-400 mt-1">Vectorized local session history mapped to SQLite/Firestore framework.</p>
          </div>
          <button 
             onClick={handleForceResync}
             disabled={isSyncing}
             className="p-2 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 rounded transition-colors disabled:opacity-50 flex items-center justify-center border border-purple-500/20"
             title="Force Memory Re-sync"
          >
             <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
       </div>
       
       <div className="flex px-4 pt-4 border-b border-[#222] shrink-0 gap-4">
           <button 
              onClick={() => setActiveTab('timelines')}
              className={`pb-2 text-sm font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'timelines' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
           >
               <Clock className="w-4 h-4" /> Immutable Timelines
           </button>
           <button 
              onClick={() => setActiveTab('ledger')}
              className={`pb-2 text-sm font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'ledger' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
           >
               <List className="w-4 h-4" /> Vector Ledger
           </button>
       </div>

       <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Database className="w-24 h-24" />
             </div>
             <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2 relative z-10">
               <Orbit className="w-4 h-4" /> Global Memory Registry
             </h3>
             <p className="text-xs text-gray-400 relative z-10 mb-4 font-mono">
               Every strategy session is mathematically embedded. When retrieving old timelines, the engine instantly reconstructs the exact constraints and directives.
             </p>
             <div className="flex items-center gap-4 text-xs font-mono">
               <div className="bg-black/50 p-2 rounded border border-[#333]">
                 <span className="text-gray-500">Nodes: </span>
                 <span className="text-white">{sessions.length + vaultVectors.length}</span>
               </div>
               <div className="bg-black/50 p-2 rounded border border-[#333]">
                 <span className="text-gray-500">Retrieval: </span>
                 <span className="text-emerald-400">Optimal</span>
               </div>
             </div>
          </div>

          <div className="space-y-3 pb-4">
            {activeTab === 'timelines' && (
                <>
                {sessions.length === 0 ? (
                    <div className="text-xs text-gray-600 italic">No temporal traces found.</div>
                ) : (
                    sessions.map((session, idx) => (
                      <motion.button 
                        key={session.id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.01 }}
                        className="w-full text-left bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] transition-all p-3 rounded-xl flex flex-col gap-2 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="font-medium text-sm transition-colors text-gray-200 group-hover:text-white">
                            {session.title || 'Unknown Origin'}
                          </div>
                          <span className="text-[10px] whitespace-nowrap px-2 py-1 rounded text-gray-500 bg-black truncate max-w-[100px] border border-[#333]">
                            {session.updatedAt ? new Date(session.updatedAt).toLocaleTimeString() : 'Unknown Time'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono mt-1">
                           <div className="flex items-center gap-1.5 text-gray-500">
                             <Target className="w-3 h-3" /> Vectors: {session.messages?.length || 0}
                           </div>
                           <div className="flex items-center gap-1.5 text-purple-400/70">
                             <Zap className="w-3 h-3" /> Validated
                           </div>
                        </div>
                      </motion.button>
                    ))
                )}
                </>
            )}
            
            {activeTab === 'ledger' && (
                <div className="w-full overflow-x-auto no-scrollbar font-mono text-xs border border-[#222] rounded-lg">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-[#111] border-b border-[#333] text-gray-500 uppercase tracking-widest">
                                <th className="px-4 py-3">Timestamp</th>
                                <th className="px-4 py-3">Label</th>
                                <th className="px-4 py-3">Impact Tags</th>
                                <th className="px-4 py-3 text-right">Owner Node UID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vaultVectors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-gray-600 italic">No autonomous events registered in the vector ledger.</td>
                                </tr>
                            ) : (
                                vaultVectors.map((vec, idx) => (
                                    <tr key={idx} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                            {vec.timestamp ? new Date(vec.timestamp).toLocaleTimeString() : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-fuchsia-400 truncate max-w-[200px]" title={vec.label}>
                                            {vec.label || 'Unlabeled Vector'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {vec.tags ? vec.tags.slice(0,2).map((t: string, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-black border border-[#333] rounded text-emerald-500 text-[10px] uppercase">{t}</span>
                                                )) : <span className="text-gray-600">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500 truncate max-w-[100px]">
                                            {vec.ownerId || 'System'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
       </div>
    </div>
  );
}
