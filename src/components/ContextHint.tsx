import React, { useState, useEffect } from 'react';
import { HelpCircle, Sparkles, AlertCircle, Lightbulb } from 'lucide-react';

const AGENT_TIPS = [
  "Did you know? If your target URL is protected by Cloudflare, requesting a Google Web Cache fallback is a clever bypass.",
  "Tip: Autonomous scraping runs faster in Local Mode because it binds directly inside your browser's WebGPU memory.",
  "Debugging Tip: If a scrape fails with an SSL or network error, verify the server permits standard CORS fetches.",
  "Pro Tip: Click the 'CSV' button underneath an agent message to generate clean table exports instantly.",
  "Optimization: Low-End Hardware fallback will automatically route execution to Google Cloud Gemini for perfect stability.",
  "Security Tip: Keep your GitHub token safe and do not expose it in browser console logs.",
  "Did you know? You can sync your chat prompts offline to IndexedDB to keep development safe even during travel.",
];

export default function ContextHint({ isRunning }: { isRunning: boolean }) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    
    // Cycle tips every 4 seconds when running
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % AGENT_TIPS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isRunning) return null;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-3 duration-300 flex items-start gap-3.5 max-w-lg">
      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4 animate-pulse text-emerald-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Agent Context Hint</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <p className="text-xs text-slate-300 font-semibold leading-relaxed mt-1">
          {AGENT_TIPS[currentTipIndex]}
        </p>
      </div>
    </div>
  );
}
