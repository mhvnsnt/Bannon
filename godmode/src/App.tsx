import { QuantumEngineProvider } from "./hooks/useQuantumEngine";
import React, { useState, useEffect } from "react";
import MainSidebar from "./components/MainSidebar";
import { StatusBar } from "./components/StatusBar";
import QuantumChat from "./components/QuantumChat";
import UnifiedSessionsExplorer from "./components/UnifiedSessionsExplorer";
import { QuantumPersistenceManager } from "./lib/QuantumPersistenceManager";

import MovesetDatabase from "./components/MovesetDatabase";
import AIAssistant from "./components/AIAssistant";
import PhysicsLab from "./components/PhysicsLab";
import GameStudio from "./components/GameStudio";
import GodModeOS from "./components/GodModeOS";
import CodeSurgeonPanel from "./components/CodeSurgeonPanel";
import { SystemOverseer } from "./components/SystemOverseer";
import { KineticVisualizer } from "./components/KineticVisualizer";
import { SwarmMonitor } from "./components/SwarmMonitor";
import { AbundanceCompiler } from "./components/AbundanceCompiler";
import SecurityVault from "./components/SecurityVault";
import { ApexCoreOS } from "./components/ApexCore";
import { AutonomousNavigationMatrix } from "./components/AutonomousNavigationMatrix";
import { MetaconsciousApotheosis } from "./components/MetaconsciousApotheosis";
import OuroborosEngine from "./components/OuroborosEngine";
import RevenueDashboard from "./components/RevenueDashboard";
import DataDominance from "./components/DataDominance";
import IPGeneration from "./components/IPGeneration";
import GameEconomy from "./components/GameEconomy";
import AutonomousSandbox from "./components/AutonomousSandbox";
import KineticWealth from "./components/KineticWealth";
import { RazorMonitor } from "./components/RazorMonitor";

import DynamicToolForgePanel from "./components/DynamicToolForgePanel";

// Dynamic sub-systems added back from the God-Mode-OS total archive
import { PrimeArchitectIDE } from "./components/PrimeArchitectIDE";
import NexusOperatingSystem from "./components/NexusOperatingSystem";
import CognitiveArchitectureNexus from "./components/CognitiveArchitectureNexus";
import SpatialCommandArchitecture from "./components/SpatialCommandArchitecture";
import MotorolaHardwareBridge from "./components/MotorolaHardwareBridge";
import MotorolaDataGrid from "./components/MotorolaDataGrid";
import FractalExpansionEngine from "./components/FractalExpansionEngine";
import { MythEngine } from "./components/MythEngine";
import RealityCompiler from "./components/RealityCompiler";
import NeurospatialWormhole from "./components/NeurospatialWormhole";
import EvolutionRoadmap from "./components/EvolutionRoadmap";
import { OmniverseHyperStructure } from "./components/OmniverseHyperStructure";
import QuantumFieldVisualizer from "./components/QuantumFieldVisualizer";
import MlabStudio from "./components/MlabStudio";
import Dashboard from "./components/Dashboard";
import SectorMatrixHub from "./components/SectorMatrixHub";
import { OmniSingularityNexus } from "./components/OmniSingularityNexus";
import { NeuroplasticityEngine } from "./components/NeuroplasticityEngine";
import EnvironmentalControls from "./components/EnvironmentalControls";
import { EarthObservationGrid } from "./components/EarthObservationGrid";
import { CellularRejuvenationMatrix } from "./components/CellularRejuvenationMatrix";
import { MasterBlueprintAtlas } from "./components/MasterBlueprintAtlas";
import { EnvironmentalTechGrid } from "./components/EnvironmentalTechGrid";
import { EmbodiedRoboticsInterface } from "./components/EmbodiedRoboticsInterface";
import { OneBitCompressionEngine } from "./components/OneBitCompressionEngine";
import { AgenticSwarmMatrix } from "./components/AgenticSwarmMatrix";
import { TrendlineForecaster } from "./components/TrendlineForecaster";
import { KineticHapticEngine } from "./components/KineticHapticEngine";
import BiomechanicalSandbox from "./components/BiomechanicalSandbox";
import { CrucibleProtocol } from "./components/CrucibleProtocol";
import { BiologicalOverride } from "./components/BiologicalOverride";
import InfluenceArcEngine from "./components/InfluenceArcEngine";
import KineticResistanceEngine from "./components/KineticResistanceEngine";
import OrbitalResonance from "./components/OrbitalResonance";
import FieldLogs from "./components/FieldLogs";
import TemporalMemoryVault from "./components/TemporalMemoryVault";
import ForgeStudio from "./components/ForgeStudio";
import MediaForge from "./components/MediaForge";
import DirectiveVault from "./components/DirectiveVault";
import SemanticMemoryMonitor from "./components/SemanticMemoryMonitor";
import SystemSettings from "./components/Settings";
import { StabilityMonitor } from "./components/StabilityMonitor";
import { SystemHealthMonitor } from "./components/SystemHealthMonitor";
import VoidMonitor from "./components/VoidMonitor";
import WorldModel from "./components/WorldModel";
import DoolyCountySocialPhysics from "./components/DoolyCountySocialPhysics";
import TelegramDiagnostics from "./components/TelegramDiagnostics";
import AutonomousWorkflowsPanel from "./components/AutonomousWorkflowsPanel";

