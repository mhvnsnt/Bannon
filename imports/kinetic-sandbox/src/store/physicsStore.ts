import { create } from 'zustand';
import * as THREE from 'three';

interface PhysicsState {
  stiffness: number;
  damping: number;
  funnelBaseRadius: number;
  cylinderRadius: number;
  cylinderSoftness: number;
  slapSensitivity: number;
  isDragging: boolean;
  wireframe: boolean;
  uiGhostMode: boolean;
  plasticityLimit: number;
  volumePreservation: number;
  surfaceGrip: number;
  hyperElasticity: number;
  structuralShield: number;
  tearingThreshold: number;
  willpower: number;
  jiggleAmplitude: number;
  panicThreshold: number;
  aggression: number;
  reactionSpeed: number;
  timelineFrame: number;
  isPlaying: boolean;
  setHyperElasticity: (v: number) => void;
  setStructuralShield: (v: number) => void;
  setTearingThreshold: (v: number) => void;
  setWillpower: (v: number) => void;
  setJiggleAmplitude: (v: number) => void;
  setPanicThreshold: (v: number) => void;
  setAggression: (v: number) => void;
  setReactionSpeed: (v: number) => void;
  setTimelineFrame: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  audioDrivenFace: boolean;
  fluidMode: boolean;
  fluidPressure: number;
  fluidViscosity: number;
  setAudioDrivenFace: (v: boolean) => void;
  setFluidMode: (v: boolean) => void;
  setFluidPressure: (v: number) => void;
  setFluidViscosity: (v: number) => void;
  customModelUrl: string | null;
  funnelModels: string[];
  cylinderModels: string[];
  activeFunnelModel: string | null;
  activeCylinderModel: string | null;
  activeTextureUrl: string | null;
  activeFunnelUrl: string | null;
  activeCylinderUrl: string | null;
  funnelsData: {id: string, position: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number], url?: string, isFbx?: boolean, rigidity?: number, jiggleAmplitude?: number}[];
  cylindersData: {id: string, position: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number], url?: string, isFbx?: boolean, rigidity?: number, jiggleAmplitude?: number, isProcedural?: boolean, length?: number, radius?: number}[];
  cylinderRefs: THREE.Group[];
  bones: THREE.Bone[];
  meshes: THREE.Mesh[];
  hiddenMeshes: Set<string>;
  jiggleBones: Set<string>;
  boneTransforms: Record<string, { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }>;
  setStiffness: (v: number) => void;
  setDamping: (v: number) => void;
  setCylinderRadius: (v: number) => void;
  setCylinderSoftness: (v: number) => void;
  setSlapSensitivity: (v: number) => void;
  setIsDragging: (v: boolean) => void;
  setWireframe: (v: boolean) => void;
  setUiGhostMode: (v: boolean) => void;
  setPlasticityLimit: (v: number) => void;
  setVolumePreservation: (v: number) => void;
  setSurfaceGrip: (v: number) => void;
  setCustomModelUrl: (url: string | null) => void;
  setFunnelModels: (models: string[]) => void;
  setCylinderModels: (models: string[]) => void;
  setActiveFunnelModel: (name: string | null) => void;
  setActiveCylinderModel: (name: string | null) => void;
  setActiveFunnelUrl: (url: string | null) => void;
  setActiveCylinderUrl: (url: string | null) => void;
  addFunnels: (count: number) => void;
  addCylinders: (count: number) => void;
  addProceduralCylinder: (length: number, radius: number, rigidity: number) => void;
  updateFunnelTransform: (id: string, transform: { position?: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number], rigidity?: number, jiggleAmplitude?: number }) => void;
  updateCylinderTransform: (id: string, transform: { position?: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number], rigidity?: number, jiggleAmplitude?: number }) => void;
  clearSwarms: () => void;
  setBones: (bones: THREE.Bone[]) => void;
  registerBones: (bones: THREE.Bone[]) => void;
  unregisterBones: (bones: THREE.Bone[]) => void;
  setMeshes: (meshes: THREE.Mesh[]) => void;
  toggleMeshVisibility: (uuid: string) => void;
  toggleJiggleBone: (uuid: string) => void;
  setBoneTransform: (uuid: string, transform: { position?: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number] }) => void;
  applySlap: (worldPoint: THREE.Vector3, velocity: THREE.Vector3) => void;
  registerCylinderRef: (ref: THREE.Group) => void;
  unregisterCylinderRef: (ref: THREE.Group) => void;
  hiveMindWorker: Worker | null;
  physicsTick: number;
  physicsSpeed: number;
  setPhysicsSpeed: (speed: number) => void;
  environmentMode: 'cyberpunk' | 'mono' | 'laboratory';
  setEnvironmentMode: (env: 'cyberpunk' | 'mono' | 'laboratory') => void;
  lightingIntensity: number;
  setLightingIntensity: (intensity: number) => void;
  cameraLocked: boolean;
  setCameraLocked: (locked: boolean) => void;
  enableCylinderControl: boolean;
  setEnableCylinderControl: (enabled: boolean) => void;
  enableFleshInteraction: boolean;
  setEnableFleshInteraction: (enabled: boolean) => void;
  enableForceField: boolean;
  setEnableForceField: (enabled: boolean) => void;
  forceFieldIntensity: number;
  setForceFieldIntensity: (intensity: number) => void;
  pointerWorldPosition: [number, number, number];
  setPointerWorldPosition: (pos: [number, number, number]) => void;
  enableVertexPaintMode: boolean;
  setEnableVertexPaintMode: (enabled: boolean) => void;
  vertexPaintIntensity: number;
  setVertexPaintIntensity: (intensity: number) => void;
  paintedVertices: { [key: number]: THREE.Vector3 };
  addPaintedVertexOffset: (vertexIndex: number, offset: THREE.Vector3) => void;
  clearPaintedVertices: () => void;
  thermalVision: boolean;
  setThermalVision: (enabled: boolean) => void;
  physicsPresets: { [name: string]: any };
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  entityTemperature: number; // 37.0 is normal
  entityOxygen: number; // 1.0 is normal
  entityBloodPressure: number; // 1.0 is normal baseline (scalar)
  entityHeartRate: number; // 60.0 is normal
  setEntityTemperature: (temp: number) => void;
  setEntityOxygen: (ox: number) => void;
  setEntityBloodPressure: (bp: number) => void;
  setEntityHeartRate: (hr: number) => void;
  entityPH: number;
  setEntityPH: (ph: number) => void;
  systemSaturation: number;
  setSystemSaturation: (v: number) => void;
  metabolicHeat: number;
  setMetabolicHeat: (v: number) => void;
  chestVolume: number;
  setChestVolume: (v: number) => void;
  currentStrain: number;
  setCurrentStrain: (v: number) => void;
  fluidVaginalTransudate: number; // 0 to 1
  setFluidVaginalTransudate: (v: number) => void;
  fluidCervicalMucus: number; // 0 to 1
  setFluidCervicalMucus: (v: number) => void;
  fluidBartholinMucus: number; // 0 to 1
  setFluidBartholinMucus: (v: number) => void;
  fluidSkeneEjaculate: number; // 0 to 1
  setFluidSkeneEjaculate: (v: number) => void;
  fluidMenstrual: number; // 0 to 1
  setFluidMenstrual: (v: number) => void;
  fluidSmegma: number; // 0 to 1
  setFluidSmegma: (v: number) => void;
  fluidAnalMucus: number; // 0 to 1
  setFluidAnalMucus: (v: number) => void;
  fluidPerianalSebum: number; // 0 to 1
  setFluidPerianalSebum: (v: number) => void;
  fluidAnalBile: number; // 0 to 1
  setFluidAnalBile: (v: number) => void;
  fluidPurulentDischarge: number; // 0 to 1 (Pus)
  setFluidPurulentDischarge: (v: number) => void;
  fluidInterstitial: number; // 0 to 1 (Swelling/Trauma fluid)
  setFluidInterstitial: (v: number) => void;
  fluidUrethralOutput: number; // 0 to 1
  setFluidUrethralOutput: (v: number) => void;
  fecalMatterType: number; // 1 to 7 (Bristol scale)
  setFecalMatterType: (v: number) => void;
  calculatedFriction: number; 
  setCalculatedFriction: (v: number) => void;
  tissueTrauma: number; // 0.0 to 1.0 (crimson visualization)
  setTissueTrauma: (v: number) => void;
  simulatedEMG: number; // Hz
  setSimulatedEMG: (v: number) => void;
  resetFluidMatrix: () => void;
  temporalAtrophy: number; // 0.0 to 1.0 (1.0 = max atrophy)
  setTemporalAtrophy: (v: number) => void;
  cfuCount: number; // Colony Forming Units
  setCfuCount: (v: number) => void;
  perspirationLevel: number;
  setPerspirationLevel: (v: number) => void;
  lactationVolume: number; // 0.0 to 1.0 (Engorgement)
  setLactationVolume: (v: number) => void;
  oxytocinLevel: number; // 0.0 to 1.0
  setOxytocinLevel: (v: number) => void;
  milkViscosity: number; // 0.0 (Colostrum) to 1.0 (Mature)
  setMilkViscosity: (v: number) => void;
  pupilDilation: number; // 0.0 to 1.0
  setPupilDilation: (v: number) => void;
  scleralVasocongestion: number; // 0.0 to 1.0
  setScleralVasocongestion: (v: number) => void;
  tearProduction: number; // 0.0 to 1.0
  setTearProduction: (v: number) => void;
  salivaryViscosity: number; // 0.0 to 1.0
  setSalivaryViscosity: (v: number) => void;
  hypothalamicClock: number; // 0.0 to 1.0 (Arousal phase scalar)
  setHypothalamicClock: (v: number) => void;
  rippleImpacts: { position: [number, number, number], time: number, intensity: number }[];
  addRippleImpact: (position: [number, number, number], intensity: number) => void;
  smearImpacts: { position: [number, number, number], intensity: number }[];
  addSmearImpact: (position: [number, number, number], intensity: number) => void;
}

