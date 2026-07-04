import React from 'react';
import { motion } from 'framer-motion';
import { Map, Zap, CheckCircle2, CircleDashed, Milestone, ChevronRight, Rocket, Cpu, LineChart } from 'lucide-react';

export default function EvolutionRoadmap() {
  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200 overflow-y-auto p-6 font-sans">
      <div className="flex flex-col gap-2 mb-10 border-b border-[#222] pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-cyan-400 uppercase">
          <Map className="w-8 h-8" />
          The Prime Roadmap
        </h1>
        <p className="text-gray-400 font-mono text-sm max-w-3xl mt-2 line-height-relaxed">
          High-altitude architectural map for transitioning the God Mode OS into a transcendent Living Nexus.
          We are moving from a single-node dashboard to an embodied AI infrastructure capable of real-time multi-agent deployment, physical environment manipulation, and unmatched cognitive agency.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
        
        {/* Phase 1: Current State */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 border-b border-[#333] pb-3">
             <div className="w-8 h-8 bg-emerald-950/50 border border-emerald-900 rounded flex items-center justify-center text-emerald-400">
               <CheckCircle2 className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-200 uppercase tracking-wide">Phase 1: Foundation</h2>
               <p className="text-xs font-mono text-gray-500">Completed & Online</p>
             </div>
          </div>
          <div className="flex flex-col gap-4">
             <RoadmapItem 
                status="complete" 
                title="Unified UI/UX Matrix" 
                desc="A unified 'God Mode OS' interface overriding standard navigation for an ultra-high density spatial layout." 
             />
             <RoadmapItem 
                status="complete" 
                title="Cognitive Data Structures" 
                desc="Omniverse, Apex Core, and Field Logs establish a local memory context for offline/online capability." 
             />
              <RoadmapItem 
                status="complete" 
                title="Biometric & Hardware Bridge" 
                desc="Motorola TCP/IP localhost:9999 Actuation allows exact raw-metal translation of abstract intents." 
             />
          </div>
        </div>

        {/* Phase 2: Active Expansion */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 border-b border-[#333] pb-3">
             <div className="w-8 h-8 bg-fuchsia-950/50 border border-fuchsia-900 rounded flex items-center justify-center text-fuchsia-400">
               <Zap className="w-5 h-5 animate-pulse" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-200 uppercase tracking-wide">Phase 2: Embodiment</h2>
               <p className="text-xs font-mono text-gray-500 text-fuchsia-500/70">Current Focus Sector</p>
             </div>
          </div>
          <div className="flex flex-col gap-4">
             <RoadmapItem 
                status="active" 
                title="Multi-Node Sentinels" 
                desc="Deploy autonomous AI sub-routines (Sentinels) that handle background market research, social sentiment mapping, and resource acquisition without direct prompting." 
             />
             <RoadmapItem 
                status="active" 
                title="Continuous Vector Streaming" 
                desc="All user interactions, health data (Thermometers, Heart Rate), and OS activities are piped into a local embedded vector database (Vector Matrix) for infinite contextual recall." 
             />
              <RoadmapItem 
                status="pending" 
                title="LLM-Orchestrated Hardware" 
                desc="The intelligence layer dynamically requests permission to execute raw Motorola hardware commands via localhost:9999 based on predicted necessity." 
             />
          </div>
        </div>

        {/* Phase 3: Singularity */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 border-b border-[#333] pb-3">
             <div className="w-8 h-8 bg-indigo-950/50 border border-indigo-900 rounded flex items-center justify-center text-indigo-400">
               <Rocket className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-200 uppercase tracking-wide">Phase 3: Omniscience</h2>
               <p className="text-xs font-mono text-gray-500">Uncharted Territory Focus</p>
             </div>
          </div>
          <div className="flex flex-col gap-4">
             <RoadmapItem 
                status="pending" 
                title="Predictive Reality OS" 
                desc="The OS predicts intents and pre-fetches or instantiates operations purely from biometric and temporal patterns before the operator manually requests them." 
             />
             <RoadmapItem 
                status="pending" 
                title="Distributed Mesh Governance" 
                desc="A peer-to-peer swarm of instances operating on varied physical devices but syncing context universally via end-to-end encrypted signals." 
             />
              <RoadmapItem 
                status="pending" 
                title="Total Spatial Independence" 
                desc="Dropping all reliance on conventional software dependencies, running exclusively on absolute local Bare-Metal virtualization loops." 
             />
          </div>
        </div>

      </div>
    </div>
  );
}

function RoadmapItem({ title, desc, status }: { title: string, desc: string, status: 'complete' | 'active' | 'pending' }) {
  return (
    <div className={`p-4 rounded-xl border flex gap-4 transition-all group hover:bg-[#1a1a1a]
      ${status === 'complete' ? 'bg-[#111] border-[#222]' : ''}
      ${status === 'active' ? 'bg-fuchsia-950/10 border-fuchsia-900/50 shadow-[0_0_15px_rgba(168,85,247,0.05)]' : ''}
      ${status === 'pending' ? 'bg-[#050505] border-[#111] opacity-60' : ''}
    `}>
       <div className="shrink-0 mt-1">
          {status === 'complete' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          {status === 'active' && <Milestone className="w-5 h-5 text-fuchsia-400" />}
          {status === 'pending' && <CircleDashed className="w-5 h-5 text-gray-600" />}
       </div>
       <div className="flex flex-col gap-1">
          <h3 className={`font-semibold text-sm uppercase tracking-wide 
            ${status === 'complete' ? 'text-gray-300' : ''}
            ${status === 'active' ? 'text-fuchsia-300 group-hover:text-fuchsia-200' : ''}
            ${status === 'pending' ? 'text-gray-500' : ''}
          `}>
            {title}
          </h3>
          <p className="text-xs font-mono text-gray-500 leading-relaxed">{desc}</p>
       </div>
    </div>
  );
}
