import { Mic } from 'lucide-react';

export default function LiveVoice() {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Mic className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Live Voice Assistant</h2>
        <p className="text-neutral-400 mb-8 leading-relaxed">
          Talk to the Gemini Live API directly. This feature utilizes the <code>gemini-3.1-flash-live-preview</code> model to provide real-time, low-latency conversational audio streaming for your Bannon game.
        </p>
        <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold tracking-wide shadow-lg shadow-green-900/50 transition-transform active:scale-95 flex items-center gap-2 mx-auto">
          <Mic className="w-5 h-5" /> Start Conversation
        </button>
      </div>
    </div>
  );
}
