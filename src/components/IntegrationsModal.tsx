import React, { useState, useEffect } from 'react';
import { X, Server, Database, Globe, Plus, Trash, Check, Loader2 } from 'lucide-react';

export function IntegrationsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [railwayToken, setRailwayToken] = useState(localStorage.getItem('railway_token') || '');
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('supabase_key') || '');
  const [repos, setRepos] = useState<{owner: string, repo: string, branch: string}[]>([]);
  const [newOwner, setNewOwner] = useState('');
  const [newRepo, setNewRepo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/github/connected-repos')
        .then(res => res.json())
        .then(data => setRepos(data || []))
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveIntegrations = () => {
    localStorage.setItem('railway_token', railwayToken);
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);
    alert('Integration settings saved successfully locally.');
  };

  const addRepo = async () => {
    if (!newOwner || !newRepo) return;
    setLoading(true);
    try {
      const res = await fetch('/api/github/add-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: newOwner, repo: newRepo, branch: 'main' })
      });
      const data = await res.json();
      if (data.repos) setRepos(data.repos);
      setNewOwner('');
      setNewRepo('');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const removeRepo = async (owner: string, repo: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/github/remove-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo })
      });
      const data = await res.json();
      if (data.repos) setRepos(data.repos);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            Integrations & Sync
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Railway */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Server className="w-4 h-4 text-indigo-600" /> Railway Token
            </label>
            <input
              type="password"
              value={railwayToken}
              onChange={e => setRailwayToken(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Railway API Token"
            />
          </div>

          {/* Supabase */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Database className="w-4 h-4 text-emerald-600" /> Supabase Credentials
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 mb-2"
              placeholder="Supabase Project URL"
            />
            <input
              type="password"
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Supabase Anon/Service Role Key"
            />
          </div>

          <button onClick={saveIntegrations} className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            <Check className="w-4 h-4" /> Save Tokens
          </button>

          <hr className="border-slate-100" />

          {/* Connected Repositories */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Globe className="w-4 h-4 text-slate-900" /> Connected Repositories for Auto-Sync
            </label>
            <p className="text-xs text-slate-500 leading-relaxed">
              These repositories will be continuously monitored by the background daemon. If changes occur on GitHub, they will be pulled in. If you edit files locally here, they will be pushed back.
            </p>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-2">
              {repos.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-sm font-mono text-slate-700">{r.owner}/{r.repo} <span className="text-xs text-slate-400">({r.branch})</span></span>
                  <button onClick={() => removeRepo(r.owner, r.repo)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {repos.length === 0 && <div className="text-center p-4 text-sm text-slate-400">No repos connected</div>}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                placeholder="Owner (e.g. mhvnsnt)"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={newRepo}
                onChange={e => setNewRepo(e.target.value)}
                placeholder="Repo (e.g. BANNON)"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <button onClick={addRepo} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
