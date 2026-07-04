import React, { useState } from 'react';
import { Play, Download, X, Orbit, ChevronDown, ChevronUp, Code } from 'lucide-react';

export function ArtifactRenderer({ code, filename = 'app.html' }: { code: string; filename?: string }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const download = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2 my-2 w-full">
      <div className="flex gap-2">
        <button 
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs"
        >
          <Play size={12} /> PREVIEW
        </button>
        <button 
          onClick={download}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs"
        >
          <Download size={12} /> DOWNLOAD
        </button>
      </div>

      <div className="border border-zinc-800 rounded bg-black/50">
        <button 
          onClick={() => setShowCode(!showCode)}
          className="w-full flex items-center justify-between p-2 text-xs text-gray-400 hover:text-white"
        >
          <span className="flex items-center gap-2"><Code size={12} /> View Code</span>
          {showCode ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        
        {showCode && (
          <pre className="p-2 text-[10px] font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto border-t border-zinc-800">
            {code}
          </pre>
        )}
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-black border border-purple-500/50 rounded-xl overflow-hidden w-full max-w-4xl h-[600px] relative shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-purple-900/60 to-cyan-900/60 backdrop-blur-md text-white text-[10px] font-mono p-2 flex justify-between items-center z-10 border-b border-purple-500/30">
              <div className="flex items-center gap-2 uppercase tracking-[0.2em] font-bold">
                <Orbit className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
                Artifact Preview
              </div>
              <button onClick={() => setShowPreview(false)} className="flex items-center gap-1 hover:text-red-400">
                <X size={14} /> CLOSE
              </button>
            </div>
            <iframe
              title="Live Preview"
              srcDoc={code}
              className="w-full h-full pt-8"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      )}
    </div>
  );
}
