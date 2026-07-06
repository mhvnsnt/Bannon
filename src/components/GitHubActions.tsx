import { createRepositoryIfMissing, autoCommitAndPush } from '../utils/github';
import { RefreshCw } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Database, Server } from 'lucide-react';
import { UploadCloud, GitPullRequest, Download, Loader2, GitBranch, Shield, Key, Rocket, X, ChevronUp } from 'lucide-react';
import { fetchBranches, cloneRepo, pushToRepo, createPullRequest } from '../utils/github';
import PRPreviewModal from './PRPreviewModal';
import { IntegrationsModal } from './IntegrationsModal';
import { cn } from '../App';

export default function GitHubActions({ 
  githubToken, 
  setGithubToken, 
  handleDeploy, 
  isDeploying 
}: { 
  githubToken: string, 
  setGithubToken: (t: string) => void,
  handleDeploy: () => void,
  isDeploying: boolean
}) {
  const [isOpen, setIsOpen] = useState(false); // For mobile bottom sheet
  const [protocol, setProtocol] = useState<'https' | 'ssh'>('https');
  const [branches, setBranches] = useState<string[]>(['main']);
  const [selectedBranch, setSelectedBranch] = useState('main');
  
  const [isCloning, setIsCloning] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPRing, setIsPRing] = useState(false);
  
  const [showPRPreview, setShowPRPreview] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);


  const handleGithubOAuth = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      if (!response.ok) throw new Error('Failed to fetch OAuth URL');
      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const authWindow = window.open(url, 'github_oauth', `width=${width},height=${height},left=${left},top=${top}`);
      
      if (!authWindow) {
        alert('Please allow popups to connect your GitHub account.');
      }
    } catch (e) {
      console.error(e);
      alert('Could not start GitHub OAuth flow.');
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setGithubToken(event.data.token);
        localStorage.setItem('codedummy-github-token', event.data.token);
        
        // Save to Supabase
        const { supabase, isSupabaseConfigured } = await import('../services/supabaseClient');
        if (isSupabaseConfigured) {
            const userId = localStorage.getItem('codedummy-user-id');
            if (userId) {
                await supabase.from('user_profiles').upsert({ id: userId, github_pat: event.data.token });
            }
        }
        alert('GitHub Account linked successfully!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setGithubToken]);

  useEffect(() => {
    if (githubToken) {
      // Mock fetching branches
      fetchBranches(githubToken, 'owner', 'repo').then(b => setBranches(b));
    }
  }, [githubToken]);

  const handleClone = async (targetRepo?: string) => {
    // Token injected in backend
    const repo = targetRepo || prompt("Enter owner/repo to clone (e.g., torvalds/linux):");
    if (!repo) return;
    const [owner, name] = repo.split('/');
    if (!owner || !name) return alert("Invalid format. Use owner/repo.");
    if (!enforceGodMode(owner)) return;
    
    setIsCloning(true);
    try {
      const res = await cloneRepo(githubToken, owner, name, protocol);
      alert(`Successfully cloned ${repo} via ${protocol.toUpperCase()}\nURL: ${res.url}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCloning(false);
    }
  };

  const handlePush = async () => {
    // Token injected in backend
    setIsPushing(true);
    try {
      await pushToRepo(githubToken, "Automated commit from God Mode", selectedBranch);
      alert(`Successfully pushed to ${selectedBranch}!`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPushing(false);
    }
  };

  const handleConfirmPR = async () => {
    setIsPRing(true);
    try {
      const res: any = await createPullRequest(githubToken, "Automated PR from God Mode", selectedBranch, "main");
      alert(`Successfully created PR: ${res.url}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPRing(false);
    }
  };

  
    
  const isGodMode = 
    localStorage.getItem('codedummy-user-email') === 'marquiswhitacre@gmail.com' ||
    localStorage.getItem('codedummy-telegram-username') === 'cierrasquirts';

  const enforceGodMode = (owner) => {
    if (owner === 'mhvnsnt' && !isGodMode) {
      alert("Access denied: Only the God Mode Admin can push/pull to the mhvnsnt account.");
      return false;
    }
    return true;
  };

  
  const verifySyncStatus = async () => {
    setIsCloning(true);
    try {
      const owner = 'mhvnsnt';
      const repo = 'CODEDUMMY';
      if (!enforceGodMode(owner)) { setIsCloning(false); return; }
      
      const localHash = localStorage.getItem('codedummy-last-sync-hash') || 'local_unknown';
      
      let remoteHash = 'remote_unknown';
      try {
        const remoteRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/main`);
        const remoteData = await remoteRes.json();
        remoteHash = remoteData.sha || remoteHash;
      } catch (e) {
        console.warn("Could not fetch remote hash", e);
      }
      
      if (localHash !== remoteHash && remoteHash !== 'remote_unknown') {
         alert(`Hash mismatch!\nLocal: ${localHash.slice(0,7)}\nRemote: ${remoteHash.slice(0,7)}\nTriggering automated patching workflow for Railway instance...`);
         localStorage.setItem('codedummy-last-sync-hash', remoteHash);
         await handlePullSync();
      } else {
         alert("Sync verified: Railway instance is up-to-date with GitHub.");
         if (remoteHash !== 'remote_unknown') localStorage.setItem('codedummy-last-sync-hash', remoteHash);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCloning(false);
    }
  };

  const handlePullSync = async () => {
    // Token injected in backend
    setIsCloning(true);
    try {
      const owner = 'mhvnsnt';
      const repo = 'CODEDUMMY';
      if (!enforceGodMode(owner)) { setIsCloning(false); return; }
      
      const response = await fetch('/api/github/pull-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          owner,
          repo,
          branch: 'main'
        })
      });
      
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to pull workspace');
      
      alert(`Successfully pulled from ${owner}/${repo}!\n${result.message}`);
    } catch (e: any) {
      console.error(e);
      alert('Pull failed: ' + e.message);
    } finally {
      setIsCloning(false);
    }
  };

  const handleAutoSync = async () => {
    // Token injected in backend
    setIsPushing(true);
    try {
      const owner = 'mhvnsnt';
      const repo = 'CODEDUMMY';
      if (!enforceGodMode(owner)) { setIsPushing(false); return; }
      
      await createRepositoryIfMissing(githubToken, owner, repo, false);
      
      const response = await fetch('/api/github/sync-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          owner,
          repo,
          branch: 'main',
          message: 'Auto-sync workspace to GitHub from CODEDUMMY'
        })
      });
      
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to sync workspace');
      
      alert(`Successfully synced entire workspace to ${owner}/${repo}!\nCommit: ${result.commitUrl}`);
    } catch (e: any) {
      console.error(e);
      alert('Sync failed: ' + e.message);
    } finally {
      setIsPushing(false);
    }
  };

  const MobileToggle = () => (
    <button 
      onClick={() => setIsOpen(!isOpen)}
      className="lg:hidden fixed bottom-6 right-6 z-[90] bg-slate-900 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all"
    >
      <Rocket className="w-6 h-6" />
    </button>
  );

  return (
    <>
      <MobileToggle />
      
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[95] lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <div className={cn(
        "fixed lg:relative lg:flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto",
        "bottom-0 left-0 right-0 z-[100] lg:z-auto bg-white lg:bg-transparent p-4 lg:p-0 rounded-t-2xl lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none transition-transform duration-300",
        isOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
      )}>
        
        <div className="flex items-center justify-between lg:hidden mb-4 pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Rocket className="w-4 h-4 text-slate-500" /> Actions</h3>
          <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-black bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            {githubToken ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 lg:flex-none lg:w-32 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center">
                  Account Linked
                </div>
                <button 
                  onClick={() => { setGithubToken(''); localStorage.removeItem('codedummy-github-token'); }} 
                  className="px-2 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="Disconnect"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={handleGithubOAuth}
                  className="flex-1 lg:flex-none bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
                  title="Connect via App OAuth"
                >
                  <Key className="w-3.5 h-3.5" />
                  Connect
                </button>
                <button
                  onClick={async () => {
                    const { supabase, isSupabaseConfigured } = await import('../services/supabaseClient');
                    if (isSupabaseConfigured) {
                      await supabase.auth.signInWithOAuth({ provider: 'github' });
                    } else {
                      alert('Supabase not configured yet for this MVP.');
                    }
                  }}
                  className="flex-1 lg:flex-none bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                  title="Sign In with GitHub"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Sign In
                </button>
              </div>
            )}
            <button
              onClick={() => setProtocol(p => p === 'https' ? 'ssh' : 'https')}
              className="px-2 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1 border border-slate-200"
              title={`Switch to ${protocol === 'https' ? 'SSH' : 'HTTPS'}`}
            >
              {protocol === 'https' ? <Shield className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
              {protocol.toUpperCase()}
            </button>
          </div>
          
          <div className="relative flex-1 lg:flex-none">
            <GitBranch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full lg:w-auto appearance-none bg-slate-50 lg:bg-white border border-slate-200 focus:border-black rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-slate-700 transition-all outline-none"
            >
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          <button
            onClick={verifySyncStatus}
            disabled={isCloning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-indigo-200 disabled:opacity-50 transition-all border border-indigo-200"
            title="Verify Sync & Patch"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Verify Sync
          </button>
          <button
            onClick={() => handleClone('mhvnsnt/CODEDUMMY')}
            disabled={isCloning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-blue-200 disabled:opacity-50 transition-all border border-blue-200"
            title="Clone mhvnsnt/CODEDUMMY"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Clone CODEDUMMY
          </button>
          <button
            onClick={() => handleClone()}
            disabled={isCloning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-200 disabled:opacity-50 transition-all border border-slate-200"
            title="Clone Repository"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Clone Custom
          </button>
          <button
            onClick={handlePush}
            disabled={isPushing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            title="Push to GitHub"
          >
            {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            Push
          </button>
                    <button
            onClick={handlePullSync}
            disabled={isCloning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
            title="Pull Latest from GitHub"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Pull
          </button>
          <button
            onClick={handleAutoSync}
            disabled={isPushing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            title="Push Auto-Sync mhvnsnt/CODEDUMMY"
          >
            {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            Sync Up
          </button>
          <button
            onClick={() => {
              // Token injected in backend
              setShowPRPreview(true);
            }}
            disabled={isPRing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            title="Preview Pull Request"
          >
            {isPRing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitPullRequest className="w-3.5 h-3.5" />}
            PR
          </button>
          
          <button
            onClick={() => setShowIntegrationsModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-emerald-200 transition-all border border-emerald-200"
            title="Configure Supabase pgvector"
          >
            <Database className="w-3.5 h-3.5" />
            Supabase
          </button>
          
          <button
            onClick={() => setShowIntegrationsModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-100 text-indigo-800 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-indigo-200 transition-all border border-indigo-200"
            title="Deploy to Railway (Qwen)"
          >
            <Server className="w-3.5 h-3.5" />
            Railway
          </button>

          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {isDeploying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Rocket className="w-3.5 h-3.5" />
            )}
            Deploy
          </button>
        </div>
      </div>

      <IntegrationsModal isOpen={showIntegrationsModal} onClose={() => setShowIntegrationsModal(false)} />
      <PRPreviewModal 
        isOpen={showPRPreview} 
        onClose={() => setShowPRPreview(false)} 
        onConfirm={handleConfirmPR} 
      />
    </>
  );
}
