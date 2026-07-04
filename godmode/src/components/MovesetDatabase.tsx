import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Cpu, ExternalLink, Trophy, History } from 'lucide-react';
import { WrestlingMove, MoveCategory } from '../types';

// Hardcoded initial data
const INITIAL_MOVES: WrestlingMove[] = [
  { 
    id: '1', 
    name: 'German Suplex', 
    category: 'Grapple', 
    damage: 32, 
    staminaCost: 18, 
    startupFrames: 11, 
    description: 'Belly-to-back waist lock lift throwing the opponent high over in an arching bridge.',
    inventedBy: 'Karl Gotch (Catch Wrestler)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Suplex',
    styleRating: '⭐⭐⭐⭐⭐'
  },
  { 
    id: '2', 
    name: 'Western Lariat / Clothesline', 
    category: 'Strike', 
    damage: 24, 
    staminaCost: 10, 
    startupFrames: 7, 
    description: 'A devastating high-impact stiff strike extending the arm to collide with the neck.',
    inventedBy: 'Stan Hansen (All Japan Strong Style)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Lariat',
    styleRating: '⭐⭐⭐⭐.8'
  },
  { 
    id: '3', 
    name: 'Sharpshooter (Scorpion Deathlock)', 
    category: 'Submission', 
    damage: 45, 
    staminaCost: 28, 
    startupFrames: 22, 
    description: 'Step-through leg cross turning the opponent prone to exert torque on the spine and knees.',
    inventedBy: 'Riki Choshu / Bret Hart',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Sharpshooter',
    styleRating: '⭐⭐⭐⭐⭐'
  },
  { 
    id: '4', 
    name: 'Burning Hammer (Inverted Piledriver)', 
    category: 'Technical', 
    damage: 65, 
    staminaCost: 40, 
    startupFrames: 28, 
    description: 'Extremely rare neck-drop throw carrying the opponent in an inverted torture rack and slamming them on their shoulders.',
    inventedBy: 'Kenta Kobashi (Global Puroresu MVP)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Burning+Hammer',
    styleRating: '⭐⭐⭐⭐⭐.75'
  },
  { 
    id: '5', 
    name: 'One-Winged Angel', 
    category: 'Grapple', 
    damage: 60, 
    staminaCost: 35, 
    startupFrames: 25, 
    description: 'Electric chair drop that transitions into an elegant, high-impact one-shouldered driver slam.',
    inventedBy: 'Kenny Omega (Wrestling Observer Star)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=One+Winged+Angel',
    styleRating: '⭐⭐⭐⭐⭐⭐'
  },
  { 
    id: '6', 
    name: 'The Moonsault Press', 
    category: 'Aerial', 
    damage: 34, 
    staminaCost: 19, 
    startupFrames: 18, 
    description: 'A spectacular 360 backflip from the top turnbuckle landing chest-first onto the recumbent defender.',
    inventedBy: 'Keiji Mutoh / Great Muta',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Moonsault',
    styleRating: '⭐⭐⭐⭐⭐'
  },
  {
    id: '7',
    name: 'Blue Thunder Bomb',
    category: 'Grapple',
    damage: 42,
    staminaCost: 22,
    startupFrames: 14,
    description: 'Back suplex lift rotated 180 degrees into a sit-out powerbomb, achieving maximum drop velocity.',
    inventedBy: 'Jun Akiyama (Puroresu Legend)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Blue+Thunder',
    styleRating: '⭐⭐⭐⭐.9'
  },
  {
    id: '8',
    name: 'Vertical Suplex Orange Crush',
    category: 'Technical',
    damage: 55,
    staminaCost: 30,
    startupFrames: 20,
    description: 'Stalled vertical suplex modified in mid-air to drop the opponent into a sit-out powerbomb pin.',
    inventedBy: 'Kenta Kobashi',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Orange+Crush',
    styleRating: '⭐⭐⭐⭐⭐.5'
  },
  {
    id: '9',
    name: 'Cradle Powerbomb',
    category: 'Grapple',
    damage: 48,
    staminaCost: 25,
    startupFrames: 16,
    description: 'Powerbomb variant holding the opponent by their legs/tights to bundle and pin upon direct impact.',
    inventedBy: 'Jushin Thunder Liger (Liger Bomb)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Liger+Bomb',
    styleRating: '⭐⭐⭐⭐.7'
  },
  {
    id: '10',
    name: 'Rolling Unprettier / Killswitch',
    category: 'Technical',
    damage: 38,
    staminaCost: 20,
    startupFrames: 18,
    description: 'Double underhook capture, spinning 180 degrees back-to-back before dropping flat-face forward.',
    inventedBy: 'Christian Cage / Chelsea Green',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Unprettier',
    styleRating: '⭐⭐⭐⭐.8'
  },
  {
    id: '11',
    name: '630 Senton',
    category: 'Aerial',
    damage: 58,
    staminaCost: 34,
    startupFrames: 26,
    description: 'Extreme airborne maneuver performing one and three-quarter front flips (630 degrees) of absolute momentum.',
    inventedBy: 'Jack Evans / Ricochet',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=630+Senton',
    styleRating: '⭐⭐⭐⭐⭐⭐'
  },
  {
    id: '12',
    name: 'Canadian Destroyer',
    category: 'Aerial',
    damage: 52,
    staminaCost: 24,
    startupFrames: 15,
    description: 'A front flip piledriver utilizing the opponent\'s counter weight-momentum to spike them securely.',
    inventedBy: 'Petey Williams (TNA X-Division)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Destroyer',
    styleRating: '⭐⭐⭐⭐⭐.3'
  },
  {
    id: '13',
    name: 'Tiger Driver \'91',
    category: 'Technical',
    damage: 68,
    staminaCost: 42,
    startupFrames: 29,
    description: 'Double underhook elevated powerbomb where the grips are held tight to force a steep neck shoulder-first landing.',
    inventedBy: 'Mitsuharu Misawa (Emerald Emperor)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Tiger+Driver',
    styleRating: '⭐⭐⭐⭐⭐⭐.5'
  },
  {
    id: '14',
    name: 'Cop Killa / Vertebreaker',
    category: 'Grapple',
    damage: 64,
    staminaCost: 38,
    startupFrames: 27,
    description: 'Back-to-back double underhook inverted neckbreaker driving the defender vertically down on their shoulder girdle.',
    inventedBy: 'Megumi Kudo / Homicide / Gregory Helms',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Vertebreaker',
    styleRating: '⭐⭐⭐⭐⭐.9'
  },
  {
    id: '15',
    name: 'Steiner Screwdriver',
    category: 'Grapple',
    damage: 70,
    staminaCost: 45,
    startupFrames: 30,
    description: 'Stalled vertical suplex dynamically transitioned in mid-air straight down into a sit-out tombstone piledriver.',
    inventedBy: 'Scott Steiner (Big Poppa Pump)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Screwdriver',
    styleRating: '⭐⭐⭐⭐⭐⭐.8'
  },
  {
    id: '16',
    name: 'Go To Sleep (GTS)',
    category: 'Strike',
    damage: 46,
    staminaCost: 21,
    startupFrames: 13,
    description: 'Fireman\'s carry drop tossing the defender forward into a stiff knee strike directly to the jaw.',
    inventedBy: 'KENTA / CM Punk',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Go+To+Sleep',
    styleRating: '⭐⭐⭐⭐⭐.1'
  },
  {
    id: '17',
    name: 'Styles Clash',
    category: 'Technical',
    damage: 48,
    staminaCost: 23,
    startupFrames: 19,
    description: 'Belly-to-belly lift, stepping over the opponent\'s arms to lock legs and drop prone face-first.',
    inventedBy: 'AJ Styles (The Phenomenal One)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Styles+Clash',
    styleRating: '⭐⭐⭐⭐.9'
  },
  {
    id: '18',
    name: 'Phoenix Splash',
    category: 'Aerial',
    damage: 54,
    staminaCost: 32,
    startupFrames: 24,
    description: 'Facing away top-rope springboard, executing a 180-degree turn coupled with a 450-degree corkscrew front flip.',
    inventedBy: 'Hayabusa / Seth Rollins',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Phoenix+Splash',
    styleRating: '⭐⭐⭐⭐⭐.6'
  },
  {
    id: '19',
    name: 'Kawada Folding Powerbomb',
    category: 'Grapple',
    damage: 58,
    staminaCost: 29,
    startupFrames: 17,
    description: 'High-impact powerbomb folding the defender\'s weight into a double-knee jackknife press pin layout.',
    inventedBy: 'Toshiaki Kawada (Dangerous K)',
    cagematchUrl: 'https://www.cagematch.net/?id=99&view=moves&search=Kawada',
    styleRating: '⭐⭐⭐⭐⭐.4'
  }
];

