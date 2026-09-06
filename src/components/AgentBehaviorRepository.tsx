import { useState, useEffect } from 'react';
import { Sparkles, Brain, Cpu, Code, Database, ChevronRight, Play, CheckCircle2, Copy, Download, RefreshCw, Layers, ShieldAlert, Heart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Archetypes
export interface BehaviorArchetype {
  id: string;
  name: string;
  description: string;
  aggression: number;
  defense: number;
  range: number;
  grapple: number;
  risk: number;
  patience: number;
  showmanship: number;
  locomotion: {
    gaitType: 'heavy_plodding' | 'athletic_bouncy' | 'methodical_stalker' | 'erratic_fidgety';
    armSwing: number; // 0.0 to 1.0
    swayFrequency: number; // Hz
    cadence: number; // steps/min
  };
}

const ARCHETYPES: BehaviorArchetype[] = [
  {
    id: 'powerhouse',
    name: 'Powerhouse (Colossus)',
    description: 'Slow, high-impact grapple focus. Relies on supreme physical conditioning and crushing slams rather than speed.',
    aggression: 0.65,
    defense: 0.80,
    range: 0.30,
    grapple: 0.95,
    risk: 0.20,
    patience: 0.70,
    showmanship: 0.60,
    locomotion: {
      gaitType: 'heavy_plodding',
      armSwing: 0.35,
      swayFrequency: 0.8,
      cadence: 90
    }
  },
  {
    id: 'brawler',
    name: 'Brawler (Street Fighter)',
    description: 'High-intensity strike exchanges. Completely disregards defense to maximize pressure and stun build-up.',
    aggression: 0.95,
    defense: 0.25,
    range: 0.40,
    grapple: 0.50,
    risk: 0.75,
    patience: 0.20,
    showmanship: 0.80,
    locomotion: {
      gaitType: 'erratic_fidgety',
      armSwing: 0.70,
      swayFrequency: 1.6,
      cadence: 135
    }
  },
  {
    id: 'striker',
    name: 'Striker (Martial Artist)',
    description: 'Precise standing combat. Uses swift kicks, elbows, and space-checking distance management to pick opponents apart.',
    aggression: 0.80,
    defense: 0.60,
    range: 0.85,
    grapple: 0.30,
    risk: 0.50,
    patience: 0.65,
    showmanship: 0.50,
    locomotion: {
      gaitType: 'methodical_stalker',
      armSwing: 0.50,
      swayFrequency: 1.1,
      cadence: 110
    }
  },
  {
    id: 'technician',
    name: 'Technician (Submission Specialist)',
    description: 'Methodical, counter-driven master. Fishes for reversals and works specific body parts for rapid tap-outs.',
    aggression: 0.40,
    defense: 0.90,
    range: 0.50,
    grapple: 0.85,
    risk: 0.30,
    patience: 0.95,
    showmanship: 0.40,
    locomotion: {
      gaitType: 'methodical_stalker',
      armSwing: 0.40,
      swayFrequency: 0.9,
      cadence: 105
    }
  },
  {
    id: 'high_flyer',
    name: 'High Flyer (Acrobat)',
    description: 'Extreme-risk acrobatic aerialist. Uses ropes, springboards, and top-rope dives to attack from unexpected angles.',
    aggression: 0.70,
    defense: 0.35,
    range: 0.90,
    grapple: 0.20,
    risk: 0.95,
    patience: 0.40,
    showmanship: 0.90,
    locomotion: {
      gaitType: 'athletic_bouncy',
      armSwing: 0.85,
      swayFrequency: 1.4,
      cadence: 125
    }
  },
  {
    id: 'free_agent',
    name: 'Free Agent (Balanced)',
    description: 'Adaptive all-rounder with dynamic AI priority weighting that shifts mid-fight based on momentum swings.',
    aggression: 0.50,
    defense: 0.50,
    range: 0.50,
    grapple: 0.50,
    risk: 0.50,
    patience: 0.50,
    showmanship: 0.50,
    locomotion: {
      gaitType: 'athletic_bouncy',
      armSwing: 0.60,
      swayFrequency: 1.2,
      cadence: 115
    }
  }
];

interface AgentBehaviorRepositoryProps {
  currentTraits?: string[];
  currentInjuries?: {
    head: number;
    torso: number;
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
  };
  onApplyTraits?: (traits: string[]) => void;
  superstarName?: string;
}

export function AgentBehaviorRepository({
  currentTraits = [],
  currentInjuries = { head: 0, torso: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 },
  onApplyTraits,
  superstarName = 'Superstar'
}: AgentBehaviorRepositoryProps) {
  const [activeArchetype, setActiveArchetype] = useState<string>('free_agent');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [pipelineActiveTab, setPipelineActiveTab] = useState<'json' | 'cpp_headers' | 'scoring_weights'>('json');
  const [gaitAnimateFrame, setGaitAnimateFrame] = useState(0);

  // Parse local values based on archetype weights or customized traits
  const getTraitVal = (name: string, archFallback: number): number => {
    const found = currentTraits.find(t => t.startsWith(`${name}:`));
    if (!found) return archFallback;
    return parseFloat(found.split(':')[1]) ?? archFallback;
  };

  const agg = getTraitVal('aggression', 0.5);
  const def = getTraitVal('defense', 0.5);
  const ran = getTraitVal('range', 0.5);
  const gra = getTraitVal('grapple', 0.5);
  const rsk = getTraitVal('risk', 0.5);
  const pat = getTraitVal('patience', 0.5);
  const sho = getTraitVal('showmanship', 0.5);

  // Locate current locomotion settings based on active archetype
  const currentArchObj = ARCHETYPES.find(a => a.id === activeArchetype) || ARCHETYPES[5];
  const { gaitType, armSwing, swayFrequency, cadence } = currentArchObj.locomotion;

  // Compute live derived scoring multipliers
  const derivedScoring = {
    StrikeChanceMultiplier: (0.5 + agg * 1.5).toFixed(2),
    ComboChainingLikelihood: (agg * 100).toFixed(0) + '%',
    BlockHoldDurationMax: (1.5 + def * 3.5).toFixed(1) + 's',
    DodgevsBlockRatio: (def > 0.6 ? '30/70' : '65/35'),
    PreferredDistanceUnits: (50 + ran * 350).toFixed(0) + ' Unreal Units',
    ClinchEngagementRate: (gra * 100).toFixed(0) + '%',
    SpringboardAttemptFrequency: (rsk > 0.7 ? 'HIGH' : rsk > 0.4 ? 'MEDIUM' : 'LOW'),
    TopRopeDiveProbability: (rsk * 100).toFixed(0) + '%',
    CounterFishingDelaySeconds: (1.5 - pat * 1.2).toFixed(2) + 's',
    WakeUpTauntFrequency: (sho > 0.7 ? 'AGGRESSIVE' : sho > 0.3 ? 'SITUATIONAL' : 'NEVER'),
    CrowdBuzzRegenFactor: (1.0 + sho * 1.5).toFixed(2) + 'x'
  };

  // Gait stick figure animation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setGaitAnimateFrame(f => (f + 1) % 360);
    }, 1000 / 60); // 60fps physics tick
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(label);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const applyArchetype = (arch: BehaviorArchetype) => {
    setActiveArchetype(arch.id);
    if (onApplyTraits) {
      const traitList = [
        `aggression:${arch.aggression.toFixed(2)}`,
        `defense:${arch.defense.toFixed(2)}`,
        `range:${arch.range.toFixed(2)}`,
        `grapple:${arch.grapple.toFixed(2)}`,
        `risk:${arch.risk.toFixed(2)}`,
        `patience:${arch.patience.toFixed(2)}`,
        `showmanship:${arch.showmanship.toFixed(2)}`
      ];
      onApplyTraits(traitList);
    }
  };

  // Generate clean C++ compatible JSON pipeline
  const jsonPipelinePayload = {
    $schema: "https://ottr.wrestling/schemas/bannon_ai_dna.json",
    agentId: superstarName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    metadata: {
      version: "1.5.0",
      targetEngine: "UnrealEngine_5.4",
      lastCompiled: new Date().toISOString(),
      author: "BANNON HTML Client Runtime"
    },
    subTraits: [
      `aggression:${agg.toFixed(2)}`,
      `defense:${def.toFixed(2)}`,
      `range:${ran.toFixed(2)}`,
      `grapple:${gra.toFixed(2)}`,
      `risk:${rsk.toFixed(2)}`,
      `patience:${pat.toFixed(2)}`,
      `showmanship:${sho.toFixed(2)}`
    ],
    locomotionModulators: {
      gaitType: gaitType,
      fArmSwingIntensity: armSwing,
      fSwayFrequencyHz: swayFrequency,
      nTargetCadenceBpm: cadence,
      fLimpWeightModifier: ((currentInjuries.leftLeg + currentInjuries.rightLeg) * 0.005).toFixed(3)
    },
    derivedCPlusPlusAttributes: {
      fStrikeSpeedModifier: (1.0 + agg * 0.15 - (currentInjuries.leftArm + currentInjuries.rightArm) * 0.001).toFixed(4),
      fBlockCapacity: (100 + def * 30 - currentInjuries.torso * 0.2).toFixed(1),
      fReversalWindowFrames: (12 + pat * 6 - currentInjuries.head * 0.05).toFixed(1),
      fStunThreshold: Math.max(10, 100 - currentInjuries.head * 0.5 - currentInjuries.torso * 0.1).toFixed(1),
      fStaminaRecoveryMultiplier: Math.max(0.2, 1.0 - currentInjuries.torso * 0.004 - currentInjuries.leftLeg * 0.001).toFixed(3)
    }
  };

  const jsonString = JSON.stringify(jsonPipelinePayload, null, 2);

  const cppHeaderString = `// Fill out your copyright notice in the Description page of Project Settings.
#pragma once

#include "CoreMinimal"
#include "GameplayTagContainer.h"
#include "Engine/DataTable.h"
#include "BannonAgentBehavior.generated.h"

UENUM(BlueprintType)
enum class EGaitType : uint8
{
    HeavyPlodding   UMETA(DisplayName = "Heavy Plodding"),
    AthleticBouncy  UMETA(DisplayName = "Athletic Bouncy"),
    MethodicalStalker UMETA(DisplayName = "Methodical Stalker"),
    ErraticFidgety  UMETA(DisplayName = "Erratic Fidgety")
};

USTRUCT(BlueprintType)
struct FBannonAgentDNASave : public FTableRowBase
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Agent Behavior")
    FName AgentID;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Agent Behavior")
    TArray<FString> SubTraits; // Mapped "aggression:0.80" weights

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Locomotion")
    EGaitType GaitStyle;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Locomotion")
    float ArmSwingIntensity;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Locomotion")
    float LimpModifier; // Dynamic limb-damage gait translation

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "AI Scoring Engine")
    float StrikeChanceMultiplier;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "AI Scoring Engine")
    float ReversalWindowFrames;
};`;

  // Draw real-time dynamic gait diagram simulating injury-limp influence
  const renderGaitCanvas = () => {
    const scale = 1.0;
    const legInjuryTotal = currentInjuries.leftLeg + currentInjuries.rightLeg;
    const speedCoeff = Math.max(0.3, 1.0 - legInjuryTotal * 0.005);
    const speed = cadence * speedCoeff;
    const angle = (gaitAnimateFrame * (speed / 100)) % 360;
    const rad = (angle * Math.PI) / 180;
    
    // Joint coordinates
    const hipX = 120;
    const hipY = 80;
    
    // Limp amplitude
    const limpAmount = (legInjuryTotal / 100) * 12;
    const limpYOffset = Math.sin(rad) * limpAmount;
    
    const headX = hipX + Math.sin(rad * 0.5) * 3;
    const headY = 25 + limpYOffset * 0.2;
    
    // Knee and ankle motions
    const lKneeX = hipX - 15 * Math.sin(rad) - (currentInjuries.leftLeg > 0 ? 5 : 0);
    const lKneeY = hipY + 25 + 5 * Math.cos(rad);
    const lAnkleX = lKneeX + 5 * Math.sin(rad * 2);
    const lAnkleY = lKneeY + 25 + Math.max(0, 8 * Math.cos(rad));
    
    const rKneeX = hipX + 15 * Math.sin(rad);
    const rKneeY = hipY + 25 - 5 * Math.cos(rad) + limpYOffset;
    const rAnkleX = rKneeX - 5 * Math.sin(rad * 2);
    const rAnkleY = rKneeY + 25 - Math.max(0, 8 * Math.cos(rad)) + limpYOffset * 0.5;

    return (
      <svg className="w-full h-44 bg-neutral-950 border border-neutral-800 rounded-lg" viewBox="0 0 240 180" id="gait-canvas-svg">
        {/* Ground grid */}
        <line x1="20" y1="140" x2="220" y2="140" stroke="#333" strokeWidth="2" strokeDasharray="4" />
        
        {/* Head */}
        <circle cx={headX} cy={headY} r="10" fill="#4f46e5" stroke="#818cf8" strokeWidth="1.5" />
        
        {/* Spine/Torso */}
        <line x1={headX} y1={headY + 10} x2={hipX} y2={hipY} stroke="#818cf8" strokeWidth="3" />
        
        {/* Left Leg (Reddish if injured) */}
        <line 
          x1={hipX} 
          y1={hipY} 
          x2={lKneeX} 
          y2={lKneeY} 
          stroke={currentInjuries.leftLeg > 40 ? '#ef4444' : currentInjuries.leftLeg > 0 ? '#fbbf24' : '#38bdf8'} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
        <line 
          x1={lKneeX} 
          y1={lKneeY} 
          x2={lAnkleX} 
          y2={lAnkleY} 
          stroke={currentInjuries.leftLeg > 40 ? '#ef4444' : currentInjuries.leftLeg > 0 ? '#fbbf24' : '#38bdf8'} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* Right Leg (Reddish if injured) */}
        <line 
          x1={hipX} 
          y1={hipY} 
          x2={rKneeX} 
          y2={rKneeY} 
          stroke={currentInjuries.rightLeg > 40 ? '#f87171' : currentInjuries.rightLeg > 0 ? '#fbbf24' : '#60a5fa'} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          opacity="0.8"
        />
        <line 
          x1={rKneeX} 
          y1={rKneeY} 
          x2={rAnkleX} 
          y2={rAnkleY} 
          stroke={currentInjuries.rightLeg > 40 ? '#f87171' : currentInjuries.rightLeg > 0 ? '#fbbf24' : '#60a5fa'} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          opacity="0.8"
        />
        
        {/* Arms (Swing based on intensity) */}
        <line x1={headX} y1={headY + 12} x2={hipX - 10 * Math.sin(rad) * armSwing} y2={hipY + 10} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        <line x1={headX} y1={headY + 12} x2={hipX + 10 * Math.sin(rad) * armSwing} y2={hipY + 10} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

        {/* Labels overlay */}
        <text x="15" y="25" className="fill-neutral-500 font-mono text-[8px] uppercase font-bold">LOCO gait sway analysis</text>
        <text x="15" y="37" className="fill-indigo-400 font-mono text-[9px] font-bold">Cadence: {speed.toFixed(0)} BPM</text>
        
        {legInjuryTotal > 0 && (
          <g>
            <text x="150" y="25" className="fill-red-400 font-mono text-[8px] uppercase font-bold animate-pulse">⚠️ Limb Injury Active</text>
            <text x="150" y="37" className="fill-neutral-400 font-mono text-[7px]">Limp amplitude: {limpAmount.toFixed(1)}px</text>
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-6" id="agent-behavior-repository-root">
      
      {/* Header Info */}
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Local Agent Behavior Repository</h3>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Store, preset, and modularize behavioral models. Generates real-time C++ compile-ready payloads to sync client ring psychology directly with your Unreal Engine build.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Archetypes Selection (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Archetypes Registry ({ARCHETYPES.length})</span>
            <span className="text-[8px] font-mono bg-neutral-950 border border-neutral-800 text-indigo-400 font-bold px-2 py-0.5 rounded uppercase">BANNON Canonical</span>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
            {ARCHETYPES.map(arch => {
              const isSelected = activeArchetype === arch.id;
              return (
                <button
                  key={arch.id}
                  onClick={() => applyArchetype(arch)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    isSelected 
                      ? 'bg-indigo-600/10 border-indigo-500 shadow' 
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase">{arch.name}</span>
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                      Gait: {arch.locomotion.gaitType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">{arch.description}</p>
                  
                  {/* Axis indicators list */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {[
                      { l: 'Agg', v: arch.aggression },
                      { l: 'Def', v: arch.defense },
                      { l: 'Rng', v: arch.range },
                      { l: 'Gpl', v: arch.grapple },
                      { l: 'Rsk', v: arch.risk },
                      { l: 'Pat', v: arch.patience },
                      { l: 'Shw', v: arch.showmanship }
                    ].map(axis => (
                      <span key={axis.l} className="text-[8px] font-mono px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded">
                        {axis.l}:<strong className="text-indigo-300">{(axis.v * 100).toFixed(0)}</strong>
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Locomotion & Gait Modulation View */}
          <div className="border-t border-neutral-800 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">LOCO Locomotion Modulator</span>
              <span className="text-[8px] font-mono text-neutral-500 uppercase">{gaitType.toUpperCase()} gait</span>
            </div>
            {renderGaitCanvas()}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-neutral-950 border border-neutral-800 p-2.5 rounded-lg">
              <div>
                <span className="text-[8px] block text-neutral-500 uppercase font-bold">Arm Swing</span>
                <span className="text-white font-mono block mt-0.5">{(armSwing * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-[8px] block text-neutral-500 uppercase font-bold">Sway Freq</span>
                <span className="text-white font-mono block mt-0.5">{swayFrequency} Hz</span>
              </div>
              <div>
                <span className="text-[8px] block text-neutral-500 uppercase font-bold">Base Cadence</span>
                <span className="text-white font-mono block mt-0.5">{cadence} steps/m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: JSON Pipeline and Header Generator (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col justify-between min-h-[480px]">
          
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl flex-1 flex flex-col overflow-hidden">
            
            {/* Tab selection */}
            <div className="flex border-b border-neutral-800 bg-neutral-950 p-2 gap-1">
              {[
                { id: 'json', label: 'JSON Payload', icon: <Database className="w-3.5 h-3.5" /> },
                { id: 'cpp_headers', label: 'C++ Ingest Struct', icon: <Code className="w-3.5 h-3.5" /> },
                { id: 'scoring_weights', label: 'Scoring Weights', icon: <Activity className="w-3.5 h-3.5" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPipelineActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
                    pipelineActiveTab === tab.id
                      ? 'bg-neutral-900 text-white border-b-2 border-indigo-500'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pipeline Viewer Body */}
            <div className="p-4 flex-1 overflow-auto max-h-[440px] no-scrollbar">
              <AnimatePresence mode="wait">
                {pipelineActiveTab === 'json' && (
                  <motion.div
                    key="tab-body-json"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 animate-pulse" /> Serialized client-to-game stream
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(jsonString, 'json')}
                          className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold text-neutral-300 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedIndex === 'json' ? 'Copied!' : 'Copy'}
                        </button>
                        <a
                          href={`data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`}
                          download={`${jsonPipelinePayload.agentId}_dna.json`}
                          className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold text-neutral-300 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    </div>
                    <pre className="text-[10px] font-mono text-neutral-300 bg-neutral-900/50 p-3 rounded-lg border border-neutral-850 overflow-x-auto whitespace-pre leading-relaxed select-all">
                      {jsonString}
                    </pre>
                  </motion.div>
                )}

                {pipelineActiveTab === 'cpp_headers' && (
                  <motion.div
                    key="tab-body-cpp"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-green-400 uppercase font-bold flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Unreal Engine 5.4 USTRUCT Definition
                      </span>
                      <button
                        onClick={() => handleCopy(cppHeaderString, 'cpp')}
                        className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold text-neutral-300 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedIndex === 'cpp' ? 'Copied!' : 'Copy String'}
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono text-emerald-300/90 bg-neutral-900/50 p-3 rounded-lg border border-neutral-850 overflow-x-auto whitespace-pre leading-relaxed select-all">
                      {cppHeaderString}
                    </pre>
                  </motion.div>
                )}

                {pipelineActiveTab === 'scoring_weights' && (
                  <motion.div
                    key="tab-body-scoring"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                      <h4 className="text-xs font-bold text-white uppercase mb-2">Live C++ AI Weight Evaluations</h4>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        The weights below represent how the active 7-axis BANNON_AI_DNA is converted inside the C++ combat behavior tree to drive real-time agent tactics.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {Object.entries(derivedScoring).map(([nodeName, val]) => (
                        <div key={nodeName} className="bg-neutral-900 p-2.5 rounded border border-neutral-850 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="block font-mono text-indigo-300 font-bold">{nodeName}</span>
                            <span className="text-[9px] text-neutral-500 uppercase mt-0.5">Behavior Tree Node</span>
                          </div>
                          <span className="font-mono text-white font-bold px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick compiler diagnostic feedback */}
            <div className="p-3.5 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-neutral-400">UE5 LiveLink C++ Ingestion Stream</span>
              </div>
              <span className="text-green-400 font-bold">READY TO BOOT</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
