import React, { useState, useEffect } from 'react';
import { Upload, Play, Settings, Server, Clock, Image as ImageIcon, Box, Save, Download, ChevronDown, Check, FolderHeart, Activity, ListOrdered, Layers, ShieldCheck, Wand2, Grid3X3, Camera, Cpu, Database, Eye, Map, MousePointer2, Paintbrush, Network, Shuffle, Move, RotateCcw, Maximize, Crosshair, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell } from 'recharts';
import ModelViewer from './components/ModelViewer';

// Types
interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'error' | 'processing';
}

interface Preset {
  id: string;
  name: string;
  engineMode: string;
  viewInjection: number;
  polyTarget: number;
  voxelRes: number;
  retopology: string;
  rigging: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'generation' | 'batch' | 'presets' | 'library' | 'performance' | 'textures' | 'import' | 'cinematics' | 'morph'>('generation');
  
  const [prompt, setPrompt] = useState("");
  const [batchPrompts, setBatchPrompts] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Settings
  const [engineMode, setEngineMode] = useState("Trellis 2 Ultra");
  const [viewInjection, setViewInjection] = useState(4);
  const [polyTarget, setPolyTarget] = useState(8500000);
  const [voxelRes, setVoxelRes] = useState(1024);
  const [retopology, setRetopology] = useState("Quad-Dominant (AI)");
  const [rigging, setRigging] = useState("Bannon Deep IK");
  const [animationPreset, setAnimationPreset] = useState("None");
  const [segmentationMethod, setSegmentationMethod] = useState("Blender MCP (15-Node Skinned)");
  const [pbrMaterials, setPbrMaterials] = useState(true);
  const [magicBrush, setMagicBrush] = useState(false);
  const [symmetryEnforcement, setSymmetryEnforcement] = useState(false);
  
  // App State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatching, setIsBatching] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isUvMap, setIsUvMap] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isVertexPaint, setIsVertexPaint] = useState(false);
  const [superResolution, setSuperResolution] = useState(false);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [vramUsage, setVramUsage] = useState(1.2); // GB
  const [meshHealth, setMeshHealth] = useState({ score: 0, manifold: false, strays: 0, highValence: 0, nonManifoldEdges: 0 });
  
  // Advanced State
  const [performanceMode, setPerformanceMode] = useState<'low_vram' | 'high_fidelity'>('high_fidelity');
  const [cameraAngle, setCameraAngle] = useState<'Free Cam' | 'Top-Down' | 'Front-View' | 'Side-Profile' | 'Isometric'>('Free Cam');
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  
  // Undo / Redo History Stack
  interface SettingsState {
    engineMode: string; viewInjection: number; polyTarget: number; voxelRes: number; 
    retopology: string; rigging: string; animationPreset: string; segmentationMethod: string; 
    pbrMaterials: boolean; magicBrush: boolean; symmetryEnforcement: boolean;
  }
  const [history, setHistory] = useState<SettingsState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  useEffect(() => {
    // Initialize history with default state
    if (history.length === 0) {
      setHistory([{ engineMode, viewInjection, polyTarget, voxelRes, retopology, rigging, animationPreset, segmentationMethod, pbrMaterials, magicBrush, symmetryEnforcement }]);
      setHistoryIndex(0);
    }
  }, []);
  
