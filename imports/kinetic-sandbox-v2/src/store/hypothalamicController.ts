import { create } from 'zustand';

export interface HypothalamicState {
    hormonalCyclePhase: number; // 0 to 1
    setHormonalCyclePhase: (v: number) => void;
    resolutionPhaseActive: boolean;
    setResolutionPhaseActive: (v: boolean) => void;
    triggerMuscularReset: () => void;
    triggerOcularReset: () => void;
}

export const useHypothalamicStore = create<HypothalamicState>((set) => ({
    hormonalCyclePhase: 0.5,
    setHormonalCyclePhase: (v) => set({ hormonalCyclePhase: Math.max(0, Math.min(1, v)) }),
    resolutionPhaseActive: false,
    setResolutionPhaseActive: (v) => set({ resolutionPhaseActive: v }),
    triggerMuscularReset: () => {
        // In a real expanded app, this could dispatch complex events.
        // For now, it signals a systemic release of muscle tension.
        const event = new CustomEvent('biological_muscular_reset');
        window.dispatchEvent(event);
    },
    triggerOcularReset: () => {
        // Resets pupil dilation and tear production spikes
        const event = new CustomEvent('biological_ocular_reset');
        window.dispatchEvent(event);
    }
}));
