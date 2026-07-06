import React, { useState, useEffect } from 'react';
import { Layers, Play, Plus, RefreshCw, Radio, CheckCircle, HelpCircle, Activity, LayoutGrid, Terminal } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  root_file: string;
  created_at: string;
  active_status: number;
}

export default function CommandNexus() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('bannon');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  // Form fields
  const [name, setName] = useState('');
  const [rootFile, setRootFile] = useState('');
  const [projectId, setProjectId] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/armada/projects');
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
        const active = data.projects.find((p: Project) => p.active_status === 1);
        if (active) {
          setActiveProjectId(active.id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects mapping:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchProject = async (id: string) => {
    try {
      const res = await fetch('/api/armada/projects/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id })
      });
      const data = await res.json();
      if (data.success) {
        setActiveProjectId(id);
        fetchProjects();
        setFeedbackMsg(`Successfully switched active workspace context to project: ${id}`);
        setTimeout(() => setFeedbackMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to switch project:', err);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rootFile.trim() || !projectId.trim()) return;

    try {
      const res = await fetch('/api/armada/projects/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          name,
          rootFile
        })
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setRootFile('');
        setProjectId('');
        fetchProjects();
        setFeedbackMsg(`Project "${name}" registered successfully inside Sector Matrix.`);
        setTimeout(() => setFeedbackMsg(''), 4500);
      } else {
        alert(data.error || 'Failed to register project');
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const executeManualThink = async (id: string) => {
    setThinking(true);
    setFeedbackMsg(`NexusMind is generating strategic directives for project: ${id}...`);
    try {
      const res = await fetch('/api/armada/projects/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setFeedbackMsg(`Think cycle completed. Directive: "${data.result.directive}"`);
      } else {
        setFeedbackMsg(`Error: ${data.error || 'Think cycle aborted'}`);
      }
    } catch (err) {
      console.error('Think loop failing:', err);
      setFeedbackMsg('Autonomous think cycle experienced an communication failure.');
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Sector Matrix High Altitude Header */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-white text-sm">Multi-Project Sector Matrix Orchestrator</h3>
          </div>
          <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono font-bold">
            LAYER 12 ACTIVE
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Manage isolated codebases and distribute compute resources. The round-robin scheduler allocates intelligence sequences to build independent assets.
        </p>

        {feedbackMsg && (
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg flex items-center gap-2 text-xs text-emerald-400 font-mono animate-fade-in">
            <Radio className="w-4 h-4 animate-ping text-emerald-500 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Live Project Workspace Matrices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            return (
              <div 
                key={p.id} 
                className={`border rounded-xl p-4.5 transition-all flex flex-col justify-between h-44 ${
                  isActive 
                    ? 'bg-zinc-900/40 border-emerald-500/50 shadow-sm' 
                    : 'bg-[#0d0d0d] border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">{p.name}</span>
                    {isActive ? (
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.2 rounded font-mono uppercase font-bold animate-pulse">
                        Slicing Active
                      </span>
                    ) : (
                      <span className="text-[9px] bg-zinc-950 text-zinc-500 border border-zinc-900 px-2 py-0.2 rounded font-mono uppercase">
                        Queued
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] font-mono mb-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-550">WORKSPACE ID:</span>
                      <span className="text-zinc-350">{p.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">ROOT VECTOR:</span>
                      <span className="text-zinc-350 break-all">{p.root_file}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">STABILITY INDEX:</span>
                      <span className="text-emerald-400/90 font-bold">100.0%</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-zinc-900 pt-3">
                  {!isActive && (
                    <button
                      onClick={() => switchProject(p.id)}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded text-[11px] text-zinc-300 font-bold uppercase transition-colors"
                    >
                      Focus Context
                    </button>
                  )}
                  <button
                    onClick={() => executeManualThink(p.id)}
                    disabled={thinking}
                    className="flex-1 bg-emerald-950/15 hover:bg-emerald-900/25 border border-emerald-900/40 px-3 py-1.5 rounded text-[11px] text-emerald-400 font-bold uppercase transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    Think Pass
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={fetchProjects}
          disabled={loading}
          className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-xs px-3.5 py-1.5 rounded-lg text-zinc-400 transition-all font-semibold font-sans self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Sectors
        </button>
      </div>

      {/* Add New Sector Matrix Workspace */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-white text-sm">Initialize New Space-Time Matrix Node</h3>
        
        <form onSubmit={createProject} className="flex flex-col gap-4.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">Workspace Identifier (id)</label>
              <input
                type="text"
                placeholder="reckon"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-800 font-mono"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">Project Human Name</label>
              <input
                type="text"
                placeholder="Reckon Combat Sandbox"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-800"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">Root Physics Engine Vector</label>
              <input
                type="text"
                placeholder="reckon.html"
                value={rootFile}
                onChange={(e) => setRootFile(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-800 font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 bg-emerald-950/20 hover:bg-emerald-900/35 border border-emerald-900/50 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors self-start"
          >
            <Plus className="w-4 h-4" />
            Initialize Workspace
          </button>
        </form>
      </div>

      {/* Orchestrator Simulation Log */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <h3 className="font-semibold text-white text-sm">Sector Allocation Stream</h3>
        </div>
        <div className="bg-zinc-950 rounded-lg border border-zinc-900 p-3 font-mono text-[11px] leading-relaxed text-zinc-400 flex flex-col gap-1">
          <div><span className="text-zinc-600">[23:35:50]</span> [ProjectOrchestrator] Registered default project mapping matrix</div>
          <div><span className="text-zinc-600">[23:35:50]</span> [ProjectMigrations] Table dna_archive project_id: SUCCESS</div>
          <div><span className="text-zinc-600">[23:35:51]</span> [ProjectMigrations] Table kinetic_logs project_id: SUCCESS</div>
          <div><span className="text-zinc-600">[23:35:51]</span> [ProjectMigrations] Table swarm_results project_id: SUCCESS</div>
          <div><span className="text-zinc-600">[23:35:51]</span> [ProjectMigrations] Table prompt_queue project_id: SUCCESS</div>
          <div><span className="text-zinc-600">[23:35:52]</span> [ProjectMigrations] Table memory_user_edits project_id: SUCCESS</div>
          <div><span className="text-emerald-500/80">[23:35:53]</span> [NexusMind] Core thread assigned to round-robin allocation slices</div>
        </div>
      </div>
    </div>
  );
}
