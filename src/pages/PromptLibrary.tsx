import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { History, MessageSquare, Clock, TrendingUp, ArrowRight, BrainCircuit } from 'lucide-react';
import Markdown from 'react-markdown';

export default function PromptLibrary() {
  const [historyLog, setHistoryLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'growth'>('growth');

  // Simulated growth log based on system instructions adapting over time
  const [growthLog, setGrowthLog] = useState<any[]>([]);

  useEffect(() => {
    fetch('/history_log.json')
      .then(res => res.json())
      .then(data => setGrowthLog(data))
      .catch(err => console.error("Failed to load growth log", err));
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('chatHistoryLog').eq('id', session.user.id).single();
        if (!error && data) {
          setHistoryLog(data.chatHistoryLog || []);
        }
      }
      setLoading(false);
    };
    loadHistory();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-pink-400" /> Prompt Library & Growth
          </h2>
          <p className="text-neutral-400 mt-1">
            Tracking conversation history and autonomous system adaptation.
          </p>
        </div>
        
        <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800 shrink-0">
          <button 
            onClick={() => setActiveTab('growth')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'growth' ? 'bg-indigo-500/20 text-indigo-300' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <TrendingUp className="w-4 h-4" /> Growth Log
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-500/20 text-indigo-300' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <MessageSquare className="w-4 h-4" /> Full History
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2">
        {activeTab === 'growth' ? (
          <div className="space-y-6">
            <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-indigo-300 flex items-center gap-2 mb-2">
                <BrainCircuit className="w-5 h-5" /> System Adaptation Engine
              </h3>
              <p className="text-sm text-indigo-200/70">
                This log tracks how your raw inputs (Insights) are automatically parsed and injected into the core system instructions (Refinements). The model evolves permanently based on these records.
              </p>
            </div>
            
            <div className="relative border-l border-neutral-800 ml-4 pl-6 space-y-8">
              {growthLog.map((log, i) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] bg-neutral-950 border-2 border-indigo-500 rounded-full w-4 h-4 mt-1" />
                  <div className="text-xs text-neutral-500 mb-2">{new Date(log.date).toLocaleString()}</div>
                  
                  <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div>
                      <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">User Insight</span>
                      <p className="text-neutral-300 text-sm">"{log.userInsight}"</p>
                    </div>
                    
                    <div className="hidden md:flex justify-center text-neutral-600">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">System Refinement</span>
                      <p className="text-indigo-200 text-sm bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
                        {log.promptRefinement}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="text-neutral-500">Loading history...</div>
            ) : historyLog.length === 0 ? (
              <div className="text-neutral-500 flex flex-col items-center justify-center py-20 bg-neutral-900 rounded-xl border border-neutral-800">
                <MessageSquare className="w-12 h-12 text-neutral-700 mb-4" />
                <p>No conversation history found.</p>
              </div>
            ) : (
              historyLog.slice().reverse().map((entry, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-700 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="mb-4">
                    <span className="font-bold text-indigo-300 text-sm block mb-1">You:</span>
                    <div className="text-neutral-200 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                      {entry.prompt}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-green-400 text-sm block mb-1">AI:</span>
                    <div className="prose prose-invert prose-sm max-w-none text-neutral-300 bg-neutral-950 p-3 rounded-lg border border-neutral-800 max-h-60 overflow-y-auto">
                      <Markdown>{entry.response}</Markdown>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
