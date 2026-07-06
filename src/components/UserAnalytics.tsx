import React, { useState } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import {  Trophy, Clock, Target, Flame, Sparkles, FileText  } from 'lucide-react';
import GlobalLeaderboard from './GlobalLeaderboard';
import DailyMissions from './DailyMissions';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { AgentEfficacyDashboard } from './AgentEfficacyDashboard';
import { SuccessHeatmap } from './SuccessHeatmap';
import { EliteAnalytics } from './EliteAnalytics';
import { AgentLogicProfiler } from './AgentLogicProfiler';
import { QuantumAnalytics } from './QuantumAnalytics';
import { SkillTreeData } from '../types';
import { cn } from '../App';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import jsPDF from 'jspdf';

const xpData = [
  { name: 'Mon', xp: 400 },
  { name: 'Tue', xp: 300 },
  { name: 'Wed', xp: 550 },
  { name: 'Thu', xp: 200 },
  { name: 'Fri', xp: 700 },
  { name: 'Sat', xp: 900 },
  { name: 'Sun', xp: 850 },
];

const projectData = [
  { name: 'Week 1', completed: 2 },
  { name: 'Week 2', completed: 3 },
  { name: 'Week 3', completed: 1 },
  { name: 'Week 4', completed: 4 },
];

const personalityCorrelationData = [
  { personality: 'Socratic 🧠', avgXpGain: 75, totalPrompts: 24, efficiencyPercent: 95 },
  { personality: 'Verbose 🗣️', avgXpGain: 45, totalPrompts: 18, efficiencyPercent: 62 },
  { personality: 'Concise 🎯', avgXpGain: 30, totalPrompts: 42, efficiencyPercent: 41 },
];

const MILESTONES = [
  {
    id: 1,
    title: "Copper Scraper",
    description: "Earn 100 XP to gain the copper bronze frame aura and Novice title.",
    badgeName: "Novice",
    badgeIcon: "🥉",
    xpRequired: 100,
    cosmeticId: "copper_aura",
    styleClass: "text-amber-700 font-bold",
    inlineStyles: { textShadow: '0 0 4px rgba(180, 83, 9, 0.4)' }
  },
  {
    id: 2,
    title: "Golden Architect",
    description: "Reach 300 XP to earn the golden high-contrast glowing identity.",
    badgeName: "Elite",
    badgeIcon: "🥈",
    xpRequired: 300,
    cosmeticId: "golden_glow",
    styleClass: "text-amber-500 font-black tracking-wide",
    inlineStyles: { textShadow: '0 0 8px rgba(245, 158, 11, 0.6)' }
  },
  {
    id: 3,
    title: "Data Overlord",
    description: "Reach 500 XP to claim the legendary neon cyber identity.",
    badgeName: "Overlord",
    badgeIcon: "🥇",
    xpRequired: 500,
    cosmeticId: "neon_overlord",
    styleClass: "text-indigo-500 font-extrabold tracking-wider uppercase",
    inlineStyles: { textShadow: '0 0 10px rgba(99, 102, 241, 0.8)' }
  }
];

