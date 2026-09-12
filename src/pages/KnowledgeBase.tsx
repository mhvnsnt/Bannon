import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, Search, Edit3, BookOpen, BrainCircuit } from 'lucide-react';

export default function KnowledgeBase() {
  const [evolvingContext, setEvolvingContext] = useState('');
  const [researchNotes, setResearchNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKnowledge = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (!error && data) {
          setEvolvingContext(data.evolvingContext || '');
          setResearchNotes(data.researchNotes || []);
        }
      }
      setLoading(false);
    };
    loadKnowledge();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BrainCircuit className="w-6 h-6 text-indigo-400" /> Knowledge Base & Research
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-400" /> Agent Evolving Memory
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              This is the live memory the AI has built about you and the project based on past conversations. It automatically updates.
            </p>
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 min-h-[200px]">
              {loading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-2 bg-neutral-700 rounded w-3/4"></div>
                    <div className="h-2 bg-neutral-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono">
                  {evolvingContext || "No memory built yet. Start chatting with the AI!"}
                </pre>
              )}
            </div>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-pink-400" /> Research Dashboard
            </h3>
            <div className="space-y-4">
              {researchNotes.length === 0 ? (
                <p className="text-neutral-500 text-sm">No research items logged yet. Ask the AI to research topics for you.</p>
              ) : (
                researchNotes.map((note, i) => (
                  <div key={i} className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                    <h4 className="font-semibold text-indigo-300">{note.topic}</h4>
                    <p className="text-sm text-neutral-400 mt-2">{note.summary}</p>
                    {note.url && <a href={note.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-2 inline-block">Source Link</a>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
             <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Fable Method Integration
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We are using the Fable Method to structure knowledge ingestion. 
              The system classifies tasks, gathers evidence from your inputs, and surgically adapts the codebase and memory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}