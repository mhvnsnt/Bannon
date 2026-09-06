import { useState } from 'react';
import { Camera, Video, Music, Mic, Image as ImageIcon } from 'lucide-react';

export default function AICreative() {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState('gemini-3.1-flash-image-preview');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setResult(null);
    try {
      if (activeTab === 'image') {
        const res = await fetch('/api/gemini/image-gen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: quality, aspectRatio })
        });
        const data = await res.json();
        if (data.imageBytes) {
          setResult(`data:image/jpeg;base64,${data.imageBytes}`);
        }
      }
      // Audio and Video mock for now since we don't have full endpoints for them implemented
      if (activeTab === 'audio') {
        const res = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: prompt })
        });
        const data = await res.json();
        if (data.audioBytes) {
          setResult(`data:${data.mimeType || 'audio/mp3'};base64,${data.audioBytes}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div className="w-full md:w-80 bg-neutral-950 md:border-r border-b md:border-b-0 border-neutral-800 p-4 md:p-6 flex flex-col shrink-0 md:overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
          <Camera className="w-5 h-5 text-pink-400" /> Creative Studio
        </h2>
        
        <div className="flex gap-2 mb-6 bg-neutral-900 p-1 rounded-lg shrink-0">
          <button onClick={() => setActiveTab('image')} className={`flex-1 py-2 text-sm rounded-md flex justify-center items-center gap-2 ${activeTab === 'image' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}><ImageIcon className="w-4 h-4"/> Image</button>
          <button onClick={() => setActiveTab('video')} className={`flex-1 py-2 text-sm rounded-md flex justify-center items-center gap-2 ${activeTab === 'video' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}><Video className="w-4 h-4"/> Video</button>
          <button onClick={() => setActiveTab('audio')} className={`flex-1 py-2 text-sm rounded-md flex justify-center items-center gap-2 ${activeTab === 'audio' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}><Music className="w-4 h-4"/> Audio</button>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-24 md:h-32 bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm focus:outline-none focus:border-pink-500 resize-none"
              placeholder="Describe what you want to generate..."
            />
          </div>

          {activeTab === 'image' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Quality / Model</label>
                <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm focus:outline-none focus:border-pink-500">
                  <option value="gemini-3.1-flash-image-preview">Flash Image (Standard)</option>
                  <option value="gemini-3-pro-image-preview">Pro Image (High Quality)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Aspect Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm focus:outline-none focus:border-pink-500">
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="3:4">3:4</option>
                  <option value="4:3">4:3</option>
                  <option value="3:2">3:2</option>
                  <option value="2:3">2:3</option>
                </select>
              </div>
            </>
          )}

        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-lg font-medium transition-colors mt-4 shrink-0"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8 bg-neutral-900 flex items-center justify-center overflow-auto">
        {result ? (
          activeTab === 'image' ? (
            <img src={result} alt="Generated" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
          ) : activeTab === 'audio' ? (
            <audio controls src={result} className="w-full max-w-md" />
          ) : (
            <div className="text-neutral-400">Video output placeholder</div>
          )
        ) : (
          <div className="text-neutral-500 flex flex-col items-center text-center p-4">
            <Camera className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-20" />
            <p className="text-sm md:text-base">Your generated {activeTab} will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
