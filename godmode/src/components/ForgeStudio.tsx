import React, { useState, useCallback } from 'react';
import { Play, Sparkles, Download, RefreshCw, AlertTriangle, Code2, TerminalSquare, Cpu, Workflow, Bot } from 'lucide-react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor, 
  SandpackPreview, 
  SandpackConsole 
} from '@codesandbox/sandpack-react';
import { amethyst } from '@codesandbox/sandpack-themes';
import { usePrimeStore } from '../lib/store';

export default function ForgeStudio() {
  // Generative State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Architect Data - Bounded to Global Store
  const { 
    projectFiles, 
    setProjectFiles, 
    projectTemplate, 
    setProjectTemplate, 
    projectDeps, 
    setProjectDeps 
  } = usePrimeStore();
  
  const [architectPlan, setArchitectPlan] = useState<string[]>([]);
  const [repairInput, setRepairInput] = useState('');
  
  // Custom Model Configuration UI
  const [selectedModel, setSelectedModel] = useState<string>('Apex-Omni');

  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');

  const [mobileTab, setMobileTab] = useState<'editor' | 'preview' | 'logs'>('preview');

  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    
    setArchitectPlan(prev => [...prev, `[System] Ingesting ${droppedFiles.length} raw assets...`]);
    
    droppedFiles.forEach(async (file: any) => {
      const textData = await file.text();
      console.log(`Ingesting file density: ${file.name}`);
      setArchitectPlan(prev => [...prev, `[System] Parsed ${file.name}`]);
      
      try {
        await fetch('/api/armada/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, content: textData })
        });
      } catch (e) {
         console.error("Ingest failed", e);
      }
    });
  }, []);

  const handleArchitectPrompt = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setMobileTab('logs');
    setArchitectPlan(['[Network] Establishing uplink to Omni-Core...', '[Model] Classifying execution intent...']);
    
    try {
      const res = await fetch('/api/forge/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, targetTemplate: projectTemplate, customModel: selectedModel })
      });
      const data = await res.json();
      
      if (data.error) {
        setArchitectPlan(prev => [...prev, `[Critical Error] ${data.error}`]);
      } else {
        if (data.plan) {
           setArchitectPlan(prev => [...prev, ...data.plan.map((p: string) => `[Architect] ${p}`)]);
        }
        if (data.template) {
           setProjectTemplate(data.template);
        }
        if (data.files) {
           setProjectFiles((prev: any) => ({ ...prev, ...data.files }));
           setArchitectPlan(prev => [...prev, `[System] Injecting ${data.template || 'react-ts'} AST payload into container...`]);
        }
        if (data.dependencies) {

           setProjectDeps((prev: any) => ({ ...prev, ...data.dependencies }));
        }
      }
    } catch (e: any) {
      setArchitectPlan(prev => [...prev, `[Critical Error] ${e.message}`]);
    }
    setIsGenerating(false);
  };

  const handleRepair = async (errorText: string) => {
    setIsGenerating(true);
    setArchitectPlan(prev => [...prev, `[Self-Repair] Triggering auto-fix for: ${errorText}`]);
    try {
       const res = await fetch('/api/forge/architect-repair', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ prompt, currentFiles: projectFiles, errors: errorText, customModel: selectedModel })
       });
       const data = await res.json();
       if (data.plan) {
           setArchitectPlan(prev => [...prev, ...data.plan.map((p: string) => `[Repair] ${p}`)]);
       }
       if (data.files) {
           setProjectFiles((prev: any) => ({ ...prev, ...data.files }));
           setArchitectPlan(prev => [...prev, '[Repair] Patch injected successfully. Environment reloading.']);
       }
    } catch (e: any) {
       setArchitectPlan(prev => [...prev, `[Repair Error] ${e.message}`]);
    }
    setIsGenerating(false);
  };
  
  const downloadArtifact = () => {
     if (projectTemplate === 'vanilla' && projectFiles['/index.html']) {
         let html = projectFiles['/index.html'] || '';
         const js = projectFiles['/index.js'] || '';
         const css = projectFiles['/styles.css'] || '';

         if (js) {
             html = html.replace('<script src="/index.js"></script>', `<script>${js}</script>`);
             html = html.replace('<script src="index.js"></script>', `<script>${js}</script>`);
         }
         if (css) {
             html = html.replace('</head>', `<style>${css}</style></head>`);
         }

         const blob = new Blob([html], { type: 'text/html' });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = 'arcade_game.html';
         a.click();
         URL.revokeObjectURL(url);
     } else {
         downloadProject();
     }
  };

  const downloadProject = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();
      
      Object.entries(projectFiles).forEach(([path, content]) => {
         const relativePath = path.startsWith('/') ? path.substring(1) : path;
         zip.file(relativePath, content as string);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `ForgeStudio_Artifact_${Date.now()}.zip`);
    } catch (e) {
      alert("Failed to package and download artifact.");
    }
  };

  return (
    <div 
      onDrop={handleDrop} 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      className="flex flex-col h-full bg-[#0a0a0a] text-white font-sans overflow-hidden relative"
    >
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-indigo-500 m-4 rounded-xl">
             <div className="text-3xl font-bold uppercase tracking-widest text-indigo-300">Drop raw assets to increase resource density</div>
          </div>
        )}
        {/* Generative Top Bar */}
        <div className="border-b border-zinc-800 bg-[#050505] p-3 flex flex-col gap-3 shrink-0 z-10 w-full shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
           <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-sm tracking-widest uppercase bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">Supreme Multi-Core Architect</h2>
               </div>
               
               <div className="flex items-center gap-2">
                 <Bot className="w-4 h-4 text-zinc-500" />
                 <select 
                   value={selectedModel} 
                   onChange={e => setSelectedModel(e.target.value)}
                   className="bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 outline-none text-zinc-300 shadow-inner"
                 >
                   <option value="Apex-Omni">Custom: Apex-Omni-X</option>
                   <option value="Game-Dev-Pro">Custom: Genesis-Game-Gen</option>
                   <option value="UI-Specialist">Custom: UI-God-Mode</option>
                   <option value="Logic-Master">Custom: Neural-Logic-Core</option>
                 </select>
               </div>
           </div>
           
           <div className="flex gap-2 w-full">
              <select 
                 className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-400 focus:outline-none"
                 value={projectTemplate}
                 onChange={(e) => setProjectTemplate(e.target.value as any)}
              >
                 <option value="react-ts">React.js Web App</option>
                 <option value="vanilla">HTML5 Game (Vanilla)</option>
              </select>
              <input 
                 type="text"
                 placeholder="Describe app/game..."
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleArchitectPrompt(); }}
                 disabled={isGenerating}
                 className="flex-1 bg-zinc-900/80 border border-zinc-800/80 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
              <button 
                 onClick={handleArchitectPrompt}
                 disabled={isGenerating || !prompt.trim()}
                 className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 text-white font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-lg shadow-indigo-900/30"
              >
                 {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                 {isGenerating ? 'Synthesizing...' : 'Execute Architect'}
              </button>
           </div>
           
           {/* Mobile Tabs */}
           <div className="md:hidden flex rounded-lg overflow-hidden border border-zinc-800 bg-[#000]">
               <button onClick={() => setMobileTab('logs')} className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold ${mobileTab === 'logs' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500'}`}>Chain</button>
               <button onClick={() => setMobileTab('editor')} className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold border-l border-zinc-800 ${mobileTab === 'editor' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500'}`}>Editor</button>
               <button onClick={() => setMobileTab('preview')} className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold border-l border-zinc-800 ${mobileTab === 'preview' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-500'}`}>View</button>
           </div>
        </div>

        {/* Workspace Area */}
        <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">
            
            {/* Left Sidebar: Architect Plan / execution logs */}
            <div className={`${mobileTab === 'logs' ? 'flex w-full' : 'hidden'} md:flex md:w-64 border-r border-zinc-800 bg-[#080808] flex-col shrink-0 relative z-0 h-full overflow-hidden shadow-xl`}>
               <div className="p-3 border-b border-zinc-800 flex items-center gap-2 bg-[#050505]">
                  <Workflow className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-300">Execution Chain</span>
               </div>
               <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed flex flex-col gap-2">
                  {architectPlan.length === 0 && <div className="text-zinc-600 text-center mt-10 italic">Awaiting neural input...</div>}
                  {architectPlan.map((step, i) => (
                     <div key={i} className={`p-2 rounded border border-zinc-800/50 ${step.includes('[Critical Error]') ? 'bg-red-950/30 text-red-400' : step.includes('[Self-Repair]') ? 'bg-amber-950/30 text-amber-400' : 'bg-zinc-900/30 text-indigo-300'}`}>
                        {step}
                     </div>
                  ))}
               </div>
               
               {/* Quick Repair Tool */}
               <div className="p-3 border-t border-zinc-800 bg-[#050505] flex flex-col gap-2">
                 <input 
                   type="text" 
                   placeholder="Describe what's wrong or paste error..."
                   value={repairInput}
                   onChange={e => setRepairInput(e.target.value)}
                   onKeyDown={e => { if(e.key === 'Enter') { handleRepair(repairInput || "It's not working, please fix the errors and try again."); } }}
                   className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-zinc-300"
                 />
                 <button 
                   onClick={() => handleRepair(repairInput || "It's not working, please fix the errors and try again.")}
                   disabled={isGenerating || Object.keys(projectFiles).length <= 2}
                   className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-amber-500 text-[11px] font-bold py-1.5 rounded uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-amber-500/20"
                 >
                   <AlertTriangle className="w-3 h-3" />
                   Trigger Fix / Adjust
                 </button>
               </div>
            </div>

            {/* Main Sandpack Instance */}
            <div className={`${mobileTab !== 'logs' ? 'flex w-full' : 'hidden'} md:flex flex-1 flex-col h-full bg-[#111] overflow-hidden shrink-0 relative z-0`}>
               <SandpackProvider 
                 template={projectTemplate}
                 theme={amethyst}
                 files={projectFiles}
                 customSetup={{
                    dependencies: projectDeps
                 }}
                 options={{
                   activeFile: projectTemplate === 'react-ts' ? "/App.tsx" : "/index.html",
                   visibleFiles: Object.keys(projectFiles).filter(f => !f.includes('public/index.html'))
                 }}
               >
                 <div className="flex h-full w-full relative">
                   <SandpackLayout className="flex-1 h-full rounded-none max-md:!flex-col !flex-col md:!flex-row max-w-none bg-transparent overflow-hidden">
                      <div className={`${mobileTab === 'editor' ? 'flex h-full' : 'hidden md:flex h-1/2 md:h-full'} w-full md:w-1/2 flex-col border-b md:border-b-0 md:border-r border-zinc-800 shrink-0`}>
                         <div className="p-2 border-b border-zinc-800 bg-[#050505] flex items-center gap-2 shrink-0">
                            <Code2 className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs uppercase tracking-wider text-zinc-300 font-semibold">Project Files</span>
                         </div>
                         <SandpackCodeEditor 
                           showTabs={true} 
                           showLineNumbers={true}
                           showInlineErrors={true}
                           wrapContent={true}
                           style={{ height: 'calc(100% - 37px)', flex: 1, minHeight: 0 }}
                         />
                      </div>
                      
                      <div className={`${mobileTab === 'preview' ? 'flex h-full' : 'hidden md:flex h-1/2 md:h-full'} w-full md:w-1/2 flex-col relative shrink-0`}>
                         <div className="p-2 border-b border-zinc-800 bg-[#050505] flex justify-between items-center shrink-0">
                            <div className="flex gap-4">
                               <button 
                                 onClick={() => setActiveTab('preview')}
                                 className={`flex items-center gap-2 text-xs uppercase tracking-wider font-semibold transition-colors ${activeTab === 'preview' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                               >
                                 <Play className="w-3.5 h-3.5" /> Preview
                               </button>
                               <button 
                                 onClick={() => setActiveTab('console')}
                                 className={`flex items-center gap-2 text-xs uppercase tracking-wider font-semibold transition-colors ${activeTab === 'console' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                               >
                                 <TerminalSquare className="w-3.5 h-3.5" /> Console
                               </button>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={downloadArtifact}
                                className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 transition-colors text-[10px] px-2 py-1 rounded border border-indigo-500/30 font-bold uppercase tracking-widest hidden md:flex items-center gap-1"
                                title="Download Standalone Artifact"
                              >
                                <Download className="w-3 h-3" /> Artifact
                              </button>
                              <button 
                                onClick={downloadProject}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                title="Download Zip"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                         </div>
                         
                         <div className="flex-1 relative w-full overflow-hidden bg-white">
                           {activeTab === 'preview' ? (
                             <SandpackPreview 
                               showNavigator={true} 
                               showRefreshButton={true} 
                               showOpenInCodeSandbox={false}
                               style={{ height: '100%' }}
                             />
                           ) : (
                             <div className="w-full h-full bg-[#1e1e1e]">
                               <SandpackConsole 
                                 resetOnPreviewRestart={true}
                                 style={{ height: '100%', width: '100%' }} 
                               />
                             </div>
                           )}
                         </div>
                      </div>
                   </SandpackLayout>
                 </div>
               </SandpackProvider>
            </div>

        </div>
    </div>
  );
}
