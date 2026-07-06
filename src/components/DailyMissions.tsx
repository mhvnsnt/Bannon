import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Zap } from 'lucide-react';
import { SkillTreeData } from '../types';

interface Mission {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
}

const ALL_MISSIONS = [
  { id: 'm1', title: 'Write a basic fetch request', xp: 20, req: 'fetch_api' },
  { id: 'm2', title: 'Draw a circle on a 2D canvas', xp: 30, req: 'canvas_2d' },
  { id: 'm3', title: 'Play a synthesized beep', xp: 25, req: 'audio_api' },
  { id: 'm4', title: 'Save a theme preference', xp: 15, req: 'local_storage' },
  { id: 'm5', title: 'Change a div color on click', xp: 15, req: 'dom_manipulation' },
  { id: 'm6', title: 'Reverse a string', xp: 20, req: 'string_manipulation' },
  { id: 'm7', title: 'Calculate distance between 2 points', xp: 35, req: 'math_physics' },
  { id: 'm8', title: 'Create a 5-second countdown', xp: 25, req: 'timing_events' },
  { id: 'm9', title: 'Write a loop that prints 1 to 10', xp: 10, req: 'loops_logic' },
];

export default function DailyMissions({ skillTree, addXp }: { skillTree: SkillTreeData, addXp: (amount: number) => void }) {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    // Generate daily missions based on unlocked skills
    const today = new Date().toDateString();
    const stored = localStorage.getItem('codedummy-daily-missions');
    
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        setMissions(parsed.missions);
        return;
      }
    }

    // Generate new missions
    const unlockedMissions = ALL_MISSIONS.filter(m => skillTree.skills[m.req as keyof typeof skillTree.skills]?.unlocked);
    // Shuffle and pick 3
    const shuffled = [...unlockedMissions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(m => ({ id: m.id, title: m.title, xp: m.xp, completed: false }));
    
    // If fewer than 3 unlocked, add some default simple ones
    if (selected.length < 3) {
      selected.push({ id: 'd1', title: 'Log in to your dashboard', xp: 5, completed: false });
    }
    
    setMissions(selected);
    localStorage.setItem('codedummy-daily-missions', JSON.stringify({ date: today, missions: selected }));
  }, [skillTree]);

  const completeMission = (id: string) => {
    setMissions(prev => {
      const newMissions = prev.map(m => {
        if (m.id === id && !m.completed) {
          addXp(m.xp);
          return { ...m, completed: true };
        }
        return m;
      });
      const today = new Date().toDateString();
      localStorage.setItem('codedummy-daily-missions', JSON.stringify({ date: today, missions: newMissions }));
      return newMissions;
    });
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Target className="w-32 h-32" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-xl text-white">Daily Missions</h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">Bonus XP Available</p>
          </div>
        </div>

        <div className="space-y-3">
          {missions.map((mission) => (
            <button
              key={mission.id}
              onClick={() => completeMission(mission.id)}
              disabled={mission.completed}
              className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                mission.completed 
                  ? 'bg-slate-800/50 border-white/5 opacity-60 cursor-default' 
                  : 'bg-slate-800 border-white/10 hover:bg-slate-700 hover:border-white/20 cursor-pointer shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                {mission.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <span className={`text-sm font-bold ${mission.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {mission.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-4">
                <span className={`font-black ${mission.completed ? 'text-slate-500' : 'text-emerald-400'}`}>+{mission.xp}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${mission.completed ? 'text-slate-600' : 'text-emerald-500/70'}`}>XP</span>
              </div>
            </button>
          ))}
          {missions.length === 0 && (
            <p className="text-sm text-slate-500">Unlocking new skills will reveal more missions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
