import { useState, useEffect } from 'react';
import { Settings, Layers, Shield, Maximize2, Zap, Tv, Flame, Sun, Activity, Info, Volume2, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ArenaSettings {
  matTexture: string;      // 'canvas_dark' | 'classic_blue' | 'industrial_grid' | 'kings_road'
  barricadeStyle: string;  // 'steel_barrier' | 'protective_padding' | 'classic_wooden'
  rampLength: string;      // 'no_ramp' | 'standard' | 'extended_runway'
  titantronScale: number;  // 0.8 to 1.5
  sideTronCount: number;   // 0 | 2 | 4 | 6
  lightingRig: string;     // 'neon_grid' | 'concert_spotlights' | 'classic_ambient'
  pyroLaunchers: boolean;  // true | false
  ropeColor: string;       // hex color code
  soundtrack: string;      // 'bannon_theme_v2' | 'kings_road_anthem' | 'synth_noise'
}

const DEFAULT_SETTINGS: ArenaSettings = {
  matTexture: 'canvas_dark',
  barricadeStyle: 'steel_barrier',
  rampLength: 'extended_runway',
  titantronScale: 1.25,
  sideTronCount: 4,
  lightingRig: 'neon_grid',
  pyroLaunchers: true,
  ropeColor: '#4f46e5', // indigo
  soundtrack: 'bannon_theme_v2',
};

interface ArenaCustomizerProps {
  settings?: ArenaSettings;
  onChange?: (newSettings: ArenaSettings) => void;
}

export function ArenaCustomizer({ settings, onChange }: ArenaCustomizerProps) {
  // Use local state falling back to default, synchronized with prop if provided
  const [localSettings, setLocalSettings] = useState<ArenaSettings>(settings || DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'visuals' | 'ring' | 'barricades' | 'stage' | 'effects'>('visuals');
  
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const updateSetting = (key: keyof ArenaSettings, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    if (onChange) {
      onChange(updated);
    } else {
      // If used standalone, save to localStorage
      localStorage.setItem('customArena', JSON.stringify(updated));
    }
  };

  // Live Modifiers calculations based on current selection
  const getEntranceTimeModifier = () => {
    if (localSettings.rampLength === 'no_ramp') return 15;
    if (localSettings.rampLength === 'standard') return 30;
    return 45; // extended runway
  };

  const getBarricadeDamageModifier = () => {
    if (localSettings.barricadeStyle === 'steel_barrier') return 1.25; // +25% damage
    if (localSettings.barricadeStyle === 'protective_padding') return 0.85; // -15% damage
    return 1.05; // Wooden
  };

  const getCrowdBuzzModifier = () => {
    let buzz = 100;
    if (localSettings.pyroLaunchers) buzz += 15;
    if (localSettings.sideTronCount > 2) buzz += 10;
    if (localSettings.lightingRig === 'concert_spotlights') buzz += 10;
    if (localSettings.matTexture === 'kings_road') buzz += 20;
    return buzz;
  };

  const getShowmanshipMultiplier = () => {
    return 1.0 + (localSettings.titantronScale - 1.0) * 0.4 + (localSettings.sideTronCount * 0.05);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-6 mt-6" id="arena-construction-suite-root">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-indigo-400" /> Modular Arena Construction Suite
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Build and wire custom rings, ramp socket nodes, trons, and pyro cues. Live stats auto-recalculate presentation.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 self-start">
          {[
            { id: 'visuals', label: 'Overview Map', icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'ring', label: 'Ring & Mat', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'barricades', label: 'Barricades', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'stage', label: 'Stage & Ramp', icon: <Tv className="w-3.5 h-3.5" /> },
            { id: 'effects', label: 'FX & Sound', icon: <Flame className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Interactive Viewport / Schematic Map (Left 7 Columns) */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex justify-between items-center z-10 border-b border-neutral-900 pb-2 mb-4">
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Blueprint Assembler
            </span>
            <span className="text-[9px] font-mono text-neutral-500 uppercase">
              Scale: 1:1 UE5 Anchor Grid
            </span>
          </div>

          {/* Interactive Schematic Drawing */}
          <div className="flex-1 flex items-center justify-center py-4 relative">
            <div className="w-full max-w-sm aspect-square flex flex-col items-center justify-center relative">
              
              {/* STAGE & TRONS */}
              <motion.div 
                layout
                onClick={() => setActiveTab('stage')}
                className={`w-4/5 h-16 rounded-lg bg-neutral-900 border-2 flex flex-col justify-center items-center cursor-pointer transition-colors ${
                  activeTab === 'stage' ? 'border-indigo-500 bg-indigo-950/20' : 'border-neutral-800 hover:border-neutral-700'
                }`}
                title="Stage and Screens"
              >
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: localSettings.sideTronCount / 2 }).map((_, i) => (
                    <div key={`left-tron-${i}`} className="w-2.5 h-4 bg-neutral-800 border border-neutral-700 rounded-sm" />
                  ))}
                  <div 
                    className="bg-indigo-950 border border-indigo-400 rounded-md flex items-center justify-center text-center px-2"
                    style={{ 
                      width: `${60 * localSettings.titantronScale}px`,
                      height: `${24 * localSettings.titantronScale}px` 
                    }}
                  >
                    <span className="text-[7px] font-mono font-bold text-indigo-300">TRON</span>
                  </div>
                  {Array.from({ length: localSettings.sideTronCount / 2 }).map((_, i) => (
                    <div key={`right-tron-${i}`} className="w-2.5 h-4 bg-neutral-800 border border-neutral-700 rounded-sm" />
                  ))}
                </div>
                <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Entrance Stage</span>
              </motion.div>

              {/* ENTRANCE RAMP CONNECTOR */}
              {localSettings.rampLength !== 'no_ramp' && (
                <motion.div 
                  layout
                  onClick={() => setActiveTab('stage')}
                  className={`w-12 border-x-2 border-dashed bg-gradient-to-b from-neutral-900 to-neutral-950 flex justify-center items-center cursor-pointer transition-all ${
                    localSettings.rampLength === 'extended_runway' ? 'h-24' : 'h-12'
                  } ${
                    activeTab === 'stage' ? 'border-indigo-500/50 bg-indigo-950/10' : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                  title="Entrance Ramp"
                >
                  <span className="text-[7px] font-mono font-bold text-neutral-600 rotate-90 whitespace-nowrap tracking-wider">
                    {localSettings.rampLength === 'extended_runway' ? 'RUNWAY (45m)' : 'RAMP (25m)'}
                  </span>
                </motion.div>
              )}

              {/* RINGSIDE BARRICADES (CONTAINER) */}
              <motion.div 
                layout
                onClick={() => setActiveTab('barricades')}
                className={`w-72 h-72 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  activeTab === 'barricades' ? 'border-indigo-500 bg-indigo-950/5' : 'border-neutral-800 hover:border-neutral-700'
                }`}
                style={{
                  borderStyle: localSettings.barricadeStyle === 'steel_barrier' ? 'solid' : 'dashed',
                  borderColor: localSettings.barricadeStyle === 'protective_padding' ? '#10b981' : undefined
                }}
                title="Ringside Barricade"
              >
                
                {/* INNER RING */}
                <motion.div 
                  layout
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('ring');
                  }}
                  className={`w-44 h-44 rounded-md border-4 flex flex-col items-center justify-center cursor-pointer relative shadow-2xl transition-all ${
                    activeTab === 'ring' ? 'border-indigo-500 scale-105' : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                  style={{
                    backgroundColor: 
                      localSettings.matTexture === 'canvas_dark' ? '#0a0a0a' :
                      localSettings.matTexture === 'classic_blue' ? '#1e3a8a' :
                      localSettings.matTexture === 'kings_road' ? '#78350f' : '#171717'
                  }}
                >
                  {/* Ropes lines representing ring boundaries */}
                  <div className="absolute inset-1.5 border border-dashed rounded-sm" style={{ borderColor: localSettings.ropeColor }} />
                  <div className="absolute inset-3 border border-double rounded-sm" style={{ borderColor: localSettings.ropeColor, opacity: 0.8 }} />
                  
                  {/* Mat texture name label */}
                  <div className="text-center z-10 p-2">
                    <span className="block text-[9px] font-bold text-neutral-200 uppercase tracking-widest drop-shadow-md">
                      {localSettings.matTexture.replace('_', ' ')}
                    </span>
                    <span className="block text-[6px] font-mono text-neutral-400 mt-0.5">
                      Ropes: {localSettings.ropeColor}
                    </span>
                  </div>

                  {/* Corner Turnbuckles representation */}
                  <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full shadow" style={{ backgroundColor: localSettings.ropeColor }} />
                  <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full shadow" style={{ backgroundColor: localSettings.ropeColor }} />
                  <div className="absolute bottom-0.5 left-0.5 w-2 h-2 rounded-full shadow" style={{ backgroundColor: localSettings.ropeColor }} />
                  <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full shadow" style={{ backgroundColor: localSettings.ropeColor }} />
                </motion.div>
                
              </motion.div>

              {/* Pyro cues visual indication */}
              {localSettings.pyroLaunchers && (
                <>
                  <div className="absolute top-0 left-4 flex gap-1 animate-pulse">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="absolute top-0 right-4 flex gap-1 animate-pulse">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                </>
              )}

            </div>
          </div>

          {/* Quick HUD readout */}
          <div className="grid grid-cols-3 gap-2 bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg text-center z-10">
            <div>
              <span className="block text-[8px] text-neutral-400 font-bold uppercase tracking-wider">Soundtrack</span>
              <span className="text-[10px] font-bold text-indigo-400 font-mono block mt-0.5 truncate uppercase">
                {localSettings.soundtrack.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-neutral-400 font-bold uppercase tracking-wider">Lighting Rig</span>
              <span className="text-[10px] font-bold text-indigo-400 font-mono block mt-0.5 truncate uppercase">
                {localSettings.lightingRig.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-neutral-400 font-bold uppercase tracking-wider">Pyro Launchers</span>
              <span className={`text-[10px] font-bold font-mono block mt-0.5 uppercase ${localSettings.pyroLaunchers ? 'text-green-400' : 'text-neutral-500'}`}>
                {localSettings.pyroLaunchers ? 'ENABLED (ARMED)' : 'DISABLED'}
              </span>
            </div>
          </div>

        </div>

        {/* Configuration Forms & Inputs (Right 5 Columns) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          <AnimatePresence mode="wait">
            
            {/* TAB: VISUALS OVERVIEW */}
            {activeTab === 'visuals' && (
              <motion.div
                key="tab-visuals"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-400" /> Arena Blueprint Overview
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    This interactive constructor links configuration parameters directly to real-time Unreal Engine actor properties. Swap materials, adjust geometry scales, and configure timing structures easily.
                  </p>
                  <div className="border-t border-neutral-900 pt-3 space-y-1.5">
                    <div className="text-[11px] text-neutral-300 flex justify-between">
                      <span>Ring Mat style:</span>
                      <strong className="text-white uppercase font-mono">{localSettings.matTexture}</strong>
                    </div>
                    <div className="text-[11px] text-neutral-300 flex justify-between">
                      <span>Barricade structure:</span>
                      <strong className="text-white uppercase font-mono">{localSettings.barricadeStyle}</strong>
                    </div>
                    <div className="text-[11px] text-neutral-300 flex justify-between">
                      <span>Stage length:</span>
                      <strong className="text-white uppercase font-mono">{localSettings.rampLength}</strong>
                    </div>
                  </div>
                </div>

                {/* GAMEPLAY INFLUENCE STAT CARD */}
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> presentation & physics influence
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-neutral-900 p-2 rounded border border-neutral-800">
                      <div>
                        <span className="block text-[9px] text-neutral-400 uppercase font-bold">Entrance Walk Duration</span>
                        <span className="text-[8px] text-neutral-500">Determined by Ramp Structure</span>
                      </div>
                      <span className="text-sm font-bold font-mono text-indigo-300">+{getEntranceTimeModifier()}s</span>
                    </div>

                    <div className="flex justify-between items-center bg-neutral-900 p-2 rounded border border-neutral-800">
                      <div>
                        <span className="block text-[9px] text-neutral-400 uppercase font-bold">Barricade Damage Ratio</span>
                        <span className="text-[8px] text-neutral-500">Throws onto ringside barriers</span>
                      </div>
                      <span className={`text-sm font-bold font-mono ${getBarricadeDamageModifier() > 1.0 ? 'text-red-400' : 'text-green-400'}`}>
                        {getBarricadeDamageModifier().toFixed(2)}x
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-neutral-900 p-2 rounded border border-neutral-800">
                      <div>
                        <span className="block text-[9px] text-neutral-400 uppercase font-bold">Crowd Excitement Buzz</span>
                        <span className="text-[8px] text-neutral-500">Effects, lighting & special mats</span>
                      </div>
                      <span className="text-sm font-bold font-mono text-green-400">+{getCrowdBuzzModifier() - 100}%</span>
                    </div>

                    <div className="flex justify-between items-center bg-neutral-900 p-2 rounded border border-neutral-800">
                      <div>
                        <span className="block text-[9px] text-neutral-400 uppercase font-bold">Showmanship Buff Scale</span>
                        <span className="text-[8px] text-neutral-500">Titantron geometry scaling</span>
                      </div>
                      <span className="text-sm font-bold font-mono text-indigo-400">{getShowmanshipMultiplier().toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: RING & MAT */}
            {activeTab === 'ring' && (
              <motion.div
                key="tab-ring"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ring Canvas & Rope parameters</h4>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">Mat Surface Material</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'canvas_dark', label: 'Canvas Noir (Soft Slate)', desc: 'Standard non-distracting dark textured fabric' },
                        { id: 'classic_blue', label: 'Madison Square Blue', desc: 'Saturated classic federation canvas' },
                        { id: 'industrial_grid', label: 'Metallic Mech Grid', desc: 'Steel mesh plating with high impact reverb' },
                        { id: 'kings_road', label: 'King\'s Road Gold', desc: 'Warm golden mat representing legendary legacy (+20% Excitement)' }
                      ].map(mat => (
                        <button
                          key={mat.id}
                          onClick={() => updateSetting('matTexture', mat.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            localSettings.matTexture === mat.id
                              ? 'bg-indigo-600/10 border-indigo-500'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <span className="block text-xs font-bold text-white uppercase">{mat.label}</span>
                          <span className="block text-[10px] text-neutral-400 mt-1">{mat.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">Ring Rope Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={localSettings.ropeColor}
                        onChange={(e) => updateSetting('ropeColor', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer bg-neutral-900 border border-neutral-800 p-1"
                      />
                      <div>
                        <span className="block text-xs text-white font-mono">{localSettings.ropeColor}</span>
                        <span className="block text-[9px] text-neutral-500">Click color block to customize corner cables</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: BARRICADES */}
            {activeTab === 'barricades' && (
              <motion.div
                key="tab-barricades"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ringside Guardrail options</h4>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">Barricade Material & Rigidity</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'steel_barrier', label: 'Heavy Steel Railing', damage: '+25% impact damage', desc: 'Stiff steel panels. Throws onto barricades cause higher stun values.' },
                        { id: 'protective_padding', label: 'High-Impact Foam', damage: '-15% impact damage', desc: 'Thick modern foam protective padding. Maximizes safe wrestling.' },
                        { id: 'classic_wooden', label: 'Classic Wooden Fence', damage: '+5% impact damage', desc: 'Vintage timber boundaries. Breaks on high-intensity falls.' }
                      ].map(barr => (
                        <button
                          key={barr.id}
                          onClick={() => updateSetting('barricadeStyle', barr.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            localSettings.barricadeStyle === barr.id
                              ? 'bg-indigo-600/10 border-indigo-500'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white uppercase">{barr.label}</span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 text-indigo-400 rounded">
                              {barr.damage}
                            </span>
                          </div>
                          <span className="block text-[10px] text-neutral-400 mt-1.5 leading-relaxed">{barr.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: STAGE & RAMP */}
            {activeTab === 'stage' && (
              <motion.div
                key="tab-stage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ramp geometry & Trons</h4>

                  {/* RAMP LENGTH */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">Entrance Ramp Length</label>
                    <select
                      value={localSettings.rampLength}
                      onChange={(e) => updateSetting('rampLength', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg text-xs text-white"
                    >
                      <option value="no_ramp">No Runway / Direct Ingress (+15s Entrance)</option>
                      <option value="standard">Standard Level Approach Stage (+30s Entrance)</option>
                      <option value="extended_runway">Extended Elevated Runway (+45s Entrance)</option>
                    </select>
                  </div>

                  {/* TITANTRON SCALE */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-neutral-400 uppercase">Titantron Display Scale</label>
                      <span className="text-xs font-mono font-bold text-indigo-400">{localSettings.titantronScale}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.8" 
                      max="1.5" 
                      step="0.05"
                      value={localSettings.titantronScale}
                      onChange={(e) => updateSetting('titantronScale', parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded cursor-pointer"
                    />
                    <span className="block text-[9px] text-neutral-500">Alters the vertical camera bounds and showmanship scoring multipliers.</span>
                  </div>

                  {/* SIDE TRON COUNT */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">Side Screen Panels</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 2, 4, 6].map(count => (
                        <button
                          key={count}
                          onClick={() => updateSetting('sideTronCount', count)}
                          className={`p-2 rounded text-xs font-mono font-bold border transition-colors ${
                            localSettings.sideTronCount === count
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          {count} SCR
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LIGHTING RIG */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">Stage Lighting Array</label>
                    <select
                      value={localSettings.lightingRig}
                      onChange={(e) => updateSetting('lightingRig', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg text-xs text-white"
                    >
                      <option value="neon_grid">Neon Tech Grid (Vapor Purple)</option>
                      <option value="concert_spotlights">Moving Halogen Concert Spotlights</option>
                      <option value="classic_ambient">Warm Incandescent Classic Ambiance</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: EFFECTS & SOUND */}
            {activeTab === 'effects' && (
              <motion.div
                key="tab-effects"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Atmospherics & Soundtrack</h4>

                  {/* PYRO LAUNCHERS */}
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                    <div>
                      <span className="block text-xs font-bold text-white uppercase">Pyro Launchers</span>
                      <span className="block text-[9px] text-neutral-400 mt-0.5">Arm stage pyro spark cannons for entrances</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={localSettings.pyroLaunchers}
                        onChange={(e) => updateSetting('pyroLaunchers', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                    </label>
                  </div>

                  {/* SOUNDTRACK */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> Venue Ambient Audio
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'bannon_theme_v2', label: 'Bannon Theme V2 (Industrial)', desc: 'Heavy sync basslines and synth pulses' },
                        { id: 'kings_road_anthem', label: 'King\'s Road Anthem (Rock)', desc: 'High momentum live rock guitar' },
                        { id: 'synth_noise', label: 'Dark Synthwave Loop', desc: 'Dystopian atmospheric retro pads' }
                      ].map(track => (
                        <button
                          key={track.id}
                          onClick={() => updateSetting('soundtrack', track.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            localSettings.soundtrack === track.id
                              ? 'bg-indigo-600/10 border-indigo-500'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <span className="block text-xs font-bold text-white uppercase">{track.label}</span>
                          <span className="block text-[10px] text-neutral-400 mt-1">{track.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
