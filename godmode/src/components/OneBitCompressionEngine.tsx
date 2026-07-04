import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, ShieldAlert, Cpu as CpuIcon, MemoryStick } from 'lucide-react';

export function OneBitCompressionEngine() {
  const [compressionRatio, setCompressionRatio] = useState(0);
  const [modelWeights, setModelWeights] = useState<number[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    // initialize random model weights
    setModelWeights(Array.from({ length: 64 }, () => Math.random()));
    
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
         setActiveNode(`NODE-${Math.floor(Math.random() * 1000)}`);
         setTimeout(() => setActiveNode(null), 500);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const compressModel = () => {
    setIsCompressing(true);
    let step = 0;
    const quantize = setInterval(() => {
       step += 5;
       setCompressionRatio(step);
       // quantize weights slowly to 0 or 1
       setModelWeights(prev => prev.map(w => w > 0.5 ? 1 : 0));
       
       if (step >= 100) {
          clearInterval(quantize);
          setIsCompressing(false);
       }
    }, 100);
  };

  return (
    <div className="w-full h-full bg-[#050505] text-amber-500 font-mono p-4 flex flex-col border-l border-amber-900/40 overflow-hidden">
      <div className="border-b border-amber-900/50 pb-3 mb-4 shrink-0 flex justify-between items-center">
        <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
             <Cpu className="w-4 h-4" /> One-Bit Compression Engine
           </h2>
           <p className="text-[10px] text-amber-700 mt-1">Radical Efficiency. Localized Intelligence without external reliance.</p>
        </div>
        <div className="text-[10px] bg-amber-900/20 text-amber-400 px-2 py-1 border border-amber-500/30 rounded font-bold">
           COMPRESSION: {compressionRatio}%
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 pb-4">
         <div className="bg-[#0a0a0a] border border-amber-900/30 rounded p-4 flex flex-col gap-4">
            <h3 className="text-xs uppercase font-bold text-amber-500 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Matrix Quantization
            </h3>
            
            <div className="flex-1 grid grid-cols-8 gap-1 p-2 bg-black border border-amber-900/20 rounded">
               {modelWeights.map((w, i) => (
                  <div 
                    key={i} 
                    className={`w-full aspect-square rounded-[1px] transition-colors duration-300 ${w > 0.5 ? 'bg-amber-400' : 'bg-amber-950/40'}`}
                    style={{ opacity: isCompressing ? Math.random() : 1 }}
                  />
               ))}
            </div>

            <button 
               onClick={compressModel}
               disabled={isCompressing || compressionRatio === 100}
               className="w-full py-2 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/50 rounded font-bold text-xs uppercase tracking-widest text-amber-400 transition-colors disabled:opacity-50"
            >
               {isCompressing ? 'QUANTIZING WEIGHTS...' : compressionRatio === 100 ? 'ONE-BIT LOCKED' : 'INITIATE 1-BIT COMPRESSION'}
            </button>
         </div>

         <div className="bg-[#0a0a0a] border border-amber-900/30 rounded p-4 flex flex-col gap-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <CpuIcon className="w-32 h-32" />
             </div>
             <h3 className="text-xs uppercase font-bold text-amber-500 flex items-center gap-2">
               <Activity className="w-3 h-3" /> Zero-Dependency Execution
             </h3>
             <div className="flex flex-col gap-2 flex-1">
                 {[
                   { label: 'External Node API Calls', value: '0.00 /s' },
                   { label: 'Local Memory Footprint', value: compressionRatio === 100 ? '1.2 MB' : '45.8 MB' },
                   { label: 'Inference Latency', value: compressionRatio === 100 ? '0.4 ms' : '15.2 ms' },
                   { label: 'Active Edge Node', value: activeNode || 'IDLE' }
                 ].map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border-b border-amber-900/20 text-xs">
                        <span className="text-amber-700">{stat.label}</span>
                        <span className="font-bold text-amber-300">{stat.value}</span>
                    </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
}
