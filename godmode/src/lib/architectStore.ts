import { create } from 'zustand';

interface ArchitectState {
  wealthGoals: { id: string; name: string; target: number; current: number; }[];
  relationshipInsights: string[];
  primeDirectives: { id: string; name: string; complete: boolean; }[];
  addWealthGoal: (goal: { name: string; target: number; }) => void;
  updateWealthCurrent: (id: string, amount: number) => void;
  addRelationshipInsight: (insight: string) => void;
  addPrimeDirective: (directive: { name: string; }) => void;
  togglePrimeDirective: (id: string) => void;
}

export const useArchitectStore = create<ArchitectState>((set) => ({
  wealthGoals: [
    { id: 'wg1', name: 'Establish Prime Income Stream', target: 50000, current: 15000 },
    { id: 'wg2', name: 'Harden Investment Grid', target: 100000, current: 30000 },
  ],
  relationshipInsights: [
    'Mastering the Articulation of Intent: Clarity bends perception.',
    'The Reciprocal Gravity Principle: Value extended, value received.',
    'Decoding Non-Verbal Flux: Subtlety reveals prime vectors.',
  ],
  primeDirectives: [
    { id: 'pd1', name: 'Map Dooly County Gravity Vectors', complete: false },
    { id: 'pd2', name: 'Engineer Personal Influence Engine', complete: true },
  ],
  addWealthGoal: (goal) => set((state) => ({
    wealthGoals: [...state.wealthGoals, { ...goal, id: `wg${state.wealthGoals.length + 1}`, current: 0 }],
  })),
  updateWealthCurrent: (id, amount) => set((state) => ({
    wealthGoals: state.wealthGoals.map((g) => g.id === id ? { ...g, current: amount } : g),
  })),
  addRelationshipInsight: (insight) => set((state) => ({
    relationshipInsights: [...state.relationshipInsights, insight],
  })),
  addPrimeDirective: (directive) => set((state) => ({
    primeDirectives: [...state.primeDirectives, { ...directive, id: `pd${state.primeDirectives.length + 1}`, complete: false }],
  })),
  togglePrimeDirective: (id) => set((state) => ({
    primeDirectives: state.primeDirectives.map((d) => d.id === id ? { ...d, complete: !d.complete } : d),
  })),
}));
