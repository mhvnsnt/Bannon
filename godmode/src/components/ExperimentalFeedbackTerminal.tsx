import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const ExperimentalFeedbackTerminal = () => {
  const [activeTab, setActiveTab] = useState<'log' | 'query' | 'audit'>('log');
  const [formData, setFormData] = useState({
    category: 'interaction',
    description: '',
    ai_prediction: '',
    actual_result: '',
    outcome: '',
    risk_level: 'low',
    lessons_learned: ''
  });
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [audit, setAudit] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAudit();
    }
  }, [activeTab]);

  const fetchAudit = async () => {
    try {
      const res = await fetch('/api/experimental-feedback/audit');
      const data = await res.json();
      setAudit(data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitLog = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/experimental-feedback/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMessage('Experiment logged successfully. Vector embedded.');
        setFormData({
          category: 'interaction',
          description: '',
          ai_prediction: '',
          actual_result: '',
          outcome: '',
          risk_level: 'low',
          lessons_learned: ''
        });
      } else {
        setMessage('Failed to log experiment.');
      }
    } catch (err) {
      setMessage('Error connecting to feedback engine.');
    }
    setSubmitting(false);
  };

  const runQuery = async () => {
    try {
      const res = await fetch(`/api/experimental-feedback/query?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-emerald-400 p-4 font-mono text-sm border border-emerald-900 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      <div className="flex items-center justify-between border-b border-emerald-900 pb-2 mb-4">
        <h2 className="text-lg font-black tracking-widest text-white uppercase">Experimental Feedback Loop</h2>
        <div className="flex gap-2">
          {['log', 'query', 'audit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 uppercase text-xs font-bold rounded ${activeTab === tab ? 'bg-emerald-600 text-black' : 'bg-slate-800 text-emerald-500 hover:bg-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'log' && (
          <div className="space-y-4">
            <p className="text-xs text-emerald-500/70">Ingest real-world data into the vector index to refine autonomous predictions.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400">Category</label>
                <select 
                  className="w-full bg-slate-950 border border-emerald-900/50 p-2 text-white outline-none focus:border-emerald-500"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="interaction">Social Interaction</option>
                  <option value="social">Social Experiment</option>
                  <option value="financial">Financial Decision</option>
                  <option value="strategy">Strategic Deployment</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400">Risk Level</label>
                <select 
                  className="w-full bg-slate-950 border border-emerald-900/50 p-2 text-white outline-none focus:border-emerald-500"
                  value={formData.risk_level} onChange={e => setFormData({...formData, risk_level: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider text-slate-400">Experiment Description</label>
              <textarea 
                className="w-full h-16 bg-slate-950 border border-emerald-900/50 p-2 text-white outline-none focus:border-emerald-500"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the action taken..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400">AI Prediction</label>
                <textarea 
                  className="w-full h-16 bg-slate-950 border border-emerald-900/50 p-2 text-white outline-none focus:border-emerald-500"
                  value={formData.ai_prediction} onChange={e => setFormData({...formData, ai_prediction: e.target.value})}
                  placeholder="What was the expected outcome?"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400">Actual Result</label>
                <textarea 
                  className="w-full h-16 bg-slate-950 border border-emerald-900/50 p-2 text-white outline-none focus:border-emerald-500"
                  value={formData.actual_result} onChange={e => setFormData({...formData, actual_result: e.target.value})}
                  placeholder="What actually happened?"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider text-slate-400">Lessons Learned (To Embed)</label>
              <textarea 
                className="w-full h-20 bg-slate-950 border border-emerald-900/50 p-2 text-emerald-300 outline-none focus:border-emerald-500"
                value={formData.lessons_learned} onChange={e => setFormData({...formData, lessons_learned: e.target.value})}
                placeholder="What did we learn to adjust future behavior?"
              />
            </div>

            <button 
              onClick={submitLog}
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {submitting ? 'Embedding...' : 'Inject Feedback into RAG'}
            </button>
            {message && <div className="text-center mt-2 text-emerald-400 font-bold">{message}</div>}
          </div>
        )}

        {activeTab === 'query' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runQuery()}
                placeholder="Search historical vectors (e.g. 'high risk financial losses')"
                className="flex-1 bg-slate-950 border border-emerald-900/50 p-2 text-white outline-none focus:border-emerald-500"
              />
              <button 
                onClick={runQuery}
                className="px-6 bg-emerald-800 hover:bg-emerald-700 text-white font-bold uppercase"
              >
                Query
              </button>
            </div>
            
            <div className="space-y-3 mt-4">
              {results.length === 0 && <p className="text-slate-500 italic text-center py-8">No results found or waiting for query.</p>}
              {results.map((res, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={res.id || i} 
                  className="bg-slate-950/50 border border-emerald-900/30 p-3 rounded"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="uppercase text-[10px] font-bold bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded">{res.category}</span>
                    <span className="uppercase text-[10px] font-bold text-slate-400">{res.timestamp}</span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p><span className="text-emerald-500 font-bold">Desc:</span> {res.description}</p>
                    <p><span className="text-rose-400 font-bold">Actual:</span> {res.actual_result}</p>
                    <p className="bg-emerald-900/20 p-2 text-emerald-300 border-l-2 border-emerald-500">
                      <span className="font-bold block mb-1">Lesson:</span> {res.lessons_learned}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit' && audit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 border border-emerald-900/30">
                <div className="text-slate-400 uppercase text-[10px] tracking-widest mb-1">Status</div>
                <div className="text-emerald-400 font-black text-lg">{audit.status}</div>
              </div>
              <div className="bg-slate-950 p-4 border border-emerald-900/30">
                <div className="text-slate-400 uppercase text-[10px] tracking-widest mb-1">Total Experiments</div>
                <div className="text-white font-black text-lg">{audit.totalExperimentsLogged}</div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-emerald-900/30">
              <h3 className="text-slate-400 uppercase text-[10px] tracking-widest mb-3">Breakdown by Category</h3>
              <div className="space-y-2">
                {audit.breakdownByCategory.map((c: any) => (
                  <div key={c.category} className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="uppercase">{c.category || 'Unknown'}</span>
                    <span className="text-emerald-400 font-bold">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-950 p-4 border border-emerald-900/30">
              <h3 className="text-slate-400 uppercase text-[10px] tracking-widest mb-3">Upgrade Paths</h3>
              <ul className="list-disc pl-4 space-y-2 text-slate-300">
                {audit.upgradePaths.map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
