import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';

interface LoadingSpinnerProps {
  isProcessing: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isProcessing }) => {
  const { active, progress, total, loaded } = useProgress();
  const [forceClose, setForceClose] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    let forceOpenTimeoutId: number;
    if (active || isProcessing) {
      setForceClose(false);
      // Auto-dismiss if stuck for more than 12 seconds
      timeoutId = window.setTimeout(() => {
        setForceClose(true);
        // Attempt to clean up Three.js loading manager
        try {
            (THREE.DefaultLoadingManager as any).isLoading = false;
        } catch(e) {}
      }, 12000);
    }
    return () => {
        clearTimeout(timeoutId);
    };
  }, [active, isProcessing, loaded, total]);

  if ((!isProcessing && !active) || forceClose) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-auto">
      <button 
        onClick={() => {
           setForceClose(true);
           // Attempt to unstuck THREE.DefaultLoadingManager if needed
           try {
               // three's internal loading manager sometimes gets stuck if item counts desync
               (THREE.DefaultLoadingManager as any).isLoading = false;
               (THREE.DefaultLoadingManager as any).itemsLoaded = 0;
               (THREE.DefaultLoadingManager as any).itemsTotal = 0;
           } catch(e) {}
        }} 
        className="absolute top-4 right-4 text-white hover:text-red-500 bg-neutral-800 p-2 rounded-full cursor-pointer z-[101]"
      >
        <X size={24} />
      </button>
      <Loader2 className="w-16 h-16 animate-spin text-white mb-4" />
      <div className="text-sm font-medium tracking-wide">
        {active ? 'Loading...' : 'Processing...'}
      </div>
      {active && total > 0 && (
        <div className="text-xs text-neutral-400 mt-2">
          {loaded} / {total} files ({progress.toFixed(0)}%)
        </div>
      )}
      <div className="mt-4 w-48 h-1 bg-neutral-800 rounded-full overflow-hidden">
         <div className="h-full bg-neutral-200 transition-all duration-300" style={{ width: `${active ? progress : 100}%` }}></div>
      </div>
      <div className="text-[10px] text-neutral-500 mt-8 absolute bottom-8">
         If this takes too long, you can dismiss it using the X button. 
      </div>
    </div>
  );
};
