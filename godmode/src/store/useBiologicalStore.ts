import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NeurochemicalLevels {
    dopamine: number; // Reward, Motivation, Focus (0-100)
    serotonin: number; // Satisfaction, Confidence, Rest (0-100)
    norepinephrine: number; // Arousal, Alertness, Stress (0-100)
    acetylcholine: number; // Learning, Myelination, Neuroplasticity (0-100)
    gaba: number; // Inhibition, Calm, Amygdala damping (0-100)
}

interface BiologicalState {
    neurochemicals: NeurochemicalLevels;
    myelinDensity: number; // Global structural integration multiplier
    dailyYieldHistory: { date: string; yield: number }[];
    totalJoulesConserved: number;
    
    // Actions
    triggerDopamineSpike: (amount: number) => void;
    triggerAdrenaline: (amount: number) => void;
    dampenAmygdala: (gabaIncrease: number) => void;
    buildMyelin: (amount: number) => void;
    addJoulesConserved: (amount: number) => void;
    decayChemicals: () => void;
}

export const useBiologicalStore = create<BiologicalState>()(
    persist(
        (set) => ({
            neurochemicals: {
                dopamine: 50,
                serotonin: 50,
                norepinephrine: 30,
                acetylcholine: 20,
                gaba: 50,
            },
            myelinDensity: 1.0,
            dailyYieldHistory: [],
            totalJoulesConserved: 0,

            triggerDopamineSpike: (amount) => set((state) => ({
                neurochemicals: { 
                    ...state.neurochemicals, 
                    dopamine: Math.min(100, state.neurochemicals.dopamine + amount),
                    // High dopamine temporarily suppresses serotonin and pushes up norepinephrine
                    norepinephrine: Math.min(100, state.neurochemicals.norepinephrine + amount * 0.5)
                }
            })),
            
            triggerAdrenaline: (amount) => set((state) => ({
                neurochemicals: {
                    ...state.neurochemicals,
                    norepinephrine: Math.min(100, state.neurochemicals.norepinephrine + amount),
                    gaba: Math.max(0, state.neurochemicals.gaba - amount * 0.5) // Stress kills calm
                }
            })),

            dampenAmygdala: (gabaIncrease) => set((state) => ({
                neurochemicals: {
                    ...state.neurochemicals,
                    gaba: Math.min(100, state.neurochemicals.gaba + gabaIncrease),
                    norepinephrine: Math.max(0, state.neurochemicals.norepinephrine - gabaIncrease * 0.8) // Calm kills stress
                }
            })),

            buildMyelin: (amount) => set((state) => ({
                neurochemicals: {
                    ...state.neurochemicals,
                    acetylcholine: Math.min(100, state.neurochemicals.acetylcholine + amount)
                },
                myelinDensity: state.myelinDensity + (amount * 0.01)
            })),

            addJoulesConserved: (amount) => set((state) => ({
                totalJoulesConserved: state.totalJoulesConserved + amount
            })),

            // Call periodically to simulate biological half-life
            decayChemicals: () => set((state) => ({
                neurochemicals: {
                    dopamine: Math.max(20, state.neurochemicals.dopamine * 0.95), // Drops rapidly
                    serotonin: Math.max(40, state.neurochemicals.serotonin * 0.99), // Stable
                    norepinephrine: Math.max(20, state.neurochemicals.norepinephrine * 0.90), // Very fast clearance
                    acetylcholine: Math.max(10, state.neurochemicals.acetylcholine * 0.98), // Slower
                    gaba: Math.max(30, state.neurochemicals.gaba * 0.97),
                }
            }))
        }),
        {
            name: 'biological-override-state',
        }
    )
);
