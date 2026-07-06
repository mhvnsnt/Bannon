import { create } from 'zustand';

interface CoreBlueprintState {
  stage: number;
  sens: number;
  turb: number;
  glow: number;
  manualForm: number;
  balanceMat: number;
  glyphScale: number;
  glyph: string;
  activeCount: number;
  
  // Frequency Variables
  bassAvg: number;
  formForce: number;
  stageBlend: number;
  
  // Custom user shape points
  customSigilPoints: { x: number, y: number }[];

  // Update actions
  setPhysicsVar: (key: keyof CoreBlueprintState, value: any) => void;
  loadTrackWorld: (d: Partial<CoreBlueprintState>) => void;
  setCustomSigilPoints: (points: { x: number, y: number }[]) => void;
}

export const useCoreBlueprint = create<CoreBlueprintState>((set) => ({
  stage: 0,
  sens: 0.5,
  turb: 0.2,
  glow: 0.8,
  manualForm: 0.5,
  balanceMat: 0.5,
  glyphScale: 1.0,
  glyph: 'default',
  activeCount: 1000,
  
  bassAvg: 0,
  formForce: 0,
  stageBlend: 0,

  customSigilPoints: [],

  setPhysicsVar: (key, value) => set((state) => ({ ...state, [key]: value })),
  loadTrackWorld: (d) => set((state) => ({ ...state, ...d })),
  setCustomSigilPoints: (points) => set({ customSigilPoints: points }),
}));
