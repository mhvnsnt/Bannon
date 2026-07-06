import { create } from 'zustand';

interface GodModeState {
    bassAvg: number;
    formForce: number;
    kineticVelocity: number;
    currentStage: number;
    glyphScale: number;
    setKineticImpact: (velocity: number) => void;
    setAudioPulse: (bass: number) => void;
    advanceStage: (stage: number) => void;
}

export const useGodModeStore = create<GodModeState>((set) => ({
    bassAvg: 0,
    formForce: 0,
    kineticVelocity: 0,
    currentStage: 0,
    glyphScale: 1.0,
    setKineticImpact: (velocity) => set({ kineticVelocity: velocity }),
    setAudioPulse: (bass) => set({ bassAvg: bass }),
    advanceStage: (stage) => set({ currentStage: stage })
}));
