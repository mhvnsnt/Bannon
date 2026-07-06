import React, { useState } from 'react';

export function GitHubIntegration({ userId }: { userId?: string }) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  const handleSaveToken = async () => {
    if (!token) return;
    setStatus('Encrypting and securing token...');
    
    try {
      // In a real environment, this calls a secure Edge Function or Express endpoint
      const response = await fetch('/api/github/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, github_token: token })
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        setStatus(`Error: ${result.error || 'Failed to sync token'}`);
      } else {
        setStatus('GitHub Token synced successfully and isolated.');
        setToken(''); // Clear from memory instantly
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 my-4 max-w-xl">
      <h3 className="text-lg font-bold mb-2">GitHub PAT Integration</h3>
      <p className="text-xs text-slate-400 mb-4">
        Paste your Fine-Grained Personal Access Token. It will be encrypted and used strictly by runtime agents.
      </p>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
        className="w-full p-2 mb-4 bg-slate-800 rounded border border-slate-700 text-sm font-mono focus:outline-none focus:border-cyan-500"
      />
      <button
        onClick={handleSaveToken}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-semibold transition"
      >
        Sync Workspace Token
      </button>
      {status && <p className="text-xs mt-2 text-cyan-400 font-mono">{status}</p>}
    </div>
  );
}
