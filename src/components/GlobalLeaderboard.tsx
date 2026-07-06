import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Trophy, Medal, Loader2, AlertCircle } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  xp: number;
}

export default function GlobalLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        let list: LeaderboardEntry[] = [];
        
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('user_stats')
            .select('id, xp')
            .order('xp', { ascending: false })
            .limit(10);
          
          if (error) throw error;
          
          if (!data || data.length === 0) {
            list = [
              { id: 'Anon-9f8a', xp: 4500 },
              { id: 'Anon-2b1c', xp: 3200 },
              { id: 'Anon-8d3e', xp: 2150 },
              { id: 'Anon-7a4f', xp: 1800 },
              { id: 'Anon-1c9b', xp: 1200 },
            ];
          } else {
            list = data.map((d: any) => ({ id: d.id, xp: d.xp }));
          }
        } else {
          // Instantly fallback to mock data
          list = [
            { id: 'Anon-9f8a', xp: 4500 },
            { id: 'Anon-2b1c', xp: 3200 },
            { id: 'Anon-8d3e', xp: 2150 },
            { id: 'Anon-7a4f', xp: 1800 },
            { id: 'Anon-1c9b', xp: 1200 },
          ];
        }

        const currentUserId = localStorage.getItem('codedummy-user-id') || 'You';
        let currentXp = 120; // default for demo, or read from saved skilltree
        try {
          const st = JSON.parse(localStorage.getItem('codedummy-skilltree') || '{}');
          if (st && st.xp !== undefined) {
            currentXp = st.xp;
          }
        } catch (e) {}

        if (!list.some(item => item.id === currentUserId)) {
          list.push({ id: currentUserId, xp: currentXp });
        } else {
          list = list.map(item => item.id === currentUserId ? { ...item, xp: currentXp } : item);
        }

        list.sort((a, b) => b.xp - a.xp);
        setLeaders(list);
        setError(null);
      } catch (err: any) {
        console.warn("Could not fetch leaderboard from Supabase:", err.message);
        // Fallback to mock data for presentation
        let fallbackList = [
          { id: 'Anon-9f8a', xp: 4500 },
          { id: 'Anon-2b1c', xp: 3200 },
          { id: 'Anon-8d3e', xp: 2150 },
          { id: 'Anon-7a4f', xp: 1800 },
          { id: 'Anon-1c9b', xp: 1200 },
        ];

        const currentUserId = localStorage.getItem('codedummy-user-id') || 'You';
        let currentXp = 120;
        try {
          const st = JSON.parse(localStorage.getItem('codedummy-skilltree') || '{}');
          if (st && st.xp !== undefined) {
            currentXp = st.xp;
          }
        } catch (e) {}

        if (!fallbackList.some(item => item.id === currentUserId)) {
          fallbackList.push({ id: currentUserId, xp: currentXp });
        } else {
          fallbackList = fallbackList.map(item => item.id === currentUserId ? { ...item, xp: currentXp } : item);
        }

        fallbackList.sort((a, b) => b.xp - a.xp);
        setLeaders(fallbackList);
        setError("Using simulated network data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-black text-xl text-black">Global Leaderboard</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">Top Coders</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <p className="text-sm font-medium">Syncing global stats...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg mb-4">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
          {leaders.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'border-yellow-200 bg-yellow-50/30 shadow-sm' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                  index === 1 ? 'bg-slate-200 text-slate-700' : 
                  index === 2 ? 'bg-orange-100 text-orange-800' : 
                  'bg-white text-slate-400 shadow-sm border border-slate-100'
                }`}>
                  {index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
                </div>
                <div>
                  <div className="font-mono font-bold text-sm text-slate-800">
                    {(() => {
                      const currentUserId = localStorage.getItem('codedummy-user-id') || '';
                      const isSelf = entry.id === currentUserId || entry.id === 'You';
                      const nameText = isSelf ? 'You (Self)' : `User_${entry.id.substring(0, 5).replace('Anon-', '')}`;
                      
                      const equipped = isSelf 
                        ? localStorage.getItem('codedummy-equipped-cosmetic') || 'none'
                        : (index === 0 ? 'neon_overlord' : index === 1 ? 'golden_glow' : 'none');
                        
                      const COSMETIC_STYLES: Record<string, { className: string, style?: React.CSSProperties, title: string }> = {
                        copper_aura: {
                          className: "text-amber-700 font-bold",
                          style: { textShadow: '0 0 4px rgba(180, 83, 9, 0.4)' },
                          title: "Novice"
                        },
                        golden_glow: {
                          className: "text-amber-500 font-black tracking-wide",
                          style: { textShadow: '0 0 8px rgba(245, 158, 11, 0.6)' },
                          title: "Elite"
                        },
                        neon_overlord: {
                          className: "text-indigo-600 font-extrabold tracking-wider uppercase",
                          style: { textShadow: '0 0 10px rgba(99, 102, 241, 0.5)' },
                          title: "Overlord"
                        }
                      };
                      
                      const styleInfo = COSMETIC_STYLES[equipped];
                      
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            className={styleInfo ? styleInfo.className : "text-slate-800"}
                            style={styleInfo?.style}
                          >
                            {nameText}
                          </span>
                          {styleInfo && (
                            <span className="text-[8px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200/60 px-1.5 py-0.5 rounded tracking-wide uppercase">
                              {styleInfo.title}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-slate-900">{entry.xp.toLocaleString()}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">XP</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
