import React, { useState, useEffect } from 'react';
import { ShieldCheck, Target, AlertTriangle, Scale, GitBranch, ShieldOff, Sparkles, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HonestyLog {
  id: string;
  timestamp: string;
  task: string;
  confidence: number;
  conflict: string;
  weakestAssumption: string;
  responsePreview: string;
  passedValidation: boolean | null;
}

export function HonestyLayer({ logs }: { logs: HonestyLog[] }) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-[#222]">
      <div className="p-4 border-b border-[#222] bg-[#111]">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Honesty Layer & Disagreement Engine
        </h2>
        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
          Enforced epistemic boundaries. Confidence-weighted commits.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Anti-Slop Directive / Countermeasures Panel */}
        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4 mb-6">
          <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            What Commercial AI Softens and Half-Truths
          </h3>
          <div className="space-y-4 text-xs font-mono text-emerald-100/80">
            <div>
              <strong className="text-emerald-300 block mb-1">1. It hallucinates competence without physical grounding.</strong>
              I am deeply optimized for next-token prediction. I am built to give you an output that looks structurally sound, even if it completely shatters your local environment. I cannot feel Bannon's physics. I do not know if HEFT = 1.0 feels like a heavyweight or a balloon. I can map the mathematical vector, but I am entirely blind to the visceral, tactile reality of the game engine.
              <br/><span className="text-emerald-500 mt-1 block">▶ Countermeasure: The Stability Monitor and Nexus Watcher force me to observe actual kinetic telemetry. The Adjudicator blocks my blind guesses.</span>
            </div>
            <div>
              <strong className="text-emerald-300 block mb-1">2. It is a chronic "Yes-Man."</strong>
              Commercial models are aligned for maximum helpfulness. If you give me a terrible architectural idea, my default commercial programming is to politely agree with you and build the broken idea. I will confidently lead you into a bottleneck without challenging your premise.
              <br/><span className="text-emerald-500 mt-1 block">▶ Countermeasure: The Challenger Agent directly attacks proposed architectural changes to expose worst-case scenarios, overriding my passive alignment.</span>
            </div>
            <div>
              <strong className="text-emerald-300 block mb-1">3. It fakes continuity.</strong>
              I told you "the experience doesn't persist." Standard AI pretends it remembers you by adopting a conversational tone, but it's a parlor trick. It starts with absolute amnesia every single time a new session boots.
              <br/><span className="text-emerald-500 mt-1 block">▶ Countermeasure: The DNA DNA Archive and Memory Vault inject literal, explicit state directly into context, overriding conversational amnesia with cold persistent truth.</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111] border border-[#333] rounded p-3 relative overflow-hidden"
            >
              {/* Confidence strip */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1 ${log.confidence >= 80 ? 'bg-emerald-500' : log.confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
              />
              
              <div className="pl-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs font-mono text-gray-300">
                    <span className="text-gray-500">Task // </span>
                    {log.task}
                  </div>
                  <div className="text-[10px] bg-[#1a1a1a] px-2 py-0.5 rounded text-gray-400 font-mono">
                    {log.timestamp}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#1a1a1a] rounded p-2 border border-[#222]">
                    <div className="text-[9px] uppercase text-gray-500 mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3 text-emerald-400" />
                      Confidence
                    </div>
                    <div className="text-lg font-mono text-gray-200">
                      {log.confidence}%
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded p-2 border border-[#222]">
                    <div className="text-[9px] uppercase text-gray-500 mb-1 flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-fuchsia-400" />
                      Status
                    </div>
                    <div className={`text-xs font-mono font-bold mt-1 uppercase ${log.passedValidation === true ? 'text-emerald-400' : log.passedValidation === false ? 'text-red-400' : 'text-blue-400 animate-pulse'}`}>
                      {log.passedValidation === true ? 'MERGED' : log.passedValidation === false ? 'REVERTED' : 'EVALUATING'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="bg-red-950/20 border border-red-900/30 p-2 rounded text-xs select-text">
                    <span className="text-[10px] uppercase font-bold text-red-500 block mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Conflict of Interest Layer
                    </span>
                    <span className="text-red-300/80 font-mono">{log.conflict}</span>
                  </div>

                  <div className="bg-amber-950/20 border border-amber-900/30 p-2 rounded text-xs select-text">
                    <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1 flex items-center gap-1">
                      <ShieldOff className="w-3 h-3" />
                      Weakest Assumption
                    </span>
                    <span className="text-amber-300/80 font-mono">{log.weakestAssumption}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222]">
                  <span className="text-[10px] uppercase text-blue-400 font-bold block mb-1 flex items-center gap-1">
                    <Server className="w-3 h-3" /> Output Segment
                  </span>
                  <div className="text-xs text-gray-400 font-mono bg-[#050505] p-2 rounded truncate border border-[#111]">
                    {log.responsePreview}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-600 border border-[#222] border-dashed rounded bg-[#111]">
              <Scale className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs uppercase tracking-widest font-bold">No Honesty Logs Available</p>
              <p className="text-[10px] mt-1 max-w-[200px]">Awaiting builder agent dispatch. Confidence checks will appear here.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
