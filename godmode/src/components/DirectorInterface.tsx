import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, HelpCircle, Activity, Play, Sparkles, Terminal, CheckCircle } from 'lucide-react';

interface DirectorTranslation {
  originalCommand: string;
  technicalTask: string;
  parametersTargeted: string[];
  queueId: string | null;
  timestamp: string;
}

export function DirectorInterface() {
  const [command, setCommand] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [lastTranslation, setLastTranslation] = useState<DirectorTranslation | null>(null);
  const [translationFeed, setTranslationFeed] = useState<DirectorTranslation[]>([]);
  
  // Web Speech API
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for web speech support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setCommand(text);
        setIsRecording(false);
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice recording interface is not compatible with this browser. Please input text commands manually.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const transmitCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!command.trim()) return;

    setTranslating(true);
    try {
      const res = await fetch('/api/armada/director/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (data.success && data.translation) {
        setLastTranslation(data.translation);
        setTranslationFeed(prev => [data.translation, ...prev]);
        setCommand('');
      }
    } catch (err) {
      console.error('Failed to transmit director command:', err);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Voice / Text Director Interface Control */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-white text-sm">Director Command Console</h3>
          </div>
          <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono font-bold">
            DIRECTOR INTENT V1
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Dictate high-altitude creative ideas to reshape code structures, strike trajectories, or gravity weights dynamically. The system compilation pipeline handles implementation.
        </p>

        {/* Input Controls */}
        <form onSubmit={transmitCommand} className="flex gap-2 pt-2">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='Try "Make the Bannon heavy strikes feel 20 percent more brutal and exhausting"'
              className="w-full bg-zinc-950 border border-zinc-900 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-700 placeholder-zinc-650"
            />
            <button
              type="button"
              onClick={toggleRecording}
              className={`absolute right-2 p-1.5 rounded-md transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-zinc-450 hover:bg-zinc-900 hover:text-white'
              }`}
              title="Dictate voice command"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={translating || !command.trim()}
            className="bg-emerald-950/30 hover:bg-emerald-900/50 disabled:opacity-40 border border-emerald-900/40 px-4 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-semibold uppercase transition-all"
          >
            {translating ? 'Analyzing...' : <Send className="w-4 h-4" />}
          </button>
        </form>

        {/* Helper suggestions */}
        <div className="flex flex-col gap-1 text-[11px] text-zinc-550 pt-1">
          <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px] mb-1">Director Commands Suggestions</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCommand('Make the gravity feel twice as heavy to anchor fighters to the canvas')}
              className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 px-2 py-1 rounded text-zinc-400 text-left transition-colors"
            >
              "Twice as heavy gravity"
            </button>
            <button
              type="button"
              onClick={() => setCommand('Tune the maximum strike force dynamically by twenty percent to amplify strike impacts')}
              className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 px-2 py-1 rounded text-zinc-400 text-left transition-colors"
            >
              "Amplify strike impacts"
            </button>
            <button
              type="button"
              onClick={() => setCommand('Extend the anatomical reaches of shoulders to grant long distance extension punches')}
              className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 px-2 py-1 rounded text-zinc-400 text-left transition-colors"
            >
              "Extend shoulder reaches"
            </button>
          </div>
        </div>
      </div>

      {/* Latency Transceiver status */}
      {lastTranslation && (
        <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5 text-xs text-emerald-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">INTENT TRANSLATION LOCKED</span>
            <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900/40 font-mono text-[11px] leading-relaxed text-zinc-350">
              <span className="text-zinc-500 font-bold block mb-1">COGNITIVE ACTION:</span>
              {lastTranslation.technicalTask}
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-450 mt-1">
              <span>TARGETS: {lastTranslation.parametersTargeted.join(', ') || 'Global configs'}</span>
              <span>QUEUE ID: {lastTranslation.queueId ? lastTranslation.queueId.slice(0, 8) : 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Logs Translation Feed */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <h3 className="font-semibold text-white text-sm">Action Stream Feed</h3>
        </div>
        <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1 no-scrollbar text-xs">
          {translationFeed.length === 0 ? (
            <span className="text-zinc-550 italic">No instructions transmitted in this session. Send a command to see executive processing stream logs.</span>
          ) : (
            translationFeed.map((f, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg flex flex-col gap-1">
                <span className="text-zinc-350 font-medium">"{f.originalCommand}"</span>
                <p className="text-[10px] text-zinc-500 font-mono leading-relaxed mt-1">
                  {f.technicalTask}
                </p>
                <div className="flex justify-between text-[9px] text-zinc-550 pt-1.5 border-t border-zinc-900 mt-2 font-mono">
                  <span>Targets: {f.parametersTargeted.join(', ')}</span>
                  <span>Queue: {f.queueId ? f.queueId.slice(0, 8) : 'N/A'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
