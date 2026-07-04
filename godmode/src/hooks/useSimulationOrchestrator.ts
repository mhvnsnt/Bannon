import { useEffect, useRef, useState } from 'react';
import { ChemicalProxyEngine } from '../lib/proxyDispersion';
import { calculateBehavioralOutput } from '../lib/logicEngine';
import { useProceduralAudio } from './useProceduralAudio';
import { useAutonomicSystem, AutonomicMetrics } from './useAutonomicSystem';

export const useSimulationOrchestrator = (
  nodeId: string, 
  active: boolean, 
  externalMetrics?: AutonomicMetrics
) => {
  const [dopamineState, setDopamineState] = useState(0);
  const engineRef = useRef(new ChemicalProxyEngine(0.05, 0.2));
  
  // Instantiates local autonomic stress metrics if external is not supplied
  const { metrics: internalMetrics } = useAutonomicSystem(50, active && !externalMetrics);
  const metrics = externalMetrics || internalMetrics;

  // Pipe chestVolume, currentStrain, and autonomicSaturation (systemSaturation) variables 
  // to drive pitch and amplitude of synthesized gasps and respiratory sounds in real time
  useProceduralAudio(metrics, active);
  
  useEffect(() => {
    if (!active) return;
    const TICK_RATE_MS = 100;
    
    const interval = setInterval(() => {
      const currentDopamine = engineRef.current.calculateCurrentState(TICK_RATE_MS / 1000);
      setDopamineState(currentDopamine);

      calculateBehavioralOutput([{ intensity: currentDopamine, receptivityWeight: 0.8 }], TICK_RATE_MS / 1000, 0.5);
    }, TICK_RATE_MS);

    return () => clearInterval(interval);
  }, [nodeId, active]);

  return { 
    dopamineState, 
    metrics, 
    injectDopamine: (amt: number) => engineRef.current.injectProxy(amt) 
  };
};
