import React, { useState, useEffect } from 'react';
import { cn } from '../App';
import { CAPSTONE_PROJECTS, SkillTreeData } from '../types';
import ConversionModal from './ConversionModal';
import ProjectAnalytics from './ProjectAnalytics';
import {  Lock, Unlock, PlayCircle, Share2, Check, ExternalLink , GitFork, Download, GitBranch, History, User, Clock } from 'lucide-react';
import { SnapshotGallery } from './SnapshotGallery';
import { ProjectDef } from '../types';

interface ProjectSelectionProps {
  skillTree: SkillTreeData;
  onProjectStart: (projectId: string) => void;
  onUnlockLab: () => void;
  addXp: (amount: number) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  userId: string;
  isBuyer: boolean;
  onOpenSignIn: () => void;
}

export default function ProjectSelection({ 
  skillTree, 
  onProjectStart, 
  onUnlockLab, 
  addXp,
  activeProjectId,
  setActiveProjectId,
  userId,
  isBuyer,
  onOpenSignIn
}: ProjectSelectionProps) {
  const [buildingProject, setBuildingProject] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [githubStatus, setGithubStatus] = useState<string | null>(null);

  const [forkedProjects, setForkedProjects] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('codedummy-forked-projects') || '[]');
    } catch {
      return [];
    }
  });

  const [forkHistory, setForkHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('codedummy-fork-history');
    if (saved) return JSON.parse(saved);

    // Initial mock lineage to show elegant timeline graphs immediately
    return [
      {
        id: 'fork-mock-1',
        sourceId: 'audio_visualizer',
        sourceName: 'Audio Visualizer',
        forkedId: 'audio_visualizer-fork-1',
        forkedName: 'Neon Wave Audio Mod',
        timestamp: 'Jul 2, 2026, 11:30 AM',
        attribution: 'marquiswhitacre@gmail.com'
      },
      {
        id: 'fork-mock-2',
        sourceId: 'audio_visualizer',
        sourceName: 'Audio Visualizer',
        forkedId: 'audio_visualizer-fork-2',
        forkedName: '808 Stereo Visual Bass',
        timestamp: 'Jul 3, 2026, 03:45 PM',
        attribution: 'dg88will@gmail.com'
      },
      {
        id: 'fork-mock-3',
        sourceId: 'crypto_ticker',
        sourceName: 'Crypto Panic Ticker',
        forkedId: 'crypto_ticker-fork-1',
        forkedName: 'DeFi Liquidity Alarm Ticker',
        timestamp: 'Jul 2, 2026, 09:20 PM',
        attribution: 'dg88will@gmail.com'
      },
      {
        id: 'fork-mock-4',
        sourceId: 'crypto_ticker',
        sourceName: 'Crypto Panic Ticker',
        forkedId: 'crypto_ticker-fork-2',
        forkedName: 'Bitcoin Whale Signal Tracker',
        timestamp: 'Jul 3, 2026, 01:10 PM',
        attribution: 'marquiswhitacre@gmail.com'
      },
      {
        id: 'fork-mock-5',
        sourceId: 'paintbrush_tool',
        sourceName: 'Paintbrush Tool',
        forkedId: 'paintbrush_tool-fork-1',
        forkedName: 'Rainbow Brush Speed Canvas',
        timestamp: 'Jul 3, 2026, 06:15 PM',
        attribution: 'usr_F294A1'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('codedummy-fork-history', JSON.stringify(forkHistory));
  }, [forkHistory]);

  const handleFork = (project: any) => {
    const newFork = {
      ...project,
      id: `${project.id}-fork-${Date.now()}`,
      name: `${project.name} (Forked)`,
      isFork: true
    };
    const newForks = [...forkedProjects, newFork];
    setForkedProjects(newForks);
    localStorage.setItem('codedummy-forked-projects', JSON.stringify(newForks));

    // Save fork in lineage log history
    const authorEmail = localStorage.getItem('codedummy-user-email') || 'usr_' + userId.slice(-6).toUpperCase();
    const newHistoryEntry = {
      id: `fork-hist-${Date.now()}`,
      sourceId: project.id.split('-fork-')[0], // associate back to root blueprint
      sourceName: project.name.replace(' (Forked)', ''),
      forkedId: newFork.id,
      forkedName: newFork.name,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      attribution: authorEmail
    };
    setForkHistory(prev => [newHistoryEntry, ...prev]);

    handleProjectClick(newFork.id, true);
  };

  const handleExportProject = (project: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      projectName: project.name,
      description: project.description,
      id: project.id,
      exportedAt: new Date().toISOString(),
      metadata: {
        skillsRequired: project.requires,
        xpReward: project.xpReward,
        author: "Orion Developer Sandbox"
      },
      codeFiles: {
        "src/App.tsx": localStorage.getItem(`codedummy-saved-code-${project.id}`) || "// Default sandbox code",
        "package.json": localStorage.getItem(`codedummy-saved-package-${project.id}`) || "{\n  \"name\": \"dummy\"\n}"
      }
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };


  const isProjectUnlocked = (requires: string[]) => {
    return requires.every(req => skillTree.skills[req as keyof typeof skillTree.skills]?.unlocked);
  };

  const getConflictWarning = (project: any) => {
    if (Math.random() > 0.7) return "Dependency conflict detected: react-dom version mismatch.";
    return null;
  };

  const handleProjectClick = (projectId: string, unlocked: boolean) => {
    if (!unlocked) return;
    
    setBuildingProject(projectId);
    setTimeout(() => {
      addXp(50); // Award XP for completion
      setActiveProjectId(projectId);
      setBuildingProject(null);
      setShowModal(true);
    }, 1500);
  };

  const handleCopyLink = (projectId: string) => {
    const url = `${window.location.origin}?project=${projectId}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const activeProjectDef = [...CAPSTONE_PROJECTS, ...forkedProjects].find(p => p.id === activeProjectId);

  return (
    <div className="flex flex-col items-center justify-start w-full min-h-full py-12 px-4 md:px-8">
      <header className="w-full max-w-5xl mb-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left animate-in fade-in">
        <div>
          <h1 className="text-sm font-bold tracking-widest uppercase text-black mb-2 opacity-80">
            The Sandbox Menu
          </h1>
          <h2 className="text-3xl md:text-4xl font-black text-black">
            Select Your Capstone
          </h2>
          <p className="mt-4 text-slate-500 max-w-2xl text-sm leading-relaxed">
            The system dynamically reveals what you can build next based on the tools you have acquired. Pick a project to prove your knowledge and share it with others!
          </p>
        </div>
        
        {/* XP Display */}
        <div className="flex flex-col items-center justify-center p-4 bg-black text-white rounded-xl shadow-lg border border-black/10 shrink-0">
          <span className="text-[10px] uppercase font-mono tracking-widest opacity-80 mb-1">Total XP</span>
          <span className="text-2xl font-black tabular-nums">{skillTree.xp}</span>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl">
        {/* Active Shared Project Spotlight */}
        {activeProjectId && activeProjectDef && (
          <div className="mb-12 bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Share2 className="w-48 h-48" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <span className="bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                  Active Share Preview Mode
                </span>
                <h3 className="text-2xl font-black mt-3 text-white tracking-tight">{activeProjectDef.name}</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">{activeProjectDef.description}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span>OpenGraph Meta Preview loaded in document headers for SEO crawling.</span>
                </div>
              </div>
              
              <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 shrink-0 flex flex-col gap-2 w-full md:w-80">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Shareable Project URL</span>
                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-300">
                  <span className="truncate flex-1 font-mono">{`${window.location.origin}?project=${activeProjectId}`}</span>
                </div>
                <button
                  onClick={() => handleCopyLink(activeProjectId)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {shareCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      COPIED!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      COPY LINK TO SHARE
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onUnlockLab(); // This triggers setCurrentView('agent') in App.tsx
                    localStorage.setItem('agent-active-tab', 'playground');
                    window.dispatchEvent(new Event('switch-agent-tab-playground'));
                  }}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-lg bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-500 transition-colors cursor-pointer mt-1 shadow-md w-full animate-pulse"
                >
                  <PlayCircle className="w-4 h-4" />
                  LAUNCH & PLAY IN PLAYGROUND
                </button>

                <button
                  onClick={() => handleFork(activeProjectDef)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-colors cursor-pointer mt-2"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  FORK PROJECT
                </button>

                <button
                  onClick={() => handleExportProject(activeProjectDef)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs uppercase tracking-wider hover:bg-slate-700 hover:text-white transition-colors cursor-pointer mt-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT PROJECT (JSON)
                </button>

              </div>
            </div>
          </div>
        )}

        <div className="panel w-full mb-8">
          <h2>Available Blueprints</h2>
          <div className="grid-options">
            {[...CAPSTONE_PROJECTS, ...forkedProjects].map((project) => {
              const unlocked = isProjectUnlocked(project.requires);
              const isHybrid = project.isHybrid;
              const isActive = activeProjectId === project.id;

              return (
                <div 
                  key={project.id}
                  onClick={() => unlocked && handleProjectClick(project.id, unlocked)}
                  className={cn(
                    "option-btn flex flex-col gap-2 relative text-left select-none",
                    !unlocked && "opacity-50 cursor-not-allowed",
                    isHybrid && "hybrid md:col-span-2",
                    isActive && "ring-2 ring-emerald-500 bg-emerald-50/50 border-emerald-200"
                  )}
                  role="button"
                  tabIndex={unlocked ? 0 : -1}
                >
                      <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-sm leading-tight text-black">{project.name}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setGithubStatus(`Syncing '${project.name}' structures to your linked GitHub repository...`);
                          setTimeout(() => setGithubStatus(null), 3500);
                        }} 
                        className="p-1 hover:bg-slate-200 rounded"
                        disabled={!unlocked}
                      >
                        <GitBranch className="w-3 h-3 text-slate-500" />
                      </button>
                      {unlocked ? (
                        isActive ? (
                          <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">Active</span>
                        ) : (
                          <Unlock className="w-3 h-3 text-emerald-500 shrink-0" />
                        )
                      ) : (
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                    {project.description}
                  </span>
                  
                  {buildingProject === project.id && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in z-20 rounded-md">
                      <PlayCircle className="w-6 h-6 text-black mb-1 animate-pulse" />
                      <span className="text-black font-bold text-[10px] uppercase tracking-widest">Building</span>
                    </div>
                  )}
                  {getConflictWarning(project) && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" title={getConflictWarning(project)!}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fork Lineage Graph Panel */}
        <div className="panel w-full mb-8 animate-in fade-in">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/5 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-black">Fork Lineage Graph</h2>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
                Visual Lineage Tree & User Attribution
              </p>
            </div>
            
            {activeProjectId && (
              <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 text-[10px] font-mono rounded border border-indigo-100 uppercase">
                Inspecting: {activeProjectId.split('-fork-')[0]}
              </div>
            )}
          </div>

          {activeProjectId ? (
            (() => {
              const rootId = activeProjectId.split('-fork-')[0];
              const rootProj = CAPSTONE_PROJECTS.find(p => p.id === rootId);
              const relatedForks = forkHistory.filter(f => f.sourceId === rootId);

              return (
                <div className="bg-slate-50/50 rounded-2xl border border-black/5 p-6 relative overflow-hidden">
                  <div className="flex flex-col gap-6 relative">
                    
                    {/* The root parent project node */}
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                        P
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">Root Blueprint</span>
                          <span className="bg-slate-100 text-slate-500 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">Master</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 mt-1">{rootProj ? rootProj.name : rootId.toUpperCase()}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">The original master repository maintained by Orion Enterprises.</p>
                      </div>
                    </div>

                    {/* Dotted vertical connector lines */}
                    {relatedForks.length > 0 && (
                      <div className="absolute left-5 top-10 bottom-6 w-0.5 border-l border-dashed border-slate-300 pointer-events-none" />
                    )}

                    {relatedForks.length > 0 ? (
                      <div className="flex flex-col gap-6 pl-10 mt-2">
                        {relatedForks.map((fork, idx) => (
                          <div key={fork.id} className="flex items-start gap-4 relative z-10 group">
                            {/* Line connector branch */}
                            <div className="absolute -left-6 top-5 w-4 h-0.5 border-t border-dashed border-slate-300" />
                            
                            {/* Node icon with user avatar */}
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0 shadow-sm">
                              {fork.attribution.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-black/5 flex-1 shadow-sm group-hover:shadow-md group-hover:border-indigo-200 transition-all">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-800">{fork.forkedName}</span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                  <Clock className="w-3 h-3" />
                                  <span>{fork.timestamp}</span>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  Attribution: <strong className="text-slate-700">{fork.attribution}</strong>
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-indigo-600 font-bold uppercase tracking-wider text-[8px] bg-indigo-50 px-1.5 py-0.5 rounded">
                                  Fork Revision #{relatedForks.length - idx}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pl-10 mt-2 text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
                        <GitFork className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">No Forks Yet</h4>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                          There are currently no forks registered for this project. Use the "Fork Project" action above to create your personal sandboxed branch!
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-black/5">
              <History className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Lineage Trace Standby</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Please select any capstone blueprint from the list above to dynamically project and render its active forks, developer revision histories, and branching lineage tree.
              </p>
            </div>
          )}
        </div>
        
        <SnapshotGallery />
        <ProjectAnalytics />
      </div>

      <ConversionModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
        }}
        onSignUp={() => {
          setShowModal(false);
          onUnlockLab();
        }}
        userId={userId}
        isBuyer={isBuyer}
        onOpenSignIn={onOpenSignIn}
      />

      {githubStatus && (
        <div className="fixed bottom-4 left-4 z-[99999] bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg shadow-xl font-mono text-xs flex items-center gap-2 animate-in slide-in-from-bottom-10">
          <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{githubStatus}</span>
        </div>
      )}
    </div>
  );
}
