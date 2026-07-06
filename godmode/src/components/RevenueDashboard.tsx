import React from 'react';
import { Activity, TrendingUp, DollarSign, Target, Settings, ArrowRight } from 'lucide-react';

export default function RevenueDashboard() {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-green-400 font-mono p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-green-500/30">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-green-300">STRATEGIC REVENUE ORCHESTRATION</h1>
          <p className="text-gray-400 mt-2">Maximum Leverage Vector Coordination & Actionable Monetization.</p>
        </div>
        <div className="flex bg-black px-4 py-2 border border-green-500/50 rounded items-center gap-2">
          <Activity className="w-5 h-5 animate-pulse text-green-500" />
          <span className="text-sm font-bold tracking-wider">SYSTEM ACTIVE: YIELDING</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Wrestling Data Arbitrage", val: "$1,842.50", trend: "+12.4%", desc: "Daily Expected Yield" },
          { label: "Generative IP Royalties", val: "$5,290.00", trend: "+45.1%", desc: "Bannon Engine Subscriptions" },
          { label: "Autonomous Game Farms", val: "8.4 ETH", trend: "+2.1%", desc: "Digital Asset Valuation" },
          { label: "Predictive Betting Models", val: "14.2% ROI", trend: "+1.2%", desc: "Cagematch / PWI Sentiment" }
        ].map((stat, i) => (
          <div key={i} className="bg-[#111] p-5 border border-green-500/20 rounded shadow-[0_0_15px_rgba(0,255,100,0.05)]">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-1">{stat.label}</h3>
            <div className="text-2xl font-bold text-white mb-2">{stat.val}</div>
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-xs font-bold">{stat.trend}</span>
              <span className="text-gray-500 text-[10px] uppercase">{stat.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-[#222] p-6 rounded">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            Active Leverage Vectors
          </h3>
          <ul className="space-y-4">
            <li className="flex justify-between items-center p-3 bg-black border border-[#333] rounded">
              <div>
                <div className="font-bold text-green-400">CAGEMATCH Sentiment Analysis</div>
                <div className="text-xs text-gray-500">Autonomous Web Scraping Swarm</div>
              </div>
              <button className="px-3 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/30 text-xs border border-green-500/50 rounded flex items-center gap-1">
                Configure <Settings className="w-3 h-3" />
              </button>
            </li>
            <li className="flex justify-between items-center p-3 bg-black border border-[#333] rounded">
              <div>
                <div className="font-bold text-green-400">PWI & Wrestling Observer Aggregation</div>
                <div className="text-xs text-gray-500">Talent Valuation Predictor</div>
              </div>
              <button className="px-3 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/30 text-xs border border-green-500/50 rounded flex items-center gap-1">
                Configure <Settings className="w-3 h-3" />
              </button>
            </li>
            <li className="flex justify-between items-center p-3 bg-black border border-[#333] rounded">
              <div>
                <div className="font-bold text-green-400">Generative Wrestling Simulations</div>
                <div className="text-xs text-gray-500">Bannon Sandbox "What If" Rendering</div>
              </div>
              <button className="px-3 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/30 text-xs border border-green-500/50 rounded flex items-center gap-1">
                Configure <Settings className="w-3 h-3" />
              </button>
            </li>
          </ul>
        </div>
        
        <div className="bg-[#111] border border-[#222] p-6 rounded">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            Monetization Execution
          </h3>
          <div className="space-y-4">
             <p className="text-sm text-gray-400">Deploy immediate actions to generate yield across established vectors.</p>
             <button className="w-full flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 transition-colors">
               <span className="font-bold tracking-wide">Execute Arbitrage Trades (Observer Leaks)</span>
               <ArrowRight className="w-4 h-4" />
             </button>
             <button className="w-full flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 transition-colors">
               <span className="font-bold tracking-wide">Mint New Bannon Engine NFTs</span>
               <ArrowRight className="w-4 h-4" />
             </button>
             <button className="w-full flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 transition-colors">
               <span className="font-bold tracking-wide">Sell API Access Keys (Data Dominance Tier)</span>
               <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
