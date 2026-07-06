import { create } from 'zustand';
import { ArmadaNode, ModelProvider, PROVIDERS } from '../types';
import { safeStorage } from './safeStorage';

interface PrimeState {
    // Blast Shield
    isBlastShieldActive: boolean;
    setBlastShield: (active: boolean) => void;
    
    // Core Physics Bounds
    glassWidth: number;
    setGlassWidth: (w: number) => void;
    
    // Global Model Routing
    activeNode: ArmadaNode;
    setActiveNode: (node: ArmadaNode) => void;
    activeProvider: ModelProvider;
    setActiveProvider: (provider: ModelProvider | string) => void;
    activeModelString: string | null;
    setActiveModelString: (model: string | null) => void;
    
    // OpenRouter Key
    openRouterApiKey: string;
    setOpenRouterApiKey: (key: string) => void;
    
    // Grid Queue for dropping kinetic strikes while offline
    offlineQueue: { id: string, action: string, payload: any, timestamp: number }[];
    pushToQueue: (action: string, payload: any) => void;
    flushQueue: () => void;
    
    // Temporal Matrix Sync
    lastSyncTime: number | null;
    updateSyncTime: (time: number) => void;

    // Fable 5 / Mythos 5 Daemon Insight
    daemonInsight: string | null;
    setDaemonInsight: (insight: string | null) => void;

    // Shared Forge Workspace Files System State
    projectFiles: Record<string, string>;
    setProjectFiles: (files: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    projectTemplate: "react-ts" | "vanilla-ts" | "vanilla" | "react";
    setProjectTemplate: (template: "react-ts" | "vanilla-ts" | "vanilla" | "react") => void;
    projectDeps: Record<string, string>;
    setProjectDeps: (deps: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export const usePrimeStore = create<PrimeState>((set) => ({
    isBlastShieldActive: false,
    setBlastShield: (active) => set({ isBlastShieldActive: active }),
    
    glassWidth: typeof window !== 'undefined' ? window.innerWidth : 1000,
    setGlassWidth: (w) => set({ glassWidth: w }),

    activeNode: 'Apex-Core',
    setActiveNode: (node) => set({ activeNode: node }),
    activeProvider: PROVIDERS[0],
    activeModelString: PROVIDERS[0].models ? PROVIDERS[0].models[0] : null,
    setActiveProvider: (provider) => {
       if (typeof provider === 'string') {
          const found = PROVIDERS.find(p => p.id === provider);
          if (found) set({ activeProvider: found, activeModelString: found.models ? found.models[0] : null });
       } else {
          set({ activeProvider: provider, activeModelString: provider.models ? provider.models[0] : null });
       }
    },
    setActiveModelString: (model) => set({ activeModelString: model }),
    
    openRouterApiKey: safeStorage.getItem('OPENROUTER_API_KEY') || '',
    setOpenRouterApiKey: (key) => {
        safeStorage.setItem('OPENROUTER_API_KEY', key);
        set({ openRouterApiKey: key });
    },
    
    offlineQueue: [],
    pushToQueue: (action, payload) => set((state) => ({ 
         offlineQueue: [...state.offlineQueue, {
            id: crypto.randomUUID(), 
            action, 
            payload, 
            timestamp: Date.now() 
        }]
    })),
    flushQueue: () => set({ offlineQueue: [] }),
    
    lastSyncTime: null,
    updateSyncTime: (time) => set({ lastSyncTime: time }),

    daemonInsight: null,
    setDaemonInsight: (insight) => set({ daemonInsight: insight }),

    // Initial Shared Workspace Files
    projectFiles: {
      "/App.tsx": `import React from 'react';

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
        Forge Runtime Core
      </h1>
      <p className="mt-4 text-zinc-400 text-sm font-mono">Awaiting instructions...</p>
    </div>
  );
}`,
      "/styles.css": "body { margin: 0; font-family: sans-serif; background: #111; color: white; }",
      "/public/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
    },
    setProjectFiles: (files) => set((state) => ({
      projectFiles: typeof files === 'function' ? files(state.projectFiles) : files
    })),
    projectTemplate: "react-ts",
    setProjectTemplate: (template) => set({ projectTemplate: template }),
    projectDeps: { "lucide-react": "latest", "framer-motion": "latest" },
    setProjectDeps: (deps) => set((state) => ({
      projectDeps: typeof deps === 'function' ? deps(state.projectDeps) : deps
    }))
}));