export default function UserAnalytics({ streak, skillTree, addXp }: { streak: number, skillTree: SkillTreeData, addXp: (amount: number) => void }) {
  const [equippedCosmetic, setEquippedCosmetic] = useState(() => {
    return localStorage.getItem('codedummy-equipped-cosmetic') || 'none';
  });

  const handleEquipCosmetic = async (cosmeticId: string) => {
    const newCosmetic = equippedCosmetic === cosmeticId ? 'none' : cosmeticId;
    setEquippedCosmetic(newCosmetic);
    localStorage.setItem('codedummy-equipped-cosmetic', newCosmetic);
    
    // Sync with Supabase profiles table
    if (!isSupabaseConfigured) {
      return;
    }
    try {
      const savedUserId = localStorage.getItem('codedummy-user-id') || 'demo_user';
      const { error } = await supabase.from('profiles').update({
        equipped_cosmetic: newCosmetic
      }).eq('id', savedUserId);
      
      if (error) throw error;
    } catch (err) {
      console.warn("Could not sync cosmetic choice to Supabase profiles:", err);
    }
  };

  const [activeTab, setActiveTab] = useState<'analytics' | 'marketplace' | 'quantum'>('analytics');
  const [isGodMode, setIsGodMode] = useState(false);

  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.text("Project Performance Comparison Report", 10, 10);
    doc.text("Optimizations applied: Automated refactoring.", 10, 20);
    doc.text("Results: 25% faster load time.", 10, 30);
    doc.save("performance-report.pdf");
  };

  return (
    <div className="flex-1 w-full bg-[#f5f5f7] overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8">
        
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-black tracking-tight mb-2">Analytics</h1>
            <p className="text-slate-500 font-medium tracking-wide">Track your learning progress and mastery.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsGodMode(!isGodMode)} className={cn("px-4 py-2 rounded-xl font-bold text-xs", isGodMode ? "bg-indigo-600 text-white" : "bg-white border text-black")}>God Mode: {isGodMode ? 'ON' : 'OFF'}</button>
            <button onClick={() => setActiveTab('analytics')} className={cn("px-4 py-2 rounded-xl font-bold text-xs", activeTab === 'analytics' ? "bg-black text-white" : "bg-white border border-black/5 text-black")}>Analytics</button>
            <button onClick={() => setActiveTab('marketplace')} className={cn("px-4 py-2 rounded-xl font-bold text-xs", activeTab === 'marketplace' ? "bg-black text-white" : "bg-white border border-black/5 text-black")}>Marketplace</button>
            <button onClick={() => setActiveTab('quantum')} className={cn("px-4 py-2 rounded-xl font-bold text-xs border transition-colors", activeTab === 'quantum' ? "bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white border-black/5 text-black hover:bg-slate-50")}>Quantum</button>
          </div>
          <button onClick={generatePDFReport} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-bold border border-black/5 shadow-sm hover:shadow-md cursor-pointer text-xs">
            <FileText className="w-4 h-4" />
            Export Report
          </button>
        </header>

        {activeTab === 'analytics' ? (
        <div className="space-y-8">
            {isGodMode && <EliteAnalytics data={xpData} />}
            {/* Success Heatmap */}
            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                <h2 className="text-sm font-black uppercase text-slate-800 mb-4">Time-to-Success Heatmap</h2>
                <SuccessHeatmap data={personalityCorrelationData} />
            </div>
            {/* Agent Profiler */}
            <AgentLogicProfiler />
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-black">{streak} Days</div>
              <div className="text-xs uppercase font-bold tracking-widest text-slate-400">Current Streak</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-black">12</div>
              <div className="text-xs uppercase font-bold tracking-widest text-slate-400">Projects Done</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-black">48h</div>
              <div className="text-xs uppercase font-bold tracking-widest text-slate-400">Lab Time</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-black">Top 5%</div>
              <div className="text-xs uppercase font-bold tracking-widest text-slate-400">Global Rank</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-black">XP Earned (Last 7 Days)</h2>
              <p className="text-sm text-slate-500">Consistent effort leads to mastery.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={xpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="xp" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-black">Projects Completed (Monthly)</h2>
              <p className="text-sm text-slate-500">Milestones achieved over the past month.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="completed" fill="#000000" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Learning Efficiency: Agent Personality Correlation Chart */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm animate-in fade-in">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                Learning Efficiency: Agent Personality Correlation
              </h2>
              <p className="text-sm text-slate-500">Correlates your XP gains and prompt count across active agent personalities.</p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-bold rounded-lg border border-indigo-100 self-start md:self-auto shrink-0">
              Socratic Mode Highest Efficiency
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personalityCorrelationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="personality" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Bar dataKey="avgXpGain" name="Avg XP Gained per Prompt" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar dataKey="totalPrompts" name="Total Prompts Submitted" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar dataKey="efficiencyPercent" name="Cognitive Efficiency %" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center bg-slate-50 p-6 rounded-2xl border border-black/5 gap-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Optimization Analytics</span>
              <h3 className="text-sm font-black text-slate-800 leading-tight">Identify Your Learning Accelerator</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Analyzing cognitive retention metrics reveals that utilizing the <strong className="text-indigo-600 font-extrabold">Socratic mode</strong> drives a substantial boost in learning. 
                Rather than providing copy-paste solutions, Socratic dialog forces structural understanding, achieving an average of <strong className="text-indigo-600 font-extrabold">75 XP per interaction</strong> compared to just <strong className="text-slate-500 font-semibold">30 XP</strong> in Concise mode.
              </p>
              <div className="border-t border-black/5 pt-3 mt-1 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">🧠 Socratic Efficiency</span>
                  <span className="font-extrabold text-indigo-600">Highest (95%)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">🎯 Concise Speed</span>
                  <span className="font-extrabold text-amber-600">High Volume, Low Retention</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Efficacy Dashboard */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
            <h2 className="text-lg font-bold text-black mb-4">Agent Efficacy Dashboard</h2>
            <AgentEfficacyDashboard />
        </div>


        {/* Performance Heatmap */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
          <h2 className="text-lg font-bold text-black mb-4">Agent Performance Heatmap</h2>
          <PerformanceHeatmap />
        </div>

        {/* Milestone Achievements & Profile Cosmetics */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                Milestone Achievements & Cosmetics
              </h2>
              <p className="text-sm text-slate-500">Reach specific XP targets to unlock permanent profile cosmetic badges.</p>
            </div>
            <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-black/5 font-mono text-xs font-bold text-slate-800 self-start md:self-auto shrink-0">
              Total XP: {skillTree.xp}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MILESTONES.map((milestone) => {
              const isUnlocked = skillTree.xp >= milestone.xpRequired;
              const isEquipped = equippedCosmetic === milestone.cosmeticId;
              
              return (
                <div 
                  key={milestone.id} 
                  className={cn(
                    "p-5 rounded-2xl border transition-all relative flex flex-col justify-between overflow-hidden",
                    isUnlocked 
                      ? "bg-gradient-to-br from-white to-slate-50 border-black/10 shadow-sm hover:shadow-md" 
                      : "bg-slate-50/60 border-slate-200/80 grayscale opacity-75"
                  )}
                >
                  {isUnlocked && (
                    <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase">
                      Unlocked
                    </div>
                  )}
                  
                  <div>
                    <div className="text-3xl mb-3">{milestone.badgeIcon}</div>
                    <h3 className="font-bold text-slate-900 text-sm">{milestone.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{milestone.description}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">
                      Requires {milestone.xpRequired} XP
                    </div>
                    
                    {/* Visual preview of the name cosmetic */}
                    <div className="mt-4 p-2.5 rounded-lg border border-black/5 bg-white flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">Profile Preview</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-bold font-mono text-slate-400">#1</span>
                        <span 
                          className={cn("text-xs font-black", milestone.styleClass)}
                          style={milestone.inlineStyles}
                        >
                          DemoUser
                        </span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {milestone.badgeName}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5">
                    {isUnlocked ? (
                      <button
                        onClick={() => handleEquipCosmetic(milestone.cosmeticId)}
                        className={cn(
                          "w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                          isEquipped 
                            ? "bg-black text-white" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        )}
                      >
                        {isEquipped ? '✓ Equipped' : 'Equip Cosmetic'}
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-slate-100 text-slate-400 text-center text-xs font-bold rounded-xl select-none">
                        Locked ({milestone.xpRequired - skillTree.xp} XP left)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* Leaderboard and Missions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DailyMissions skillTree={skillTree} addXp={addXp} />
          <GlobalLeaderboard />
        </div>
        </div>
        ) : activeTab === 'quantum' ? (
          <QuantumAnalytics />
        ) : (
            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                <h2 className="text-xl font-black mb-6">Community Skills Marketplace</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-xl"><h3>Skill 1</h3><button className="bg-black text-white px-2 py-1 text-xs">Import (+100 XP)</button></div>
                    <div className="p-4 border rounded-xl"><h3>Skill 2</h3><button className="bg-black text-white px-2 py-1 text-xs">Import (+100 XP)</button></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