import FrontierOperations from "./components/FrontierOperations";
import { ExperimentalFeedbackTerminal } from "./components/ExperimentalFeedbackTerminal";
import LHCManager from "./components/LHCManager";
import AutonomousAgents from "./components/AutonomousAgents";
import EvolutionaryMetrics from "./components/EvolutionaryMetrics";
import VectorMemoryVault from "./components/VectorMemoryVault";
import LocalSecurityPipeline from "./components/LocalSecurityPipeline";
import QuantumConvergencePanel from "./components/QuantumConvergencePanel";

import {
  Database,
  Activity,
  Code,
  Gamepad2,
  Settings,
  Terminal,
  Zap,
  Compass,
  Cpu,
  Network,
  Sparkles,
  ShieldAlert,
  FlaskConical,
  Atom,
  LineChart,
  DatabaseZap,
  Shield,
} from "lucide-react";

import ToolsAndConnectorsSidebar from "./components/ToolsAndConnectorsSidebar";

export const PANELS = [
  {
    id: "autonomous_workflows",
    label: "Autonomous Workflows",
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    isMain: true,
  },
  {
    id: "lhc_manager",
    label: "LHC High-Luminosity",
    icon: <Atom className="w-5 h-5 text-blue-400" />,
    isMain: true,
  },
  {
    id: "autonomous_agents",
    label: "Meta-Learning Agents",
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    isMain: true,
  },
  {
    id: "evolutionary_metrics",
    label: "Evolutionary Metrics",
    icon: <LineChart className="w-5 h-5 text-emerald-400" />,
    isMain: true,
  },
  {
    id: "vector_memory",
    label: "Vector Memory Vault",
    icon: <DatabaseZap className="w-5 h-5 text-indigo-400" />,
    isMain: true,
  },
  {
    id: "local_security",
    label: "Autonomous Security Pipeline",
    icon: <Shield className="w-5 h-5 text-emerald-500" />,
    isMain: true,
  },
  {
    id: "revenue_dashboard",
    label: "Revenue & Orchestration",
    icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
    isMain: true,
  },
  {
    id: "data_dominance",
    label: "Data Dominance & Arbitrage",
    icon: <Database className="w-5 h-5 text-blue-500" />,
    isMain: true,
  },
  {
    id: "ip_generation",
    label: "Generative IP Exploitation",
    icon: <Sparkles className="w-5 h-5 text-purple-500" />,
    isMain: true,
  },
  {
    id: "game_economy",
    label: "Autonomous Game Economy",
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    isMain: true,
  },
  {
    id: "god_mode_os",
    label: "God Mode OS",
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
    isMain: true,
  },
  {
    id: "dooly_county",
    label: "Dooly County Lab",
    icon: <Activity className="w-5 h-5 text-emerald-500" />,
    isMain: true,
  },
  {
    id: "experimental_feedback",
    label: "Experimental Feedback Loop",
    icon: <FlaskConical className="w-5 h-5 text-emerald-400" />,
    isMain: true,
  },
  {
    id: "dynamic_tool_forge",
    label: "Dynamic Tool Forge",
    icon: <Terminal className="w-5 h-5 text-emerald-500" />,
    isMain: true,
  },
  {
    id: "prime_ide",
    label: "Prime Architect IDE",
    icon: <Terminal className="w-5 h-5 text-cyan-400" />,
    isMain: false,
  },
  {
    id: "code_surgeon",
    label: "Code Surgeon",
    icon: <Cpu className="w-5 h-5 text-pink-400" />,
    isMain: false,
  },
  {
    id: "nexus_os",
    label: "Nexus Operating System",
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
    isMain: false,
  },
  {
    id: "cognitive_nexus",
    label: "Cognitive Nexus",
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    isMain: false,
  },
  {
    id: "spatial_command",
    label: "Spatial Command",
    icon: <Compass className="w-5 h-5 text-cyan-400" />,
    isMain: false,
  },
  {
    id: "motorola_hardware",
    label: "Motorola Hardware",
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
    isMain: false,
  },
  {
    id: "motorola_grid",
    label: "Motorola Data Grid",
    icon: <Network className="w-5 h-5 text-emerald-500" />,
    isMain: false,
  },
  {
    id: "fractal_expansion",
    label: "Fractal Expansion",
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    isMain: false,
  },
  {
    id: "myth_engine",
    label: "The Myth Engine",
    icon: <Database className="w-5 h-5 text-blue-500" />,
    isMain: false,
  },
  {
    id: "reality_compiler",
    label: "Reality Compiler",
    icon: <Terminal className="w-5 h-5 text-purple-500" />,
    isMain: false,
  },
  {
    id: "neurospatial_wormhole",
    label: "Neurospatial Wormhole",
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
    isMain: false,
  },
  {
    id: "evolution_roadmap",
    label: "Evolution Roadmap",
    icon: <Compass className="w-5 h-5 text-cyan-400" />,
    isMain: false,
  },
  {
    id: "quantum_chat",
    label: "Quantum Chat & Strategy",
    icon: <Zap className="w-5 h-5 text-pink-500" />,
    isMain: true,
  },
  {
    id: "ouroboros_engine",
    label: "Ouroboros Engine",
    icon: <Cpu className="w-5 h-5 text-emerald-500" />,
    isMain: true,
  },
  {
    id: "bannon_game",
    label: "Bannon Sandbox",
    icon: <Gamepad2 className="w-5 h-5 text-red-500" />,
    isMain: true,
  },
  {
    id: "game_studio",
    label: "Developer Studio",
    icon: <Settings className="w-5 h-5 text-yellow-500" />,
    isMain: true,
  },
  {
    id: "moveset_db",
    label: "Moveset Matrix",
    icon: <Database className="w-5 h-5 text-blue-400" />,
    isMain: false,
  },
  {
    id: "physics_lab",
    label: "Physics Laboratory",
    icon: <Activity className="w-5 h-5 text-emerald-500" />,
    isMain: false,
  },
  {
    id: "ai_assistant",
    label: "AI Diagnostician",
    icon: <Code className="w-5 h-5 text-indigo-400" />,
    isMain: false,
  },
  {
    id: "system_overseer",
    label: "System Overseer",
    icon: <Compass className="w-5 h-5 text-purple-400" />,
    isMain: false,
  },
  {
    id: "kinetic_grid",
    label: "Kinetic Grid",
    icon: <Activity className="w-5 h-5 text-emerald-500" />,
    isMain: false,
  },
  {
    id: "swarm_routing",
    label: "Swarm Routing",
    icon: <Network className="w-5 h-5 text-emerald-500" />,
    isMain: false,
  },
  {
    id: "abundance_matrix",
    label: "Abundance Matrix",
    icon: <Sparkles className="w-5 h-5 text-fuchsia-500" />,
    isMain: false,
  },
  {
    id: "security_vault",
    label: "Security Vault",
    icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
    isMain: false,
  },
  {
    id: "apex_system",
    label: "Apex System Logic",
    icon: <Cpu className="w-5 h-5 text-indigo-500" />,
    isMain: false,
  },
  {
    id: "metaconscious",
    label: "Metaconscious Apotheosis",
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    isMain: false,
  },
  {
    id: "telegram_diagnostics",
    label: "Telegram Diagnostics",
    icon: <Network className="w-5 h-5 text-blue-400" />,
    isMain: false,
  },
];

