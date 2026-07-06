import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Globe, MapPin } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

export default function BroadcastEngine() {
  const [user] = useAuthState(auth);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // In a full implementation, these links would be pulled from Firestore.
  // Using static placeholders reflecting the user's intent.
  const localCaptureLink = "https://pay.thecoreunlocked.com/dooly-county";
  const globalCaptureLink = "https://pay.thecoreunlocked.com/global-nodes";

  const broadcastTemplate = `Most of you are runnin unoptimized cognitive states. You are grindin effort without value and wonderin why your physical reality is not shiftin. I am openin a closed circuit loop in The Core Unlocked architecture this week. If your business or personal grid is caught in a friction loop we will map your exact structural math and inject the precise code to fix it. We operate wit pure clinical physics. If you want absolute clarity and heavy physical wins lock your slot in. The absolute truth is autonomous.`;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] p-6 rounded-xl border border-[#222] flex flex-col gap-5 text-white"
    >
        <div className="border-b border-[#333] pb-3">
            <h2 className="text-lg font-bold text-emerald-400 capitalize flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-500" />
                Value Broadcast Array
            </h2>
            <p className="text-xs text-gray-500 mt-1">
                Push structural supremacy to the active network. Quick-copy templates appended wit your kinetic capture points.
            </p>
        </div>

        <div className="bg-[#0a0a0a] p-4 rounded border border-[#333]">
            <p className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
                {broadcastTemplate}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={() => copyToClipboard(`${broadcastTemplate}\n\nLock in here: ${localCaptureLink}`, 1)}
                className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 rounded-lg group transition-colors"
            >
                <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">Local Dooly County</span>
                        <span className="text-xs text-gray-500">Append Local Link</span>
                    </div>
                </div>
                {copiedIndex === 1 ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-gray-500 group-hover:text-emerald-500 transition-colors" />}
            </button>

            <button 
                onClick={() => copyToClipboard(`${broadcastTemplate}\n\nLock in here: ${globalCaptureLink}`, 2)}
                className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-700 hover:border-purple-500/50 rounded-lg group transition-colors"
            >
                 <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-500" />
                    <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-gray-200 group-hover:text-purple-400 transition-colors">Global Digital Network</span>
                        <span className="text-xs text-gray-500">Append Global Link</span>
                    </div>
                </div>
                {copiedIndex === 2 ? <CheckCircle className="w-5 h-5 text-purple-400" /> : <Copy className="w-5 h-5 text-gray-500 group-hover:text-purple-500 transition-colors" />}
            </button>
        </div>
    </motion.div>
  );
}