const FIXED_TIME_STEP = 1.0 / 120.0;
let physicsLoopInterval: number | null = null;
let lastTime = 0;
let accumulator = 0;

export const startPhysicsLoop = () => {
  if (typeof window === 'undefined') return;
  if (physicsLoopInterval !== null) return;
  
  lastTime = performance.now();
  physicsLoopInterval = window.requestAnimationFrame(function loop(time) {
      physicsLoopInterval = window.requestAnimationFrame(loop);
      const ds = (time - lastTime) / 1000.0;
      lastTime = time;
      
      // Prevent spiral of death if tab is inactive
      accumulator += Math.min(ds, 0.1) * usePhysicsStore.getState().physicsSpeed;
      
      while (accumulator >= FIXED_TIME_STEP) {
          usePhysicsStore.setState((state) => {
              const ds = FIXED_TIME_STEP;
              const velocityProxy = state.isDragging ? 1.5 : 0.1; // Proxy for v

              // Complex Vaginal Physics
              // Transudate sweeps through epithelium based on arousal (hypothalamicClock)
              let newTransudate = state.fluidVaginalTransudate;
              if (state.hypothalamicClock > 0.3) {
                  newTransudate = Math.min(1.0, newTransudate + (state.hypothalamicClock * 0.05 * ds));
              } else {
                  newTransudate = Math.max(0.0, newTransudate - 0.01 * ds);
              }
              
              // Bartholin glands secrete heavy mucus at early and peak arousal to prevent initial tearing
              let newBartholin = state.fluidBartholinMucus;
              if (state.hypothalamicClock > 0.2 && state.hypothalamicClock < 0.6) {
                   newBartholin = Math.min(1.0, newBartholin + 0.1 * ds);
              } else if (state.hypothalamicClock > 0.8) {
                   newBartholin = Math.min(1.0, newBartholin + 0.2 * ds);
              } else {
                   newBartholin = Math.max(0.0, newBartholin - 0.02 * ds);
              }

              // Skene glands (female ejaculate) trigger intensely upon climax or high velocity anterior friction
              let newSkene = state.fluidSkeneEjaculate;
              let newPH = state.entityPH;
              if (state.hypothalamicClock > 0.95 || (velocityProxy > 2.0 && state.calculatedFriction > 0.5)) {
                  newSkene = Math.min(1.0, newSkene + 0.3 * ds);
                  // Alkaline flush raises pH rapidly
                  newPH = Math.min(7.0, newPH + 0.2 * ds);
              } else {
                  newSkene = Math.max(0.0, newSkene - 0.05 * ds); // Washes away quickly
              }

              // Cervical mucus shifts based on hormonal cycle
              let newCervical = Math.max(0.05, state.fluidCervicalMucus - 0.001 * ds);

              // Menstruation (Simulated crash)
              let newMenstruation = state.fluidMenstrual;
              
              // Smegma (constant low secretion to keep out friction)
              let newSmegma = Math.min(1.0, state.fluidSmegma + 0.005 * ds);

              // Fecal/Anal fluid physics
              // Internal anal mucus spikes during peristalsis or deep insertion
              let newAnalMucus = state.fluidAnalMucus;
              if (state.calculatedFriction > 0.5) { 
                   newAnalMucus = Math.min(1.0, newAnalMucus + 0.05 * ds);
              } else {
                   newAnalMucus = Math.max(0.1, newAnalMucus - 0.01 * ds);
              }

              // Perianal Sebum and Sweat spikes during exertion or trauma
              let newSebum = state.fluidPerianalSebum;
              if (state.hypothalamicClock > 0.6 || velocityProxy > 1.0) {
                  newSebum = Math.min(1.0, newSebum + 0.08 * ds);
              }

              let newBile = state.fluidAnalBile;

              // Pathological / Defensive Secretions
              let newPurulent = state.fluidPurulentDischarge;
              if (state.cfuCount > 500) {
                  newPurulent = Math.min(1.0, newPurulent + 0.05 * ds); // Immune response
              } else {
                  newPurulent = Math.max(0.0, newPurulent - 0.01 * ds);
              }

              let trauma = state.tissueTrauma;
              let newInterstitial = state.fluidInterstitial;
              if (trauma > 0.4) {
                  newInterstitial = Math.min(1.0, newInterstitial + (trauma * 0.1 * ds)); // Swelling
              } else {
                  newInterstitial = Math.max(0.0, newInterstitial - 0.02 * ds);
              }

              // Calculate mixed viscosity based ONLY on the dominant present fluids
              const combinedVagViscosity = (newTransudate * 0.1) + (newCervical * 0.4) + (newBartholin * 0.8) + (newSkene * 0.05) + (newSmegma * 0.9) + (newMenstruation * 0.6);
              const totalVagVolume = newTransudate + newCervical + newBartholin + newSkene + newSmegma + newMenstruation;
              
              const combinedAnalViscosity = (newAnalMucus * 0.9) + (newSebum * 0.5) + (newBile * 0.2);
              const totalAnalVolume = newAnalMucus + newSebum + newBile;

              const totalPathosVolume = newPurulent + newInterstitial;
              
              const totalVolume = totalVagVolume + totalAnalVolume + totalPathosVolume + 0.01; 
              
              const averageViscosity = (combinedVagViscosity + combinedAnalViscosity + (newPurulent * 0.8) + (newInterstitial * 0.2)) / totalVolume;
              
              let newFriction = Math.max(0.05, 1.0 - (totalVolume * 0.5));
              newFriction += state.temporalAtrophy * 0.5;
              
              let mu = 0;
              if (averageViscosity < 0.2 && totalVolume > 0.5) {
                  mu = newFriction * (1.0 / (1.0 + velocityProxy));
              } else {
                  mu = newFriction * (1.0 + velocityProxy * 0.5);
              }
              
              if (mu > 1.2) {
                  trauma = Math.min(1.0, trauma + (mu - 1.2) * 0.01);
              }

              const isTearing = mu > 1.2;
              
              // Simulate pH crash if alkaline fluids enter (e.g., anal mucus into vagina proxy)
              let targetPH = 4.5;
              if (newAnalMucus > 0.3 || state.fecalMatterType >= 5) {
                  targetPH = 6.5; 
              } else if (newSkene > 0.5 || state.fluidUrethralOutput > 0.5) {
                  targetPH = 6.0;
              }
              
              newPH = newPH + (targetPH - newPH) * 0.05;

              // Pathogenic Evolution (CFUs)
              // Bacteria multiply exponentially in high pH, high nutrient (transudate) environments
              let newCFU = state.cfuCount;
              if (newPH > 5.5) {
                  newCFU += (newPH - 5.5) * 100 * ds;
              } else if (newPH <= 4.5) {
                  newCFU = Math.max(0, newCFU - 50 * ds); // Acidic baseline kills bacteria
              }

              // Epidermal Sweat (Perspiration) based on friction/heat
              let currentPerspiration = state.perspirationLevel;
              if (mu > 0.5 || state.hypothalamicClock > 0.5) {
                  currentPerspiration = Math.min(1.0, currentPerspiration + ((mu + state.hypothalamicClock) * 0.02 * ds));
              } else {
                  currentPerspiration = Math.max(0.0, currentPerspiration - 0.01 * ds);
              }

              // Simulate body temperature spikes from stress / arousal
              let newTemp = state.entityTemperature;
              if (trauma > 0 || state.hypothalamicClock > 0.6) {
                  newTemp = Math.min(42.0, newTemp + (trauma + state.hypothalamicClock*0.5) * ds);
              }
              // Cooling via sweat
              newTemp = Math.max(34.0, newTemp - currentPerspiration * 2.0 * ds);

              if (isTearing) {
                  trauma = Math.min(1.0, trauma + (0.1 * ds)); 
              } else {
                  trauma = Math.max(0.0, trauma - 0.05 * ds);
              }
              
              // Determine EMG based on trauma and pleasure/friction
              let emg = 15.0 + Math.sin(time * 0.01) * 5.0; // Baseline 10-20 Hz
              if (isTearing || trauma > 0.3) {
                  emg = 100.0 + Math.random() * 20.0; // Pain/splinting reflex
              } else if (state.hypothalamicClock > 0.8) {
                  emg = 80.0 + Math.random() * 40.0; // Myotonia / Orgasm splinting
              }
              
              // Hypothalamic Clock (Arousal Driver)
              let newClock = state.hypothalamicClock;
              if (velocityProxy > 0.5 && mu < 0.8 && !isTearing) {
                  newClock = Math.min(1.0, newClock + 0.05 * ds); // Pleasure climbs
              } else if (isTearing) {
                  newClock = Math.max(0.0, newClock - 0.2 * ds); // Pain kills arousal
              } else {
                  newClock = Math.max(0.0, newClock - 0.02 * ds); // Resolution phase
              }

              return { 
                  physicsTick: state.physicsTick + 1,
                  calculatedFriction: mu,
                  entityPH: newPH,
                  entityTemperature: newTemp,
                  tissueTrauma: trauma,
                  simulatedEMG: emg,
                  cfuCount: newCFU,
                  perspirationLevel: currentPerspiration,
                  hypothalamicClock: newClock,
                  pupilDilation: 0.2 + (newClock * 0.8) + (trauma > 0.5 ? 0.5 : 0.0), // Pupils dilate on arousal or pain
                  scleralVasocongestion: newClock > 0.9 ? 1.0 : (trauma * 1.5),
                  tearProduction: (newClock > 0.95 || trauma > 0.8) ? 1.0 : 0.0,
                  salivaryViscosity: newClock * 1.0, // Sympathetic shift thickens saliva
                  fluidVaginalTransudate: newTransudate,
                  fluidBartholinMucus: newBartholin,
                  fluidSkeneEjaculate: newSkene,
                  fluidCervicalMucus: newCervical,
                  fluidMenstrual: newMenstruation,
                  fluidSmegma: newSmegma,
                  fluidAnalMucus: newAnalMucus,
                  fluidPerianalSebum: newSebum,
                  fluidAnalBile: newBile,
                  fluidPurulentDischarge: newPurulent,
                  fluidInterstitial: newInterstitial
              };
          });
          accumulator -= FIXED_TIME_STEP;
      }
  });
};

