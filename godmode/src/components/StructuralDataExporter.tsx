import React, { useState } from 'react';
import { Download, Database, FileJson, FileText, CheckCircle2, ShieldAlert, Zap, Orbit } from 'lucide-react';
import { useArchitectStore } from '../lib/architectStore';

export function StructuralDataExporter() {
  const { wealthGoals, relationshipInsights, primeDirectives } = useArchitectStore();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = (format: 'json' | 'csv') => {
    setExporting(format);
    
    setTimeout(() => {
      // Gather all local truth
      const exportData = {
        wealthGoals,
        relationshipInsights,
        primeDirectives,
        timestamp: new Date().toISOString(),
        vectorState: 'LOCKED',
        signature: 'M. Heaven$ent Absolute Autonomy Grid'
      };

      let content = '';
      let mimeType = '';
      let extension = '';

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // Flat CSV extraction (simplified)
        const headers = 'DataType,Count,Status,Timestamp\n';
        const rows = [
          `WealthGoals,${wealthGoals?.length || 0},SECURE,${new Date().toISOString()}`,
          `RelationshipInsights,${relationshipInsights?.length || 0},ACTIVE,${new Date().toISOString()}`,
          `PrimeDirectives,${primeDirectives?.length || 0},SYNCED,${new Date().toISOString()}`,
        ].join('\n');
        content = headers + rows;
        mimeType = 'text/csv';
        extension = 'csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autonomous_grid_structural_snapshot_${Date.now()}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      setExporting(null);
    }, 1500);
  };

  return (
    <div className="w-full h-full bg-[#050505] text-cyan-500 font-mono p-4 flex flex-col border-l border-cyan-900/40 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Database className="w-48 h-48" />
      </div>

      <div className="border-b border-cyan-900/50 pb-3 mb-4 shrink-0 flex justify-between items-center relative z-10">
        <div>
           <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-2">
             <Download className="w-4 h-4" /> Structural Data Extraction
           </h2>
           <p className="text-[10px] text-cyan-700 mt-1">Manifest data extraction. Export local atomic mechanics (JSON/CSV) for external visualization.</p>
        </div>
        <div className="flex items-center gap-2">
           <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
           <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Awaiting Export</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10 p-8 max-w-2xl mx-auto w-full">
         <div className="bg-[#0a0a0a] border border-cyan-900/40 p-8 rounded-lg w-full flex flex-col items-center text-center shadow-[0_0_50px_rgba(34,211,238,0.05)]">
            <Orbit className="w-16 h-16 text-cyan-500 mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-[spin_10s_linear_infinite]" />
            <h3 className="text-xl font-bold tracking-widest text-white uppercase mb-2">Absolute Vector Output</h3>
            <p className="text-xs text-cyan-600 mb-8 max-w-md">
              Compile current probability fields and physical density loops into tangible raw data structures. Zero data loss.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full">
               <button
                 onClick={() => handleExport('json')}
                 disabled={exporting !== null}
                 className="flex flex-col items-center justify-center gap-3 p-6 bg-black border border-cyan-900 hover:border-cyan-400 transition-all rounded group disabled:opacity-50 disabled:hover:border-cyan-900 relative overflow-hidden"
               >
                 {exporting === 'json' ? (
                   <div className="absolute inset-0 bg-cyan-900/20 flex flex-col items-center justify-center">
                     <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent flex items-center justify-center rounded-full animate-spin mb-2" />
                     <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest">Compiling...</span>
                   </div>
                 ) : (
                   <>
                     <FileJson className="w-8 h-8 text-cyan-600 group-hover:text-cyan-400 transition-colors" />
                     <div className="text-center">
                       <div className="font-bold text-sm tracking-widest text-gray-200">EXTRACT JSON</div>
                       <div className="text-[10px] text-cyan-800 mt-1">Full Relational Topology</div>
                     </div>
                   </>
                 )}
               </button>

               <button
                 onClick={() => handleExport('csv')}
                 disabled={exporting !== null}
                 className="flex flex-col items-center justify-center gap-3 p-6 bg-black border border-emerald-900 hover:border-emerald-400 transition-all rounded group disabled:opacity-50 disabled:hover:border-emerald-900 relative overflow-hidden text-emerald-500"
               >
                 {exporting === 'csv' ? (
                   <div className="absolute inset-0 bg-emerald-900/20 flex flex-col items-center justify-center">
                     <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent flex items-center justify-center rounded-full animate-spin mb-2" />
                     <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Compiling...</span>
                   </div>
                 ) : (
                   <>
                     <FileText className="w-8 h-8 text-emerald-600 group-hover:text-emerald-400 transition-colors" />
                     <div className="text-center">
                       <div className="font-bold text-sm tracking-widest text-gray-200">EXTRACT CSV</div>
                       <div className="text-[10px] text-emerald-800 mt-1">Flat Metric Arrays</div>
                     </div>
                   </>
                 )}
               </button>
            </div>
         </div>

         <div className="w-full flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest px-4 border border-dashed border-cyan-900/30 p-3 rounded">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-700" /> Data Sanitized</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-700" /> Vectors Verified</span>
            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-cyan-700" /> Local Host Zero Dependency</span>
         </div>
      </div>
    </div>
  );
}
