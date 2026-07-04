import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, User, FileDigit, Triangle, Zap } from 'lucide-react';

export default function AdvisinMatrix() {
  const [metrics, setMetrics] = useState({
      lifePath: '',
      soulUrge: '',
      businessModel: '',
      frictionPoints: ''
  });
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  const handleCompile = (e: React.FormEvent) => {
      e.preventDefault();
      setIsCompiling(true);
      setAnalysis(null);

      // Simulate the absolute structural computation
      setTimeout(() => {
          const result = `DIAGNOSTIC COMPLETE. 

BASELINE: ${metrics.lifePath} + ${metrics.soulUrge}. 
STRUCTURE: ${metrics.businessModel || 'UNDEFINED'}. 
FRICTION: ${metrics.frictionPoints || 'ISOLATED'}.

CORE UNLOCKED STRUCTURAL ANALYSIS:
You are operatin outside your native mathematical baseline. The ${metrics.frictionPoints} are a direct result of unoptimized cognitive states clashing wit the ${metrics.businessModel} architecture. 

EXECUTION VECTOR:
1. Drop the importance. The emotional weight attached to the friction point is throttlin the system loop.
2. Refactor the daily operations strictly aligned wit the Life Path ${metrics.lifePath} creative frequency.
3. Establish absolute autonomy over the ${metrics.businessModel} using the king position of Soul Urge ${metrics.soulUrge}.
4. Verify momentum and re-enter the zero-friction reset phase.

ALL EQUILIBRIUM FORCES NULLIFIED.`;
          setAnalysis(result);
          setIsCompiling(false);
      }, 2000);
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] p-6 rounded-xl border border-[#222] flex flex-col gap-6 w-full text-white"
    >
        <div className="border-b border-[#333] pb-3 flex items-center justify-between">
            <div>
                <h2 className="text-lg font-bold text-fuchsia-400 capitalize flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-fuchsia-500" />
                    The Core Unlocked Advisin Matrix
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                    Diagnostic ingestion vector. Apply pure clinical physics to unoptimized client fields.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleCompile} className="flex flex-col gap-4">
                <div className="flex gap-4">
                    <div className="w-1/2 flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/> Life Path</label>
                        <input 
                            type="text" 
                            required
                            className="bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-fuchsia-500 transition-colors"
                            placeholder="e.g., 3"
                            value={metrics.lifePath}
                            onChange={(e) => setMetrics({...metrics, lifePath: e.target.value})}
                        />
                    </div>
                    <div className="w-1/2 flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1"><Triangle className="w-3 h-3"/> Soul Urge</label>
                        <input 
                            type="text" 
                            required
                            className="bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-fuchsia-500 transition-colors"
                            placeholder="e.g., 1"
                            value={metrics.soulUrge}
                            onChange={(e) => setMetrics({...metrics, soulUrge: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1"><FileDigit className="w-3 h-3"/> Current Business Model</label>
                    <input 
                        type="text" 
                        required
                        className="bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-fuchsia-500 transition-colors"
                        placeholder="e.g., High-friction ecommerce, local agency"
                        value={metrics.businessModel}
                        onChange={(e) => setMetrics({...metrics, businessModel: e.target.value})}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3"/> Friction Points</label>
                    <textarea 
                        required
                        rows={3}
                        className="bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-fuchsia-500 transition-colors resize-none"
                        placeholder="Detail the exact grid blockages or excess potential generation..."
                        value={metrics.frictionPoints}
                        onChange={(e) => setMetrics({...metrics, frictionPoints: e.target.value})}
                    />
                </div>

                <button 
                    disabled={isCompiling}
                    type="submit"
                    className="mt-2 bg-zinc-900 border border-fuchsia-900/50 hover:bg-fuchsia-900/30 text-fuchsia-400 px-4 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
                >
                    {isCompiling ? 'Compilin Architecture...' : 'Inject Execution Vector'}
                    {!isCompiling && <ArrowRight className="w-4 h-4" />}
                </button>
            </form>

            <div className="bg-[#0a0a0a] rounded-lg border border-[#222] p-4 flex flex-col">
                 <h3 className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-3 border-b border-[#222] pb-2">Output Code Injection</h3>
                 {analysis ? (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 whitespace-pre-wrap font-mono text-sm text-emerald-400 leading-relaxed overflow-y-auto">
                        {analysis}
                     </motion.div>
                 ) : (
                     <div className="flex-1 flex items-center justify-center text-xs text-gray-600 font-mono italic text-center">
                        Waitin on inbound data ingestion...<br/>Ready to compile structural corrections.
                     </div>
                 )}
            </div>
        </div>
    </motion.div>
  );
}