  const updateSetting = (key: keyof SettingsState, value: any) => {
    const currentState = { engineMode, viewInjection, polyTarget, voxelRes, retopology, rigging, animationPreset, segmentationMethod, pbrMaterials, magicBrush, symmetryEnforcement };
    const nextState = { ...currentState, [key]: value };
    
    // Apply state
    if (key === 'engineMode') setEngineMode(value);
    if (key === 'viewInjection') setViewInjection(value);
    if (key === 'polyTarget') setPolyTarget(value);
    if (key === 'voxelRes') setVoxelRes(value);
    if (key === 'retopology') setRetopology(value);
    if (key === 'rigging') setRigging(value);
    if (key === 'animationPreset') setAnimationPreset(value);
    if (key === 'segmentationMethod') setSegmentationMethod(value);
    if (key === 'pbrMaterials') setPbrMaterials(value);
    if (key === 'magicBrush') setMagicBrush(value);
    if (key === 'symmetryEnforcement') setSymmetryEnforcement(value);
    
    // Save to history
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, nextState]);
    setHistoryIndex(newHistory.length);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setEngineMode(prevState.engineMode); setViewInjection(prevState.viewInjection);
      setPolyTarget(prevState.polyTarget); setVoxelRes(prevState.voxelRes);
      setRetopology(prevState.retopology); setRigging(prevState.rigging);
      setAnimationPreset(prevState.animationPreset); setSegmentationMethod(prevState.segmentationMethod);
      setPbrMaterials(prevState.pbrMaterials); setMagicBrush(prevState.magicBrush);
      setSymmetryEnforcement(prevState.symmetryEnforcement);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setEngineMode(nextState.engineMode); setViewInjection(nextState.viewInjection);
      setPolyTarget(nextState.polyTarget); setVoxelRes(nextState.voxelRes);
      setRetopology(nextState.retopology); setRigging(nextState.rigging);
      setAnimationPreset(nextState.animationPreset); setSegmentationMethod(nextState.segmentationMethod);
      setPbrMaterials(nextState.pbrMaterials); setMagicBrush(nextState.magicBrush);
      setSymmetryEnforcement(nextState.symmetryEnforcement);
      setHistoryIndex(historyIndex + 1);
    }
  };
  
  // Texture Inspector
  const [activeTextureMap, setActiveTextureMap] = useState<'Combined' | 'Albedo' | 'Roughness' | 'Metallic' | 'Normal' | 'Glow'>('Combined');
  
  // Batch Tasks
  interface BatchTask {
    id: string;
    prompt: string;
    status: 'Pending' | 'Processing' | 'Completed';
    progress: number;
  }
  const [batchTasks, setBatchTasks] = useState<BatchTask[]>([]);
  
  // Import Queue Tasks
  interface ImportTask {
    id: string;
    filename: string;
    status: 'Pending' | 'Uploading' | 'Processing' | 'Bound to Supabase';
    progress: number;
  }
  const [importTasks, setImportTasks] = useState<ImportTask[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleMultiImport = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let files: FileList | null = null;
    if ('dataTransfer' in e) {
      files = e.dataTransfer.files;
    } else if (e.target.files) {
      files = e.target.files;
    }
    
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    const tasks = fileArray.map(f => ({
      id: Math.random().toString(36).substring(7),
      filename: f.name,
      status: 'Pending' as const,
      progress: 0
    }));
    
    setImportTasks(prev => [...prev, ...tasks]);
    setIsImporting(true);
    
    addLog('Import', `Queued ${tasks.length} files for import to Supabase 'gen_jobs'...`, 'info');
    
    for (const task of tasks) {
      // Simulate parallel processing per file but just run sequentially for UI simplicity, 
      // or we can fire them off together. Let's fire them off!
      const processFile = async (taskId: string) => {
        setImportTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Uploading' } : t));
        
        let fileProgress = 0;
        while (fileProgress < 50) {
          fileProgress += Math.floor(Math.random() * 15) + 5;
          if (fileProgress > 50) fileProgress = 50;
          setImportTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: fileProgress } : t));
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        setImportTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Processing' } : t));
        
        while (fileProgress < 100) {
          fileProgress += Math.floor(Math.random() * 15) + 5;
          if (fileProgress > 100) fileProgress = 100;
          setImportTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: fileProgress } : t));
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        setImportTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Bound to Supabase', progress: 100 } : t));
        addLog('Supabase', `Successfully bound ${task.filename} to 'gen_jobs' database.`, 'success');
      };
      
      processFile(task.id);
    }
  };
  
  // Saved Models (Library)
  interface SavedAsset {
    id: string;
    prompt: string;
    engineMode: string;
    timestamp: string;
  }
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);
  
  // Presets
  const [presets, setPresets] = useState<Preset[]>([
    {
      id: "1", name: "AAA Hero Asset", engineMode: "Trellis 2 Ultra",
      viewInjection: 4, polyTarget: 8500000, voxelRes: 1024,
      retopology: "Quad-Dominant (AI)", rigging: "Bannon Deep IK"
    },
    {
      id: "2", name: "Background Prop (LOD3)", engineMode: "Hunyuan3D Parallel Hybrid",
      viewInjection: 2, polyTarget: 150000, voxelRes: 256,
      retopology: "Triangle-Based", rigging: "None"
    }
  ]);

  // Mock WebSocket Connection
  useEffect(() => {
    setWsStatus('connecting');
    const timer = setTimeout(() => {
      setWsStatus('connected');
      addLog('System', 'Connected to local ComfyUI WebSocket', 'success');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  
  // VRAM Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isGenerating) {
        // Spiky VRAM usage during generation
        setVramUsage(prev => {
          const peak = performanceMode === 'high_fidelity' ? 18.5 : 9.5;
          const target = peak + (Math.random() * 4 - 2);
          return prev + (target - prev) * 0.1;
        });
      } else {
        // Idle VRAM usage
        setVramUsage(prev => {
          const target = 1.2 + (Math.random() * 0.2 - 0.1);
          return prev + (target - prev) * 0.05;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const addLog = (source: string, message: string, status: LogEntry['status']) => {
    setLogs(prev => [{
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      message: `[${source}] ${message}`,
      status
    }, ...prev]);
  };

  const handleGenerate = (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt && !imageFile && activeTab === 'generation') {
      addLog('Error', 'Please provide a text prompt or an image input.', 'error');
      return;
    }

    if (wsStatus !== 'connected') {
      addLog('Error', 'ComfyUI Backend is offline.', 'error');
      return;
    }

    setIsGenerating(true);
    setIsComplete(false);
    setProgress(0);
    setMeshHealth({ score: 0, manifold: false, strays: 0, highValence: 0, nonManifoldEdges: 0 });
    setIsWireframe(false);
    
    addLog('System', `Initiating M Craft Factory. Target: ${activePrompt.substring(0, 20)}... Engine: ${engineMode}`, 'info');
    
    // Simulate generation process
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 10) + 3;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setIsGenerating(false);
        setIsComplete(true);
        setProgress(100);
        
        // Randomly generate mesh health
        const score = Math.floor(Math.random() * 8) + 92; // 92 - 99
        setMeshHealth({ score, manifold: score > 94, strays: Math.floor(Math.random() * 3), highValence: Math.floor(Math.random() * 5), nonManifoldEdges: score > 94 ? 0 : 2 });
        
        // Save to asset library
        setSavedAssets(prev => [{
          id: Math.random().toString(36).substring(7),
          prompt: activePrompt || "Image Input Only",
          engineMode,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev]);
        
        addLog('System', 'AAA Asset generation complete. Ready for export.', 'success');
      } else {
        setProgress(currentProgress);
        if (currentProgress === 10) addLog('Vision', 'DINOv1 extracting latent vectors...', 'processing');
        if (currentProgress === 25) addLog('Hunyuan3D', `Injecting ${viewInjection} multi-view latents...`, 'processing');
        if (currentProgress === 40 && pbrMaterials) addLog('Material', 'Synthesizing PBR texture maps (Albedo, Normal, Roughness)...', 'processing');
        if (currentProgress === 50) addLog('Trellis2', `Triplane NeRF optimization running at ${voxelRes} voxel res...`, 'processing');
        if (currentProgress === 60 && symmetryEnforcement) addLog('Topology', 'Enforcing absolute mesh symmetry...', 'processing');
        if (currentProgress === 70) addLog('AutoRetopo', `Rebuilding mesh with ${retopology}...`, 'processing');
        if (currentProgress === 75) {
          if (segmentationMethod === 'Blender MCP (15-Node Skinned)') addLog('BlenderMCP', 'daemon_blender.py: Auto-skinned mesh segmentation into 15-node rig...', 'processing');
          else if (segmentationMethod === 'Geometric Split (Legacy)') addLog('Topology', 'Performing legacy geometric distance-based mesh splitting...', 'processing');
        }
        if (currentProgress === 85) addLog('BannonPhysics', `Rigging collision bounds via ${rigging}...`, 'processing');
        if (currentProgress === 90 && animationPreset !== 'None') addLog('Animation', `Baking ${animationPreset} motion data...`, 'processing');
      }
    }, 500);
  };

  const handleBatchGenerate = async () => {
    if (!batchPrompts.trim()) {
      addLog('Error', 'No batch prompts provided.', 'error');
      return;
    }
    
    const prompts = batchPrompts.split('\n').filter(p => p.trim());
    if (prompts.length === 0) return;
    
    setIsBatching(true);
    addLog('Batch', `Queuing ${prompts.length} autonomous generations...`, 'info');
    
    const tasks = prompts.map(p => ({
      id: Math.random().toString(36).substring(7),
      prompt: p,
      status: 'Pending' as const,
      progress: 0
    }));
    setBatchTasks(tasks);
    
    for (let i = 0; i < prompts.length; i++) {
      if (!isBatching) break; // Allow cancellation
      
      setBatchTasks(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'Processing' } : t));
      addLog('Batch', `Starting Task ${i+1}/${prompts.length}: ${prompts[i]}`, 'info');
      handleGenerate(prompts[i]);
      
      // Wait for completion (simulation)
      let taskProgress = 0;
      while (taskProgress < 100) {
        taskProgress += Math.floor(Math.random() * 10) + 5;
        if (taskProgress > 100) taskProgress = 100;
        setBatchTasks(prev => prev.map((t, idx) => idx === i ? { ...t, progress: taskProgress } : t));
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setBatchTasks(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'Completed', progress: 100 } : t));
      
      if (i < prompts.length - 1) {
         addLog('Batch', `Task ${i+1} completed. Caching to local DB...`, 'success');
         await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsBatching(false);
    addLog('Batch', 'Bulk processing queue finished successfully.', 'success');
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImageFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleSavePreset = () => {
    const newPreset: Preset = {
      id: Math.random().toString(36).substring(7),
      name: `Custom Preset ${presets.length + 1}`,
      engineMode, viewInjection, polyTarget, voxelRes, retopology, rigging
    };
    setPresets([...presets, newPreset]);
    addLog('System', `Saved new configuration preset: ${newPreset.name}`, 'info');
  };
  
  const handleLoadPreset = (preset: Preset) => {
    setEngineMode(preset.engineMode);
    setViewInjection(preset.viewInjection);
    setPolyTarget(preset.polyTarget);
    setVoxelRes(preset.voxelRes);
    setRetopology(preset.retopology);
    setRigging(preset.rigging);
    addLog('System', `Loaded preset: ${preset.name}`, 'info');
  };
  
  const [exportOpen, setExportOpen] = useState(false);
  const handleExport = (format: string) => {
    setExportOpen(false);
    if (format === 'LOD_Bundle') {
      addLog('Exporter', `Generating optimized L0-L3 variants for performance...`, 'processing');
      setTimeout(() => {
        addLog('Exporter', `L0 (100%), L1 (50%), L2 (25%), L3 (10%) generated successfully.`, 'success');
        addLog('Exporter', `Packaged multi-LOD bundle ready.`, 'success');
      }, 1200);
      return;
    }

    addLog('Exporter', `Packaging asset as ${format}...`, 'processing');
    setTimeout(() => {
      // Create hidden blob and download
      const blob = new Blob([`# M Craft Simulated ${format} file\n# Data...`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `m_craft_asset.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLog('Exporter', `Successfully exported m_craft_asset.${format.toLowerCase()}`, 'success');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Box className="text-cyan-500" />
            M Craft Model Creator
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Autonomous Local GPU Generation Panel</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800">
            <Server size={14} className={wsStatus === 'connected' ? 'text-cyan-500' : 'text-amber-500'} />
            <span className="text-zinc-300">
              {wsStatus === 'connected' ? 'Backend Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-full lg:w-1/3 lg:min-w-[400px] border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-900/50 flex flex-col h-[45vh] lg:h-auto shrink-0 lg:shrink">
          
          <div className="flex border-b border-zinc-800 overflow-x-auto scrollbar-hide">
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'generation' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('generation')}
            >
              <Wand2 size={16} /> Generation
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'batch' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('batch')}
            >
              <ListOrdered size={16} /> Batch
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'presets' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('presets')}
            >
              <FolderHeart size={16} /> Presets
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'library' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('library')}
            >
              <Database size={16} /> Library
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'performance' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('performance')}
            >
              <Cpu size={16} /> Performance
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'textures' as any ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('textures' as any)}
            >
              <Layers size={16} /> Textures
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'import' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('import')}
            >
              <Upload size={16} /> Import
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'cinematics' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('cinematics')}
            >
              <Camera size={16} /> Cinematics
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'morph' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('morph')}
            >
              <Shuffle size={16} /> Morph Engine
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
            {activeTab === 'generation' ? (
              <>
                {/* Inputs */}
                <section className="space-y-4">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Generation Inputs</h2>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Text Prompt</label>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your combat ready asset in detail here..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none h-24"
                    />
                    {/* Qwable Assistant - Prompt Architect */}
                    <div className="flex items-start gap-2 bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-3 mt-2">
                      <Wand2 size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-xs font-semibold text-indigo-300">Prompt Architect (Qwable Model)</span>
                           <button onClick={() => setPrompt(prompt + (prompt ? ', ' : '') + 'hyper-detailed, Unreal Engine 5 render, cinematic lighting, 8k resolution')} className="text-[10px] text-indigo-400 hover:text-indigo-200 uppercase font-bold tracking-wider transition-colors bg-indigo-900/40 px-2 py-0.5 rounded">Auto-Expand</button>
                        </div>
                        <p className="text-[11px] text-indigo-200/70 leading-relaxed mb-1">
                          Context-aware styling active. Suggestions based on archetype: 
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => setPrompt(prompt + (prompt ? ' ' : '') + 'Ronin with weathered metallic plating and tattered fabric')} className="px-1.5 py-0.5 rounded border border-indigo-800 bg-indigo-900/30 hover:bg-indigo-800 text-indigo-300 transition-colors text-[10px]">Ronin (Weathered Metal)</button>
                          <button onClick={() => setPrompt(prompt + (prompt ? ' ' : '') + 'Cybernetic operative with carbon-fiber armor and neon accents')} className="px-1.5 py-0.5 rounded border border-indigo-800 bg-indigo-900/30 hover:bg-indigo-800 text-indigo-300 transition-colors text-[10px]">Cybernetic (Carbon Fiber)</button>
                          <button onClick={() => setPrompt(prompt + (prompt ? ' ' : '') + 'Ancient golem with overgrown bioluminescent moss and glowing runes')} className="px-1.5 py-0.5 rounded border border-indigo-800 bg-indigo-900/30 hover:bg-indigo-800 text-indigo-300 transition-colors text-[10px]">Golem (Bioluminescent)</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Image Input</label>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleImageDrop}
                      className="w-full h-32 border-2 border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer relative overflow-hidden"
                    >
                      {imageFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon size={24} className="text-cyan-500" />
                          <span className="text-sm text-cyan-400 truncate max-w-[200px]">{imageFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload size={24} />
                          <span className="text-sm text-center px-4">Drop photos here for<br/>Multi-View Image to 3D</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                      />
                    </div>
                  </div>
                </section>

                {/* Advanced Settings */}
                <section className="space-y-4 border-t border-zinc-800 pt-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Settings size={16} />
                      Engine Calibration
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 border-r border-zinc-700 pr-3">
                        <button onClick={undo} disabled={historyIndex <= 0} className="text-[10px] px-2 py-1 bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors uppercase tracking-wider">Undo</button>
                        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="text-[10px] px-2 py-1 bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors uppercase tracking-wider">Redo</button>
                      </div>
                      <button onClick={handleSavePreset} className="text-xs flex items-center gap-1 text-cyan-500 hover:text-cyan-400">
                        <Save size={12} /> Save
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">Active Reconstruction Model</label>
                      <select 
                        value={engineMode}
                        onChange={(e) => updateSetting('engineMode', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-cyan-500/50 text-zinc-200"
                      >
                        <option value="Trellis 2 Ultra">Trellis 2 Ultra (Precision)</option>
                        <option value="Hunyuan3D Parallel Hybrid">Hunyuan3D Parallel Hybrid (Complex)</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Smart Retopology</label>
                        <select 
                          value={retopology}
                          onChange={(e) => updateSetting('retopology', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-cyan-500/50 text-zinc-200"
                        >
                          <option value="Quad-Dominant (AI)">Quad-Dominant (AI)</option>
                          <option value="Triangle-Based">Triangle-Based</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Auto-Rigging</label>
                        <select 
                          value={rigging}
                          onChange={(e) => updateSetting('rigging', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-cyan-500/50 text-zinc-200"
                        >
                          <option value="Bannon Deep IK">Bannon Deep IK</option>
                          <option value="Standard Mixamo">Standard Mixamo</option>
                          <option value="None">None (Static Mesh)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">Motion Library (Animation)</label>
                      <select 
                        value={animationPreset}
                        onChange={(e) => updateSetting('animationPreset', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-cyan-500/50 text-zinc-200"
                      >
                        <option value="None">None (Static T-Pose)</option>
                        <option value="Idle (Combat)">Idle (Combat)</option>
                        <option value="Walk Cycle">Walk Cycle</option>
                        <option value="Run/Sprint">Run/Sprint</option>
                        <option value="Jump (Root Motion)">Jump (Root Motion)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">Mesh Segmentation Method</label>
                      <select 
                        value={segmentationMethod}
                        onChange={(e) => updateSetting('segmentationMethod', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-cyan-500/50 text-zinc-200"
                      >
                        <option value="Blender MCP (15-Node Skinned)">Blender MCP (15-Node Skinned)</option>
                        <option value="Geometric Split (Legacy)">Geometric Split (Legacy)</option>
                        <option value="None (Single Mesh)">None (Single Mesh)</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={pbrMaterials} 
                          onChange={(e) => updateSetting('pbrMaterials', e.target.checked)} 
                          className="accent-cyan-500 rounded bg-zinc-950 border-zinc-800"
                        />
                        <span className="text-xs text-zinc-300">PBR Material Synthesis</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={magicBrush} 
                          onChange={(e) => updateSetting('magicBrush', e.target.checked)} 
                          className="accent-cyan-500 rounded bg-zinc-950 border-zinc-800"
                        />
                        <span className="text-xs text-zinc-300 flex items-center gap-1"><Wand2 size={12}/> Magic Brush Prep</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={symmetryEnforcement} 
                          onChange={(e) => updateSetting('symmetryEnforcement', e.target.checked)} 
                          className="accent-cyan-500 rounded bg-zinc-950 border-zinc-800"
                        />
                        <span className="text-xs text-zinc-300">Absolute Symmetry</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm text-zinc-400">Multi View Injection</label>
                        <span className="text-sm text-cyan-500">{viewInjection} Points</span>
                      </div>
                      <input 
                        type="range" min="1" max="4" step="1" 
                        value={viewInjection} onChange={(e) => updateSetting('viewInjection', parseInt(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm text-zinc-400">Target Polygon Resolution</label>
                        <span className="text-sm text-cyan-500">{(polyTarget / 1000000).toFixed(2)}M</span>
                      </div>
                      <input 
                        type="range" min="20000" max="8500000" step="50000" 
                        value={polyTarget} onChange={(e) => updateSetting('polyTarget', parseInt(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm text-zinc-400">Voxel Grid Resolution</label>
                        <span className="text-sm text-cyan-500">{voxelRes}</span>
                      </div>
                      <input 
                        type="range" min="256" max="1024" step="256" 
                        value={voxelRes} onChange={(e) => updateSetting('voxelRes', parseInt(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                </section>
              </>
            ) : activeTab === 'batch' ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="text-cyan-500" size={18} />
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Batch Processing Queue</h2>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Enter multiple prompts (one per line) to autonomously queue and generate massive variations back-to-back using the currently active engine calibration.
                </p>
                <textarea
                  value={batchPrompts}
                  onChange={(e) => setBatchPrompts(e.target.value)}
                  placeholder="A ruined roman pillar...&#10;A glowing sci-fi container...&#10;A medieval iron sword..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none h-32 font-mono"
                />
                
                {batchTasks.length > 0 && (
                  <div className="space-y-2 mt-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Queue Status</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                      {batchTasks.map((task, i) => (
                        <div key={task.id} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-300 truncate pr-4 w-3/4">Task {i+1}: {task.prompt}</span>
                            <span className={`font-mono ${task.status === 'Completed' ? 'text-cyan-400' : task.status === 'Processing' ? 'text-amber-400' : 'text-zinc-500'}`}>
                              {task.status}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${task.status === 'Completed' ? 'bg-cyan-500' : 'bg-amber-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : activeTab === 'presets' ? (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Saved Presets</h2>
                <div className="space-y-3">
                  {presets.map(preset => (
                    <div key={preset.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-cyan-400">{preset.name}</span>
                        <button 
                          onClick={() => handleLoadPreset(preset)}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs rounded transition-colors"
                        >
                          Load
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                        <div>Engine: <span className="text-zinc-300">{preset.engineMode}</span></div>
                        <div>Polys: <span className="text-zinc-300">{(preset.polyTarget / 1000000).toFixed(2)}M</span></div>
                        <div>Rig: <span className="text-zinc-300">{preset.rigging}</span></div>
                        <div>Retopo: <span className="text-zinc-300">{preset.retopology}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : activeTab === 'library' ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="text-cyan-500" size={18} />
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Asset Library Ledger</h2>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  All generated meshes, PBR textures, physics boundaries, and prompt telemetry are persistently saved.
                </p>
                <div className="space-y-3">
                  {savedAssets.length === 0 ? (
                    <div className="text-center p-6 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-500 text-sm">
                      No assets generated yet.
                    </div>
                  ) : (
                    savedAssets.map(asset => (
                      <div key={asset.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-cyan-400 truncate pr-4">{asset.prompt}</span>
                          <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono">ID: {asset.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                          <div>Engine: <span className="text-zinc-300">{asset.engineMode}</span></div>
                          <div>Created: <span className="text-zinc-300">{asset.timestamp}</span></div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded transition-colors text-zinc-200">Load to Viewport</button>
                          <button onClick={() => addLog('ESRGAN', `Invoking Real-ESRGAN x4 API for high-res upscaling on asset ${asset.id}...`, 'processing')} className="flex-1 py-1.5 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 text-xs rounded transition-colors border border-indigo-900/50 truncate">4x Upscale</button>
                          <button className="flex-1 py-1.5 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 text-xs rounded transition-colors border border-cyan-900/50 truncate">Export</button>
                        </div>
                        {/* 360-degree Turntable Preview Simulation */}
                        <div className="w-full h-24 bg-zinc-900 mt-2 rounded border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Box size={32} className="text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
                           </div>
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent w-[200%] animate-[spin_3s_linear_infinite]" />
                           <div className="absolute bottom-2 left-2 text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950/80 px-1.5 rounded">360° Turntable Preview</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : activeTab === 'performance' ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="text-cyan-500" size={18} />
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Engine Performance</h2>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Adjust GPU constraints and memory allocation for the Bannon Physics Engine and NeRF optimizations.
                </p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => setPerformanceMode('high_fidelity')}
                    className={`w-full p-4 border rounded-lg text-left transition-all ${performanceMode === 'high_fidelity' ? 'bg-cyan-900/20 border-cyan-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${performanceMode === 'high_fidelity' ? 'bg-cyan-500' : 'bg-zinc-600'}`} />
                      <span className={`font-medium ${performanceMode === 'high_fidelity' ? 'text-cyan-400' : 'text-zinc-300'}`}>High Fidelity Mode</span>
                    </div>
                    <p className="text-xs text-zinc-500 ml-4">Maximizes VRAM overhead. Allows 8K PBR map generation, large batch sizes, and dense retopology. Risk of OOM on GPUs under 16GB.</p>
                  </button>
                  
                  <button 
                    onClick={() => setPerformanceMode('low_vram')}
                    className={`w-full p-4 border rounded-lg text-left transition-all ${performanceMode === 'low_vram' ? 'bg-amber-900/20 border-amber-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${performanceMode === 'low_vram' ? 'bg-amber-500' : 'bg-zinc-600'}`} />
                      <span className={`font-medium ${performanceMode === 'low_vram' ? 'text-amber-400' : 'text-zinc-300'}`}>Low VRAM Mode</span>
                    </div>
                    <p className="text-xs text-zinc-500 ml-4">Reduces batch size and limits texture resolution to 2K. Drastically lowers memory footprint while maintaining geometric topology.</p>
                  </button>
                </div>
              </section>
            ) : activeTab === 'textures' ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="text-cyan-500" size={18} />
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Texture Inspector</h2>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Individually toggle and view the synthesized PBR texture maps applied to the current asset.
                </p>
                <div className="space-y-3">
                  {['Combined', 'Albedo', 'Roughness', 'Metallic', 'Normal', 'Glow'].map((map) => (
                    <button
                      key={map}
                      onClick={() => setActiveTextureMap(map as any)}
                      className={`w-full p-3 border rounded-lg text-left transition-all flex items-center justify-between ${activeTextureMap === map ? 'bg-cyan-900/20 border-cyan-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden`}>
                           {map === 'Albedo' && <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-600" />}
                           {map === 'Normal' && <div className="w-full h-full bg-indigo-500/80" />}
                           {map === 'Roughness' && <div className="w-full h-full bg-zinc-400" />}
                           {map === 'Metallic' && <div className="w-full h-full bg-zinc-300 shadow-inner" />}
                           {map === 'Glow' && <div className="w-full h-full bg-black flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-cyan-400 blur-[2px]" /></div>}
                           {map === 'Combined' && <ImageIcon size={14} className="text-zinc-400" />}
                        </div>
                        <span className={`font-medium ${activeTextureMap === map ? 'text-cyan-400' : 'text-zinc-300'}`}>{map} Map</span>
                      </div>
                      {activeTextureMap === map && <Check size={16} className="text-cyan-500" />}
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Wand2 size={14} className="text-cyan-500" />
                        <h3 className="text-sm font-semibold text-zinc-300">AI Super Resolution</h3>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">Real-ESRGAN x4 pass on Albedo, Normal, and Roughness maps. Persists to Supabase storage bucket.</p>
                    </div>
                    <button
                      onClick={() => setSuperResolution(!superResolution)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${superResolution ? 'bg-cyan-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${superResolution ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </section>
            ) : activeTab === 'import' ? (
              <section className="space-y-4 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="text-cyan-500" size={18} />
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Asset Import</h2>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Drag & Drop multiple images or .glb files to automatically process and bind them into the Supabase 'gen_jobs' database queue.
                </p>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleMultiImport}
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-cyan-500 hover:bg-cyan-900/10 transition-colors cursor-pointer relative group min-h-[160px] shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                    <Upload size={24} className="text-zinc-400 group-hover:text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-300">Drop files to import</h3>
                  <p className="text-xs text-zinc-500 mt-1">Supports .glb, .gltf, .png, .jpg (Parallel multi-file queue)</p>
                  <input 
                    type="file" 
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleMultiImport}
                  />
                </div>
                
                {importTasks.length > 0 && (
                  <div className="flex-1 mt-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex flex-col overflow-hidden">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 shrink-0">Upload & Processing Queue</h3>
                    <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-hide">
                      {importTasks.map((task) => (
                        <div key={task.id} className="space-y-1.5 bg-zinc-950 p-3 rounded border border-zinc-800">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-300 font-medium truncate pr-4 max-w-[60%]">{task.filename}</span>
                            <span className={`font-mono ${task.status === 'Bound to Supabase' ? 'text-cyan-400' : task.status === 'Processing' ? 'text-indigo-400' : 'text-amber-400'}`}>
                              {task.status}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${task.status === 'Bound to Supabase' ? 'bg-cyan-500' : 'bg-cyan-400'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress}%` }}
                              transition={{ ease: "linear", duration: 0.3 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : activeTab === 'cinematics' ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="text-cyan-500" size={18} />
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Media & Cinematics</h2>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Generate cutscenes, intro movies, and storyboard images using the Qwable-powered multi-modal video engine.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400">Cinematic Prompt</label>
                    <textarea 
                      placeholder="e.g. A slow cinematic pan over a ruined cyberpunk city at sunset..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all resize-none h-24 mt-2"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                      <Camera size={16} /> Render Image
                    </button>
                    <button className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                      <Play size={16} /> Generate Video
                    </button>
                  </div>
                </div>
              </section>
            ) : activeTab === 'morph' ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shuffle className="text-cyan-500" size={18} />
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Morph Engine</h2>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Set start and end keyframes to generate smooth morphing video transitions between assets via AI-based latent space interpolation.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400">Start Keyframe Prompt</label>
                    <input 
                      type="text"
                      placeholder="e.g. A pristine metallic knight armor"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400">End Keyframe Prompt</label>
                    <input 
                      type="text"
                      placeholder="e.g. A rusted, corrupted demon armor"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 mt-1"
                    />
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={() => addLog('MorphEngine', 'Initializing latent space interpolation for morph sequence...', 'processing')}
                      className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Shuffle size={16} /> Generate Latent Interpolation
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Generate Action */}
            <div className="mt-auto pt-6">
              {activeTab === 'batch' ? (
                <button 
                  onClick={handleBatchGenerate}
                  disabled={isBatching || isGenerating || wsStatus !== 'connected'}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {isBatching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      BATCH PROCESSING...
                    </>
                  ) : (
                    <>
                      <Layers size={18} fill="currentColor" />
                      START BATCH QUEUE
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || wsStatus !== 'connected'}
                  className="w-full py-3.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      PROCESSING ASSET...
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      GENERATE AAA ASSET
                    </>
                  )}
                </button>
              )}
              
              {isGenerating && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Generation Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Viewport & Logs */}
        <div className="flex-1 flex flex-col bg-zinc-950 min-h-[40vh] lg:min-h-0 relative">
          
          {/* 3D Viewport Area */}
          <div className="flex-1 relative border-b border-zinc-800">
            {/* Viewport Info Overlays */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="px-3 py-1.5 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-md text-xs font-mono text-zinc-400 flex items-center gap-2 shadow-lg">
                <Box size={14} className="text-cyan-500"/> 
                M Craft Interactive Viewport // {engineMode}
              </div>
            </div>

            {/* Viewport Orbit Camera Controls */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg p-1.5 flex flex-col gap-1 shadow-lg">
                <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                  <Camera size={10} /> Viewport Orbit
                </div>
                <div className="flex gap-1 flex-wrap max-w-[320px]">
                  {['Free Cam', 'Top-Down', 'Front-View', 'Side-Profile', 'Isometric'].map(angle => (
                    <button
                      key={angle}
                      onClick={() => setCameraAngle(angle as any)}
                      className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-colors ${cameraAngle === angle ? 'bg-cyan-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
                    >
                      {angle.split('-').join(' ')}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-zinc-500 px-2 mt-1 italic flex items-center gap-1">
                  <Eye size={10}/> Focus locked to model bounds. 2-finger slide to pan.
                </div>
              </div>
            </div>
            
            {/* Real-time VRAM Monitor Overlay */}
            <div className="absolute top-4 right-4 z-10 px-3 py-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-md flex flex-col items-center gap-1 shadow-lg w-32">
               <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1 self-end">
                 <Activity size={12} /> GPU VRAM
               </div>
               
               <div className="h-16 w-full -mt-2 -mb-4">
                 <PieChart width={104} height={60}>
                   <Pie
                     data={[
                       { name: 'Used', value: vramUsage },
                       { name: 'Free', value: 24 - vramUsage }
                     ]}
                     cx="50%"
                     cy="100%"
                     startAngle={180}
                     endAngle={0}
                     innerRadius={30}
                     outerRadius={45}
                     dataKey="value"
                     stroke="none"
                     isAnimationActive={false}
                   >
                     <Cell fill={vramUsage > 16 ? '#ef4444' : vramUsage > 8 ? '#f59e0b' : '#06b6d4'} />
                     <Cell fill="#27272a" />
                   </Pie>
                 </PieChart>
               </div>
               
               <div className="text-lg font-mono font-medium text-cyan-400 flex items-baseline gap-1 mt-1">
                 {vramUsage.toFixed(1)} <span className="text-[10px] text-zinc-500">/ 24 GB</span>
               </div>
            </div>

            {/* Export Menu (Only shows when complete) */}
            <AnimatePresence>
              {isComplete && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 right-4 z-10 flex flex-wrap justify-end gap-2 max-w-[80vw]"
                >
                  <div className="flex gap-2">
                    {isEditMode && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-1.5 flex items-center gap-1 shadow-lg mr-2"
                      >
                        <button className="p-1.5 bg-amber-600 rounded text-white" title="Translate"><Move size={14}/></button>
                        <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-amber-400" title="Rotate"><RotateCcw size={14}/></button>
                        <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-amber-400" title="Scale"><Maximize size={14}/></button>
                        <div className="w-px h-4 bg-zinc-700 mx-1" />
                        <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-amber-400" title="Vertex Select"><Crosshair size={14}/></button>
                        <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-amber-400" title="Face Select"><Square size={14}/></button>
                      </motion.div>
                    )}
                    {isVertexPaint && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-2 flex items-center gap-2 shadow-lg"
                      >
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mr-2">Brush</div>
                        {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map(color => (
                          <button key={color} className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                        ))}
                      </motion.div>
                    )}
                    <button 
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`px-3 py-2 ${isEditMode ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 transition-colors`}
                      title="Toggle Geometric Edit Mode"
                    >
                      <MousePointer2 size={16} /> <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button 
                      onClick={() => setIsVertexPaint(!isVertexPaint)}
                      className={`px-3 py-2 ${isVertexPaint ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 transition-colors`}
                      title="Toggle Vertex Painting"
                    >
                      <Paintbrush size={16} /> <span className="hidden sm:inline">Paint</span>
                    </button>
                    <button 
                      onClick={() => setIsWireframe(!isWireframe)}
                      className={`px-3 py-2 ${isWireframe ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 transition-colors`}
                      title="Toggle Quad-Dominant Wireframe"
                    >
                      <Grid3X3 size={16} /> <span className="hidden sm:inline">Wireframe</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsUvMap(!isUvMap)}
                    className={`px-3 py-2 ${isUvMap ? 'bg-fuchsia-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 transition-colors`}
                    title="Inspect UV Map (Checkerboard)"
                  >
                    <Map size={16} /> <span className="hidden sm:inline">UV Map</span>
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setExportOpen(!exportOpen)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 transition-colors"
                    >
                      <Download size={16} /> <span className="hidden sm:inline">Export Model</span> <ChevronDown size={14} />
                    </button>
                    
                    {exportOpen && (
                      <div className="absolute bottom-full mb-2 right-0 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden py-1">
                        <button onClick={() => handleExport('GLB')} className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 hover:text-cyan-400 transition-colors flex items-center gap-2"><Box size={14}/> .GLB Format</button>
                        <button onClick={() => handleExport('OBJ')} className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 hover:text-cyan-400 transition-colors flex items-center gap-2"><Box size={14}/> .OBJ Format</button>
                        <button onClick={() => handleExport('FBX')} className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 hover:text-cyan-400 transition-colors flex items-center gap-2"><Box size={14}/> .FBX Format</button>
                        <div className="border-t border-zinc-700 my-1"></div>
                        <button onClick={() => handleExport('LOD_Bundle')} className="w-full text-left px-4 py-2 text-sm text-amber-300 hover:bg-zinc-700 hover:text-amber-200 transition-colors flex items-center gap-2">
                          <Layers size={14}/> Gen LODs (L0-L3)
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
             {/* Viewport Canvas Background */}
            <div className={`absolute inset-0 flex items-center justify-center overflow-hidden transition-colors duration-500 bg-zinc-950`}>
               <ModelViewer 
                 isGenerating={isGenerating} 
                 isComplete={isComplete} 
                 isWireframe={isWireframe} 
                 cameraAngle={cameraAngle}
                 transformMode={transformMode}
               />

               {/* Editor Gizmo Toolbar (Blender-like) */}
               {isComplete && (
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg p-2 flex flex-col gap-2 z-20">
                   <button 
                     onClick={() => setTransformMode('translate')}
                     className={`p-2 rounded hover:bg-zinc-800 transition-colors ${transformMode === 'translate' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400'}`}
                     title="Translate (G)"
                   >
                     <Move size={18} />
                   </button>
                   <button 
                     onClick={() => setTransformMode('rotate')}
                     className={`p-2 rounded hover:bg-zinc-800 transition-colors ${transformMode === 'rotate' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400'}`}
                     title="Rotate (R)"
                   >
                     <RotateCcw size={18} />
                   </button>
                   <button 
                     onClick={() => setTransformMode('scale')}
                     className={`p-2 rounded hover:bg-zinc-800 transition-colors ${transformMode === 'scale' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400'}`}
                     title="Scale (S)"
                   >
                     <Maximize size={18} />
                   </button>
                 </div>
               )}
               
               {isGenerating ? (
                 <div className="text-center space-y-4 relative z-10 pointer-events-none">
                   <div className="w-16 h-16 mx-auto border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                   <p className="text-cyan-400 font-mono text-sm animate-pulse font-bold bg-zinc-900/80 px-4 py-2 rounded-lg backdrop-blur shadow-lg border border-cyan-500/30">Reconstructing Triplane NeRF...</p>
                 </div>
               ) : isComplete ? (
                 <div className="text-cyan-500 flex flex-col items-center relative z-10 pointer-events-none absolute top-10 pointer-events-none">
                    {isUvMap ? (
                      <motion.div
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="flex flex-col items-center text-fuchsia-400 bg-zinc-900/80 p-4 rounded-xl backdrop-blur shadow-lg border border-fuchsia-500/30"
                      >
                         <Map size={48} strokeWidth={1.5} className="mb-2 drop-shadow-[0_0_15px_rgba(192,38,211,0.5)]" />
                         <p className="text-sm font-medium text-white">UV Layout Displayed</p>
                         <p className="text-[10px] text-fuchsia-400/70 mt-1 font-mono">Checkerboard Texture Overlay</p>
                      </motion.div>
                    ) : isVertexPaint ? (
                      <motion.div
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="flex flex-col items-center text-rose-400 bg-zinc-900/80 p-4 rounded-xl backdrop-blur shadow-lg border border-rose-500/30"
                      >
                         <Paintbrush size={48} strokeWidth={1.5} className="mb-2 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
                         <p className="text-sm font-medium text-white">Vertex Paint Mode Active</p>
                         <p className="text-[10px] text-rose-400/70 mt-1 font-mono">Use brush to colorize geometry</p>
                      </motion.div>
                    ) : isEditMode ? (
                      <motion.div
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="flex flex-col items-center text-amber-400 bg-zinc-900/80 p-4 rounded-xl backdrop-blur shadow-lg border border-amber-500/30"
                      >
                         <MousePointer2 size={48} strokeWidth={1.5} className="mb-2 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)]" />
                         <p className="text-sm font-medium text-white">Geometric Edit Mode Active</p>
                         <p className="text-[10px] text-amber-400/70 mt-1 font-mono">Select vertices to manipulate</p>
                      </motion.div>
                    ) : isWireframe ? (
                      <motion.div
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="flex flex-col items-center text-indigo-400 bg-zinc-900/80 p-4 rounded-xl backdrop-blur shadow-lg border border-indigo-500/30"
                      >
                         <Grid3X3 size={48} strokeWidth={1.5} className="mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                         <p className="text-sm font-medium text-white">Quad-Dominant Topology Rendered</p>
                         <p className="text-[10px] text-indigo-400/70 mt-1 font-mono">Shader Overlay Active</p>
                      </motion.div>
                    ) : null}
                 </div>
               ) : (
                 <div className="text-zinc-700/50 flex flex-col items-center relative z-10 pointer-events-none">
                    <Box size={64} strokeWidth={1} />
                    <p className="mt-4 text-sm font-medium text-zinc-500 bg-zinc-950/80 px-4 py-2 rounded-lg backdrop-blur">Awaiting Generation Input</p>
                 </div>
               )}
            </div>
          </div>

          {/* Telemetry / Logs */}
          <div className="h-64 bg-zinc-900 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} />
                Bannon Engine Telemetry
              </h3>
              
              <AnimatePresence>
                {meshHealth.score > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-md shadow-inner"
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-cyan-500" />
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Health Score:</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{meshHealth.score}/100</span>
                    </div>
                    <div className="h-3 w-px bg-zinc-800" />
                    <div className="flex gap-3 text-[10px] font-mono text-zinc-500">
                      <span>Manifold: <span className={meshHealth.manifold ? "text-cyan-500" : "text-red-500"}>{meshHealth.manifold ? 'PASS' : 'FAIL'}</span></span>
                      <span>Stray Verts: <span className={meshHealth.strays === 0 ? "text-cyan-500" : "text-amber-500"}>{meshHealth.strays}</span></span>
                      <span>High-Valence Verts: <span className={meshHealth.highValence === 0 ? "text-cyan-500" : "text-amber-500"}>{meshHealth.highValence}</span></span>
                      <span>Non-Manifold Edges: <span className={meshHealth.nonManifoldEdges === 0 ? "text-cyan-500" : "text-red-500"}>{meshHealth.nonManifoldEdges}</span></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 font-mono text-xs pr-2">
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic">No telemetry data available. System idle.</div>
              ) : (
                <AnimatePresence>
                  {logs.map(log => (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="flex items-start gap-3 border-l-2 pl-3 py-1 bg-zinc-900/50" 
                      style={{
                        borderColor: 
                          log.status === 'error' ? '#ef4444' : 
                          log.status === 'success' ? '#06b6d4' : 
                          log.status === 'processing' ? '#3b82f6' : '#64748b'
                      }}
                    >
                      <span className="text-zinc-500 whitespace-nowrap min-w-[70px]">{log.timestamp}</span>
                      <span className={
                        log.status === 'error' ? 'text-red-400' : 
                        log.status === 'success' ? 'text-cyan-400' : 
                        log.status === 'processing' ? 'text-blue-400' : 'text-zinc-300'
                      }>
                        {log.message}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