export const stopPhysicsLoop = () => {
    if (physicsLoopInterval !== null) {
        window.cancelAnimationFrame(physicsLoopInterval);
        physicsLoopInterval = null;
    }
}

export const usePhysicsStore = create<PhysicsState>((set) => {
  let hiveMindWorker: Worker | null = null;
  if (typeof window !== 'undefined') {
      hiveMindWorker = new Worker(new URL('../workers/hiveMind.worker.ts', import.meta.url), { type: 'module' });
      hiveMindWorker.postMessage({ type: 'INIT_HIVE' });
  }

  return {
  physicsTick: 0,
  stiffness: 0.15, // Structural stiffness
  damping: 0.85, // Velocity damping
  funnelBaseRadius: 1.5,
  cylinderRadius: 1.0,
  cylinderSoftness: 0.0,
  slapSensitivity: 1.0,
  isDragging: false,
  wireframe: false,
  uiGhostMode: false,
  plasticityLimit: 0.5,
  volumePreservation: 0.7,
  surfaceGrip: 0.8,
  hyperElasticity: 0.5,
  structuralShield: 0.5,
  tearingThreshold: 2.5,
  willpower: 0.5,
  jiggleAmplitude: 1.0,
  panicThreshold: 0.5,
  aggression: 0.5,
  reactionSpeed: 0.5,
  timelineFrame: 0,
  isPlaying: false,
  customModelUrl: null,
  funnelModels: [],
  cylinderModels: [],
  activeFunnelModel: null,
  activeCylinderModel: null,
  activeTextureUrl: null,
  activeFunnelUrl: null,
  activeCylinderUrl: null,
  funnelsData: [{id: 'funnel-0', position: [0,0,0]}],
  cylindersData: [{id: 'cylinder-0', position: [0,3,0]}],
  cylinderRefs: [],
  physicsSpeed: 1.0,
  setPhysicsSpeed: (speed) => set({ physicsSpeed: speed }),
  environmentMode: 'cyberpunk',
  setEnvironmentMode: (env) => set({ environmentMode: env }),
  lightingIntensity: 1.0,
  setLightingIntensity: (intensity) => set({ lightingIntensity: intensity }),
  cameraLocked: false,
  setCameraLocked: (locked) => set({ cameraLocked: locked }),
  enableCylinderControl: true,
  setEnableCylinderControl: (enabled) => set({ enableCylinderControl: enabled }),
  enableFleshInteraction: true,
  setEnableFleshInteraction: (enabled) => set({ enableFleshInteraction: enabled }),
  enableForceField: false,
  setEnableForceField: (enabled) => set({ enableForceField: enabled }),
  forceFieldIntensity: 10.0,
  setForceFieldIntensity: (intensity) => set({ forceFieldIntensity: intensity }),
  pointerWorldPosition: [0, 0, 0],
  setPointerWorldPosition: (pos) => set({ pointerWorldPosition: pos }),
  enableVertexPaintMode: false,
  setEnableVertexPaintMode: (enabled) => set({ enableVertexPaintMode: enabled }),
  vertexPaintIntensity: 1.0,
  setVertexPaintIntensity: (intensity) => set({ vertexPaintIntensity: intensity }),
  paintedVertices: {},
  addPaintedVertexOffset: (idx, offset) => set((state) => {
      const current = state.paintedVertices[idx] || new THREE.Vector3();
      return { paintedVertices: { ...state.paintedVertices, [idx]: current.clone().add(offset) } };
  }),
  clearPaintedVertices: () => set({ paintedVertices: {} }),
  physicsPresets: {
      'Default': { physicsSpeed: 1.0, jiggleAmplitude: 1.0, environmentMode: 'cyberpunk', lightingIntensity: 1.0, fluidMode: false, stiffness: 0.15, damping: 0.85 },
      'SlowMo Sludge': { physicsSpeed: 0.2, jiggleAmplitude: 3.0, environmentMode: 'laboratory', lightingIntensity: 2.0, fluidMode: true, stiffness: 0.05, damping: 0.95 },
      'Hyper Jello': { physicsSpeed: 2.0, jiggleAmplitude: 5.0, environmentMode: 'mono', lightingIntensity: 1.5, fluidMode: false, stiffness: 0.5, damping: 0.6 }
  },
  savePreset: (name) => set((state) => ({
      physicsPresets: {
          ...state.physicsPresets,
          [name]: {
              physicsSpeed: state.physicsSpeed,
              jiggleAmplitude: state.jiggleAmplitude,
              environmentMode: state.environmentMode,
              lightingIntensity: state.lightingIntensity,
              fluidMode: state.fluidMode,
              stiffness: state.stiffness,
              damping: state.damping
          }
      }
  })),
  loadPreset: (name) => set((state) => {
      const p = state.physicsPresets[name];
      if (p) {
          return { ...p };
      }
      return {};
  }),
  entityTemperature: 37.0,
  entityOxygen: 1.0,
  entityBloodPressure: 1.0,
  entityHeartRate: 60.0,
  entityPH: 4.5,
  systemSaturation: 0.0,
  metabolicHeat: 37.0,
  chestVolume: 1.0,
  currentStrain: 0.0,
  fluidVaginalTransudate: 0.1,
  fluidCervicalMucus: 0.05,
  fluidBartholinMucus: 0.0,
  fluidSkeneEjaculate: 0.0,
  fluidMenstrual: 0.0,
  fluidSmegma: 0.1,
  fluidAnalMucus: 0.1,
  fluidPerianalSebum: 0.05,
  fluidAnalBile: 0.0,
  fluidPurulentDischarge: 0.0,
  fluidInterstitial: 0.0,
  fluidUrethralOutput: 0.0,
  fecalMatterType: 4,
  calculatedFriction: 0.4,
  tissueTrauma: 0.0,
  setEntityTemperature: (temp) => set({ entityTemperature: temp }),
  setEntityOxygen: (ox) => set({ entityOxygen: ox }),
  setEntityBloodPressure: (bp) => set({ entityBloodPressure: bp }),
  setEntityHeartRate: (hr) => set({ entityHeartRate: hr }),
  setSystemSaturation: (v) => set({ systemSaturation: v }),
  setMetabolicHeat: (v) => set({ metabolicHeat: v }),
  setChestVolume: (v) => set({ chestVolume: v }),
  setCurrentStrain: (v) => set({ currentStrain: v }),
  setEntityPH: (ph) => set({ entityPH: ph }),
  setFluidVaginalTransudate: (v) => set({ fluidVaginalTransudate: v }),
  setFluidCervicalMucus: (v) => set({ fluidCervicalMucus: v }),
  setFluidBartholinMucus: (v) => set({ fluidBartholinMucus: v }),
  setFluidSkeneEjaculate: (v) => set({ fluidSkeneEjaculate: v }),
  setFluidMenstrual: (v) => set({ fluidMenstrual: v }),
  setFluidSmegma: (v) => set({ fluidSmegma: v }),
  setFluidAnalMucus: (v) => set({ fluidAnalMucus: v }),
  setFluidPerianalSebum: (v) => set({ fluidPerianalSebum: v }),
  setFluidAnalBile: (v) => set({ fluidAnalBile: v }),
  setFluidPurulentDischarge: (v) => set({ fluidPurulentDischarge: v }),
  setFluidInterstitial: (v) => set({ fluidInterstitial: v }),
  setFluidUrethralOutput: (v) => set({ fluidUrethralOutput: v }),
  setFecalMatterType: (v) => set({ fecalMatterType: v }),
  setCalculatedFriction: (v) => set({ calculatedFriction: v }),
  setTissueTrauma: (v) => set({ tissueTrauma: v }),
  simulatedEMG: 12.0,
  setSimulatedEMG: (v) => set({ simulatedEMG: v }),
  resetFluidMatrix: () => set({
      fluidVaginalTransudate: 0.1,
      fluidCervicalMucus: 0.05,
      fluidBartholinMucus: 0.0,
      fluidSkeneEjaculate: 0.0,
      fluidMenstrual: 0.0,
      fluidSmegma: 0.1,
      fluidAnalMucus: 0.1,
      fluidPerianalSebum: 0.05,
      fluidAnalBile: 0.0,
      fluidPurulentDischarge: 0.0,
      fluidInterstitial: 0.0,
      fluidUrethralOutput: 0.0,
      fecalMatterType: 4,
      entityPH: 4.5,
      tissueTrauma: 0.0,
      calculatedFriction: 0.01 // Base reset calculation takes over later
  }),
  temporalAtrophy: 0.0,
  setTemporalAtrophy: (v) => set({ temporalAtrophy: v }),
  cfuCount: 0,
  setCfuCount: (v) => set({ cfuCount: v }),
  perspirationLevel: 0.0,
  setPerspirationLevel: (v) => set({ perspirationLevel: v }),
  thermalVision: false,
  setThermalVision: (v) => set({ thermalVision: v }),
  lactationVolume: 0.0,
  setLactationVolume: (v) => set({ lactationVolume: v }),
  oxytocinLevel: 0.0,
  setOxytocinLevel: (v) => set({ oxytocinLevel: v }),
  milkViscosity: 1.0,
  setMilkViscosity: (v) => set({ milkViscosity: v }),
  pupilDilation: 0.2,
  setPupilDilation: (v) => set({ pupilDilation: v }),
  scleralVasocongestion: 0.0,
  setScleralVasocongestion: (v) => set({ scleralVasocongestion: v }),
  tearProduction: 0.0,
  setTearProduction: (v) => set({ tearProduction: v }),
  salivaryViscosity: 0.1,
  setSalivaryViscosity: (v) => set({ salivaryViscosity: v }),
  hypothalamicClock: 0.0,
  setHypothalamicClock: (v) => set({ hypothalamicClock: v }),
  rippleImpacts: [] as { position: [number, number, number], time: number, intensity: number }[],
  addRippleImpact: (position, intensity) => {
      const state = usePhysicsStore.getState();
      const now = state.physicsTick;
      state.rippleImpacts.push({ position, time: now, intensity });
      if (state.rippleImpacts.length > 5) {
          state.rippleImpacts.shift();
      }
  },
  smearImpacts: [] as { position: [number, number, number], intensity: number }[],
  addSmearImpact: (position, intensity) => {
      const state = usePhysicsStore.getState();
      // Only keep the most recent smears, or manage fade-out
      state.smearImpacts.push({ position, intensity });
      if (state.smearImpacts.length > 10) {
          state.smearImpacts.shift(); // Remove oldest
      }
      set({ smearImpacts: [...state.smearImpacts] }); // trigger slight update
  },
  bones: [],
  meshes: [],
  hiddenMeshes: new Set(),
  jiggleBones: new Set(),
  boneTransforms: {},
  registerCylinderRef: (ref) => set((state) => ({ cylinderRefs: [...state.cylinderRefs, ref] })),
  unregisterCylinderRef: (ref) => set((state) => ({ cylinderRefs: state.cylinderRefs.filter(r => r !== ref) })),
  applySlap: (worldPoint, velocity) => set((state) => {
      state.bones.forEach(bone => {
          if (!state.jiggleBones.has(bone.uuid)) return;
          const bonePos = new THREE.Vector3();
          bone.getWorldPosition(bonePos);
          const dist = bonePos.distanceTo(worldPoint);
          
          if (dist < 3.0) { // Push radius
              let localForce = velocity.clone().multiplyScalar(1.0 / (dist + 0.1));
              
              if (bone.parent) {
                  const parentInverse = new THREE.Matrix4().copy(bone.parent.matrixWorld).invert();
                  // Apply only rotation/scaling for a velocity vector, not translation
                  localForce = localForce.transformDirection(parentInverse);
              }
              
              if (!bone.userData.slapVelocity) bone.userData.slapVelocity = new THREE.Vector3();
              (bone.userData.slapVelocity as THREE.Vector3).add(localForce);
          }
      });
      return {};
  }),
  setHyperElasticity: (hyperElasticity) => set({ hyperElasticity }),
  setStructuralShield: (structuralShield) => set({ structuralShield }),
  setTearingThreshold: (tearingThreshold) => set({ tearingThreshold }),
  setWillpower: (willpower) => set({ willpower }),
  setJiggleAmplitude: (jiggleAmplitude) => set({ jiggleAmplitude }),
  setPanicThreshold: (panicThreshold) => set({ panicThreshold }),
  setAggression: (aggression) => set({ aggression }),
  setReactionSpeed: (reactionSpeed) => set({ reactionSpeed }),
  setTimelineFrame: (timelineFrame) => set({ timelineFrame }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  audioDrivenFace: false,
  fluidMode: false,
  fluidPressure: 5.0,
  fluidViscosity: 0.1,
  setAudioDrivenFace: (v) => set({ audioDrivenFace: v }),
  setFluidMode: (v) => set({ fluidMode: v }),
  setFluidPressure: (v) => set({ fluidPressure: v }),
  setFluidViscosity: (v) => set({ fluidViscosity: v }),
  setStiffness: (stiffness) => set({ stiffness }),
  setDamping: (damping) => set({ damping }),
  setCylinderRadius: (cylinderRadius) => set({ cylinderRadius }),
  setCylinderSoftness: (cylinderSoftness) => set({ cylinderSoftness }),
  setSlapSensitivity: (slapSensitivity) => set({ slapSensitivity }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setWireframe: (wireframe) => set({ wireframe }),
  setUiGhostMode: (uiGhostMode) => set({ uiGhostMode }),
  setPlasticityLimit: (plasticityLimit) => set({ plasticityLimit }),
  setVolumePreservation: (volumePreservation) => set({ volumePreservation }),
  setSurfaceGrip: (surfaceGrip) => set({ surfaceGrip }),
  setCustomModelUrl: (customModelUrl) => set({ customModelUrl }),
  setFunnelModels: (funnelModels) => set({ funnelModels }),
  setCylinderModels: (cylinderModels) => set({ cylinderModels }),
  setActiveFunnelModel: (activeFunnelModel) => set({ activeFunnelModel }),
  setActiveCylinderModel: (activeCylinderModel) => set({ activeCylinderModel }),
  setActiveFunnelUrl: (activeFunnelUrl) => set({ activeFunnelUrl }),
  setActiveCylinderUrl: (activeCylinderUrl) => set({ activeCylinderUrl }),
  addFunnels: (count: number) => set((state) => {
    const newFunnels = [...state.funnelsData];
    const isFbx = state.activeFunnelModel?.toLowerCase().endsWith('.fbx');
    for(let i=0; i<count; i++) {
        newFunnels.push({ id: `funnel-${Date.now()}-${i}`, position: [Math.random() * 10 - 5, 0, Math.random() * 10 - 5], url: state.activeFunnelUrl || undefined, isFbx });
    }
    return { funnelsData: newFunnels };
  }),
  addCylinders: (count: number) => set((state) => {
    const newCylinders = [...state.cylindersData];
    const isFbx = state.activeCylinderModel?.toLowerCase().endsWith('.fbx');
    for(let i=0; i<count; i++) {
        newCylinders.push({ id: `cylinder-${Date.now()}-${i}`, position: [Math.random() * 8 - 4, 10 + Math.random() * 20, Math.random() * 8 - 4], url: state.activeCylinderUrl || undefined, isFbx });
    }
    return { cylindersData: newCylinders };
  }),
  addProceduralCylinder: (length, radius, rigidity) => set((state) => {
    const newCylinders = [...state.cylindersData];
    newCylinders.push({ 
        id: `cylinder-proc-${Date.now()}`, 
        position: [0, length / 2 + 2, 0], 
        isProcedural: true,
        length,
        radius,
        rigidity,
        jiggleAmplitude: rigidity < 0.5 ? (0.5 - rigidity) * 2 : 0 
    });
    return { cylindersData: newCylinders };
  }),
  updateFunnelTransform: (id, transform) => set((state) => {
      const idx = state.funnelsData.findIndex(f => f.id === id);
      if (idx === -1) return {};
      const next = [...state.funnelsData];
      next[idx] = { ...next[idx], ...transform };
      return { funnelsData: next };
  }),
  updateCylinderTransform: (id, transform) => set((state) => {
      const idx = state.cylindersData.findIndex(c => c.id === id);
      if (idx === -1) return {};
      const next = [...state.cylindersData];
      next[idx] = { ...next[idx], ...transform };
      return { cylindersData: next };
  }),
  clearSwarms: () => set({ funnelsData: [], cylindersData: [] }),
  setBones: (bones) => set({ bones }),
  registerBones: (newBones) => set((state) => {
    const existing = new Set(state.bones.map(b => b.uuid));
    const unique = newBones.filter(b => !existing.has(b.uuid));
    return { bones: [...state.bones, ...unique] };
  }),
  unregisterBones: (removedBones) => set((state) => {
    const removedIds = new Set(removedBones.map(b => b.uuid));
    return { bones: state.bones.filter(b => !removedIds.has(b.uuid)) };
  }),
  setMeshes: (meshes) => set({ meshes }),
  toggleMeshVisibility: (uuid) => set((state) => {
    const next = new Set(state.hiddenMeshes);
    if (next.has(uuid)) next.delete(uuid);
    else next.add(uuid);
    return { hiddenMeshes: next };
  }),
  toggleJiggleBone: (uuid) => set((state) => {
    const next = new Set(state.jiggleBones);
    if (next.has(uuid)) next.delete(uuid);
    else next.add(uuid);
    return { jiggleBones: next };
  }),
  setBoneTransform: (uuid, transform) => set((state) => {
      const current = state.boneTransforms[uuid] || { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] };
      return { 
          boneTransforms: { 
              ...state.boneTransforms, 
              [uuid]: { ...current, ...transform } 
          } 
      };
  }),
  hiveMindWorker
  };
});

startPhysicsLoop();
