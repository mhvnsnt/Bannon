import React, { useState, useEffect, useRef } from "react";
import { Terminal, Eye, Sparkles, Cpu, Globe, LayoutDashboard, Brain, Activity, ShieldAlert, Monitor, Sliders, Menu, Compass, ArrowRight, Command, Database } from "lucide-react";
import { useOSTheme } from "./SystemOverseer";

import { PANELS } from "../App";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string, isRightPanel: boolean) => void;
  onToggleLeftSidebar: () => void;
  onToggleSplitView: () => void;
  onTriggerKillSwitch: () => void;
  presets?: any[];
  onLoadPreset?: (preset: any) => void;
  onSavePreset?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onToggleLeftSidebar,
  onToggleSplitView,
  onTriggerKillSwitch,
  presets = [],
  onLoadPreset,
  onSavePreset
}: CommandPaletteProps) {
  const { theme, setTheme } = useOSTheme();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape key, up/down arrows and enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, search]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    ...PANELS.map(p => ({
      id: p.id,
      title: p.isMain ? `Activate ${p.label}` : `View ${p.label}`,
      subtitle: p.isMain ? "Open core view" : "Access secondary panel",
      category: p.isMain ? "MAIN PANELS" : "RIGHT PANELS",
      icon: p.icon,
      action: () => onNavigate(p.id, !p.isMain)
    })),
    // Actions
    {
      id: "toggle-sidebar",
      title: "Toggle Left Sidebar",
      subtitle: "Collapse or expand main navigation menu",
      category: "CORE_ACTIONS",
      icon: <Menu className="w-4 h-4 text-gray-400" />,
      action: () => onToggleLeftSidebar()
    },
    {
      id: "toggle-split",
      title: "Toggle Split-View Workspace",
      subtitle: "Pin two panels side-by-side in main area",
      category: "CORE_ACTIONS",
      icon: <Monitor className="w-4 h-4 text-cyan-400" />,
      action: () => onToggleSplitView()
    },
    {
      id: "toggle-theme",
      title: `Toggle Dark Theme (${theme === "deep-obsidian" ? "Obsidian" : "Standard"})`,
      subtitle: "Switch between Deep Obsidian and Standard Slate palettes",
      category: "CORE_ACTIONS",
      icon: <Sliders className="w-4 h-4 text-pink-500" />,
      action: () => setTheme(theme === "deep-obsidian" ? "standard" : "deep-obsidian")
    },
    {
      id: "killswitch",
      title: "Biometric Dead Man Switch",
      subtitle: "Initiate emergency OS containment protocols",
      category: "SECURITY",
      icon: <Activity className="w-4 h-4 text-red-600 animate-pulse" />,
      action: () => onTriggerKillSwitch()
    }
  ];

  if (onSavePreset) {
    commands.push({
      id: "save-preset",
      title: "Save Current Layout as Preset",
      subtitle: "Store the active panels configuration",
      category: "PRESETS",
      icon: <LayoutDashboard className="w-4 h-4 text-fuchsia-400" />,
      action: () => {
        onSavePreset();
      } // Not closing because they can see the save happen, wait, maybe close it.
    });
  }

  presets.forEach(p => {
    commands.push({
      id: `preset-${p.id}`,
      title: `Load ${p.name}`,
      subtitle: p.split ? `Main: ${p.main}  //  Right: ${p.right}` : `Main: ${p.main}`,
      category: "PRESETS",
      icon: <LayoutDashboard className="w-4 h-4 text-purple-400" />,
      action: () => {
        if (onLoadPreset) onLoadPreset(p);
      }
    });
  });

  const filteredCommands = commands.filter((cmd) => {
    const text = `${cmd.title} ${cmd.subtitle} ${cmd.category}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/70 backdrop-blur-sm transition-opacity duration-200">
      <div
        ref={containerRef}
        className="w-full max-w-2xl rounded-xl border border-[#222] bg-[#111] shadow-2xl shadow-purple-500/10 overflow-hidden transform transition-all"
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 border-b border-[#222]">
          <Command className="w-5 h-5 text-gray-500 animate-pulse shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or navigate panels..."
            className="w-full py-4 text-gray-100 bg-transparent border-0 outline-none placeholder-gray-500 font-mono text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="hidden sm:flex items-center gap-1 text-[10px] bg-[#222] text-gray-400 px-1.5 py-0.5 rounded font-sans tracking-wide">
            <span>ESC</span>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 no-scrollbar">
          {filteredCommands.length > 0 ? (
            <div>
              {/* Grouping header placeholder or just mapping */}
              {filteredCommands.map((cmd, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className={`flex items-center justify-between w-full text-left px-3 py-3 rounded-lg transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 text-white"
                        : "border border-transparent text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-purple-950/50" : "bg-[#1c1c1c]"}`}>
                        {cmd.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold font-mono tracking-tight text-white mb-0.5 truncate">
                          {cmd.title}
                        </div>
                        <div className={`text-[10px] truncate ${isSelected ? "text-purple-300" : "text-gray-500"}`}>
                          {cmd.subtitle}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-mono font-semibold bg-[#222] px-1.5 py-0.5 rounded text-gray-500 uppercase tracking-widest">
                        {cmd.category}
                      </span>
                      {isSelected && (
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 font-mono text-xs">
              NO ANOMALIES MATCHED SEARCH SPEC.
            </div>
          )}
        </div>

        {/* Quick Instructions Footer */}
        <div className="px-4 py-3 border-t border-[#222] bg-[#0c0c0c] flex items-center justify-between text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigation</span>
            <span>ENTER Execute</span>
          </div>
          <div>
            <span>SYSTEM CONSOLE v4.26</span>
          </div>
        </div>
      </div>
    </div>
  );
}
