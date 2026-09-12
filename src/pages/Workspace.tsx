import { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, CloudDownload, Cpu, Scale, CheckCircle, 
  Sparkles, Layers, ArrowRight, Play, RefreshCw, Clipboard, ExternalLink,
  Eye, EyeOff, Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface SyncedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  at: string;
  status: string;
  driveFolder: string;
}

export default function Workspace() {
  const [driveUrl, setDriveUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [decimatePct, setDecimatePct] = useState(30);
  const [syncedFiles, setSyncedFiles] = useState<SyncedFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<SyncedFile | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Folder Presets
  const presets = [
    {
      name: "Wreck Patterson & Master Sensei Pack",
      url: "https://drive.google.com/drive/folders/19k_jmuiUYsAubZyx_bUL0m8svyYmevM5",
      id: "19k_jmuiUYsAubZyx_bUL0m8svyYmevM5",
      count: "2 Assets (FBX Models, Armature, Rigs)"
    },
    {
      name: "Titan & Steel Steps Arena Assets",
      url: "https://drive.google.com/drive/folders/1chJYomdZW6E7jqUUHZTn1w9wLTakRfvG",
      id: "1chJYomdZW6E7jqUUHZTn1w9wLTakRfvG",
      count: "2 Assets (GLB Suits, OBJ Steel Steps)"
    }
  ];

  const fetchManifest = async () => {
    try {
      const res = await fetch('/api/workspace/gdown/manifest');
      const data = await res.json();
      if (data.files) {
        setSyncedFiles(data.files);
        if (data.files.length > 0) {
          setSelectedPreviewFile(prev => prev || data.files[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load synced assets:", e);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, []);

  const triggerDownload = async (urlToUse: string) => {
    setIsLoading(true);
    setNotification(null);
    try {
      const res = await fetch('/api/workspace/gdown/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToUse })
      });
      const data = await res.json();
      if (data.success) {
        setSyncedFiles(data.files);
        if (data.files.length > 0) {
          setSelectedPreviewFile(data.files[0]);
        }
        setNotification({
          type: 'success',
          message: `gdown Success: Pulled ${data.files.length} assets from folder!`
        });
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to sync assets'
        });
      }
    } catch (e) {
      setNotification({
        type: 'error',
        message: 'Network error triggering gdown recursive downloader'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeBatchCompression = async () => {
    if (selectedIds.length === 0) return;
    setIsCompressing(true);
    setNotification(null);
    try {
      const res = await fetch('/api/workspace/gdown/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: selectedIds, decimatePct })
      });
      const data = await res.json();
      if (data.success) {
        setSyncedFiles(data.files);
        setSelectedIds([]);
        if (data.files.length > 0) {
          setSelectedPreviewFile(data.files[0]);
        }
        setNotification({
          type: 'success',
          message: `Batch Compression completed! Processed models saved as game-ready Draco GLBs.`
        });
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to compress assets'
        });
      }
    } catch (e) {
      setNotification({
        type: 'error',
        message: 'Network error executing batch decimation'
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === syncedFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(syncedFiles.map(f => f.id));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-900 text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
            <FolderOpen className="w-8 h-8 text-indigo-500" /> Bannon Asset Manager Workspace
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Recursive Drive Integration & Headless Asset Ingestion via `gdown`
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-4 py-2 rounded-lg">
          <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="text-xs font-mono text-indigo-300">Blender MCP Gateway: ONLINE</span>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg border text-sm flex items-center justify-between ${notification.type === 'success' ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-rose-950/30 border-rose-500/30 text-rose-400'}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Drive Ingress & Presets */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-950/80 border border-neutral-800 p-6 rounded-xl space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CloudDownload className="w-5 h-5 text-indigo-400" /> gdown Ingestion Pipe
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Input a Google Drive folder link. The pipeline will download the subfolders recursively, bypass antivirus confirmations, and extract 3D meshes and rigging armature files directly.
            </p>

            <div className="space-y-3">
              <input 
                type="text"
                placeholder="Paste Google Drive Folder URL"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <button 
                onClick={() => triggerDownload(driveUrl)}
                disabled={isLoading || !driveUrl}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 text-white py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                {isLoading ? 'Downloading Folder Assets...' : 'Pull Assets (gdown)'}
              </button>
            </div>

            {/* Presets */}
            <div className="pt-4 border-t border-neutral-800 space-y-3">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Connected Google Drive Folders</span>
              <div className="space-y-2">
                {presets.map((p, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2 hover:border-neutral-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-200">{p.name}</span>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-indigo-400">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">{p.count}</span>
                    </div>
                    <button
                      onClick={() => triggerDownload(p.url)}
                      disabled={isLoading}
                      className="w-full bg-neutral-800 hover:bg-indigo-900 border border-neutral-700 hover:border-indigo-700 text-neutral-300 hover:text-white py-1.5 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Fetch / Update Folder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns - Local Synced Assets Manifest */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-950/80 border border-neutral-800 p-6 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> Synced Local Assets (manifest.json)
                </h3>
                <p className="text-xs text-neutral-400">
                  Real-time synchronization with C++ file buffers and Unreal content pipeline.
                </p>
              </div>
              
              <button 
                onClick={fetchManifest}
                className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh List
              </button>
            </div>

            {/* Synced Assets Table */}
            {syncedFiles.length === 0 ? (
              <div className="border border-dashed border-neutral-800 p-8 text-center rounded-lg">
                <FolderOpen className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                <h4 className="text-sm font-semibold text-neutral-400">No Synced Assets found</h4>
                <p className="text-xs text-neutral-500 mt-1">Use the presets on the left to trigger the gdown recursive download.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="bg-neutral-900 p-3 grid grid-cols-12 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <div className="col-span-1 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === syncedFiles.length}
                        onChange={selectAll}
                        className="rounded border-neutral-700 bg-neutral-800 accent-indigo-500"
                      />
                    </div>
                    <div className="col-span-4">File Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Preview</div>
                  </div>
                  <div className="divide-y divide-neutral-800">
                    {syncedFiles.map(file => (
                      <div 
                        key={file.id} 
                        className={`p-3.5 grid grid-cols-12 text-xs items-center transition-colors ${
                          selectedPreviewFile?.id === file.id 
                            ? 'bg-indigo-950/40 border-l-2 border-l-indigo-500' 
                            : selectedIds.includes(file.id) 
                              ? 'bg-indigo-950/15' 
                              : 'hover:bg-neutral-900/40'
                        }`}
                      >
                        <div className="col-span-1 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(file.id)}
                            onChange={() => toggleSelect(file.id)}
                            className="rounded border-neutral-700 bg-neutral-800 accent-indigo-500"
                          />
                        </div>
                        <div className="col-span-4 font-semibold text-neutral-200 truncate pr-2">
                          {file.name}
                        </div>
                        <div className="col-span-2">
                          <span className="font-mono text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 uppercase">
                            {file.type}
                          </span>
                        </div>
                        <div className="col-span-2 font-mono text-neutral-300">
                          {file.size}
                        </div>
                        <div className="col-span-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${file.status.includes('Compressed') ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-amber-950 text-amber-400 border border-amber-900'}`}>
                            {file.status}
                          </span>
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => setSelectedPreviewFile(file)}
                            className={`p-1 rounded hover:bg-neutral-800 transition-colors ${selectedPreviewFile?.id === file.id ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                            title="Inspect 3D Geometry"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic 3D Preview Inspector & Decimation Settings Panel */}
                {selectedPreviewFile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800 animate-fadeIn">
                    {/* Left Column: Interactive Pre-Decimation 3D Viewer */}
                    <Asset3DPreview file={selectedPreviewFile} decimatePct={decimatePct} />

                    {/* Right Column: Optimization controls */}
                    <div className="bg-neutral-900 border border-neutral-850 p-5 rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Scale className="w-4 h-4 text-indigo-400" /> Batch Blender Optimization Settings
                          </span>
                          {selectedIds.length > 0 ? (
                            <span className="text-[10px] font-mono text-neutral-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-850">
                              {selectedIds.length} Selected
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                              No Selection
                            </span>
                          )}
                        </div>

                        {selectedIds.length > 0 ? (
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-400">Target Mesh Decimation Level:</span>
                              <span className="text-indigo-400 font-bold font-mono">{decimatePct}% (Kept Vertices)</span>
                            </div>
                            <input 
                              type="range"
                              min="10"
                              max="100"
                              step="5"
                              value={decimatePct}
                              onChange={(e) => setDecimatePct(parseInt(e.target.value))}
                              className="w-full accent-indigo-500 bg-neutral-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                            />
                            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 text-[10px] space-y-1 text-neutral-400">
                              <div className="flex justify-between">
                                <span>Optimization Mode:</span>
                                <span className="text-white font-mono uppercase">Draco decimate</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Preserve Topology:</span>
                                <span className="text-green-400 font-mono">TRUE</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Pipeline Target:</span>
                                <span className="text-indigo-300 font-mono">Unreal Engine C++ buffers</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">
                              Batch process decimation with Draco compression. Files are compressed to high-performance GLB models and integrated into the Unreal LiveLink pipelines instantly.
                            </p>
                          </div>
                        ) : (
                          <div className="border border-dashed border-neutral-800 p-6 text-center rounded-lg my-auto flex flex-col items-center justify-center space-y-2">
                            <Activity className="w-8 h-8 text-neutral-600 animate-pulse" />
                            <h5 className="text-xs font-semibold text-neutral-400">Blender Decimation Pipeline Inactive</h5>
                            <p className="text-[10px] text-neutral-500 max-w-xs">
                              Check one or more assets in the table list above to unlock batch Blender decimation, Draco polygon reduction, and LiveLink packaging controls.
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedIds.length > 0 && (
                        <button
                          onClick={executeBatchCompression}
                          disabled={isCompressing}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          {isCompressing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
                          {isCompressing ? 'Running Blender Draco decimation...' : 'Trigger Blender Batch Processing'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function Asset3DPreview({ file, decimatePct }: { file: SyncedFile; decimatePct: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotX, setRotX] = useState(-25);
  const [rotY, setRotY] = useState(45);
  const [scale, setScale] = useState(1.1);
  const [wireframe, setWireframe] = useState(true);
  const [showBones, setShowBones] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Prisma 3D Level Skeletal / Animate state extensions
  const [selectedBone, setSelectedBone] = useState<number>(1); // Default to Spine (idx 1)
  const [poseAngle, setPoseAngle] = useState(0); // -90 to 90 degrees rotation
  const [weightMode, setWeightMode] = useState(false);
  const [activeAnimation, setActiveAnimation] = useState<'none' | 'idle' | 'strike' | 'taunt' | 'walk'>('none');
  const [animFrame, setAnimFrame] = useState(0);

  // Looping animation tick
  useEffect(() => {
    if (activeAnimation === 'none') return;
    
    let animId: number;
    const tick = () => {
      setAnimFrame(prev => (prev + 1) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeAnimation]);

  // Handle active animation reset
  const handleAnimChange = (mode: 'none' | 'idle' | 'strike' | 'taunt' | 'walk') => {
    setActiveAnimation(mode);
    setPoseAngle(0); // Reset custom pose when running dynamic animation presets
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define vertices and links based on model type
    let vertices: { x: number; y: number; z: number; name?: string; parent?: number }[] = [];
    let edges: [number, number][] = [];

    const isCharacter = file.name.toLowerCase().includes('patterson') || file.name.toLowerCase().includes('sensei') || file.name.toLowerCase().includes('titan');
    const isSteps = file.name.toLowerCase().includes('step') || file.name.toLowerCase().includes('stair');

    if (isCharacter) {
      // 3D Biped Rig Mesh Skeleton with parent links
      vertices = [
        { x: 0, y: 1.5, z: 0, name: 'Head', parent: 1 },         // 0
        { x: 0, y: 1.0, z: 0, name: 'Spine', parent: 6 },        // 1
        { x: -0.5, y: 0.9, z: 0, name: 'Clavicle_L', parent: 1 }, // 2
        { x: 0.5, y: 0.9, z: 0, name: 'Clavicle_R', parent: 1 },  // 3
        { x: -0.7, y: 0.4, z: 0.1, name: 'Hand_L', parent: 2 },   // 4
        { x: 0.7, y: 0.4, z: -0.1, name: 'Hand_R', parent: 3 },   // 5
        { x: 0, y: 0.1, z: 0, name: 'Pelvis', parent: -1 },       // 6 (Root)
        { x: -0.3, y: -0.5, z: 0, name: 'Knee_L', parent: 6 },    // 7
        { x: 0.3, y: -0.5, z: 0, name: 'Knee_R', parent: 6 },     // 8
        { x: -0.4, y: -1.2, z: 0.2, name: 'Foot_L', parent: 7 },  // 9
        { x: 0.4, y: -1.2, z: -0.2, name: 'Foot_R', parent: 8 }, // 10
      ];
      edges = [
        [0, 1], // Head to Spine
        [1, 2], [2, 4], // Spine -> Clavicle_L -> Hand_L
        [1, 3], [3, 5], // Spine -> Clavicle_R -> Hand_R
        [1, 6], // Spine to Pelvis
        [6, 7], [7, 9], // Pelvis -> Knee_L -> Foot_L
        [6, 8], [8, 10] // Pelvis -> Knee_R -> Foot_R
      ];
    } else if (isSteps) {
      // 3D Staircase Step Mesh
      vertices = [
        { x: -0.8, y: -0.8, z: -0.8 }, // 0
        { x: 0.8, y: -0.8, z: -0.8 },  // 1
        { x: 0.8, y: -0.8, z: 0.8 },   // 2
        { x: -0.8, y: -0.8, z: 0.8 },  // 3
        { x: -0.8, y: -0.2, z: 0.8 },  // 4
        { x: -0.8, y: -0.2, z: 0.0 },  // 5
        { x: 0.8, y: -0.2, z: 0.0 },   // 6
        { x: 0.8, y: -0.2, z: 0.8 },   // 7
        { x: -0.8, y: 0.4, z: 0.0 },   // 8
        { x: -0.8, y: 0.4, z: -0.8 },  // 9
        { x: 0.8, y: 0.4, z: -0.8 },   // 10
        { x: 0.8, y: 0.4, z: 0.0 },    // 11
      ];
      edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Base outline
        [3, 4], [4, 7], [7, 2],
        [4, 5], [5, 6], [6, 7],
        [5, 8], [8, 11], [11, 6],
        [8, 9], [9, 10], [10, 11],
        [9, 0], [10, 1]
      ];
    } else {
      // Standard isometric wrestling ring mesh preview
      vertices = [
        { x: -0.8, y: -0.4, z: -0.8 }, // 0
        { x: 0.8, y: -0.4, z: -0.8 },  // 1
        { x: 0.8, y: -0.4, z: 0.8 },   // 2
        { x: -0.8, y: -0.4, z: 0.8 },  // 3
        { x: -0.8, y: 0.4, z: -0.8 },  // 4
        { x: 0.8, y: 0.4, z: -0.8 },   // 5
        { x: 0.8, y: 0.4, z: 0.8 },    // 6
        { x: -0.8, y: 0.4, z: 0.8 },   // 7
      ];
      edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
        [4, 6], [5, 7]
      ];
    }

    // Apply animation transformations and Forward Kinematics pose rotations
    let transformedVertices = vertices.map(v => ({ ...v }));

    if (isCharacter) {
      const theta = (animFrame * Math.PI) / 180;

      // 1. Apply Dynamic Animations Presets
      if (activeAnimation === 'idle') {
        const bob = Math.sin(theta * 2) * 0.03;
        // Bob head and spine
        transformedVertices[0].y += bob; // Head
        transformedVertices[1].y += bob * 0.7; // Spine
        // Gently swing arms
        transformedVertices[4].x += Math.cos(theta) * 0.04;
        transformedVertices[4].z += Math.sin(theta) * 0.04;
        transformedVertices[5].x -= Math.cos(theta) * 0.04;
        transformedVertices[5].z -= Math.sin(theta) * 0.04;
      } 
      else if (activeAnimation === 'strike') {
        // High impact strike: Right arm thrusts forward
        const phase = Math.sin(theta * 4);
        const thrust = phase > 0 ? phase * 0.35 : 0;
        transformedVertices[5].z += thrust; // Hand_R forward
        transformedVertices[5].y += thrust * 0.2;
        transformedVertices[3].z += thrust * 0.5; // Shoulder_R twists forward
        transformedVertices[1].z += thrust * 0.2; // Spine rotation
      } 
      else if (activeAnimation === 'taunt') {
        // Raise arms high in victory pose
        const raise = Math.sin(theta * 2.5) * 0.05;
        transformedVertices[4].y = 1.3 + raise; // Arm L up
        transformedVertices[4].x = -0.5;
        transformedVertices[5].y = 1.3 + raise; // Arm R up
        transformedVertices[5].x = 0.5;
        transformedVertices[0].y += Math.sin(theta * 3) * 0.01; // Cheering head bob
      } 
      else if (activeAnimation === 'walk') {
        // Interleaved Leg stride loops
        const legPhase = Math.sin(theta * 2);
        transformedVertices[9].z += legPhase * 0.25; // Left foot back/forth
        transformedVertices[9].y += Math.max(0, legPhase) * 0.1;
        transformedVertices[10].z -= legPhase * 0.25; // Right foot back/forth
        transformedVertices[10].y += Math.max(0, -legPhase) * 0.1;

        transformedVertices[7].z += legPhase * 0.15; // Knee L
        transformedVertices[8].z -= legPhase * 0.15; // Knee R
        
        // Arm swings
        transformedVertices[4].z -= legPhase * 0.15;
        transformedVertices[5].z += legPhase * 0.15;
      }

      // 2. Apply Custom Posing Slider (FK Rotation on selected bone & its descendants)
      if (poseAngle !== 0) {
        const radPose = (poseAngle * Math.PI) / 180;
        
        // Find center of rotation (the parent joint, or root if pelvis)
        const pivotIdx = transformedVertices[selectedBone].parent;
        const pivot = pivotIdx !== undefined && pivotIdx !== -1 
          ? transformedVertices[pivotIdx] 
          : transformedVertices[6]; // default pivot is Pelvis

        // Helper to rotate a point (px, py) around a pivot (cx, cy)
        const rotate2D = (px: number, py: number, cx: number, cy: number, angle: number) => {
          const s = Math.sin(angle);
          const c = Math.cos(angle);
          // Translate to origin
          const tempX = px - cx;
          const tempY = py - cy;
          // Rotate
          const rotatedX = tempX * c - tempY * s;
          const rotatedY = tempX * s + tempY * c;
          // Translate back
          return {
            x: rotatedX + cx,
            y: rotatedY + cy
          };
        };

        // Determine descendants of selected bone
        const getDescendants = (rootIdx: number): number[] => {
          const list: number[] = [];
          const checkChildren = (parent: number) => {
            transformedVertices.forEach((v, idx) => {
              if (v.parent === parent) {
                list.push(idx);
                checkChildren(idx);
              }
            });
          };
          checkChildren(rootIdx);
          return list;
        };

        const affectedNodes = [selectedBone, ...getDescendants(selectedBone)];

        affectedNodes.forEach(nodeIdx => {
          const node = transformedVertices[nodeIdx];
          const rotated = rotate2D(node.x, node.y, pivot.x, pivot.y, radPose);
          node.x = rotated.x;
          node.y = rotated.y;
        });
      }
    }

    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const project = (px: number, py: number, pz: number, thetaX: number, thetaY: number, cx: number, cy: number) => {
      let x1 = px * Math.cos(thetaY) - pz * Math.sin(thetaY);
      let z1 = px * Math.sin(thetaY) + pz * Math.cos(thetaY);
      let y2 = py * Math.cos(thetaX) - z1 * Math.sin(thetaX);
      let z2 = py * Math.sin(thetaX) + z1 * Math.cos(thetaX);

      const distance = 3.5;
      const zoom = scale * 120;
      const fov = zoom / (distance + z2);

      return {
        x: cx + x1 * fov,
        y: cy - y2 * fov
      };
    };

    const getInfluenceWeight = (jointIdx: number, vertexIdx: number): number => {
      if (jointIdx === vertexIdx) return 1.0;
      const v = vertices[vertexIdx];
      const selected = vertices[jointIdx];
      if (v.parent === jointIdx) return 0.85;
      if (selected.parent === vertexIdx) return 0.6;
      
      // Secondary distance decay
      const dx = v.x - selected.x;
      const dy = v.y - selected.y;
      const dz = v.z - selected.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      return Math.max(0, parseFloat((1.0 - dist * 0.85).toFixed(2)));
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw Grid Floor
      if (showGrid) {
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.08)';
        ctx.lineWidth = 1;
        const gridCount = 8;
        for (let i = -gridCount; i <= gridCount; i++) {
          const p1 = project(i * 0.2, -1.2, -1.6, radX, radY, cx, cy);
          const p2 = project(i * 0.2, -1.2, 1.6, radX, radY, cx, cy);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          const p3 = project(-1.6, -1.2, i * 0.2, radX, radY, cx, cy);
          const p4 = project(1.6, -1.2, i * 0.2, radX, radY, cx, cy);
          ctx.beginPath();
          ctx.moveTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.stroke();
        }
      }

      // Project transformed vertices to 2D
      const projected = transformedVertices.map(v => {
        return project(v.x, v.y, v.z, radX, radY, cx, cy);
      });

      // Draw bounding box
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Draw Edges (Wireframe)
      ctx.lineWidth = wireframe ? 1.5 : 3;
      const meshColor = `rgba(99, 102, 241, ${0.3 + (decimatePct / 100) * 0.7})`;
      ctx.strokeStyle = meshColor;
      
      edges.forEach(([u, v]) => {
        ctx.beginPath();
        ctx.moveTo(projected[u].x, projected[u].y);
        ctx.lineTo(projected[v].x, projected[v].y);
        ctx.stroke();
      });

      // Draw Vertices with optional weight maps heat colors
      projected.forEach((p, idx) => {
        const seed = (idx * 17) % 100;
        if (wireframe && seed > decimatePct) return;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);

        if (isCharacter && weightMode) {
          const weight = getInfluenceWeight(selectedBone, idx);
          if (weight >= 0.9) ctx.fillStyle = '#ef4444'; // Red (hot spot)
          else if (weight >= 0.7) ctx.fillStyle = '#f97316'; // Orange
          else if (weight >= 0.4) ctx.fillStyle = '#eab308'; // Yellow
          else if (weight > 0.0) ctx.fillStyle = '#22c55e'; // Green
          else ctx.fillStyle = 'rgba(255,255,255,0.15)'; // Grey (unaffected)
        } else {
          ctx.fillStyle = '#6366f1';
        }
        ctx.fill();
      });

      // Draw skeletal joints if character and showBones is active
      if (isCharacter && showBones) {
        projected.forEach((p, idx) => {
          if (vertices[idx].name) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, selectedBone === idx ? 6 : 4, 0, 2 * Math.PI);
            
            // Selected bone Highlight
            if (selectedBone === idx) {
              ctx.fillStyle = '#ef4444'; // Red for selected rig joint
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else {
              ctx.fillStyle = '#f59e0b'; // Amber for default joint
            }
            ctx.fill();

            // Label joint node
            ctx.fillStyle = selectedBone === idx ? '#ffffff' : '#9ca3af';
            ctx.font = selectedBone === idx ? 'bold 8px monospace' : '7px monospace';
            ctx.fillText(vertices[idx].name || '', p.x + 8, p.y + 2);
          }
        });
      }

      // Draw HUD status overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '8px monospace';
      ctx.fillText(`CAM_PITCH : ${Math.round(rotX)}°`, 20, 25);
      ctx.fillText(`CAM_YAW   : ${Math.round(rotY)}°`, 20, 36);
      ctx.fillText(`VERTS_EST : ${Math.round(vertices.length * (decimatePct / 100))} / ${vertices.length}`, 20, 47);
      ctx.fillText(`ANIM_PRE  : ${activeAnimation.toUpperCase()} (${Math.round(animFrame / 3.6)}%)`, 20, 58);
      if (isCharacter) {
        ctx.fillText(`RIG_JOINT : ${vertices[selectedBone]?.name || 'NONE'}`, 20, 69);
      }
    };

    render();

  }, [rotX, rotY, scale, wireframe, showBones, showGrid, file, decimatePct, selectedBone, poseAngle, weightMode, activeAnimation, animFrame]);

  // Character skeletal bone listings for inspection and weights
  const characterBones = [
    { idx: 0, name: 'Head', weight: '1.0' },
    { idx: 1, name: 'Spine', weight: '0.85' },
    { idx: 2, name: 'Clavicle_L', weight: '0.70' },
    { idx: 3, name: 'Clavicle_R', weight: '0.70' },
    { idx: 4, name: 'Hand_L', weight: '0.50' },
    { idx: 5, name: 'Hand_R', weight: '0.50' },
    { idx: 6, name: 'Pelvis', weight: '1.0 (Root)' },
    { idx: 7, name: 'Knee_L', weight: '0.60' },
    { idx: 8, name: 'Knee_R', weight: '0.60' },
    { idx: 9, name: 'Foot_L', weight: '0.40' },
    { idx: 10, name: 'Foot_R', weight: '0.40' },
  ];

  const isCharacter = file.name.toLowerCase().includes('patterson') || file.name.toLowerCase().includes('sensei') || file.name.toLowerCase().includes('titan');

  return (
    <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Interactive Mesh Rig Viewer</span>
          <span className="text-xs font-semibold text-white truncate max-w-[200px] block">{file.name}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-[9px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>PRISMA 3D INTEGRATED RIG</span>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-neutral-850 flex items-center justify-center group">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={220}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const startRotX = rotX;
            const startRotY = rotY;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const dx = moveEvent.clientX - startX;
              const dy = moveEvent.clientY - startY;
              setRotY(startRotY + dx * 0.5);
              setRotX(startRotX - dy * 0.5);
            };

            const handleMouseUp = () => {
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
        />
        {/* Help tooltip */}
        <div className="absolute bottom-2 right-2 text-[8px] text-neutral-500 bg-neutral-950/80 px-1.5 py-0.5 rounded pointer-events-none">
          Click & Drag to Orbit Model
        </div>
      </div>

      {/* Viewport Control Strip */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setWireframe(!wireframe)}
          className={`py-1.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${wireframe ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
        >
          {wireframe ? 'Solid Mode' : 'Vertices'}
        </button>
        <button
          onClick={() => setShowBones(!showBones)}
          className={`py-1.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${showBones ? 'bg-amber-600/10 border-amber-500/30 text-amber-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
        >
          {showBones ? 'Hide Armature' : 'Show Rig'}
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`py-1.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${showGrid ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
        >
          {showGrid ? 'Hide Floor' : 'Show Grid'}
        </button>
      </div>

      {/* Advanced Prisma 3D Interactive Pose & Weights Drawer */}
      {isCharacter && (
        <div className="bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">Prisma 3D Pose & Weight Controls</span>
            <button 
              onClick={() => setWeightMode(!weightMode)}
              className={`px-2 py-0.5 rounded text-[9px] font-mono border ${weightMode ? 'bg-rose-950 text-rose-400 border-rose-800' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}
            >
              {weightMode ? '🔴 WEIGHT_PAINT_ON' : '⚪ WEIGHTS_OFF'}
            </button>
          </div>

          {/* Bone selector and dynamic joint slider */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 block uppercase">Rig Joint Select</label>
              <select
                value={selectedBone}
                onChange={(e) => {
                  setSelectedBone(parseInt(e.target.value));
                  setPoseAngle(0); // reset pose on joint swap
                }}
                className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-[9px] font-mono text-white focus:outline-none"
              >
                {characterBones.map(b => (
                  <option key={b.idx} value={b.idx}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 flex justify-between uppercase">
                <span>Joint Pitch/Yaw Pose</span>
                <span className="text-indigo-400 font-bold">{poseAngle}°</span>
              </label>
              <input
                type="range"
                min="-60"
                max="60"
                value={poseAngle}
                disabled={activeAnimation !== 'none'}
                onChange={(e) => setPoseAngle(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-neutral-950 rounded appearance-none h-1 cursor-pointer disabled:opacity-30"
              />
            </div>
          </div>

          {/* Rig Animations Matrix Presets */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-neutral-400 uppercase block">Play Rig Animation Preset</span>
            <div className="grid grid-cols-5 gap-1">
              {['none', 'idle', 'strike', 'taunt', 'walk'].map(mode => (
                <button
                  key={mode}
                  onClick={() => handleAnimChange(mode as any)}
                  className={`py-1 rounded text-[8px] font-bold transition-all uppercase ${activeAnimation === mode ? 'bg-indigo-600 text-white font-black' : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'}`}
                >
                  {mode === 'none' ? 'OFF' : mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zoom / Scale Controller */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-mono text-neutral-400">
          <span>Camera Zoom Factor:</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>
        <input 
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          className="w-full accent-indigo-500 bg-neutral-900 rounded appearance-none h-1 cursor-pointer"
        />
      </div>

      {/* Live Rig Joint & Bone Matrix Info */}
      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-1.5">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-1">
          <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Estimated Model Geometry</span>
          <span className="text-[8px] font-mono text-indigo-400">Pre-Draco Specs</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[8px] font-mono">
          <div className="flex justify-between">
            <span className="text-neutral-500">File Type:</span>
            <span className="text-neutral-300 font-bold uppercase">{file.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Source Folder:</span>
            <span className="text-neutral-300 truncate max-w-[80px]">{file.driveFolder || 'Recursive'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Original Size:</span>
            <span className="text-neutral-300 font-bold">{file.size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Optimized Est:</span>
            <span className="text-green-400 font-bold">{parseFloat(file.size) ? `${(parseFloat(file.size) * (decimatePct / 100) * 0.45).toFixed(2)} MB` : '320 KB'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

