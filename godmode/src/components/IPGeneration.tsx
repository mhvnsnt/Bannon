import React from 'react';
import { Sparkles, Cpu, Image as ImageIcon, Play, Share2, Activity } from 'lucide-react';

export default function IPGeneration() {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-purple-400 font-mono p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-purple-500/30">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-purple-300">GENERATIVE IP EXPLOITATION</h1>
          <p className="text-gray-400 mt-2">Bannon Engine driven simulations, NFT creation, and reimagined Wrestling IP extraction.</p>
        </div>
        <Sparkles className="w-8 h-8 text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#111] border border-[#222] p-6 rounded relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-500" />
            "What If" Match Simulator
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Execute high-fidelity AI-driven simulations of impossible matchups using Bannon Physics. We broadcast these as PPVs or lock them behind paywalls.
          </p>
          <div className="space-y-3">
             <div className="p-3 bg-black border border-purple-500/30 rounded flex justify-between items-center group-hover:border-purple-500 transition-colors">
               <span className="font-bold text-white">90s Undertaker vs Prime Okada</span>
               <button className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded flex items-center gap-1"><Play className="w-3 h-3" /> Execute Render</button>
             </div>
             <div className="p-3 bg-black border border-purple-500/30 rounded flex justify-between items-center group-hover:border-purple-500 transition-colors">
               <span className="font-bold text-white">Brock Lesnar vs Meng (Shoot Fight)</span>
               <button className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded flex items-center gap-1"><Play className="w-3 h-3" /> Execute Render</button>
             </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded relative overflow-hidden group">
          <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-500" />
            Digital Collectibles (NFT Forge)
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Capture frame-perfect 3D kinetic outputs from the sandbox, export as GLTF/FBX, and auto-mint to blockchain marketplaces.
          </p>
          <div className="space-y-3">
             <button className="w-full flex items-center justify-between p-4 bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-400 transition-colors rounded">
               <span className="font-bold tracking-wide">Mint: "The Perfect Suplex" (Legendary)</span>
               <Share2 className="w-4 h-4" />
             </button>
             <button className="w-full flex items-center justify-between p-4 bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-400 transition-colors rounded">
               <span className="font-bold tracking-wide">Mint: Custom Character Asset Pack</span>
               <Share2 className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] p-6 rounded flex-1">
        <h3 className="text-lg font-bold text-white mb-4">Live Pipeline: Auto-Content Generator</h3>
        <div className="w-full h-32 bg-black border border-[#333] rounded flex items-center justify-center flex-col gap-2 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />
           <Activity className="w-6 h-6 text-purple-500 animate-pulse" />
           <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">Generating Twitter/X Hype Threads...</span>
           <span className="text-xs text-purple-400">Current topic: "Why Kenny Omega's biomechanics score is unmatched."</span>
        </div>
      </div>
    </div>
  );
}
