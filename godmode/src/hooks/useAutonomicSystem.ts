import { useState, useEffect, useRef } from 'react';

export interface AutonomicMetrics {
  systemSaturation: number;
  metabolicHeat: number;
  chestVolume: number;
  currentStrain: number;
}

export const useAutonomicSystem = (baseIntensity: number = 50, active: boolean = true) => {
  const [metrics, setMetrics] = useState<AutonomicMetrics>({
    systemSaturation: 0,
    metabolicHeat: 37.0, // base body temp
    chestVolume: 1.0,
    currentStrain: 0,
  });

  const [history, setHistory] = useState<{ time: string; systemSaturation: number }[]>([]);
  
  const timeRef = useRef(0);
  
  useEffect(() => {
    if (!active) return;

    const TICK_RATE = 100; // ms
    const interval = setInterval(() => {
      timeRef.current += TICK_RATE / 1000;
      
      setMetrics(prev => {
        // Target saturation based on intensity
        const targetSaturation = (baseIntensity / 100);
        // Exponential approach for saturation
        let nextSaturation = prev.systemSaturation + (targetSaturation - prev.systemSaturation) * 0.05;
        
        // Strain is highly correlated to the rate of change of saturation + base level
        let newStrain = nextSaturation * 100 + (Math.random() * 5 - 2.5);
        
        // Metabolic heat rises with strain and saturation
        let nextHeat = 37.0 + (nextSaturation * 2.5);
        
        // Chest volume simulates rhythmic breathing, frequency depends on strain
        const breathFrequency = 1.0 + (newStrain / 50.0); 
        const nextChestVol = 1.0 + Math.sin(timeRef.current * breathFrequency * Math.PI) * 0.15 * nextSaturation;
        
        setHistory(h => {
             const updated = [...h, { 
                time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }), 
                systemSaturation: nextSaturation * 100 
             }];
             if (updated.length > 50) updated.shift();
             return updated;
        });

        return {
          systemSaturation: nextSaturation,
          metabolicHeat: nextHeat,
          currentStrain: newStrain,
          chestVolume: nextChestVol,
        };
      });
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [baseIntensity, active]);

  return { metrics, history };
};
