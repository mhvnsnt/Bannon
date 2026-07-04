import React, { useState } from 'react';
import { PANELS } from '../App';

interface MainSidebarProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

export default function MainSidebar({ isOpen, setOpen, activePanel, setActivePanel }: MainSidebarProps) {
  // Search query filter tracking state for the drawer view
  const [searchQuery, setSearchQuery] = useState('');

  // Verbatim panel dictionary from images 1000142786_2.png to 1000142792_2.png
  const taxonomyGroups = [
    {
      group: "INTERFACE PANELS",
      items: [
        { id: 'prime_ide', label: 'Prime Architect IDE', icon: '⟨ ⟩', color: 'text-cyan-400' },
        { id: 'code_surgeon', label: 'Code Surgeon', icon: '✧', color: 'text-pink-400' },
        { id: 'nexus_os', label: 'Nexus Operating Sy...', icon: '⚙', color: 'text-emerald-400' },
        { id: 'god_mode_os', label: 'God Mode OS', icon: '⊞', color: 'text-amber-400' },
        { id: 'cognitive_nexus', label: 'Cognitive Nexus', icon: '🧠', color: 'text-purple-400' },
        { id: 'spatial_command', label: 'Spatial Command Ar...', icon: '⬢', color: 'text-teal-400' },
        { id: 'motorola_hardware', label: 'Motorola Hardware ...', icon: '📱', color: 'text-emerald-400' },
        { id: 'motorola_grid', label: 'Motorola Data Grid', icon: '🖧', color: 'text-emerald-500' },
        { id: 'fractal_expansion', label: 'Fractal Expansion E...', icon: '⚙', color: 'text-emerald-400' },
        { id: 'myth_engine', label: 'The Myth Engine', icon: '🛢', color: 'text-blue-500' },
        { id: 'reality_compiler', label: 'Reality Compiler', icon: '⟨⟩', color: 'text-pink-500' },
        { id: 'neurospatial_wormhole', label: 'Neurospatial Wormh...', icon: '🌀', color: 'text-purple-500' },
        { id: 'evolution_roadmap', label: 'Evolution Roadmap', icon: '🗺', color: 'text-cyan-400' },
        { id: 'quantum_chat', label: 'Quantum Chat & Str...', icon: '＞_', color: 'text-purple-400' },
        { id: 'omniverse_hyper', label: 'Omniverse HyperStr...', icon: '✧', color: 'text-pink-400' },
        { id: 'apex_core', label: 'Apex CoreOS', icon: '⚙', color: 'text-teal-400' },
        { id: 'abundance_compiler', label: 'Abundance Compiler', icon: '⊞', color: 'text-amber-400' },
        { id: 'quantum_reality', label: 'Quantum Reality', icon: '🌐', color: 'text-indigo-400' },
        { id: 'mlab_daw', label: 'MLab DAW Music St...', icon: '♫', color: 'text-pink-400' },
        { id: 'dashboard_overview', label: 'Dashboard Overview', icon: '🖧', color: 'text-slate-400' },
        { id: 'hardware_sensor', label: 'Hardware/Sensor Br...', icon: '📱', color: 'text-emerald-400' },
        { id: 'sector_matrix', label: 'Sector Matrix Hub', icon: '🖧', color: 'text-blue-500' },
        { id: 'metaconscious_apotheosis', label: 'Metaconscious Apot...', icon: '✧', color: 'text-cyan-400' },
        { id: 'omni_singularity', label: 'Omni-Singularity Ne...', icon: '∞', color: 'text-purple-400' },
        { id: 'neuroplasticity_engine', label: 'Neuroplasticity Engine', icon: '🧠', color: 'text-teal-400' },
        { id: 'environmental_os', label: 'Environmental OS (G...', icon: '🌡', color: 'text-orange-400' },
        { id: 'earth_observation', label: 'Earth Observation G...', icon: '🌐', color: 'text-emerald-500' },
        { id: 'cellular_rejuvenation', label: 'Cellular Rejuvenatio...', icon: '🌡', color: 'text-pink-400' },
        { id: 'master_blueprint', label: 'Master Blueprint Atlas', icon: '🗺', color: 'text-indigo-400' },
        { id: 'environmental_tech', label: 'Environmental Tech ...', icon: '🌐', color: 'text-emerald-400' },
        { id: 'embodied_physical', label: 'Embodied Physical ...', icon: '⚙', color: 'text-cyan-400' },
        { id: 'one_bit_compression', label: 'One-Bit Compressio...', icon: '⚡', color: 'text-amber-400' },
        { id: 'agentic_swarm', label: 'Agentic Swarm Matrix', icon: '🖧', color: 'text-indigo-400' },
        { id: 'predictive_reality', label: 'Predictive Reality Fo...', icon: '📈', color: 'text-teal-400' },
        { id: 'kinetic_haptic', label: 'Kinetic Haptic Engine', icon: '📱', color: 'text-pink-400' },
        { id: 'tomodachi_simulation', label: 'Tomodachi Simulati...', icon: '🛢', color: 'text-purple-400' },
        { id: 'the_crucible', label: 'The Crucible Protocol', icon: '🏋', color: 'text-amber-500' },
        { id: 'biological_override', label: 'Biological Override', icon: '📈', color: 'text-emerald-400' },
        { id: 'influence_arc', label: 'Influence Arc Engine', icon: '🌀', color: 'text-purple-400' },
        { id: 'kinetic_wealth', label: 'Kinetic Wealth', icon: '$', color: 'text-slate-400' },
        { id: 'kinetic_resistance', label: 'Kinetic Resistance', icon: '📈', color: 'text-emerald-400' },
        { id: 'orbital_resonance', label: 'Orbital Resonance', icon: '👥', color: 'text-slate-400' },
        { id: 'prime_architect', label: 'Prime Architect', icon: '🏆', color: 'text-slate-300' },
        { id: 'activity_logs', label: 'Activity Logs', icon: '🛢', color: 'text-blue-400' },
        { id: 'temporal_memory', label: 'Temporal Memory V...', icon: '📈', color: 'text-purple-400' },
        { id: 'autonomous_sandbox', label: 'Autonomous Sandbox', icon: '＞_', color: 'text-emerald-400' },
        { id: 'forge_studio', label: 'Forge Studio (IDE)', icon: '💻', color: 'text-cyan-400' },
        { id: 'media_forge', label: 'Media Forge (Tensor)', icon: '📷', color: 'text-indigo-400' },
        { id: 'directive_vault', label: 'Directive Vault', icon: '＞_', color: 'text-slate-300' },
        { id: 'razor_monitor', label: 'Razor Monitor', icon: '📈', color: 'text-slate-400' },
        { id: 'semantic_memory', label: 'Semantic Memory M...', icon: '🧠', color: 'text-slate-300' },
        { id: 'system_settings', label: 'System Settings', icon: '⚙', color: 'text-slate-400' },
        { id: 'stability_monitor', label: 'Stability Monitor', icon: '📈', color: 'text-slate-400' },
        { id: 'swarm_monitor', label: 'Swarm Monitor', icon: '🖧', color: 'text-slate-400' },
        { id: 'system_health', label: 'System Health Moni...', icon: '📈', color: 'text-slate-400' },
        { id: 'void_monitor', label: 'Void Monitor', icon: '📈', color: 'text-slate-400' },
        { id: 'world_model', label: 'World Model', icon: '🌐', color: 'text-slate-400' },
        { id: 'main_sidebar_ui', label: 'Main Sidebar UI', icon: '🖧', color: 'text-slate-400' }
      ]
    }
  ];

  // Map legacy PANELS back to missing array slots dynamically without changing the reference
  const existingIds = new Set(taxonomyGroups[0].items.map(item => item.id));
  const missingLegacyPanels = PANELS.filter(p => !existingIds.has(p.id)).map(p => ({
     id: p.id,
     label: p.label,
     icon: '✦',
     color: 'text-orange-400'
  }));

  if (missingLegacyPanels.length > 0) {
     taxonomyGroups.push({
         group: "LEGACY SUB-SYSTEMS",
         items: missingLegacyPanels
     });
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-50 bg-black/95 border-r border-gray-900 w-76 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:relative md:translate-x-0 flex flex-col h-screen`}>
      
      {/* Sidebar Header Block */}
      <div className="flex items-center justify-between p-4 border-b border-gray-900 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-pink-500 font-Rajdhani font-bold text-base tracking-widest">⊞ GOD MODE OS</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white md:hidden text-sm">✕</button>
      </div>

      {/* Interactive Panels Navigation Loop */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrolling-touch">
        {taxonomyGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="text-[10px] text-gray-600 font-Rajdhani font-bold px-3 py-1 tracking-wider uppercase">
              {group.group}
            </div>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActivePanel(item.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-left transition-all duration-150 ${activePanel === item.id ? 'bg-zinc-900/60 border border-pink-500/30 text-white' : 'text-gray-400 hover:bg-zinc-900/30'}`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <span className={`${item.color} font-mono font-bold text-sm w-5 text-center flex-shrink-0`}>
                    {item.icon}
                  </span>
                  <span className="font-Rajdhani font-medium tracking-wide truncate">{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Base Security Vault and Identity Grid (Image 1000142789_2.png) */}
      <div className="p-3 border-t border-gray-900 bg-black/40 flex-shrink-0 space-y-2">
        <button 
          onClick={() => setActivePanel('security_vault')}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-left text-red-400 bg-red-950/10 border border-red-900/30 hover:bg-red-950/20 transition-all duration-150"
        >
          <span className="text-sm w-5 text-center">🛡</span>
          <span className="font-Rajdhani font-bold tracking-wide">Security Vault</span>
        </button>

        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-gray-900">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold font-mono text-xs flex-shrink-0">
              M
            </div>
            <div className="min-w-0">
              <div className="text-xs font-Rajdhani font-bold text-gray-200 truncate flex items-center space-x-1.5">
                <span>Marquis Whitacre</span>
                <span className="text-[9px] font-medium text-gray-500 bg-zinc-900 px-1 py-0.5 rounded border border-gray-800">Offline</span>
              </div>
              <div className="text-[10px] font-mono text-gray-500 truncate">MarquisWhitacre@gmail.com</div>
            </div>
          </div>
        </div>

        <button className="w-full text-center py-2 text-[10px] font-mono text-gray-600 hover:text-gray-400 border border-dashed border-gray-900 rounded-lg transition-colors">
          📋 Disconnect Session...
        </button>
      </div>
    </div>
  );
}