export default function App() {
  const [activePanel, setActivePanel] = useState("lhc_manager");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSelectedFile, setGlobalSelectedFile] = useState<string>(() => {
    try {
      return localStorage.getItem("globalSelectedFile") || "";
    } catch (e) {
      return "";
    }
  });

  useEffect(() => {
    if (globalSelectedFile) {
      try {
        localStorage.setItem("globalSelectedFile", globalSelectedFile);
      } catch (e) {}
    }
  }, [globalSelectedFile]);

  useEffect(() => {
    QuantumPersistenceManager.initializeAndRestore().catch((e) => {
      console.error("Quantum Persistence Error:", e);
    });
    if (!globalSelectedFile) {
      fetch("/api/library")
        .then((r) => r.json())
        .then((data) => {
          if (data.files && data.files.length > 0) {
            const getVersionScore = (name: string) => {
              const match = name.match(/v(\d+)/i);
              return match ? parseInt(match[1], 10) : 0;
            };
            const sortedFiles = [...data.files].sort((a: any, b: any) => {
              const vA = getVersionScore(a.name);
              const vB = getVersionScore(b.name);
              if (vB !== vA) return vB - vA;
              return b.name.localeCompare(a.name);
            });
            const core = sortedFiles.find(
              (f: any) =>
                f.name.toLowerCase().includes("core") ||
                f.name.toLowerCase().includes("bannon") ||
                f.name.toLowerCase().includes("fixed")
            );
            setGlobalSelectedFile(core ? core.name : sortedFiles[0].name);
          }
        })
        .catch(() => {});
    }
  }, [globalSelectedFile]);

  return (
    <QuantumEngineProvider>
    <div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] min-h-[100dvh] bg-[#030303] text-white font-mono flex flex-col overflow-hidden select-none">
      {/* Top System Tracking Bar with Mobile Menu Toggle inline */}
      <div className="flex items-center gap-2 p-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden bg-[#111] p-1.5 rounded border border-[#333] text-gray-400 hover:text-white"
          title="Toggle Sidebar Menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <StatusBar />
        </div>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Navigation Panel Drawer */}
        <MainSidebar
          isOpen={sidebarOpen}
          setOpen={setSidebarOpen}
          activePanel={activePanel}
          setActivePanel={setActivePanel}
        />

        {/* Dynamic Panel Pipeline */}
        <main className="flex-1 flex flex-col relative overflow-y-auto p-4 transition-all duration-300 z-10 w-full min-w-0">
          {activePanel === "autonomous_workflows" && <AutonomousWorkflowsPanel />}
          {activePanel === "lhc_manager" && <LHCManager />}
          {activePanel === "autonomous_agents" && <AutonomousAgents />}
          {activePanel === "evolutionary_metrics" && <EvolutionaryMetrics />}
          {activePanel === "vector_memory" && <VectorMemoryVault />}
          {activePanel === "local_security" && <LocalSecurityPipeline />}
          {activePanel === "frontier_operations" && <FrontierOperations />}
          {activePanel === "revenue_dashboard" && <RevenueDashboard />}
          {activePanel === "data_dominance" && <DataDominance />}
          {activePanel === "ip_generation" && <IPGeneration />}
          {activePanel === "game_economy" && <GameEconomy />}
          {activePanel === "quantum_chat" && (
            <div className="flex-1 flex flex-row space-x-4">
              <div className="flex-1 flex flex-col space-y-4">
                {/* Lower Sub-Routing Drawer */}
                <UnifiedSessionsExplorer />
                {/* Primary Interaction Interface */}
                <QuantumChat />
              </div>
              <div className="hidden lg:flex lg:flex-col w-72 flex-shrink-0 space-y-4">
                <div className="flex-1 min-h-[50%]">
                  <ToolsAndConnectorsSidebar />
                </div>
                <div className="flex-1 min-h-[50%]">
                  <QuantumConvergencePanel />
                </div>
              </div>
            </div>
          )}
          {activePanel === "god_mode_os" && (
            <GodModeOS onNavigate={(id) => setActivePanel(id)} />
          )}
          {activePanel === "dooly_county" && <DoolyCountySocialPhysics />}
          {activePanel === "experimental_feedback" && (
            <ExperimentalFeedbackTerminal />
          )}
          {activePanel === "ouroboros_engine" && <OuroborosEngine />}
          {activePanel === "bannon_game" && (
            <div className="flex-1 w-full h-full">
              <iframe
                src="/bannon.html"
                className="w-full h-full border-0"
                title="Bannon Game Live"
                allow="autoplay; fullscreen; encrypted-media"
              />
            </div>
          )}
          {activePanel === "game_studio" && (
            <GameStudio
              globalSelectedFile={globalSelectedFile}
              setGlobalSelectedFile={setGlobalSelectedFile}
            />
          )}
          {activePanel === "moveset_db" && <MovesetDatabase />}
          {activePanel === "physics_lab" && <PhysicsLab />}
          {activePanel === "ai_assistant" && (
            <AIAssistant
              globalSelectedFile={globalSelectedFile}
              setGlobalSelectedFile={setGlobalSelectedFile}
            />
          )}
          {activePanel === "code_surgeon" && <CodeSurgeonPanel />}
          {activePanel === "system_overseer" && (
            <SystemOverseer>
              <div className="flex h-full w-full items-center justify-center p-8">
                <div className="text-gray-400 font-mono text-xs max-w-lg bg-[#111] p-6 border border-[#333] rounded-xl">
                  <span className="text-cyan-500 font-bold mb-4 block">
                    SYSTEM OVERSEER ONLINE
                  </span>
                  Scanning local telemetry layers...
                  <br />
                  <br />
                  The active God Mode OS and React error boundary are stable.
                  Zero sub-routine desyncs detected.
                </div>
              </div>
            </SystemOverseer>
          )}
          {activePanel === "kinetic_grid" && <KineticVisualizer />}
          {(activePanel === "swarm_routing" ||
            activePanel === "swarm_monitor") && <SwarmMonitor />}
          {(activePanel === "abundance_matrix" ||
            activePanel === "abundance_compiler") && <AbundanceCompiler />}
          {activePanel === "security_vault" && <SecurityVault />}
          {(activePanel === "apex_system" || activePanel === "apex_core") && (
            <ApexCoreOS />
          )}
          {(activePanel === "metaconscious" ||
            activePanel === "metaconscious_apotheosis") && (
            <MetaconsciousApotheosis />
          )}
          {activePanel === "autonomous_sandbox" && <AutonomousSandbox />}
          {activePanel === "kinetic_wealth" && <KineticWealth />}
          {activePanel === "razor_monitor" && <RazorMonitor />}

          {/* Newly wired interactive sub-system panels */}
          {(activePanel === "prime_ide" ||
            activePanel === "prime_architect") && <PrimeArchitectIDE />}
          {activePanel === "nexus_os" && <NexusOperatingSystem />}
          {activePanel === "cognitive_nexus" && <CognitiveArchitectureNexus />}
          {activePanel === "spatial_command" && <SpatialCommandArchitecture />}
          {(activePanel === "motorola_hardware" ||
            activePanel === "hardware_sensor") && <MotorolaHardwareBridge />}
          {activePanel === "motorola_grid" && <MotorolaDataGrid />}
          {activePanel === "fractal_expansion" && <FractalExpansionEngine />}
          {activePanel === "myth_engine" && <MythEngine />}
          {activePanel === "reality_compiler" && <RealityCompiler />}
          {activePanel === "neurospatial_wormhole" && <NeurospatialWormhole />}
          {activePanel === "evolution_roadmap" && <EvolutionRoadmap />}
          {activePanel === "omniverse_hyper" && <OmniverseHyperStructure />}
          {activePanel === "quantum_reality" && <QuantumFieldVisualizer />}
          {activePanel === "mlab_daw" && <MlabStudio />}
          {activePanel === "dashboard_overview" && <Dashboard />}
          {activePanel === "sector_matrix" && <SectorMatrixHub />}
          {activePanel === "omni_singularity" && <OmniSingularityNexus />}
          {activePanel === "neuroplasticity_engine" && (
            <NeuroplasticityEngine />
          )}
          {activePanel === "environmental_os" && <EnvironmentalControls />}
          {activePanel === "earth_observation" && <EarthObservationGrid />}
          {activePanel === "cellular_rejuvenation" && (
            <CellularRejuvenationMatrix />
          )}
          {activePanel === "master_blueprint" && <MasterBlueprintAtlas />}
          {activePanel === "environmental_tech" && <EnvironmentalTechGrid />}
          {activePanel === "embodied_physical" && <EmbodiedRoboticsInterface />}
          {activePanel === "one_bit_compression" && <OneBitCompressionEngine />}
          {activePanel === "agentic_swarm" && <AgenticSwarmMatrix />}
          {activePanel === "predictive_reality" && <TrendlineForecaster />}
          {activePanel === "kinetic_haptic" && <KineticHapticEngine />}
          {activePanel === "tomodachi_simulation" && <BiomechanicalSandbox />}
          {activePanel === "the_crucible" && <CrucibleProtocol />}
          {activePanel === "biological_override" && <BiologicalOverride />}
          {activePanel === "influence_arc" && <InfluenceArcEngine />}
          {activePanel === "kinetic_resistance" && <KineticResistanceEngine />}
          {activePanel === "orbital_resonance" && <OrbitalResonance />}
          {activePanel === "activity_logs" && <FieldLogs />}
          {activePanel === "temporal_memory" && <TemporalMemoryVault />}
          {activePanel === "forge_studio" && <ForgeStudio />}
          {activePanel === "media_forge" && <MediaForge />}
          {activePanel === "directive_vault" && <DirectiveVault />}
          {activePanel === "semantic_memory" && <SemanticMemoryMonitor />}
          {activePanel === "system_settings" && <SystemSettings />}
          {activePanel === "stability_monitor" && <StabilityMonitor />}
          {activePanel === "system_health" && <SystemHealthMonitor />}
          {activePanel === "void_monitor" && <VoidMonitor />}
          {activePanel === "world_model" && <WorldModel />}
          {activePanel === "telegram_diagnostics" && <TelegramDiagnostics />}
          {activePanel === "dynamic_tool_forge" && <DynamicToolForgePanel />}

          {/* Fallback for undeveloped modules */}
          {![
            "revenue_dashboard",
            "dooly_county",
            "data_dominance",
            "ip_generation",
            "game_economy",
            "quantum_chat",
            "god_mode_os",
            "ouroboros_engine",
            "bannon_game",
            "game_studio",
            "moveset_db",
            "physics_lab",
            "ai_assistant",
            "code_surgeon",
            "system_overseer",
            "kinetic_grid",
            "swarm_routing",
            "abundance_matrix",
            "security_vault",
            "apex_system",
            "metaconscious",
            "autonomous_sandbox",
            "kinetic_wealth",
            "razor_monitor",
            "prime_ide",
            "prime_architect",
            "nexus_os",
            "cognitive_nexus",
            "spatial_command",
            "motorola_hardware",
            "hardware_sensor",
            "motorola_grid",
            "fractal_expansion",
            "myth_engine",
            "reality_compiler",
            "neurospatial_wormhole",
            "evolution_roadmap",
            "omniverse_hyper",
            "quantum_reality",
            "mlab_daw",
            "dashboard_overview",
            "sector_matrix",
            "omni_singularity",
            "neuroplasticity_engine",
            "environmental_os",
            "earth_observation",
            "cellular_rejuvenation",
            "master_blueprint",
            "environmental_tech",
            "embodied_physical",
            "one_bit_compression",
            "agentic_swarm",
            "predictive_reality",
            "kinetic_haptic",
            "tomodachi_simulation",
            "the_crucible",
            "biological_override",
            "influence_arc",
            "kinetic_resistance",
            "orbital_resonance",
            "activity_logs",
            "temporal_memory",
            "forge_studio",
            "media_forge",
            "directive_vault",
            "semantic_memory",
            "system_settings",
            "stability_monitor",
            "swarm_monitor",
            "swarm_routing",
            "system_health",
            "void_monitor",
            "world_model",
            "abundance_compiler",
            "apex_core",
            "metaconscious_apotheosis",
            "telegram_diagnostics"
          ].includes(activePanel) && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-gray-400 font-mono text-sm max-w-lg bg-[#111] p-6 border border-[#333] rounded-xl text-center">
                <span className="text-amber-500 font-bold mb-4 block inline-flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                  MODULE OFFLINE
                </span>
                The `{activePanel}` sub-routine currently has no dedicated
                execution context. <br />
                <br />
                Please rely on the Cognitive Nexus or God Mode OS for
                cross-referencing capabilities.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </QuantumEngineProvider>
  );
}
