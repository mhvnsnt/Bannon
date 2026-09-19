import React, { useRef, useState, useEffect } from 'react';
import { usePhysicsStore } from '../store/physicsStore';
import { Activity, Eye, Upload, Box, SlidersHorizontal, Settings2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useProgress } from '@react-three/drei';
import { saveAsset } from '../store/db';
import * as THREE from 'three';
import JSZip from 'jszip';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { importAssetFile, exportVault, readAllEntries, getAssetNames, readAsset, writeAsset } from '../utils/vault';
import { LoadingSpinner } from './LoadingSpinner';

export default function ControlsPanel() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [vaultWarning, setVaultWarning] = useState(false);
  const [activeBoneId, setActiveBoneId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const SectionHeader = ({ id, label, color = '#8a8a93' }: { id: string, label: string, color?: string }) => (
      <button 
        type="button" 
        onClick={() => toggleSection(id)} 
        className="w-full flex justify-between items-center outline-none"
      >
          <label style={{ color }} className="text-[9px] uppercase tracking-widest cursor-pointer m-0">{label}</label>
          <span className="text-white/30 text-[10px]">{expandedSections[id] ? '−' : '+'}</span>
      </button>
  );

  const { active, progress, total, loaded } = useProgress();

  const stiffness = usePhysicsStore(s => s.stiffness);
  const damping = usePhysicsStore(s => s.damping);
  const cylinderRadius = usePhysicsStore(s => s.cylinderRadius);
  const cylinderSoftness = usePhysicsStore(s => s.cylinderSoftness);
  const slapSensitivity = usePhysicsStore(s => s.slapSensitivity);
  const wireframe = usePhysicsStore(s => s.wireframe);
  const uiGhostMode = usePhysicsStore(s => s.uiGhostMode);
  const plasticityLimit = usePhysicsStore(s => s.plasticityLimit);
  const volumePreservation = usePhysicsStore(s => s.volumePreservation);
  const surfaceGrip = usePhysicsStore(s => s.surfaceGrip);
  const hyperElasticity = usePhysicsStore(s => s.hyperElasticity);
  const structuralShield = usePhysicsStore(s => s.structuralShield);
  const tearingThreshold = usePhysicsStore(s => s.tearingThreshold);
  const willpower = usePhysicsStore(s => s.willpower);
  const jiggleAmplitude = usePhysicsStore(s => s.jiggleAmplitude);
  const panicThreshold = usePhysicsStore(s => s.panicThreshold);
  const aggression = usePhysicsStore(s => s.aggression);
  const reactionSpeed = usePhysicsStore(s => s.reactionSpeed);
  const timelineFrame = usePhysicsStore(s => s.timelineFrame);
  const isPlaying = usePhysicsStore(s => s.isPlaying);
  const audioDrivenFace = usePhysicsStore(s => s.audioDrivenFace);
  const fluidMode = usePhysicsStore(s => s.fluidMode);
  const fluidPressure = usePhysicsStore(s => s.fluidPressure);
  const fluidViscosity = usePhysicsStore(s => s.fluidViscosity);
  const bones = usePhysicsStore(s => s.bones);
  const meshes = usePhysicsStore(s => s.meshes);
  const hiddenMeshes = usePhysicsStore(s => s.hiddenMeshes);
  const jiggleBones = usePhysicsStore(s => s.jiggleBones);
  const funnelModels = usePhysicsStore(s => s.funnelModels);
  const cylinderModels = usePhysicsStore(s => s.cylinderModels);
  const activeFunnelModel = usePhysicsStore(s => s.activeFunnelModel);
  const activeCylinderModel = usePhysicsStore(s => s.activeCylinderModel);
  const setStiffness = usePhysicsStore(s => s.setStiffness);
  const setDamping = usePhysicsStore(s => s.setDamping);
  const setCylinderRadius = usePhysicsStore(s => s.setCylinderRadius);
  const setCylinderSoftness = usePhysicsStore(s => s.setCylinderSoftness);
  const setSlapSensitivity = usePhysicsStore(s => s.setSlapSensitivity);
  const setWireframe = usePhysicsStore(s => s.setWireframe);
  const setUiGhostMode = usePhysicsStore(s => s.setUiGhostMode);
  const setPlasticityLimit = usePhysicsStore(s => s.setPlasticityLimit);
  const setVolumePreservation = usePhysicsStore(s => s.setVolumePreservation);
  const setSurfaceGrip = usePhysicsStore(s => s.setSurfaceGrip);
  const setHyperElasticity = usePhysicsStore(s => s.setHyperElasticity);
  const setStructuralShield = usePhysicsStore(s => s.setStructuralShield);
  const setTearingThreshold = usePhysicsStore(s => s.setTearingThreshold);
  const setWillpower = usePhysicsStore(s => s.setWillpower);
  const setJiggleAmplitude = usePhysicsStore(s => s.setJiggleAmplitude);
  const setPanicThreshold = usePhysicsStore(s => s.setPanicThreshold);
  const setAggression = usePhysicsStore(s => s.setAggression);
  const setReactionSpeed = usePhysicsStore(s => s.setReactionSpeed);
  const setTimelineFrame = usePhysicsStore(s => s.setTimelineFrame);
  const setIsPlaying = usePhysicsStore(s => s.setIsPlaying);
  const setFluidPressure = usePhysicsStore(s => s.setFluidPressure);
  const setFluidViscosity = usePhysicsStore(s => s.setFluidViscosity);
  const setCustomModelUrl = usePhysicsStore(s => s.setCustomModelUrl);
  const toggleMeshVisibility = usePhysicsStore(s => s.toggleMeshVisibility);
  const toggleJiggleBone = usePhysicsStore(s => s.toggleJiggleBone);
  const setFunnelModels = usePhysicsStore(s => s.setFunnelModels);
  const setCylinderModels = usePhysicsStore(s => s.setCylinderModels);
  const setActiveFunnelModel = usePhysicsStore(s => s.setActiveFunnelModel);
  const setActiveCylinderModel = usePhysicsStore(s => s.setActiveCylinderModel);
  const addFunnels = usePhysicsStore(s => s.addFunnels);
  const addCylinders = usePhysicsStore(s => s.addCylinders);
  const funnelsData = usePhysicsStore(s => s.funnelsData);
  const updateFunnelTransform = usePhysicsStore(s => s.updateFunnelTransform);
  const cylindersData = usePhysicsStore(s => s.cylindersData);
  const updateCylinderTransform = usePhysicsStore(s => s.updateCylinderTransform);
  const entityTemperature = usePhysicsStore(s => s.entityTemperature);
  const entityOxygen = usePhysicsStore(s => s.entityOxygen);
  const entityBloodPressure = usePhysicsStore(s => s.entityBloodPressure);
  const entityHeartRate = usePhysicsStore(s => s.entityHeartRate);
  const fluidVaginalTransudate = usePhysicsStore(s => s.fluidVaginalTransudate);
  const fluidCervicalMucus = usePhysicsStore(s => s.fluidCervicalMucus);
  const fluidBartholinMucus = usePhysicsStore(s => s.fluidBartholinMucus);
  const fluidSkeneEjaculate = usePhysicsStore(s => s.fluidSkeneEjaculate);
  const fluidMenstrual = usePhysicsStore(s => s.fluidMenstrual);
  const fluidSmegma = usePhysicsStore(s => s.fluidSmegma);
  const fluidAnalMucus = usePhysicsStore(s => s.fluidAnalMucus);
  const fluidPerianalSebum = usePhysicsStore(s => s.fluidPerianalSebum);
  const fluidAnalBile = usePhysicsStore(s => s.fluidAnalBile);
  const fecalMatterType = usePhysicsStore(s => s.fecalMatterType);
  const fluidPurulentDischarge = usePhysicsStore(s => s.fluidPurulentDischarge);
  const fluidInterstitial = usePhysicsStore(s => s.fluidInterstitial);
  const entityPH = usePhysicsStore(s => s.entityPH);
  const hypothalamicClock = usePhysicsStore(s => s.hypothalamicClock);
  const lactationVolume = usePhysicsStore(s => s.lactationVolume);
  const oxytocinLevel = usePhysicsStore(s => s.oxytocinLevel);
  const salivaryViscosity = usePhysicsStore(s => s.salivaryViscosity);
  const lightingIntensity = usePhysicsStore(s => s.lightingIntensity);
  const physicsSpeed = usePhysicsStore(s => s.physicsSpeed);
  const cameraLocked = usePhysicsStore(s => s.cameraLocked);
  const enableCylinderControl = usePhysicsStore(s => s.enableCylinderControl);
  const enableFleshInteraction = usePhysicsStore(s => s.enableFleshInteraction);
  const enableForceField = usePhysicsStore(s => s.enableForceField);
  const enableVertexPaintMode = usePhysicsStore(s => s.enableVertexPaintMode);
  const thermalVision = usePhysicsStore(s => s.thermalVision);
  const environmentMode = usePhysicsStore(s => s.environmentMode);
  const physicsPresets = usePhysicsStore(s => s.physicsPresets);

  const vertexPaintIntensity = usePhysicsStore(s => s.vertexPaintIntensity);
  const forceFieldIntensity = usePhysicsStore(s => s.forceFieldIntensity);
  const [selectedMaterialInstance, setSelectedMaterialInstance] = useState<string>('');
  const [forgeLength, setForgeLength] = useState<number>(5);
  const [forgeGirth, setForgeGirth] = useState<number>(1.5);
  const [forgeRigidity, setForgeRigidity] = useState<number>(0.2);
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, storeName: 'funnels' | 'cylinders') => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsProcessing(true);
      try {
          const finalName = await importAssetFile(file, storeName);
          const entries = await getAssetNames(storeName);
          if (storeName === 'funnels') {
              setFunnelModels(entries.filter(f => !f.toLowerCase().endsWith('.zip')));
              await handleSelectModel(finalName, 'funnels');
          } else {
              setCylinderModels(entries.filter(f => !f.toLowerCase().endsWith('.zip')));
              await handleSelectModel(finalName, 'cylinders');
          }
      } catch (err: any) {
          console.warn('Import warning:', err);
          alert(`Could not import file. ${err.message || ''}`);
      } finally {
          setIsProcessing(false);
          e.target.value = ''; // Reset to allow re-importing same file
      }
  };

  const handleSelectModel = async (name: string, storeName: 'funnels' | 'cylinders') => {
      
      if (!name) {
          if (storeName === 'funnels') {
              setActiveFunnelModel(null);
              usePhysicsStore.getState().setActiveFunnelUrl(null);
              localStorage.removeItem('activeFunnelModel');
          } else {
              setActiveCylinderModel(null);
              usePhysicsStore.getState().setActiveCylinderUrl(null);
              localStorage.removeItem('activeCylinderModel');
          }
          return;
      }
      
      setIsProcessing(true);
      try {
          if (storeName === 'funnels') {
              setActiveFunnelModel(name);
              localStorage.setItem('activeFunnelModel', name);
          } else {
              setActiveCylinderModel(name);
              localStorage.setItem('activeCylinderModel', name);
          }
          
          const buffer = await readAsset(storeName, name);
          if (buffer) {
              const blob = new Blob([buffer]);
              const url = URL.createObjectURL(blob) + '#' + encodeURIComponent(name);
              if (storeName === 'funnels') {
                  usePhysicsStore.getState().setActiveFunnelUrl(url);
              } else {
                  usePhysicsStore.getState().setActiveCylinderUrl(url);
              }
          }
      } catch (err: any) {
          console.warn('Load warning', err);
          alert(`Failed to load asset. ${err.message || ''}`);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.target.files?.[0];
      if (!file) return;
      setIsProcessing(true);
      try {
          const buffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(buffer);
          
          const funnelFolder = zip.folder("funnels");
          if (funnelFolder) {
              for (const [name, file] of Object.entries(funnelFolder.files)) {
                  if (!file.dir) {
                      const fileBuffer = await file.async("arraybuffer");
                      await writeAsset('funnels', name, fileBuffer);
                  }
              }
          }
          
          const cylinderFolder = zip.folder("cylinders");
          if (cylinderFolder) {
              for (const [name, file] of Object.entries(cylinderFolder.files)) {
                  if (!file.dir) {
                      const fileBuffer = await file.async("arraybuffer");
                      await writeAsset('cylinders', name, fileBuffer);
                  }
              }
          }

          const fEntries = await getAssetNames('funnels');
          const cEntries = await getAssetNames('cylinders');
          setFunnelModels(fEntries);
          setCylinderModels(cEntries);
      } catch (err: any) {
          console.warn('Restore warning', err);
          alert(`Vault restore failed: ${err.message || ''}`);
      } finally {
          setIsProcessing(false);
          e.target.value = '';
      }
  };

  const [hudStats, setHudStats] = useState({ cpuMs: 12.4, vertices: 450, links: 1200 });

  useEffect(() => {
    const initVault = async () => {
      try {
        const fEntries = await getAssetNames('funnels');
        const cEntries = await getAssetNames('cylinders');
        setFunnelModels(fEntries.filter(f => !f.toLowerCase().endsWith('.zip')));
        setCylinderModels(cEntries.filter(f => !f.toLowerCase().endsWith('.zip')));
        
        // Auto-restore last selected active models so they persist if page reloads
        const lastFunnel = localStorage.getItem('activeFunnelModel');
        if (lastFunnel && fEntries.includes(lastFunnel) && !lastFunnel.toLowerCase().endsWith('.zip')) {
            handleSelectModel(lastFunnel, 'funnels');
        } else if (lastFunnel?.toLowerCase().endsWith('.zip')) {
            localStorage.removeItem('activeFunnelModel');
            usePhysicsStore.getState().setActiveFunnelUrl(null);
        }
        
        const lastCylinder = localStorage.getItem('activeCylinderModel');
        if (lastCylinder && cEntries.includes(lastCylinder) && !lastCylinder.toLowerCase().endsWith('.zip')) {
            handleSelectModel(lastCylinder, 'cylinders');
        } else if (lastCylinder?.toLowerCase().endsWith('.zip')) {
            localStorage.removeItem('activeCylinderModel');
            usePhysicsStore.getState().setActiveCylinderUrl(null);
        }
      } catch (err) {
        console.warn("Failed to load vault entries on mount", err);
      }
    };
    initVault();

    // Storage Scanner
    const checkQuota = async () => {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                const usageRatio = (estimate.usage || 0) / (estimate.quota || 1);
                if (usageRatio > 0.8) {
                    setVaultWarning(true);
                } else {
                    setVaultWarning(false);
                }
            } catch (err) {
                console.warn("Quota check failed", err);
            }
        }
    };
    checkQuota();
    const quotaInterval = setInterval(checkQuota, 10000);
    
    const interval = setInterval(() => {
      // Mock tracking telemetry from physics worker
      const fCount = usePhysicsStore.getState().funnelsData.length;
      const cCount = usePhysicsStore.getState().cylindersData.length;
      
      setHudStats({
         cpuMs: 2.1 + (fCount * 0.8) + (cCount * 0.2) + Math.random() * 1.5,
         vertices: 450 + (fCount * 1200) + (cCount * 64),
         links: 1200 + (fCount * 3000)
      });
    }, 100);
    return () => {
        clearInterval(interval);
        clearInterval(quotaInterval);
    };
  }, []);

  return (
    <>
      <LoadingSpinner isProcessing={isProcessing} />

      <div 
        className={`absolute top-4 left-4 w-80 max-h-[90vh] overflow-y-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl z-10 font-sans transition-opacity duration-300 ${uiGhostMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="flex items-center justify-between gap-2 mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-md transition-colors bg-white/5 text-neutral-400 hover:text-white"
              title={isMinimized ? "Expand UI" : "Minimize UI"}
            >
              {isMinimized ? <ChevronDown className="w-5 h-5 text-cyan-400" /> : <ChevronUp className="w-5 h-5 text-cyan-400" />}
            </button>
            <Activity className="w-5 h-5 text-cyan-400 hidden sm:block" />
            <h1 className="text-lg font-medium tracking-tight text-white">Kinetic Sandbox</h1>
          </div>
          <button 
            type="button"
            onClick={() => setUiGhostMode(true)}
            className="p-1.5 rounded-md transition-colors bg-white/5 text-neutral-400 hover:text-white"
            title="Ghost Protocol (Hide UI)"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

      {!isMinimized && (
        <>
        <div className="space-y-6">
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 mb-[-12px]">
          <SlidersHorizontal className="w-4 h-4 text-white/50" />
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block m-0">Physical Properties</label>
        </div>

        {/* The Vault */}
        <SectionHeader id="vault" label="THE VAULT" color="#00bcd4" />
        {expandedSections['vault'] && (
        <div className="pt-2 border-b border-white/10 pb-4 space-y-4">
            
            <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-[#8a8a93]">Funnel Architecture</label>
                <div className="flex gap-2">
                      <select 
                      className="flex-1 bg-white/10 text-cyan-400 border-none px-2 py-1 text-[10px] outline-none"
                      value={activeFunnelModel || ''}
                      onChange={(e) => handleSelectModel(e.target.value, 'funnels')}
                      disabled={isProcessing}
                    >
                        <option value="">SELECT FUNNEL</option>
                        {funnelModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <button 
                        type="button"
                        disabled={isProcessing}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black px-2 py-1 text-[10px] font-bold cursor-pointer uppercase disabled:opacity-50"
                        onClick={(e) => { e.preventDefault(); document.getElementById('funnelInput')?.click(); }}
                    >
                        IMPORT
                    </button>
                    <input id="funnelInput" type="file" className="hidden" accept=".glb,.fbx,.zip" onChange={(e) => handleImport(e, 'funnels')} />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-[#8a8a93]">Kinetic Cylinder</label>
                <div className="flex gap-2">
                    <select 
                      className="flex-1 bg-white/10 text-cyan-400 border-none px-2 py-1 text-[10px] outline-none"
                      value={activeCylinderModel || ''}
                      onChange={(e) => handleSelectModel(e.target.value, 'cylinders')}
                      disabled={isProcessing}
                    >
                        <option value="">SELECT CYLINDER</option>
                        {cylinderModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <button 
                      type="button"
                      disabled={isProcessing}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black px-2 py-1 text-[10px] font-bold cursor-pointer uppercase disabled:opacity-50"
                      onClick={(e) => { e.preventDefault(); document.getElementById('cylinderInput')?.click(); }}
                    >
                        IMPORT
                    </button>
                    <input id="cylinderInput" type="file" className="hidden" accept=".glb,.fbx,.zip" onChange={(e) => handleImport(e, 'cylinders')} />
                </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <label className="text-[9px] uppercase tracking-widest text-[#8a8a93]">Sandbox Memory Override</label>
                {vaultWarning && (
                  <div className="bg-red-500/20 border border-red-500 p-2 mb-1 flex justify-between items-center animate-pulse">
                    <span className="text-[9px] text-red-500 uppercase font-bold tracking-widest leading-tight">Storage Critical! &gt; 80% Full</span>
                    <button 
                       type="button" 
                       onClick={() => { if(window.confirm('Delete all stored models?')) { indexedDB.deleteDatabase('kinetic-assets'); setVaultWarning(false); window.location.reload(); } }} 
                       className="text-[9px] bg-red-600 hover:bg-red-500 text-white font-bold px-2 py-0.5"
                    >
                      PURGE
                    </button>
                  </div>
                )}
                <div className="flex gap-4">
                    <button type="button" onClick={(e) => { e.preventDefault(); exportVault(); }} disabled={isProcessing} className="flex-1 bg-white/10 text-white hover:bg-white/20 transition-colors border-none py-1 text-[9px] font-bold cursor-pointer uppercase disabled:opacity-50">SAVE VAULT (MODELS)</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById('restoreVaultInput')?.click(); }} disabled={isProcessing} className="flex-1 bg-white/10 text-white hover:bg-white/20 transition-colors border-none py-1 text-[9px] font-bold cursor-pointer uppercase disabled:opacity-50">RESTORE VAULT</button>
                    <input id="restoreVaultInput" type="file" className="hidden" accept=".zip,.vault" onChange={handleRestore} />
                </div>
                <div className="flex gap-4 mt-2">
                    <button type="button" onClick={(e) => { 
                        e.preventDefault(); 
                        const state = usePhysicsStore.getState();
                        const sessionData = {
                            funnelsData: state.funnelsData,
                            cylindersData: state.cylindersData
                        };
                        localStorage.setItem('master_session_data', JSON.stringify(sessionData));
                        alert('Master Session Saved');
                    }} className="flex-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 transition-colors border border-purple-500 py-1 text-[9px] font-bold cursor-pointer uppercase">STATIC OCG SNAPSHOT</button>
                    
                    <button type="button" onClick={(e) => { 
                        e.preventDefault(); 
                        const data = localStorage.getItem('master_session_data');
                        if (data) {
                            try {
                                const parsed = JSON.parse(data);
                                usePhysicsStore.setState({ funnelsData: parsed.funnelsData || [], cylindersData: parsed.cylindersData || [] });
                                alert('Master Session Restored');
                            } catch(e) { console.warn(e); }
                        } else {
                            alert('No session found');
                        }
                    }} className="flex-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 transition-colors border border-purple-500 py-1 text-[9px] font-bold cursor-pointer uppercase">RESTORE SESSION SNAPSHOT</button>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <label className="text-[9px] uppercase tracking-widest text-[#8a8a93]">Procedural Flesh Forge</label>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-neutral-400">Length</span>
                            <span className="text-[9px] font-mono text-cyan-400">{forgeLength.toFixed(1)}</span>
                        </div>
                        <input type="range" min="1" max="20" step="0.5" value={forgeLength} onChange={e => setForgeLength(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-neutral-400">Girth</span>
                            <span className="text-[9px] font-mono text-cyan-400">{forgeGirth.toFixed(1)}</span>
                        </div>
                        <input type="range" min="0.5" max="10" step="0.1" value={forgeGirth} onChange={e => setForgeGirth(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-neutral-400">Rigidity (Soft to Hard)</span>
                            <span className="text-[9px] font-mono text-[#ff003c]">{forgeRigidity.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.01" value={forgeRigidity} onChange={e => setForgeRigidity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ff003c]" />
                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); usePhysicsStore.getState().addProceduralCylinder(forgeLength, forgeGirth, forgeRigidity); }} className="w-full bg-[#00f0ff] hover:bg-cyan-400 text-black py-2 px-2 text-[10px] font-bold cursor-pointer uppercase transition-colors">
                        SPAWN PROCEDURAL CYLINDER
                    </button>
                </div>
            </div>
            </div>
            )}<div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <SectionHeader id="motion" label="The Motion Nexus (Synapse API)" color="#00ffaa" />
                {expandedSections['motion'] && (
                <div className="flex gap-2">
                    <button type="button" onClick={(e) => { e.preventDefault(); alert('Connecting to Decentralized Cloud Bucket... Streaming GLB Binary Keyframes: "All Fours 01" to Skeleton Array.'); }} className="flex-1 bg-[#00ffaa]/20 border border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">CRAWL</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); alert('Connecting to Decentralized Cloud Bucket... Streaming GLB Binary Keyframes: "Bending Over 03" to Skeleton Array.'); }} className="flex-1 bg-[#00ffaa]/20 border border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">SUBMIT</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); alert('Connecting to Decentralized Cloud Bucket... Streaming GLB Binary Keyframes: "Aggressive Thrash" to Skeleton Array.'); }} className="flex-1 bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">THRASH</button>
                </div>
                )}
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <SectionHeader id="facs" label="FACS Matrix Neural Core" color="#00aaff" />
                {expandedSections['facs'] && (
                <>
                <div className="flex gap-2">
                    <button type="button" onClick={(e) => { 
                        e.preventDefault();
                        const payload = {
                            "emotion": "extreme_agony",
                            "standard_blendshapes": { "jawOpen": 1.0, "browLowerer": 1.0 },
                            "custom_extremes": { "jawDislocate": 0.5, "pupilMiosis": 1.0 },
                            "shader_effects": { "skinFlushIntensity": 0.1, "pallorIntensity": 0.9, "tearIntensity": 1.0 }
                        };
                        if ((window as any).applyEmotionJSON && (window as any).debugMesh) {
                            (window as any).applyEmotionJSON((window as any).debugMesh, payload, (window as any).debugMaterial);
                        } else {
                            alert('JSON PAYLOAD RECEIVED:\n' + JSON.stringify(payload, null, 2) + '\n\nOverriding Morph Targets & Vertex Shader.'); 
                        }
                    }} className="flex-1 bg-red-900/40 border border-red-500 text-red-500 hover:bg-red-900/80 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">AGONY</button>
                    <button type="button" onClick={(e) => { 
                        e.preventDefault(); 
                        const payload = {
                            "emotion": "extreme_ecstasy",
                            "standard_blendshapes": { "mouthSmileLeft": 1.0, "mouthSmileRight": 1.0, "jawOpen": 0.8 },
                            "custom_extremes": { "eyeRollUp": 0.95, "tongueOut": 1.0 },
                            "shader_effects": { "skinFlushIntensity": 1.0, "skinGlossRoughness": 0.1, "pallorIntensity": 0.0 }
                        };
                        if ((window as any).applyEmotionJSON && (window as any).debugMesh) {
                            (window as any).applyEmotionJSON((window as any).debugMesh, payload, (window as any).debugMaterial);
                        } else {
                            alert('JSON PAYLOAD RECEIVED:\n' + JSON.stringify(payload, null, 2) + '\n\nOverriding Morph Targets & Vertex Shader.'); 
                        }
                    }} className="flex-1 bg-pink-900/40 border border-pink-500 text-pink-400 hover:bg-pink-900/80 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">AHEGAO</button>
                </div>
                <div className="flex gap-2 mt-1">
                    <button type="button" id="consciousness-loop-btn" onClick={(e) => { 
                        e.preventDefault(); 
                        const btn = document.getElementById('consciousness-loop-btn');
                        if ((window as any).synestheticLoopInterval) {
                            clearInterval((window as any).synestheticLoopInterval);
                            (window as any).synestheticLoopInterval = null;
                            if (btn) btn.innerText = "ENGAGE CONSCIOUSNESS LOOP";
                        } else {
                            if (btn) btn.innerText = "DISENGAGE CONSCIOUSNESS LOOP";
                            (window as any).synestheticLoopInterval = setInterval(() => {
                                const dummyPayload = {
                                    "emotion": "loop_feedback",
                                    "standard_blendshapes": { 
                                        "jawOpen": Math.random(), 
                                        "browLowerer": Math.random() * 0.8,
                                        "mouthSmileLeft": Math.random(), 
                                        "mouthSmileRight": Math.random() 
                                    },
                                    "custom_extremes": { "eyeRollUp": Math.random(), "tongueOut": Math.random() },
                                    "shader_effects": { "skinFlushIntensity": Math.random(), "skinGlossRoughness": Math.random() }
                                };
                                if ((window as any).applyEmotionJSON && (window as any).debugMesh) {
                                    (window as any).applyEmotionJSON((window as any).debugMesh, dummyPayload, (window as any).debugMaterial);
                                }
                            }, 2000); // 2 second psychological feedback loop
                        }
                    }} className="flex-1 bg-[#00ffff]/20 border border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff]/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">ENGAGE CONSCIOUSNESS LOOP</button>
                </div>
                </>
                )}
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <SectionHeader id="science" label="Scientific Instrumentation" color="#00ffaa" />
                {expandedSections['science'] && (
                    <>
                        <div className="flex gap-2">
                            <button type="button" onClick={(e) => { 
                                e.preventDefault(); 
                                const currentlyDriven = usePhysicsStore.getState().audioDrivenFace;
                                usePhysicsStore.getState().setAudioDrivenFace(!currentlyDriven);
                            }} className={`flex-1 border ${audioDrivenFace ? 'bg-[#00ffaa]/50 border-[#00ffaa] text-black' : 'bg-[#00ffaa]/20 border-[#00ffaa] text-[#00ffaa] '} hover:bg-[#00ffaa]/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase`}>MIC AUDIO LOOP</button>
                            <button type="button" onClick={(e) => { 
                                e.preventDefault(); 
                                const currentFluid = usePhysicsStore.getState().fluidMode;
                                usePhysicsStore.getState().setFluidMode(!currentFluid);
                            }} className={`flex-1 border ${fluidMode ? 'bg-cyan-500/50 border-cyan-500 text-black' : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'} hover:bg-cyan-500/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase`}>CYLINDER FLUID MODE</button>
                        </div>
                        <div className="flex gap-2 mt-2 flex-col">
                            <label className="text-[9px] text-[#00ffaa]">Text-To-Speech Consciousness Engine</label>
                            <div className="flex gap-2">
                                <input type="text" id="tts-input" placeholder="Type words for phonetic lip sync..." className="flex-1 bg-black/50 border border-[#00ffaa]/30 text-[#00ffaa] text-[10px] px-2 py-1 outline-none" />
                                <button type="button" onClick={(e) => {
                                    const input = document.getElementById('tts-input') as HTMLInputElement;
                                    const text = input.value;
                                    if (text) {
                                        const utterThis = new SpeechSynthesisUtterance(text);
                                        utterThis.pitch = 0.8; 
                                        utterThis.rate = 0.9;
                                        utterThis.onboundary = (event) => {
                                           // Animate mouth per word syllable
                                           if ((window as any).debugMesh && (window as any).debugMesh.morphTargetDictionary) {
                                               const mesh = (window as any).debugMesh;
                                               const jawIdx = mesh.morphTargetDictionary['jawOpen'];
                                               const smileIdx = mesh.morphTargetDictionary['mouthSmileLeft'];
                                               if (jawIdx !== undefined) {
                                                   mesh.morphTargetInfluences[jawIdx] = 0.5 + Math.random() * 0.5;
                                                   setTimeout(() => { if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[jawIdx] *= 0.2; }, 150);
                                               }
                                               if (smileIdx !== undefined) {
                                                   mesh.morphTargetInfluences[smileIdx] = Math.random() * 0.5;
                                               }
                                           }
                                        };
                                        window.speechSynthesis.speak(utterThis);
                                        // Fake the audio analyzer slightly if audio isn't feeding back into the system directly.
                                        if (!(window as any).audioAnalyzer || !(window as any).audioAnalyzer.isActive) {
                                           usePhysicsStore.getState().setAudioDrivenFace(true);
                                        }
                                    }
                                }} className="bg-[#00ffaa]/20 border border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/40 transition-colors px-3 py-1 text-[9px] font-bold cursor-pointer uppercase">SPEAK</button>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button type="button" onClick={(e) => { 
                                e.preventDefault();
                                const blob = new Blob([JSON.stringify({
                                    timestamp: Date.now(),
                                    gravity: "9.8 m/s2",
                                    particles: 5000,
                                    fluidMode: usePhysicsStore.getState().fluidMode,
                                    surfaceGrip: usePhysicsStore.getState().surfaceGrip,
                                    volumePreservation: usePhysicsStore.getState().volumePreservation
                                }, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'forensic-log-' + Date.now() + '.json';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }} className="flex-1 border border-white/20 text-white hover:bg-white/10 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">FORENSIC DATA EXPORT</button>
                        </div>
                        {fluidMode && (
                        <div className="space-y-4 mt-2">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#00ffaa]">Fluid Pressure (Reynolds No.)</span>
                                    <span className="text-[9px] font-mono text-[#00ffaa]">{fluidPressure.toFixed(1)}</span>
                                </div>
                                <input type="range" min="0" max="20" step="0.5" value={fluidPressure} onChange={e => setFluidPressure(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#00ffaa]" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#00ffaa]">Viscosity / Concentration</span>
                                    <span className="text-[9px] font-mono text-[#00ffaa]">{fluidViscosity.toFixed(2)}</span>
                                </div>
                                <input type="range" min="0.0" max="1.0" step="0.05" value={fluidViscosity} onChange={e => setFluidViscosity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#00ffaa]" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#00ffaa]">Hydration Level</span>
                                    <span className="text-[9px] font-mono text-[#00ffaa]">{(1.0 - fluidViscosity).toFixed(2)}</span>
                                </div>
                                <input type="range" min="0.0" max="1.0" step="0.05" value={1.0 - fluidViscosity} onChange={e => setFluidViscosity(1.0 - parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#00ffaa]" />
                            </div>
                        </div>
                        )}
                        <div className="space-y-4 mt-4">
                             <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#ff4444]">Core Temperature (Cyanosis/Goosebumps)</span>
                                    <span className="text-[9px] font-mono text-[#ff4444]">{entityTemperature.toFixed(1)}°C</span>
                                </div>
                                <input type="range" min="25.0" max="42.0" step="0.1" value={entityTemperature} onChange={e => usePhysicsStore.getState().setEntityTemperature(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ff4444]" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#4488ff]">Tissue Oxygenation (SPO2)</span>
                                    <span className="text-[9px] font-mono text-[#4488ff]">{(entityOxygen * 100).toFixed(0)}%</span>
                                </div>
                                <input type="range" min="0.5" max="1.0" step="0.01" value={entityOxygen} onChange={e => usePhysicsStore.getState().setEntityOxygen(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#4488ff]" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#ffaa00]">Blood Pressure (MAP Proxy)</span>
                                    <span className="text-[9px] font-mono text-[#ffaa00]">{(entityBloodPressure * 93).toFixed(0)} mmHg</span>
                                </div>
                                <input type="range" min="0.5" max="2.5" step="0.01" value={entityBloodPressure} onChange={e => usePhysicsStore.getState().setEntityBloodPressure(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ffaa00]" />
                            </div>
                             <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#ff0099]">Heart Rate (BPM)</span>
                                    <span className="text-[9px] font-mono text-[#ff0099]">{entityHeartRate.toFixed(0)} bpm</span>
                                </div>
                                <input type="range" min="40" max="220" step="1" value={entityHeartRate} onChange={e => usePhysicsStore.getState().setEntityHeartRate(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ff0099]" />
                            </div>

                            {/* Fluid Secretion Modifiers */}
                            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                                <label className="text-[9px] uppercase tracking-widest text-[#00ffcc] block border-b border-[#00ffcc]/30 pb-1 mb-2">Vaginal Fluid Matrix</label>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-cyan-300">Vaginal Transudate</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidVaginalTransudate} onChange={e => usePhysicsStore.getState().setFluidVaginalTransudate(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-300" />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-yellow-200">Cervical Mucus</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidCervicalMucus} onChange={e => usePhysicsStore.getState().setFluidCervicalMucus(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-yellow-200" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-[#ff66b2]">Bartholin Gland Secretions</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidBartholinMucus} onChange={e => usePhysicsStore.getState().setFluidBartholinMucus(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ff66b2]" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-white">Skene Gland Secretions (Ejaculate)</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidSkeneEjaculate} onChange={e => usePhysicsStore.getState().setFluidSkeneEjaculate(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-red-500">Menstrual Fluid (Endometrial Shedding)</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidMenstrual} onChange={e => usePhysicsStore.getState().setFluidMenstrual(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-[#e5d8b8]">Smegma (Sebaceous Buildup)</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidSmegma} onChange={e => usePhysicsStore.getState().setFluidSmegma(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#e5d8b8]" />
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                                <label className="text-[9px] uppercase tracking-widest text-orange-400 block border-b border-orange-400/30 pb-1 mb-2">Anal Fluid Matrix</label>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-orange-300">Anal Mucus (Goblet Cells / Crypts)</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidAnalMucus} onChange={e => usePhysicsStore.getState().setFluidAnalMucus(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-300" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-amber-200">Perianal Sebum and Sweat</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidPerianalSebum} onChange={e => usePhysicsStore.getState().setFluidPerianalSebum(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-200" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-green-500">Bile (Hepatobiliary Output)</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidAnalBile} onChange={e => usePhysicsStore.getState().setFluidAnalBile(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-green-500" />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-1 mt-2">
                                        <span className="text-[9px] text-amber-600">Bristol Stool Scale Type</span>
                                        <span className="text-[9px] font-mono text-amber-600">{fecalMatterType}</span>
                                    </div>
                                    <input type="range" min="1" max="7" step="1" value={fecalMatterType} onChange={e => usePhysicsStore.getState().setFecalMatterType(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                                <label className="text-[9px] uppercase tracking-widest text-[#ff4444] block border-b border-[#ff4444]/30 pb-1 mb-2">Defensive Pathological Secretions</label>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-[#ffffaa]">Purulent Discharge (Leukocyte/Pus)</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidPurulentDischarge} onChange={e => usePhysicsStore.getState().setFluidPurulentDischarge(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ffffaa]" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-[#4488ff]">Interstitial Fluid (Swelling Plasma)</span>
                                    </div>
                                    <input type="range" min="0.0" max="1.0" step="0.01" value={fluidInterstitial} onChange={e => usePhysicsStore.getState().setFluidInterstitial(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#4488ff]" />
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#55ff55]">Local Tissue pH (Chemical Disruption)</span>
                                    <span className="text-[9px] font-mono text-[#55ff55]">{entityPH.toFixed(1)} pH</span>
                                </div>
                                <input type="range" min="2.0" max="9.0" step="0.1" value={entityPH} onChange={e => usePhysicsStore.getState().setEntityPH(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#55ff55]" />
                                <div className="text-[8px] text-[#55ff55]/70 mt-1">
                                    {Math.abs(entityPH - 4.2) > 1.0 ? '🚨 HIGH VULNERABILITY (Barrier Destroyed)' : '✓ Healthy Acidic Barrier'}
                                </div>
                            </div>
                        </div>

                        {/* Removed duplicate fluid controls from lines 658-692, keep autonomic physiology below */}
                        <div className="space-y-4 mt-6 pt-4 border-t border-white/10">
                            <label className="text-[9px] text-[#aa88ff] block mb-2 uppercase font-bold">Autonomic & Systemic Physiology</label>
                            
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#aa88ff]">Hypothalamic Master Clock (Arousal State)</span>
                                    <span className="text-[9px] font-mono text-[#aa88ff]">{(hypothalamicClock * 100).toFixed(0)}%</span>
                                </div>
                                <input type="range" min="0.0" max="1.0" step="0.01" value={hypothalamicClock} onChange={e => usePhysicsStore.getState().setHypothalamicClock(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#aa88ff]" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#ffbbee]">Lactation Volume (Engorgement)</span>
                                    <span className="text-[9px] font-mono text-[#ffbbee]">{(lactationVolume * 100).toFixed(0)}%</span>
                                </div>
                                <input type="range" min="0.0" max="1.0" step="0.01" value={lactationVolume} onChange={e => usePhysicsStore.getState().setLactationVolume(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ffbbee]" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#77ccff]">Oxytocin Letdown Reflex</span>
                                    <span className="text-[9px] font-mono text-[#77ccff]">{(oxytocinLevel * 100).toFixed(0)}%</span>
                                </div>
                                <input type="range" min="0.0" max="1.0" step="0.01" value={oxytocinLevel} onChange={e => usePhysicsStore.getState().setOxytocinLevel(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#77ccff]" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#aaaaaa]">Salivary Viscosity (Sympathetic Shift)</span>
                                    <span className="text-[9px] font-mono text-[#aaaaaa]">{(salivaryViscosity * 100).toFixed(0)}%</span>
                                </div>
                                <input type="range" min="0.0" max="1.0" step="0.01" value={salivaryViscosity} onChange={e => usePhysicsStore.getState().setSalivaryViscosity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#aaaaaa]" />
                            </div>
                        </div>

                        <div className="space-y-4 mt-6 pt-4 border-t border-white/10">
                            <div>
                                <label className="text-[9px] text-[#00ffcc] block mb-2">Environment Lighting</label>
                                <div className="flex gap-1">
                                    {['cyberpunk', 'mono', 'laboratory'].map(env => (
                                        <button
                                            key={env}
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); usePhysicsStore.getState().setEnvironmentMode(env as any); }}
                                            className={`flex-1 border py-1 text-[8px] font-bold cursor-pointer uppercase ${environmentMode === env ? 'bg-[#00ffcc]/50 border-[#00ffcc] text-black' : 'bg-[#00ffcc]/20 border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc]/40'}`}
                                        >
                                            {env}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-white">Lighting / Gloss Intensity</span>
                                    <span className="text-[9px] font-mono text-white">{lightingIntensity.toFixed(2)}x</span>
                                </div>
                                <input type="range" min="0.1" max="5.0" step="0.1" value={lightingIntensity} onChange={e => usePhysicsStore.getState().setLightingIntensity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-[#00ffaa]">Simulation Speed</span>
                                    <span className="text-[9px] font-mono text-[#00ffaa]">{physicsSpeed.toFixed(2)}x</span>
                                </div>
                                <input type="range" min="0.1" max="5.0" step="0.1" value={physicsSpeed} onChange={e => usePhysicsStore.getState().setPhysicsSpeed(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#00ffaa]" />
                            </div>
                        </div>

                        <div className="space-y-4 mt-6 pt-4 border-t border-white/10">
                            <div>
                                <label className="text-[9px] text-[#ff00ff] block mb-2">Interaction Toggles</label>
                                <div className="grid grid-cols-2 gap-1 mb-2">
                                    <button type="button" onClick={() => { const s = usePhysicsStore.getState(); s.setCameraLocked(!s.cameraLocked); }} className={`border py-1 text-[8px] font-bold cursor-pointer uppercase ${cameraLocked ? 'bg-[#ff00ff]/50 border-[#ff00ff] text-white' : 'bg-[#ff00ff]/20 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff]/40'}`}>
                                        Stable Camera
                                    </button>
                                    <button type="button" onClick={() => { const s = usePhysicsStore.getState(); s.setEnableCylinderControl(!s.enableCylinderControl); }} className={`border py-1 text-[8px] font-bold cursor-pointer uppercase ${enableCylinderControl ? 'bg-[#00ffff]/50 border-[#00ffff] text-black' : 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff]/40'}`}>
                                        Cylinder Drag
                                    </button>
                                    <button type="button" onClick={() => { const s = usePhysicsStore.getState(); s.setEnableFleshInteraction(!s.enableFleshInteraction); }} className={`border py-1 text-[8px] font-bold cursor-pointer uppercase ${enableFleshInteraction ? 'bg-[#00ffaa]/50 border-[#00ffaa] text-black' : 'bg-[#00ffaa]/20 border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/40'}`}>
                                        Flesh Grapple
                                    </button>
                                    <button type="button" onClick={() => { const s = usePhysicsStore.getState(); s.setEnableForceField(!s.enableForceField); }} className={`border py-1 text-[8px] font-bold cursor-pointer uppercase ${enableForceField ? 'bg-[#ffff00]/50 border-[#ffff00] text-black' : 'bg-[#ffff00]/20 border-[#ffff00] text-[#ffff00] hover:bg-[#ffff00]/40'}`}>
                                        Force Field
                                    </button>
                                    <button type="button" onClick={() => { const s = usePhysicsStore.getState(); s.setEnableVertexPaintMode(!s.enableVertexPaintMode); }} className={`border py-1 text-[8px] font-bold cursor-pointer uppercase ${enableVertexPaintMode ? 'bg-[#ff8800]/50 border-[#ff8800] text-black' : 'bg-[#ff8800]/20 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800]/40'}`}>
                                        Vertex Paint
                                    </button>
                                    <button type="button" onClick={() => { const s = usePhysicsStore.getState(); s.setThermalVision(!s.thermalVision); }} className={`border py-1 text-[8px] font-bold cursor-pointer uppercase ${thermalVision ? 'bg-[#ff4444]/50 border-[#ff4444] text-white' : 'bg-[#ff4444]/20 border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444]/40'}`}>
                                        Thermal Heatmap
                                    </button>
                                </div>
                            </div>
                            
                            {enableVertexPaintMode && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-[#ff8800]">Paint Pull Intensity</span>
                                        <span className="text-[9px] font-mono text-[#ff8800]">{vertexPaintIntensity.toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0.1" max="5.0" step="0.1" value={vertexPaintIntensity} onChange={e => usePhysicsStore.getState().setVertexPaintIntensity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ff8800]" />
                                    <button type="button" onClick={() => window.location.reload()} className="mt-2 w-full py-1 bg-[#ff8800]/20 border border-[#ff8800] text-[#ff8800] text-[9px] uppercase font-bold hover:bg-[#ff8800]/40">Reset Geometries (Reload)</button>
                                </div>
                            )}

                            {enableForceField && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-[#ffff00]">Force Field Intensity (Repel/Attract)</span>
                                        <span className="text-[9px] font-mono text-[#ffff00]">{forceFieldIntensity.toFixed(1)}</span>
                                    </div>
                                    <input type="range" min="-30.0" max="30.0" step="0.1" value={forceFieldIntensity} onChange={e => usePhysicsStore.getState().setForceFieldIntensity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#ffff00]" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 mt-6 pt-4 border-t border-white/10">
                            <div>
                                <label className="text-[9px] text-[#ffffff] block mb-2">Physics Presets</label>
                                <div className="grid grid-cols-2 gap-1 mb-2">
                                    {Object.keys(physicsPresets).map(presetName => (
                                        <button key={presetName} type="button" onClick={() => usePhysicsStore.getState().loadPreset(presetName)} className="border border-white/30 bg-white/10 hover:bg-white/20 text-white py-1 text-[8px] font-bold cursor-pointer transition-colors">
                                            Load: {presetName}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-1 mt-2">
                                    <input type="text" id="preset-name" placeholder="Preset name..." className="flex-1 bg-black/50 border border-white/30 text-white text-[10px] px-2 py-1 outline-none" />
                                    <button type="button" onClick={() => {
                                        const input = document.getElementById('preset-name') as HTMLInputElement;
                                        if (input && input.value) {
                                            usePhysicsStore.getState().savePreset(input.value);
                                            input.value = '';
                                        }
                                    }} className="px-3 bg-white/20 hover:bg-white/30 text-white text-[9px] border border-white/30 uppercase font-bold">Save Current</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <SectionHeader id="chaos" label="Grid Chaos Mechanics" color="#ffaa00" />
                {expandedSections['chaos'] && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button type="button" onClick={(e) => { e.preventDefault(); alert('Instantiating 10k Micro-Cylinder Particle Emitter... Navigating-Stokes Fluid Dynamics Solver engaged.'); }} className="flex-1 bg-[#ffaa00]/20 border border-[#ffaa00] text-[#ffaa00] hover:bg-[#ffaa00]/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">FLUID SWARM</button>
                        <button type="button" onClick={(e) => { e.preventDefault(); alert('Gravitational Anomaly Deployed at Funnel Core. Initiating Radial Vacuum Vectors.'); }} className="flex-1 bg-purple-500/20 border border-purple-500 text-purple-400 hover:bg-purple-500/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">VORTEX SUCK</button>
                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); alert('Peristaltic Wave Generation Fired. Linear actuators initiating expulsive/pulling force across colorectal flexure.'); }} className="w-full bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500/40 transition-colors py-1 text-[9px] font-bold cursor-pointer uppercase">Trigger Peristaltic Wave</button>
                </div>
                )}
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <label className="text-[9px] uppercase tracking-widest text-[#8a8a93]">Entity Multiplication Swarm</label>
                <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={(e) => { e.preventDefault(); usePhysicsStore.getState().addFunnels(5); }} className="flex-1 bg-[#ff003c]/20 hover:bg-[#ff003c]/40 transition-colors border border-[#ff003c] text-[#ff003c] py-1 px-2 text-[9px] font-bold cursor-pointer uppercase">
                        +5 FUNNELS
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); usePhysicsStore.getState().addCylinders(50); }} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 transition-colors border border-cyan-500 text-cyan-500 py-1 px-2 text-[9px] font-bold cursor-pointer uppercase">
                        +50 CYLINDERS
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); usePhysicsStore.getState().clearSwarms(); }} className="flex-1 bg-neutral-500/20 hover:bg-neutral-500/40 transition-colors border border-neutral-500 text-neutral-400 py-1 px-2 text-[9px] font-bold cursor-pointer uppercase">
                        CLEAR
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <label className="text-[9px] uppercase tracking-widest text-[#8a8a93]">Material Properties</label>
                <select 
                  className="w-full bg-neutral-800 text-[9px] text-white p-1 border border-neutral-700 outline-none mb-2"
                  value={selectedMaterialInstance}
                  onChange={(e) => setSelectedMaterialInstance(e.target.value)}
                >
                  <option value="" disabled>-- Select Instance --</option>
                  <optgroup label="Funnels">
                    {funnelsData.map(f => <option key={f.id} value={f.id}>{f.id}</option>)}
                  </optgroup>
                  <optgroup label="Cylinders">
                    {cylindersData.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </optgroup>
                </select>
                
                {selectedMaterialInstance && (
                    <div className="space-y-4">
                        {(() => {
                            const isFunnel = selectedMaterialInstance.startsWith('funnel-');
                            const inst = isFunnel 
                                ? funnelsData.find(f => f.id === selectedMaterialInstance) 
                                : cylindersData.find(c => c.id === selectedMaterialInstance);
                            
                            if (!inst) return null;
                            
                            const rig = inst.rigidity ?? 1.0;
                            const jig = inst.jiggleAmplitude ?? (isFunnel ? 0.3 : 0.0);
                            
                            const setRig = (v: number) => isFunnel 
                                ? updateFunnelTransform(inst.id, { rigidity: v }) 
                                : updateCylinderTransform(inst.id, { rigidity: v });
                                
                            const setJig = (v: number) => isFunnel
                                ? updateFunnelTransform(inst.id, { jiggleAmplitude: v })
                                : updateCylinderTransform(inst.id, { jiggleAmplitude: v });
                                
                            return (
                                <>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] text-neutral-400">Rigidity</span>
                                            <span className="text-[9px] font-mono text-cyan-400">{rig.toFixed(2)}</span>
                                        </div>
                                        <input type="range" min="0" max="5" step="0.01" value={rig} onChange={e => setRig(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] text-neutral-400">Jiggle Amplitude</span>
                                            <span className="text-[9px] font-mono text-cyan-400">{jig.toFixed(2)}</span>
                                        </div>
                                        <input type="range" min="0" max="5" step="0.01" value={jig} onChange={e => setJig(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>

        {/* Stiffness Control */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Struct Stiffness</label>
            <span className="text-xs font-mono text-cyan-400">{stiffness.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={stiffness}
            onChange={(e) => setStiffness(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <p className="text-[10px] text-neutral-500 mt-1">Controls the snap-back force of the funnel mesh.</p>
        </div>

        {/* Damping Control */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Damping</label>
            <span className="text-xs font-mono text-cyan-400">{damping.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            value={damping}
            onChange={(e) => setDamping(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <p className="text-[10px] text-neutral-500 mt-1">Energy dissipation. Low = long jiggle, High = heavy thud.</p>
        </div>

        {/* Biological Controls Section */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="w-4 h-4 text-cyan-500" />
            <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest block m-0">Biological Matrix (Stress & Tension)</label>
          </div>
          
          {/* Hyper Elasticity */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Hyper Elasticity</label>
              <span className="text-[9px] font-mono text-cyan-400">{hyperElasticity.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="1.0" step="0.01" value={hyperElasticity} onChange={(e) => setHyperElasticity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Flow and stretch resistance (kLST).</p>
          </div>

          {/* Structural Shield */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Structural Shield</label>
              <span className="text-[9px] font-mono text-cyan-400">{structuralShield.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="1.0" step="0.01" value={structuralShield} onChange={(e) => setStructuralShield(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Pose stiffness (kAST). High values resist deformation.</p>
          </div>

          {/* Tearing Threshold */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-semibold text-red-500 uppercase tracking-widest">Tearing Limit</label>
              <span className="text-[9px] font-mono text-red-500">{tearingThreshold.toFixed(2)}</span>
            </div>
            <input type="range" min="0.5" max="5.0" step="0.1" value={tearingThreshold} onChange={(e) => setTearingThreshold(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
            <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Stress point where structural links snap (Tearing).</p>
          </div>
        </div>

        {/* Plasticity */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Plasticity</label>
            <span className="text-xs font-mono text-red-400">{plasticityLimit.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={plasticityLimit}
            onChange={(e) => setPlasticityLimit(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-400"
          />
          <p className="text-[10px] text-neutral-500 mt-1">Tolerance before permanent length alteration.</p>
        </div>

        {/* Stretchiness */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Stretchiness</label>
            <span className="text-[9px] font-mono text-cyan-400">{hyperElasticity.toFixed(2)}</span>
          </div>
          <input type="range" min="0.0" max="1.0" step="0.01" value={hyperElasticity} onChange={(e) => setHyperElasticity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
          <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Flow and stretch resistance in soft bodies.</p>
        </div>

        {/* Volume Preservation */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Volume Density</label>
            <span className="text-xs font-mono text-red-400">{volumePreservation.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={volumePreservation}
            onChange={(e) => setVolumePreservation(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-400"
          />
          <p className="text-[10px] text-neutral-500 mt-1">Forces funnel to expand outward to maintain total internal volume.</p>
        </div>

        {/* Surface Grip */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Surface Grip</label>
            <span className="text-xs font-mono text-red-400">{surfaceGrip.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={surfaceGrip}
            onChange={(e) => setSurfaceGrip(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-400"
          />
          <p className="text-[10px] text-neutral-500 mt-1">Friction coupling. High drag causes maximum node displacement.</p>
        </div>

        {/* Cylinder Radius */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Cylinder Mass (Radius)</label>
            <span className="text-xs font-mono text-cyan-400">{cylinderRadius.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="5.0"
            step="0.05"
            value={cylinderRadius}
            onChange={(e) => setCylinderRadius(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <p className="text-[10px] text-neutral-500 mt-1">Radius size and collision boundary of the cylinder.</p>
        </div>

        {/* Cylinder Softness */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Cylinder Softness</label>
            <span className="text-xs font-mono text-fuchsia-400">{cylinderSoftness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={cylinderSoftness}
            onChange={(e) => setCylinderSoftness(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
          />
          <p className="text-[10px] text-neutral-500 mt-1">0 = Rigid Hard Body. 1 = Floppy Jiggly Soft Body (yielding collision).</p>
        </div>

        {/* Slap Sensitivity */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Slap Velocity Factor</label>
            <span className="text-[9px] font-mono text-orange-400">{slapSensitivity.toFixed(2)}</span>
          </div>
          <input type="range" min="0.1" max="5.0" step="0.1" value={slapSensitivity} onChange={(e) => setSlapSensitivity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
          <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Swipe multiplier. Tune for light jiggles or violent slaps.</p>
        </div>

        {funnelsData && funnelsData.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-4">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Funnel Model Transform</label>
            <div className="space-y-3">
              {funnelsData.map(f => {
                  const s = f.scale || [1,1,1];
                  const r = f.rotation || [0,0,0];
                  return (
                    <div key={f.id} className="bg-neutral-800/50 p-2 rounded-md">
                      <span className="text-[9px] font-mono text-fuchsia-400 mb-1 block">{f.id}</span>
                      <div className="flex gap-2 items-center mb-1">
                          <span className="text-[9px] text-neutral-500 w-8">SCL</span>
                          <input type="range" min="0.05" max="5.0" step="0.05" value={s[0]} onChange={(e) => updateFunnelTransform(f.id, { scale: [parseFloat(e.target.value), parseFloat(e.target.value), parseFloat(e.target.value)] })} className="w-full h-1 accent-fuchsia-500" />
                          <span className="text-[9px] font-mono w-4">{s[0].toFixed(1)}</span>
                      </div>
                      <div className="flex gap-2 items-center mb-1">
                          <span className="text-[9px] text-neutral-500 w-8">ROT X</span>
                          <input type="range" min="-3.14" max="3.14" step="0.05" value={r[0]} onChange={(e) => updateFunnelTransform(f.id, { rotation: [parseFloat(e.target.value), r[1], r[2]] })} className="w-full h-1 accent-fuchsia-500" />
                      </div>
                      <div className="flex gap-2 items-center mb-1">
                          <span className="text-[9px] text-neutral-500 w-8">ROT Y</span>
                          <input type="range" min="-3.14" max="3.14" step="0.05" value={r[1]} onChange={(e) => updateFunnelTransform(f.id, { rotation: [r[0], parseFloat(e.target.value), r[2]] })} className="w-full h-1 accent-fuchsia-500" />
                      </div>
                      <div className="flex gap-2 items-center">
                          <span className="text-[9px] text-neutral-500 w-8">ROT Z</span>
                          <input type="range" min="-3.14" max="3.14" step="0.05" value={r[2]} onChange={(e) => updateFunnelTransform(f.id, { rotation: [r[0], r[1], parseFloat(e.target.value)] })} className="w-full h-1 accent-fuchsia-500" />
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {cylindersData && cylindersData.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-4">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Cylinder Model Transform</label>
            <div className="space-y-3">
              {cylindersData.map(c => {
                  const s = c.scale || [1,1,1];
                  const r = c.rotation || [0,0,0];
                  return (
                    <div key={c.id} className="bg-neutral-800/50 p-2 rounded-md">
                      <span className="text-[9px] font-mono text-cyan-400 mb-1 block">{c.id}</span>
                      <div className="flex gap-2 items-center mb-1">
                          <span className="text-[9px] text-neutral-500 w-8">SCL</span>
                          <input type="range" min="0.05" max="5.0" step="0.05" value={s[0]} onChange={(e) => updateCylinderTransform(c.id, { scale: [parseFloat(e.target.value), parseFloat(e.target.value), parseFloat(e.target.value)] })} className="w-full h-1 accent-cyan-500" />
                          <span className="text-[9px] font-mono w-4">{s[0].toFixed(1)}</span>
                      </div>
                      <div className="flex gap-2 items-center mb-1">
                          <span className="text-[9px] text-neutral-500 w-8">ROT X</span>
                          <input type="range" min="-3.14" max="3.14" step="0.05" value={r[0]} onChange={(e) => updateCylinderTransform(c.id, { rotation: [parseFloat(e.target.value), r[1], r[2]] })} className="w-full h-1 accent-cyan-500" />
                      </div>
                      <div className="flex gap-2 items-center mb-1">
                          <span className="text-[9px] text-neutral-500 w-8">ROT Y</span>
                          <input type="range" min="-3.14" max="3.14" step="0.05" value={r[1]} onChange={(e) => updateCylinderTransform(c.id, { rotation: [r[0], parseFloat(e.target.value), r[2]] })} className="w-full h-1 accent-cyan-500" />
                      </div>
                      <div className="flex gap-2 items-center">
                          <span className="text-[9px] text-neutral-500 w-8">ROT Z</span>
                          <input type="range" min="-3.14" max="3.14" step="0.05" value={r[2]} onChange={(e) => updateCylinderTransform(c.id, { rotation: [r[0], r[1], parseFloat(e.target.value)] })} className="w-full h-1 accent-cyan-500" />
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {bones && bones.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-4">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Bone Command Center</label>
            <div className="space-y-3">
              <button 
                onClick={() => {
                    const resetTx = { position: [0,0,0] as [number,number,number], rotation: [0,0,0] as [number,number,number], scale: [1,1,1] as [number,number,number] };
                    bones.forEach(b => usePhysicsStore.getState().setBoneTransform(b.uuid, resetTx));
                }}
                className="w-full bg-red-900/50 hover:bg-red-800 text-red-200 text-[9px] py-1 mb-2 font-bold uppercase tracking-widest border border-red-500/30"
              >
                RESET ALL BONES
              </button>
              <select 
                className="w-full bg-neutral-800 text-[9px] text-white p-1 border border-neutral-700 outline-none mb-2"
                value={activeBoneId || ''}
                onChange={(e) => setActiveBoneId(e.target.value)}
              >
                <option value="" disabled>-- Select a Bone --</option>
                {bones.map(b => (
                    <option key={b.uuid} value={b.uuid}>{b.name || b.uuid}</option>
                ))}
              </select>
              
              {(() => {
                  const bone = bones.find(b => b.uuid === activeBoneId);
                  if (!bone) return null;
                  const bt = usePhysicsStore.getState().boneTransforms[bone.uuid] || { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] };
                  return (
                    <div key={bone.uuid} className="bg-neutral-800/50 p-2 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-white" title={bone.uuid}>{bone.name || 'Bone'}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => usePhysicsStore.getState().setBoneTransform(bone.uuid, { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] })}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-700 text-red-400 hover:text-white transition-colors"
                          >
                             RESET
                          </button>
                          <button 
                            onClick={() => toggleJiggleBone(bone.uuid)}
                            className={`text-[9px] px-2 py-0.5 rounded-full ${jiggleBones.has(bone.uuid) ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50' : 'bg-neutral-700 text-neutral-400 border border-transparent'}`}
                          >
                            {jiggleBones.has(bone.uuid) ? 'JIGGLE: ON' : 'JIGGLE: OFF'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] text-neutral-500 w-8">POS</span>
                          <input type="range" min="-5" max="5" step="0.01" value={bt.position[0]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { position: [parseFloat(e.target.value), bt.position[1], bt.position[2]] })} className="h-1 accent-white" />
                          <input type="range" min="-5" max="5" step="0.01" value={bt.position[1]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { position: [bt.position[0], parseFloat(e.target.value), bt.position[2]] })} className="h-1 accent-white" />
                          <input type="range" min="-5" max="5" step="0.01" value={bt.position[2]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { position: [bt.position[0], bt.position[1], parseFloat(e.target.value)] })} className="h-1 accent-white" />
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] text-neutral-500 w-8">ROT</span>
                          <input type="range" min="-3.14" max="3.14" step="0.01" value={bt.rotation[0]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { rotation: [parseFloat(e.target.value), bt.rotation[1], bt.rotation[2]] })} className="h-1 accent-white" />
                          <input type="range" min="-3.14" max="3.14" step="0.01" value={bt.rotation[1]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { rotation: [bt.rotation[0], parseFloat(e.target.value), bt.rotation[2]] })} className="h-1 accent-white" />
                          <input type="range" min="-3.14" max="3.14" step="0.01" value={bt.rotation[2]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { rotation: [bt.rotation[0], bt.rotation[1], parseFloat(e.target.value)] })} className="h-1 accent-white" />
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] text-neutral-500 w-8">SCL</span>
                          <input type="range" min="0.1" max="5" step="0.01" value={bt.scale[0]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { scale: [parseFloat(e.target.value), bt.scale[1], bt.scale[2]] })} className="h-1 accent-white" />
                          <input type="range" min="0.1" max="5" step="0.01" value={bt.scale[1]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { scale: [bt.scale[0], parseFloat(e.target.value), bt.scale[2]] })} className="h-1 accent-white" />
                          <input type="range" min="0.1" max="5" step="0.01" value={bt.scale[2]} onChange={(e) => usePhysicsStore.getState().setBoneTransform(bone.uuid, { scale: [bt.scale[0], bt.scale[1], parseFloat(e.target.value)] })} className="h-1 accent-white" />
                        </div>
                      </div>
                    </div>
                  );
              })()}
            </div>
          </div>
        )}

        {meshes && meshes.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-4">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Object Layers</label>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  meshes.forEach(m => {
                      if (hiddenMeshes.has(m.uuid)) toggleMeshVisibility(m.uuid);
                  });
                }}
                className="w-full bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 text-[9px] py-1 mb-2 font-bold uppercase tracking-widest border border-cyan-500/30"
              >
                SHOW ALL LAYERS
              </button>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                {meshes.map(mesh => (
                  <div key={mesh.uuid} className="flex items-center justify-between bg-neutral-800/30 p-1.5 rounded">
                    <span className="text-[10px] text-neutral-300 truncate w-32" title={mesh.name || mesh.uuid}>{mesh.name || 'Unnamed Mesh'}</span>
                    <button 
                      onClick={() => toggleMeshVisibility(mesh.uuid)}
                      className={`text-[9px] px-2 py-0.5 rounded ${hiddenMeshes.has(mesh.uuid) ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}
                    >
                      {hiddenMeshes.has(mesh.uuid) ? 'HIDDEN' : 'VISIBLE'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Kinetic Archetypes */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <SectionHeader id="archetypes" label="Behavioral Archetypes (AI)" />
          {expandedSections['archetypes'] && (
          <div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px] py-1.5 rounded font-semibold uppercase tracking-wider transition-colors border border-black hover:border-cyan-500/50"
              onClick={() => {
                setStiffness(0.4); setDamping(0.9); setHyperElasticity(0.1); setStructuralShield(1.0); setWillpower(1.0);
              }}
            >
              King (Rigid)
            </button>
            <button 
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px] py-1.5 rounded font-semibold uppercase tracking-wider transition-colors border border-black hover:border-pink-500/50"
              onClick={() => {
                setStiffness(0.05); setDamping(0.95); setHyperElasticity(0.9); setStructuralShield(0.1); setWillpower(0.2);
              }}
            >
              Catalyst (Loose)
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Autonomous Willpower</label>
              <span className="text-[9px] font-mono text-cyan-400">{willpower.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="1.0" step="0.05" value={willpower} onChange={(e) => setWillpower(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Entity resistance and muscle struggle factor.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Jiggle Strength</label>
              <span className="text-[9px] font-mono text-pink-400">{jiggleAmplitude.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="5.0" step="0.1" value={jiggleAmplitude} onChange={(e) => setJiggleAmplitude(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
            <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Multiplier for inertia and procedural soft body dances.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Panic Threshold</label>
              <span className="text-[9px] font-mono text-cyan-400">{panicThreshold.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="1.0" step="0.05" value={panicThreshold} onChange={(e) => setPanicThreshold(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Controls erratic movements under severe physical stress.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Aggression</label>
              <span className="text-[9px] font-mono text-red-500">{aggression.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="1.0" step="0.05" value={aggression} onChange={(e) => setAggression(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
            <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Speed and intensity of kinetic torque attacks.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">Reaction Speed</label>
              <span className="text-[9px] font-mono text-teal-400">{reactionSpeed.toFixed(2)}</span>
            </div>
            <input type="range" min="0.1" max="5.0" step="0.1" value={reactionSpeed} onChange={(e) => setReactionSpeed(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-500" />
            <p className="text-[9px] text-neutral-500 mt-1 leading-tight">Neural response delay for collision flinches.</p>
          </div>
        </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 space-y-4">
          <SectionHeader id="universal_pipeline" label="Universal Pipeline" />
          {expandedSections['universal_pipeline'] && (
          <div>
          <div className="flex gap-2">
          <label className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs py-2 rounded-md transition-colors relative overflow-hidden text-center cursor-pointer">
              <Upload className="w-3 h-3" />
              <span>Import Asset</span>
              <input 
                type="file" 
                accept=".glb,.gltf,.fbx,.zip" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsProcessing(true);
                    try {
                      console.log('Ingesting file to Binary Store...', file.name);
                      const id = file.name.split('.')[0] || 'custom_model';
                      await saveAsset(id, file);

                      if (file.name.endsWith('.zip')) {
                        const zip = new JSZip();
                        const zipData = await zip.loadAsync(file);
                        
                        const objectUrls: Record<string, string> = {};
                        let mainFile = '';
                        
                        // Process all files in zip
                        for (const [filename, zipEntry] of Object.entries(zipData.files)) {
                          if (!zipEntry.dir) {
                            const blob = await zipEntry.async('blob');
                            const url = URL.createObjectURL(blob);
                            objectUrls[filename] = url;
                            
                            if (filename.endsWith('.gltf') || filename.endsWith('.glb') || filename.endsWith('.fbx')) {
                              mainFile = url;
                            }
                          }
                        }
                        
                        if (mainFile) {
                          setCustomModelUrl(mainFile);
                          console.log('Zip extracted and main file mapped.');
                        }

                      } else {
                        // Generate local object URL to display the asset
                        const url = URL.createObjectURL(file);
                        setCustomModelUrl(url);
                        console.log('Mesh saved to IndexedDB & object URL created');
                      }
                    } catch (err: any) {
                      console.warn('Core dump warning:', err);
                      alert(`Core dump failed: ${err.message || ''}`);
                    } finally {
                      setIsProcessing(false);
                    }
                  }
                  e.target.value = '';
                }}
              />
            </label>
            <button 
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-400 text-xs py-2 rounded-md transition-colors border border-cyan-500/30"
              onClick={async () => {
                const scene = (window as any).threeJsScene;
                if (!scene) return;
                const exporter = new GLTFExporter();
                exporter.parse(
                  scene,
                  (gltf) => {
                    const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.style.display = 'none';
                    link.href = url;
                    link.download = 'kinetic_snapshot.glb';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  },
                  (error: any) => {
                    console.warn('An error occurred during export:', error);
                    alert(`Export failed: ${error.message || ''}`);
                  },
                  { binary: true } // Export as GLB
                );
              }}
            >
              <Box className="w-3 h-3" />
              <span>Snapshot GLB</span>
            </button>
            <button 
              className="flex-1 flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-800/60 text-red-400 text-xs py-2 rounded-md transition-colors border border-red-500/30 relative"
              onClick={() => {
                const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                if (!canvas) return;
                
                // Add rec mode flag
                if ((window as any).mediaRecorder?.state === 'recording') {
                  (window as any).mediaRecorder.stop();
                  return;
                }
                
                const stream = canvas.captureStream(60); // 60 FPS
                const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
                const chunks: BlobPart[] = [];
                
                recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = () => {
                  const blob = new Blob(chunks, { type: 'video/webm' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = 'kinetic_capture.webm';
                  document.body.appendChild(a);
                  a.click();
                  URL.revokeObjectURL(url);
                };
                
                recorder.start();
                (window as any).mediaRecorder = recorder;
                console.log("Recording started...");
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Record</span>
            </button>
          </div>
        </div>
        )}

        {/* Core State Reset / Kill Switch */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (window.confirm("Annihilate IndexedDB vault and hard reset?")) {
                indexedDB.deleteDatabase('kinetic-assets');
                window.location.reload();
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/60 text-red-500 border border-red-500/50 py-2 rounded font-bold uppercase tracking-widest text-[9px] transition-colors"
          >
            Core State Reset (Wipe Vault)
          </button>
        </div>

        <ul className="text-[10px] text-neutral-400 space-y-1 opacity-80 font-mono mt-4">
          <li>1. Two-finger twist for quaternion rotation.</li>
          <li>2. Drag to translate space.</li>
          <li>3. Exceed plasticity limit for permanent deformation.</li>
        </ul>
      </div>
      </>
      )}
    </div>
    
    {/* Ghost Protocol Unhide Button */}
    {uiGhostMode && (
      <button
        onClick={() => setUiGhostMode(false)}
        className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-neutral-400 hover:text-white transition-all z-20 shadow-xl"
        title="Restore UI"
      >
        <Eye className="w-5 h-5" />
      </button>
    )}

    <div 
      className={`absolute bottom-4 left-4 right-4 h-24 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl z-10 font-sans flex flex-col justify-center transition-opacity duration-300 ${uiGhostMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
        <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase tracking-widest mb-3">
            <span>Sequence Timeline</span>
            <span className="font-mono text-cyan-400">Frame: {timelineFrame} / 240</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="240" 
          step="1" 
          value={timelineFrame} 
          onChange={(e) => setTimelineFrame(parseInt(e.target.value))} 
          className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-3" 
        />
        <div className="flex gap-3">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button 
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border border-white/10"
              onClick={() => {
                 console.log("Keyframe locked for frame: ", timelineFrame);
              }}
            >
              + KEYFRAME
            </button>
        </div>
    </div>
    </>
  );
}