export default function MovesetDatabase() {
  const [moves, setMoves] = useState<WrestlingMove[]>(() => {
    const saved = localStorage.getItem('wrestling_moves');
    return saved ? JSON.parse(saved) : INITIAL_MOVES;
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MoveCategory | 'All'>('All');
  
  const [newMoveName, setNewMoveName] = useState('');
  const [isGeneratingStats, setIsGeneratingStats] = useState(false);

  useEffect(() => {
    localStorage.setItem('wrestling_moves', JSON.stringify(moves));
  }, [moves]);

  const categories: (MoveCategory | 'All')[] = ['All', 'Strike', 'Grapple', 'Submission', 'Aerial', 'Technical'];

  const filteredMoves = moves.filter(move => {
    const matchesSearch = move.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || move.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleDelete = (id: string) => {
    setMoves(moves.filter(m => m.id !== id));
  };

  const handleGenerateMove = async () => {
    if (!newMoveName.trim()) return;
    
    setIsGeneratingStats(true);
    try {
      const res = await fetch('/api/generate-move-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveName: newMoveName })
      });
      
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      const newMove: WrestlingMove = {
        id: Date.now().toString(),
        name: newMoveName,
        category: data.category || 'Strike',
        damage: data.damage || 10,
        staminaCost: data.staminaCost || 5,
        startupFrames: data.startupFrames || 10,
        description: data.description || 'A wrestling move.'
      };
      
      setMoves(prev => [newMove, ...prev]);
      setNewMoveName('');
    } catch (e) {
      console.error(e);
      alert('Failed to generate move. Check console.');
    } finally {
      setIsGeneratingStats(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-800 mb-2">Moveset Database</h2>
        <p className="text-sm text-slate-500 mb-6 font-mono">Manage character abilities, frame data, and impact values.</p>
        
        {/* Creation Bar */}
        <div className="flex gap-2 mb-6">
          <input 
            type="text"
            placeholder="E.g. 'Stone Cold Stunner'"
            value={newMoveName}
            onChange={(e) => setNewMoveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateMove()}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
          />
          <button 
            onClick={handleGenerateMove}
            disabled={isGeneratingStats || !newMoveName.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {isGeneratingStats ? <Cpu className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            AI Auto-Stat
          </button>
        </div>

        {/* Dynamic Autonomous Combat Studies Status Indicator */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wider uppercase font-mono text-emerald-400 animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
              Autonomous Combat Engine Studier Active
            </h3>
            <span className="text-[10px] bg-slate-800 hover:bg-slate-700 font-mono text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700 select-none">
              Live Loop: 144Hz Playtest
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Our supreme compiler is constantly studying tactical frames, physics parameters, and biological ragdoll properties from combat masterworks:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
              <span className="text-amber-400 font-bold block mb-0.5">Smackdown / No Mercy</span>
              Grapple staging & weight detection calculations
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
              <span className="text-rose-400 font-bold block mb-0.5">UFC Clinch / Sprawl</span>
              Dynamic bone density & tackle neutralization
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
              <span className="text-sky-400 font-bold block mb-0.5">Tekken Juggles</span>
              Launcher airborne float gravity & block pushbacks
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
              <span className="text-purple-400 font-bold block mb-0.5">Urban Reign Reverse</span>
              Multi-combat counter spheres & limb counters
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
              <span className="text-emerald-400 font-bold block mb-0.5">Gang Beasts Verlet</span>
              Dual-grasp loops & friction torque coefficients
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
              <span className="text-pink-400 font-bold block mb-0.5">Mad Streets Brawls</span>
              Mass-ratio momentum & organic punch physics
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
              <span className="text-red-400 font-bold block mb-0.5">Steve Masson VPW Style</span>
              Head-drop vertical spikers & spinal compression
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
              <span className="text-indigo-400 font-bold block mb-0.5">MDickie Wrestling</span>
              Full weapon hazard colliders & state damage
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search moves..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full pb-2 sm:pb-0 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMoves.map(move => (
            <div key={move.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-lg transition-all transform hover:-translate-y-0.5 relative group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{move.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        move.category === 'Strike' ? 'bg-red-100 text-red-700 border border-red-200' :
                        move.category === 'Grapple' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        move.category === 'Submission' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        move.category === 'Aerial' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {move.category}
                      </span>
                      {move.styleRating && (
                        <span className="text-[10px] font-semibold text-amber-600 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          {move.styleRating}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(move.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Move"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-slate-600 mb-4 h-12 line-clamp-3 leading-relaxed">{move.description}</p>
                
                {/* Historical Lineage & Cagematch Direct Ground Hook */}
                {(move.inventedBy || move.cagematchUrl) && (
                  <div className="mb-4 pt-3 border-t border-slate-100 space-y-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-150">
                    {move.inventedBy && (
                      <div className="flex items-start gap-1.5 text-[10px] text-slate-600">
                        <History className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-slate-700">Lineage: </span>
                          <span>{move.inventedBy}</span>
                        </div>
                      </div>
                    )}
                    {move.cagematchUrl && (
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-bold text-slate-400 uppercase tracking-widest font-mono">CAGEMATCH verified</span>
                        <a 
                          href={move.cagematchUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                        >
                          <span>Move Profile</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-mono font-extrabold uppercase">Damage</div>
                  <div className="font-bold text-slate-850 font-mono">{move.damage}</div>
                </div>
                <div className="text-center border-l border-r border-slate-150">
                  <div className="text-[10px] text-slate-400 font-mono font-extrabold uppercase">Stamina</div>
                  <div className="font-bold text-slate-850 font-mono">{move.staminaCost}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-mono font-extrabold uppercase">Startup</div>
                  <div className="font-bold text-slate-850 font-mono">{move.startupFrames}f</div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredMoves.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <p>No moves found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
