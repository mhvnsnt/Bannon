import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Activity, CheckCircle2, Loader2, Database, AlertCircle } from 'lucide-react';

export default function ResearchDashboard() {
  const [tasks, setTasks] = useState([
    { id: '1', type: 'search', query: 'Latest AI gaming integrations 2026', status: 'completed', progress: 100 },
    { id: '2', type: 'video', query: 'Unreal Engine 5 Animation Rigging Tutorial', status: 'processing', progress: 65 },
  ]);
  const [ingestionSummary, setIngestionSummary] = useState('');
  const [researchNotes, setResearchNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('researchNotes').eq('id', session.user.id).single();
        if (!error && data) {
          setResearchNotes(data.researchNotes || []);
          if (data.researchNotes && data.researchNotes.length > 0) {
            setIngestionSummary(data.researchNotes[data.researchNotes.length - 1].summary);
          }
        }
      }
      setLoading(false);
    };
    loadData();
    
    // Simulate real-time progress for the mock processing task
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.status === 'processing') {
          const newProgress = Math.min(t.progress + 5, 100);
          return { ...t, progress: newProgress, status: newProgress === 100 ? 'completed' : 'processing' };
        }
        return t;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 shrink-0">
        <Search className="w-6 h-6 text-pink-400" /> Research Dashboard
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-2 pb-8">
        <div className="space-y-6">
          {/* Task Queue View */}
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Active Task Queue
            </h3>
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1 block">
                        {task.type === 'video' ? 'Video Processing' : 'Web Search'}
                      </span>
                      <p className="text-sm text-neutral-200 font-medium">{task.query}</p>
                    </div>
                    <div>
                      {task.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      )}
                    </div>
                  </div>
                  {task.status === 'processing' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>Buffer Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Latest Ingestion Summary */}
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-400" /> Latest Knowledge Ingestion
            </h3>
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
              {ingestionSummary ? (
                <p className="text-sm text-neutral-300 leading-relaxed">{ingestionSummary}</p>
              ) : (
                <div className="flex items-center gap-2 text-neutral-500 text-sm">
                  <AlertCircle className="w-4 h-4" /> No recent ingestion data to display.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Research Log */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 flex flex-col">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 shrink-0">
            <Search className="w-5 h-5 text-pink-400" /> Research Logs (Committed)
          </h3>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {loading ? (
              <div className="text-neutral-500 text-sm">Loading logs...</div>
            ) : researchNotes.length === 0 ? (
              <p className="text-neutral-500 text-sm">No research items logged yet.</p>
            ) : (
              researchNotes.slice().reverse().map((note, i) => (
                <div key={i} className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-indigo-300">{note.topic}</h4>
                    {note.timestamp && (
                      <span className="text-xs text-neutral-500">{new Date(note.timestamp).toLocaleDateString()}</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400">{note.summary}</p>
                  {note.url && (
                    <a href={note.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors hover:underline mt-3 inline-flex items-center gap-1">
                      Source Link
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
