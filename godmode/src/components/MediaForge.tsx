import { useState, useEffect, useRef } from 'react';
import { Camera, Download, Loader2, Music, Volume2, Database, ShieldAlert, Play, Pause } from 'lucide-react';
import { initializeGlobalAudio } from '../lib/audioEngine';

export default function MediaForge() {
  const [prompt, setPrompt] = useState('Cinematic shot of neon grid architecture...');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'audio'>('image');
  
  // Audio Vault States
  const [catalog, setCatalog] = useState<any>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeTab === 'audio' && !catalog) {
      setCatalogLoading(true);
      fetch('/api/metadata/heaven-sent')
        .then(res => res.json())
        .then(data => {
            setCatalog(data);
            setCatalogLoading(false);
        })
        .catch(err => {
            console.error(err);
            setCatalogLoading(false);
        });
    }
  }, [activeTab]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/armada/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.image) {
         setImage(data.image);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = (trackId: string) => {
      if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.crossOrigin = "anonymous";
          initializeGlobalAudio(audioRef.current);
      }

      if (playingTrack === trackId) {
          if (audioRef.current.paused) {
              audioRef.current.play();
          } else {
              audioRef.current.pause();
              setPlayingTrack(null);
          }
      } else {
          setPlayingTrack(trackId);
          audioRef.current.src = `/api/vault/stream/${trackId}`;
          audioRef.current.play();
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-4">
      <div className="flex items-center gap-2 mb-4 border-b border-[#222] pb-3">
        <Database className="w-5 h-5 text-emerald-400" />
        <h2 className="font-semibold text-gray-200">Autonomous Audio Vault</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setActiveTab('image')}
          className={`flex-1 flex justify-center items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'image' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-[#111] text-gray-400 hover:bg-[#222]'}`}
        >
          <Camera className="w-4 h-4" /> Image Gen
        </button>
        <button 
          onClick={() => setActiveTab('audio')}
          className={`flex-1 flex justify-center items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'audio' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#111] text-gray-400 hover:bg-[#222]'}`}
        >
          <Music className="w-4 h-4" /> Audio / Song Gen
        </button>
      </div>
      
      {activeTab === 'image' && (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Diffusion Prompt</label>
            <textarea
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               className="w-full bg-[#111] border border-[#222] rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
               rows={3}
            />
            <button 
               onClick={handleGenerate}
               disabled={loading}
               className="mt-2 bg-purple-600 hover:bg-purple-500 p-2 rounded-lg font-semibold uppercase tracking-wider text-xs flex justify-center items-center gap-2 disabled:bg-[#222]"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute Synthesis'}
            </button>
          </div>

          <div className="flex-1 border border-[#222] bg-[#111] rounded-lg relative overflow-hidden flex items-center justify-center">
              {image ? (
                 <div className="relative w-full h-full">
                    <img src={image} className="w-full h-full object-contain" />
                    <a href={image} download="synthesized_image.png" className="absolute bottom-4 right-4 bg-black/80 p-2 rounded-lg hover:bg-purple-600 border border-[#333] transition-colors">
                       <Download className="w-4 h-4" />
                    </a>
                 </div>
              ) : (
                 <span className="text-gray-600 font-mono text-xs text-center px-4">
                   Awaiting tensor execution...<br/>
                   Hooked to local Stable Diffusion pipeline.
                 </span>
              )}
          </div>
        </div>
      )}

      {activeTab === 'audio' && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
             <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-500" /> Catalog Index
             </label>
             {catalogLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {!catalogLoading && catalog?.items?.length > 0 ? (
                  catalog.items.map((item: any) => (
                      <div key={item.id} className="bg-[#111] p-3 rounded-xl border border-[#222] hover:border-emerald-500/50 transition-all flex items-center gap-4 group">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-[#333] relative">
                             <img src={item.images?.[0]?.url || 'https://placehold.co/400x400/180c24/5e1d3a?text=AUDIO'} alt={item.name} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={() => togglePlayback(item.id)}
                                  className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center"
                                >
                                   {playingTrack === item.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                </button>
                             </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold truncate text-sm">{item.name}</h3>
                              <p className="text-[#888] text-xs font-mono mt-1">RELEASE: {item.release_date}</p>
                              <div className="text-emerald-500/70 text-[10px] font-mono mt-2 uppercase flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> PRIVATE VAULT STREAM
                              </div>
                          </div>

                          {playingTrack === item.id && (
                             <div className="flex space-x-[2px] items-end h-8 mr-2">
                                {[...Array(8)].map((_, i) => (
                                   <div key={i} className="w-1.5 bg-emerald-500 rounded-t animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.3 + Math.random() * 0.5}s` }} />
                                ))}
                             </div>
                          )}
                      </div>
                  ))
              ) : (
                  <div className="h-full border border-[#222] border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 font-mono text-xs">
                      {catalogLoading ? 'Syncing with Spotify Grid...' : 'No catalog data available.'}
                  </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
