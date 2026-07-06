import React, { useState, useEffect, useRef } from 'react';
import { Settings, Sliders, Activity, Eye, Zap, Wind } from 'lucide-react';
import { AcousticEntrainmentSchemas, PhotonicGeometrySchemas, AtmosphericSchemas, SomatosensorySchemas } from '../lib/CoreBlueprintData';
import { syncSimulationState } from '../lib/persistence';
import { AudioStimulusEngine } from '../lib/audioEngine';
import { PhotonicMatrix } from './PhotonicMatrix';
import { TelemetryGrid } from './TelemetryGrid';

import { AutonomicGraph } from './AutonomicGraph';
// import { DungeonCanvas } from './DungeonCanvas';
import { CommandMatrix } from './CommandMatrix';
import { useAutonomicSystem } from '../hooks/useAutonomicSystem';
import { useProceduralAudio } from '../hooks/useProceduralAudio';

export default function EnvironmentalControls() {
  const [activeAcoustic, setActiveAcoustic] = useState<string | null>(null);
  const [activePhotonic, setActivePhotonic] = useState<string | null>(null);
  const [activeAtmospheric, setActiveAtmospheric] = useState<string | null>(null);

  const [colorTemperature, setColorTemperature] = useState<number>(6500);
  const [flickerRate, setFlickerRate] = useState<number>(60);
  const [stimuliIntensity, setStimuliIntensity] = useState<number>(50);

  const { metrics, history } = useAutonomicSystem(stimuliIntensity, true);
  useProceduralAudio(metrics, activeAcoustic !== null);

  const audioEngineRef = useRef<AudioStimulusEngine | null>(null);

  useEffect(() => {
    if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioStimulusEngine();
        audioEngineRef.current.initializeEngine();
    }
    return () => {
        if (audioEngineRef.current) {
            audioEngineRef.current.terminateActiveWaves();
        }
    }
  }, []);

  useEffect(() => {
    if (audioEngineRef.current) {
      if (activeAcoustic) {
          const schema = AcousticEntrainmentSchemas.find(s => s.id === activeAcoustic);
          if (schema) {
              const baseFreq = schema.parameters.frequencyRangeHz[0];
              // Using a simple delta for binaural beat, e.g., difference
              const deltaFreq = (schema.parameters.frequencyRangeHz[1] - schema.parameters.frequencyRangeHz[0]) || 4; 
              audioEngineRef.current.deployFrequencyVector(baseFreq, deltaFreq, 'sine');
              audioEngineRef.current.adjustVolume(stimuliIntensity / 100);
          }
      } else {
          audioEngineRef.current.terminateActiveWaves();
      }
    }
  }, [activeAcoustic, stimuliIntensity]);

  useEffect(() => {
    document.documentElement.style.setProperty('--ambient-kelvin', `${colorTemperature}K`);
    document.documentElement.style.setProperty('--flicker-rate', `${flickerRate}Hz`);
    
    // Periodically sync logic
    const syncInterval = setInterval(() => {
      syncSimulationState({
        activeAcoustic,
        activePhotonic,
        activeAtmospheric,
        colorTemperature,
        flickerRate,
        stimuliIntensity,
        timestamp: new Date().toISOString()
      });
    }, 10000); // sync every 10s
    
    return () => clearInterval(syncInterval);
  }, [colorTemperature, flickerRate, stimuliIntensity, activeAcoustic, activePhotonic, activeAtmospheric]);

  const toggleAcoustic = (id: string) => setActiveAcoustic(prev => prev === id ? null : id);
  const togglePhotonic = (id: string) => setActivePhotonic(prev => prev === id ? null : id);
  const toggleAtmospheric = (id: string) => setActiveAtmospheric(prev => prev === id ? null : id);

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0a0a0a] text-emerald-500 overflow-hidden font-mono text-sm shadow-2xl">
      <div className="w-full md:w-1/2 p-4 border-r border-[#1a1a1a] overflow-y-auto flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-emerald-900/50 pb-4">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-emerald-400 tracking-wider">ENVIRONMENTAL GRID</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-xs text-emerald-300 font-semibold mb-1">
                <span>Color Temperature (Kelvin)</span>
                <span>{colorTemperature}K</span>
              </label>
              <input 
                type="range" min="1000" max="10000" step="100" 
                value={colorTemperature} 
                onChange={(e) => setColorTemperature(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs text-emerald-300 font-semibold mb-1">
                <span>Flicker Refresh Rate (Hz)</span>
                <span>{flickerRate}Hz</span>
              </label>
              <input 
                type="range" min="1" max="240" step="1" 
                value={flickerRate} 
                onChange={(e) => setFlickerRate(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs text-emerald-300 font-semibold mb-1">
                <span>Global Stimuli Intensity</span>
                <span>{stimuliIntensity}%</span>
              </label>
              <input 
                type="range" min="0" max="100" step="1" 
                value={stimuliIntensity} 
                onChange={(e) => setStimuliIntensity(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Acoustic Resonance Matrix */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-emerald-300 font-semibold mb-3 tracking-wide">
              <Activity className="w-4 h-4" /> ACOUSTIC MATRICES
            </h3>
            <div className="space-y-2">
              {AcousticEntrainmentSchemas.map(schema => (
                <div 
                  key={schema.id}
                  onClick={() => toggleAcoustic(schema.id)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    activeAcoustic === schema.id 
                      ? 'border-emerald-500 bg-emerald-900/20' 
                      : 'border-[#222] bg-[#111] hover:border-emerald-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-xs text-emerald-100">{schema.name}</span>
                    <span className="text-[10px] bg-[#222] px-1.5 py-0.5 rounded text-emerald-400">
                      {schema.parameters.frequencyRangeHz[0]}-{schema.parameters.frequencyRangeHz[1]} Hz
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    <span className="block">Output State: {schema.expectedOutputState.autonomicShift}</span>
                    <span className="block">Coherence: {schema.expectedOutputState.brainwaveCoherence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photonic Visual Geometry */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-emerald-300 font-semibold mb-3 tracking-wide">
              <Eye className="w-4 h-4" /> PHOTONIC GEOMETRY
            </h3>
            <div className="space-y-2">
              {PhotonicGeometrySchemas.map(schema => (
                <div 
                  key={schema.id}
                  onClick={() => togglePhotonic(schema.id)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    activePhotonic === schema.id 
                      ? 'border-emerald-500 bg-emerald-900/20' 
                      : 'border-[#222] bg-[#111] hover:border-emerald-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-xs text-emerald-100">{schema.name}</span>
                    <span className="text-[10px] bg-[#222] px-1.5 py-0.5 rounded text-emerald-400">
                      {schema.parameters.wavelengthNm[0]}-{schema.parameters.wavelengthNm[1]} nm
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    <span className="block">Cognitive Load: {schema.expectedOutputState.cognitiveLoad}</span>
                    <span className="block">Dilation: {schema.expectedOutputState.pupillaryDilation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atmospheric / Chemical */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-emerald-300 font-semibold mb-3 tracking-wide">
              <Wind className="w-4 h-4" /> ATMOSPHERIC PROXY
            </h3>
            <div className="space-y-2">
              {AtmosphericSchemas.map(schema => (
                <div 
                  key={schema.id}
                  onClick={() => toggleAtmospheric(schema.id)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    activeAtmospheric === schema.id 
                      ? 'border-emerald-500 bg-emerald-900/20' 
                      : 'border-[#222] bg-[#111] hover:border-emerald-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-xs text-emerald-100">{schema.name}</span>
                    <span className="text-[10px] bg-[#222] px-1.5 py-0.5 rounded text-emerald-400">
                      {schema.parameters.dispersionRatePPM} PPM
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    <span className="block">Tribal Alignment: {schema.expectedOutputState.tribalAlignment}</span>
                    <span className="block">Risk Aversion: {schema.expectedOutputState.riskAversion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

      </div>

      <div className="w-full md:w-1/2 flex flex-col min-h-0 bg-black relative">
       <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto w-full h-full">
           <TelemetryGrid 
             flickerRate={flickerRate}
             colorTemperature={colorTemperature}
             intensity={stimuliIntensity}
             activeAcoustic={activeAcoustic}
             activePhotonic={activePhotonic}
             activeAtmospheric={activeAtmospheric}
           />
           <PhotonicMatrix 
              flickerRateHz={flickerRate}
              colorTemperatureK={colorTemperature}
              intensity={stimuliIntensity}
           />
           <div className="h-[400px] w-full border border-emerald-900/50 rounded-sm overflow-hidden bg-[#050505]">
              {/* <DungeonCanvas metrics={metrics} /> */}
           </div>
           <div className="w-full bg-[#050505] border border-emerald-900/50 p-2">
              <AutonomicGraph data={history} />
           </div>
           <CommandMatrix />
       </div>
    </div>
  </div>
  );
}
