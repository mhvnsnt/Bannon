import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key } from 'lucide-react';

export default function Settings() {
  const [keys, setKeys] = useState({
    GEMINI_API_KEY: '',
    GEMINI_FREE_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GROQ_API_KEY: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
       .then(r => r.json())
       .then(data => {
           if (data) setKeys(prev => ({ ...prev, ...data }));
       })
       .catch(e => console.error(e));
  }, []);

  const handleSave = async () => {
     setSaving(true);
     try {
         await fetch('/api/settings', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(keys)
         });
     } catch (e) {
         console.error(e);
     } finally {
         setSaving(false);
     }
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#0a0512] text-fuchsia-100 font-mono relative">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-transparent to-transparent pointer-events-none" />
       
       <div className="p-5 border-b border-fuchsia-900/40 bg-[#0f0a1c]/80 flex items-center gap-4 z-10 backdrop-blur-sm">
           <SettingsIcon className="text-fuchsia-400 w-5 h-5" />
           <h2 className="tracking-[0.2em] font-bold text-sm uppercase">System Configurations</h2>
       </div>
       
       <div className="p-8 max-w-2xl mx-auto w-full z-10 flex flex-col gap-6">
           <div className="bg-[#11051c] border border-fuchsia-900/40 p-6 rounded-xl flex flex-col gap-4">
               <h3 className="text-sm font-bold tracking-widest text-[#cbd5e1] uppercase flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-fuchsia-400"/> API Authentication
               </h3>
               
               <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-fuchsia-500/80">Gemini Premium API Key</label>
                  <input 
                      type="password"
                      value={keys.GEMINI_API_KEY || ''}
                      onChange={e => setKeys(prev => ({ ...prev, GEMINI_API_KEY: e.target.value }))}
                      className="bg-[#0b0314] border border-fuchsia-900/50 rounded-lg p-3 text-sm focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 font-mono"
                      placeholder="AIza..."
                  />
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-[#f472b6]">Google AI Studio Free API Key</label>
                  <input 
                      type="password"
                      value={keys.GEMINI_FREE_API_KEY || ''}
                      onChange={e => setKeys(prev => ({ ...prev, GEMINI_FREE_API_KEY: e.target.value }))}
                      className="bg-[#0b0314] border border-pink-900/50 rounded-lg p-3 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 font-mono"
                      placeholder="AIza... (Free backup tier)"
                  />
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-emerald-500/80">Anthropic API Key (Claude)</label>
                  <input 
                      type="password"
                      value={keys.ANTHROPIC_API_KEY || ''}
                      onChange={e => setKeys(prev => ({ ...prev, ANTHROPIC_API_KEY: e.target.value }))}
                      className="bg-[#0b0314] border border-emerald-900/50 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-mono"
                      placeholder="sk-ant..."
                  />
               </div>
               
               <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-cyan-500/80">Groq API Key (Fast Inference)</label>
                  <input 
                      type="password"
                      value={keys.GROQ_API_KEY || ''}
                      onChange={e => setKeys(prev => ({ ...prev, GROQ_API_KEY: e.target.value }))}
                      className="bg-[#0b0314] border border-cyan-900/50 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                      placeholder="gsk_..."
                  />
               </div>
               
               <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-4 bg-fuchsia-900/40 hover:bg-fuchsia-800 border border-fuchsia-500/40 text-fuchsia-100 p-3 rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold w-full disabled:opacity-50"
               >
                 <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
               </button>
           </div>
       </div>
    </div>
  );
}
