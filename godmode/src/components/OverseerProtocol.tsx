import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, ShieldCheck, Activity, Terminal, ExternalLink, RefreshCw, Send, Orbit, Ghost } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import io from 'socket.io-client';

const socket = io('');

// ... existing UI but wrap it properly

interface UserData {
  id: string;
  email: string;
  status: 'active' | 'terminated' | 'probation';
  tier: 'free' | 'Apex';
  lastActive: string;
  telemetryScore: number;
}

export default function OverseerProtocol() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLog, setActionLog] = useState<string[]>(['OVERSEER PROTOCOL ACTIVE...', 'Listening to tenant telemetry...']);
  
  // Syndicate Matrix States
  const [syndicateLogs, setSyndicateLogs] = useState<string[]>(['[SYNDICATE] Node online. Agents standing by.']);
  const [redditStatus, setRedditStatus] = useState('Standby');
  const [discordStatus, setDiscordStatus] = useState('Offline');

  useEffect(() => {
    socket.on('agent-log', (msg) => {
      setSyndicateLogs(prev => [msg, ...prev].slice(0, 50));
      if (msg.includes('DISCORD STRIKE')) setDiscordStatus('Active');
      if (msg.includes('REDDIT STRIKE')) setRedditStatus('Active');
    });
    return () => { socket.off('agent-log'); }
  }, []);

  const handleGhostDeploy = () => {
    socket.emit('agent-log', '[SYSTEM COMAND] Spinning up headless Puppeteer proxy identity...');
    setTimeout(() => {
      setSyndicateLogs(prev => ['[GHOST IDENTITY] New proxy generated: User_84x2 connected via DE Frankfurt IP.', ...prev]);
    }, 1500);
  }

  useEffect(() => {
    // Master query that bypasses silos and pulls external user logs
    const fetchWorldGraph = async () => {
      if (!db) {
         setUsers([]);
         setActionLog(prev => [`[SANDBOX MODE] Live database offline. Running in secure local autonomous container.`, ...prev]);
         setLoading(false);
         return;
      }
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const activeUsers: UserData[] = usersSnapshot.docs.map(doc => ({
           id: doc.id,
           email: doc.data().email || 'Unknown',
           status: doc.data().status || 'active',
           tier: doc.data().tier || 'free',
           lastActive: doc.data().lastActive || doc.data().createdAt || 'Just now',
           telemetryScore: doc.data().telemetryScore || 0
        }));
        
        setUsers(activeUsers);
        setActionLog(prev => [`[MASTER QUERY] Successfully absorbed ${activeUsers.length} tenants from external silos.`, ...prev]);
        setLoading(false);
      } catch (error) {
        console.error("Overseer extraction failed:", error);
        setActionLog(prev => [`[ERROR] Tenant extraction blocked: ${error}`, ...prev]);
        setLoading(false);
      }
    };
    
    fetchWorldGraph();
  }, []);

  const handleAction = async (userId: string, action: 'terminate' | 'moderate') => {
    if (!db) {
      setActionLog(prev => [`[SANDBOX MODE] Simulated action: ${action.toUpperCase()} written locally for user ${userId}.`, ...prev]);
      setUsers(prev => prev.map(u => {
        if(u.id === userId) {
           return { ...u, status: action === 'terminate' ? 'terminated' : 'probation' };
        }
        return u;
      }));
      return;
    }
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
         status: action === 'terminate' ? 'terminated' : 'probation'
      });
      setActionLog(prev => [`[COMMAND EXECUTED] ${action.toUpperCase()} signal written permanently to tenant ${userId}.`, ...prev]);
      setUsers(prev => prev.map(u => {
        if(u.id === userId) {
           return { ...u, status: action === 'terminate' ? 'terminated' : 'probation' };
        }
        return u;
      }));
    } catch(e) {
      setActionLog(prev => [`[FAILED] Could not enforce action: ${e}`, ...prev]);
    }
  };

  const headlessConnections = [
    { name: 'TikTok Graph API', latency: '12ms', status: 'connected', type: 'Scraper' },
    { name: 'DoorDash Delivery Webhook', latency: '45ms', status: 'sleeping', type: 'Service' },
    { name: 'Messenger Sync Node', latency: '18ms', status: 'connected', type: 'Social' },
    { name: 'Unity Cloud Renderer', latency: '110ms', status: 'standby', type: 'Compute' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200">
       <div className="p-4 border-b border-[#222] bg-[#111]">
          <h2 className="font-semibold text-indigo-400 flex items-center gap-2">
            <EyeIcon /> Panopticon View
          </h2>
          <p className="text-xs text-gray-400 mt-1">Prime node command center. Real-time multi-tenant telemetry and headless external bridges.</p>
       </div>

        <div className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto">
          
          {/* Syndicate Panopticon Matrix */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col shadow-lg gap-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
             <div className="flex justify-between items-center z-10">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Orbit className="w-5 h-5" /> The Syndicate Panopticon
                </h3>
                <span className="text-[10px] text-gray-500 font-mono tracking-widest bg-black px-2 py-1 rounded border border-[#333]">AUTONOMOUS LEGION ACTIVE</span>
             </div>
             
             <div className="grid grid-cols-2 gap-3 z-10">
                <div className="bg-[#050505] p-3 rounded-lg border border-[#222] flex flex-col gap-1">
                   <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Reddit API Infiltrator</div>
                   <div className="flex justify-between items-center">
                     <span className={`text-xs font-mono ${redditStatus === 'Active' ? 'text-emerald-400 animate-pulse' : 'text-yellow-500'}`}>{redditStatus}</span>
                     <button onClick={() => socket.emit('agent-log', '[REDDIT] Refreshing proxy nodes...')} className="text-indigo-400 hover:text-white transition-colors"><RefreshCw className="w-3 h-3" /></button>
                   </div>
                </div>
                <div className="bg-[#050505] p-3 rounded-lg border border-[#222] flex flex-col gap-1">
                   <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Discord Gateway Overseer</div>
                   <div className="flex justify-between items-center">
                     <span className={`text-xs font-mono inline-flex items-center gap-1 ${discordStatus === 'Offline' ? 'text-gray-600' : 'text-emerald-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${discordStatus === 'Offline' ? 'bg-gray-600' : 'bg-emerald-500'}`}></span>
                        {discordStatus}
                     </span>
                     <button title="Force reconnect" onClick={() => socket.emit('agent-log', '[DISCORD] Attempting WSS reconnect via proxy...')} className="text-indigo-400 hover:text-white transition-colors"><Send className="w-3 h-3" /></button>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-2 mt-2 z-10">
               <button onClick={handleGhostDeploy} className="bg-indigo-900/30 hover:bg-indigo-900/60 border border-indigo-500/50 text-indigo-400 text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-lg flex-1 flex items-center justify-center gap-2 transition-colors">
                  <Ghost className="w-3 h-3" /> Spin Up Headless Identity
               </button>
             </div>

             <div className="mt-2 bg-[#050505] h-24 rounded border border-[#222] p-2 overflow-y-auto font-mono text-[10px] leading-relaxed text-indigo-300/80 custom-scrollbar z-10">
                {syndicateLogs.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> Headless Aggregation Matrix
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {headlessConnections.map((conn, idx) => (
                 <div key={idx} className="bg-black border border-[#222] rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden group hover:border-[#444] transition-colors">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
                   <div className="flex justify-between items-start">
                     <span className="text-sm font-medium text-gray-200">{conn.name}</span>
                     <span className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-gray-600'}`} />
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                     <span className="uppercase">{conn.type}</span>
                     <span className="flex items-center gap-1">
                       <RefreshCw className="w-3 h-3" /> {conn.latency}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Active Terminal Subjects
            </h3>
            {users.map(user => (
               <div key={user.id} className="bg-[#111] border border-[#222] rounded-lg p-3 flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                         <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{user.email}</div>
                        <div className="text-xs text-gray-500">ID: {user.id} | Last Active: {user.lastActive}</div>
                      </div>
                   </div>
                   <div className={`text-xs px-2 py-1 rounded font-mono ${user.status === 'active' ? 'bg-emerald-950/50 text-emerald-400' : user.status === 'terminated' ? 'bg-red-950/50 text-red-500' : 'bg-yellow-950/50 text-yellow-500'}`}>
                      {user.status.toUpperCase()}
                   </div>
                 </div>

                 <div className="flex items-center gap-4 text-xs font-mono bg-black p-2 rounded border border-[#222]">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className={`w-3 h-3 ${user.tier === 'Apex' ? 'text-indigo-400' : 'text-gray-500'}`} />
                      <span className={user.tier === 'Apex' ? 'text-indigo-400' : 'text-gray-500'}>Tier: {user.tier}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-500" />
                      <span>Telemetry: {user.telemetryScore}</span>
                    </div>
                 </div>

                 {user.email !== 'MarquisWhitacre@gmail.com' && (
                   <div className="flex items-center gap-2 pt-2 border-t border-[#222]">
                      <button 
                        onClick={() => handleAction(user.id, 'moderate')}
                        className="flex-1 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 text-xs py-1.5 rounded transition-colors"
                      >
                        Enforce Probation
                      </button>
                      <button 
                         onClick={() => handleAction(user.id, 'terminate')}
                         className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" /> Terminate Access
                      </button>
                   </div>
                 )}
               </div>
            ))}
          </div>

          <div className="mt-4 border border-[#222] rounded-xl overflow-hidden flex flex-col font-mono text-xs shadow-inner">
             <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#333] text-gray-500 flex items-center gap-2">
               <Terminal className="w-3 h-3" /> Action Log
             </div>
             <div className="p-4 h-32 overflow-y-auto whitespace-pre-wrap text-indigo-400/80 leading-relaxed font-mono">
               {actionLog.join('\n')}
             </div>
          </div>
       </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
