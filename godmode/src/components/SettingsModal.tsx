import React from 'react';
import { Settings, X, Lock, Check } from 'lucide-react';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#111] overflow-hidden">
      <div className="p-4 border-b border-[#222] flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-gray-200 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          API Keys & Integrations
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Provider Endpoints (God Mode)
          </h3>
          <p className="text-xs text-gray-400 mb-4 cursor-pointer hover:text-white transition-colors">
            Authorization matrix is locked down via server environment variables. OPENROUTER_API_KEY and GEMINI_API_KEY are injected securely to seal the shadow container.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">OPENROUTER_API_KEY / OrionHavwstee</label>
              <div className="flex items-center gap-2">
                <input 
                  type="password" 
                  value="****************"
                  readOnly
                  className="w-full bg-[#0a0a0a] border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-400 pointer-events-none" 
                  placeholder="Injected securely via Server Node"
                />
                <div className="text-emerald-500">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 block mb-1">GEMINI_API_KEY (Server Env)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="password" 
                  value="****************"
                  readOnly
                  className="w-full bg-[#0a0a0a] border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-400 pointer-events-none" 
                  placeholder="Injected securely via Server Node"
                />
                <div className="text-emerald-500">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Discography Scraper
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Spotify App Dashboard keys required to scrape your external metrics and catalogue mapping.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">SPOTIFY_CLIENT_ID</label>
              <input 
                type="password" 
                value="*********"
                readOnly
                className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-1.5 text-xs text-gray-300 pointer-events-none" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">SPOTIFY_CLIENT_SECRET</label>
              <input 
                type="password" 
                value="*********"
                readOnly
                className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-1.5 text-xs text-gray-300 pointer-events-none" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">TARGET_ENTITY</label>
              <input 
                type="text" 
                value="M. Heaven$ent"
                readOnly
                className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-1.5 text-xs font-mono text-indigo-400 pointer-events-none" 
              />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Zero Limit Compute Expansion
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Bypass API credit limits and maintain Opus level cognition via dedicated open source backend nodes (Railway/Local).
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">MAX_FILE_CONTEXT Buffer</label>
              <input 
                type="text" 
                value="32768"
                readOnly
                className="w-full bg-[#0a0a0a] border border-purple-900/50 rounded px-3 py-1.5 text-xs font-mono text-purple-300 focus:outline-none" 
              />
              <p className="text-[10px] text-gray-600 mt-1">Holds entire project state in active memory without bleeding cognitive density.</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">CODE_MODEL Execution Daemon</label>
              <input 
                type="text" 
                value="qwen2.5-coder:72b"
                readOnly
                className="w-full bg-[#0a0a0a] border border-purple-900/50 rounded px-3 py-1.5 text-xs font-mono text-purple-300 focus:outline-none" 
              />
              <p className="text-[10px] text-gray-600 mt-1">Dedicated GPU routing for syntax generation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
