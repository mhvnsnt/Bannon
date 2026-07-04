import React, { useState, useMemo } from 'react';
import { BookOpen, Monitor, Gamepad2, Swords, Target, Database, Search, Activity, Zap, ShieldAlert, Cpu } from 'lucide-react';

type Section = 'WWF_WWE_HISTORY' | 'UFC_MMA_SIMULATION' | 'TEKKEN_3D_FIGHTERS' | 'VISCERAL_PHYSICS' | 'KINETIC_MECHANICS';

export function GamestudyLibrary() {
  const [activeSection, setActiveSection] = useState<Section>('WWF_WWE_HISTORY');
  const [searchQuery, setSearchQuery] = useState('');

  const navItems: { id: Section, label: string, icon: React.ReactNode }[] = [
    { id: 'WWF_WWE_HISTORY', label: 'Wrestling History (WWF/WWE)', icon: <Activity className="w-4 h-4" /> },
    { id: 'UFC_MMA_SIMULATION', label: 'MMA & UFC Simulation', icon: <Target className="w-4 h-4" /> },
    { id: 'TEKKEN_3D_FIGHTERS', label: 'Tekken & 3D Fighters', icon: <Swords className="w-4 h-4" /> },
    { id: 'VISCERAL_PHYSICS', label: 'Visceral Physics & Brawlers', icon: <Zap className="w-4 h-4" /> },
    { id: 'KINETIC_MECHANICS', label: 'Combat Kinematics', icon: <Cpu className="w-4 h-4" /> },
  ];

  const contentDatabase = {
    'WWF_WWE_HISTORY': {
      title: "WWF & WWE Games: The Grappling Evolution",
      data: [
        {
          title: "The Golden N64 Era (AKI Corporation)",
          content: "The absolute pinnacle of mechanical purity. WCW vs. nWo Revenge, WWF WrestleMania 2000, and WWF No Mercy established the 'Spirit Meter' (momentum-based psychology) and the Weak/Strong grapple system. Instead of fighting game inputs, players tapped for weak grapples or held for strong grapples, creating a flawless rock-paper-scissors tempo of pacing, reversals, and limb targeting."
        },
        {
          title: "The SmackDown! Arcade Era (Yuke's)",
          content: "Starting on PS1 and dominating PS2 (Here Comes the Pain). This engine abandoned the plodding simulation of AKI for hyper-kinetic, arcade-speed brawling. Highlighted by extreme environmental interactivity (jumping off the SmackDown fist) and weight-detection mechanics."
        },
        {
          title: "The Simulation Era (WWE 2K series)",
          content: "Yuke's and later Visual Concepts transitioned the franchise into strict sports simulation. Introduction of limited reversal slots, active stamina management, chain wrestling mini-games based on collar-and-elbow tie-ups, and massive motion-capture libraries aiming for broadcast-television parity."
        }
      ]
    },
    'UFC_MMA_SIMULATION': {
      title: "UFC & MMA: The Anatomy of Violence",
      data: [
        {
          title: "THQ Undisputed Era (Yuke's)",
          content: "UFC 2009, 2010, and Undisputed 3 revolutionized combat sims. Introduced independent limb damage displays, analog-stick sweep transitions for ground-and-pound, and the legendary TKO system. UD3's 'Pride Mode' allowed soccer kicks and knees to grounded opponents, capturing raw, visceral violence."
        },
        {
          title: "EA Sports UFC (Ignite & Frostbite)",
          content: "Transitioned to procedural hit reactions and Real Player Motion (RPM) tech. Knockouts became purely physics-driven rather than canned animations. The grappling system fractured into micro-transitions (half-guard to side control), requiring defensive blocking of specific limbs using right-stick directional prediction. Visceral damage includes swelling, cuts, and blood spreading dynamically on the canvas."
        }
      ]
    },
    'TEKKEN_3D_FIGHTERS': {
      title: "Tekken & 3D Fighters: The Frame Data Kings",
      data: [
        {
          title: "4-Button Limb Architecture",
          content: "Unlike Street Fighter's light/medium/hard system, Tekken rigidly assigns each face button to a limb (Left Arm, Right Arm, Left Leg, Right Leg). Combos (strings) are physical sequences. 1,1,2 (Jab, Jab, Right Straight) represents a fluid kinematic chain."
        },
        {
          title: "Movement & The Korean Backdash (KBD)",
          content: "Tekken is heavily defined by the Z-axis (sidestepping). The 'Korean Backdash' is a physical exploit turned core mechanic—canceling the recovery frames of a backdash into a crouch dash, and immediately backdashing again, creating an unnatural, hyper-evasive reverse glide."
        },
        {
          title: "Frame Data Math",
          content: "The excruciating math of 1vs1. Most attacks start up in 10-15 frames (i10 to i15). If a player blocks an attack that leaves the opponent at -15 frames, the player has a guaranteed 15-frame window to launch them. It is pure chronological physics."
        }
      ]
    },
    'VISCERAL_PHYSICS': {
      title: "Visceral Physics: Gang Beasts & Masson Mechanics",
      data: [
        {
          title: "Active Ragdolls (Gang Beasts / Human Fall Flat)",
          content: "Zero canned animations. Muscle tension is applied dynamically to physical joints. Characters maintain balance using procedural torque on a simulated pelvic center-of-mass. Punches are physical rigidbodies accelerating into other physics objects, creating wildly unpredictable, hilarious, but mathematically accurate blunt force trauma."
        },
        {
          title: "Steve Masson Spine/Neckbreaker Visceral Pro Wrestling",
          content: "A masterclass study in raw impact mechanics. When executing a neckbreaker, the engine does not merely play an animation. It tracks the mass of the attacking body pulling the defending body downward. The impact registers structural vector compression on the cervical spine nodes of the defending mesh. Sound design triggers precisely when rigidbodies collide with the mat, creating a terrifying, visceral thud that vibrates the physical controller."
        },
        {
          title: "Toribash Joint-Manipulation",
          content: "Turn-based combat where players manually relax, contract, or extend specific biological joints (glutes, pecs, knees) and let the engine step forward in time. Resulting in hyper-violent dismemberment governed purely by momentum and shear force thresholds."
        }
      ]
    },
    'KINETIC_MECHANICS': {
      title: "Core Combat Kinematics & Execution",
      data: [
        {
          title: "Hit Stop & Screen Shake",
          content: "To make an impact feel 'visceral', the engine physically pauses the timeline for 2-4 frames exactly at the moment a hitbox intersects a hurtbox ('Hit Stop'). This simulates the immense physical resistance of flesh and bone. The camera then applies a Perlin noise vector shake synced to the impact force."
        },
        {
          title: "Hitboxes & Hurtboxes",
          content: "Invisible collision geometry. A hurtbox is attached to a player's bones. A hitbox is an active volume attached to a weapon or limb. When they overlap, damage math executes. Disjointed hitboxes (like a sword, where the weapon hurts the enemy but striking the weapon doesn't hurt the attacker) create zoning advantages."
        }
      ]
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return contentDatabase[activeSection].data;
    const lowerQuery = searchQuery.toLowerCase();
    
    // Search across current section only, or could be expanded to all
    return contentDatabase[activeSection].data.filter(
      item => item.title.toLowerCase().includes(lowerQuery) || item.content.toLowerCase().includes(lowerQuery)
    );
  }, [activeSection, searchQuery, contentDatabase]);

  return (
    <div className="w-full h-full bg-[#050505] text-[#ff2a85] font-mono p-4 flex flex-col border-l border-[#ff2a85]/40 overflow-hidden">
      <div className="border-b border-[#ff2a85]/50 pb-3 mb-4 shrink-0 flex items-center justify-between flex-wrap gap-2">
         <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-[#ff2a85] flex items-center gap-2">
             <BookOpen className="w-4 h-4" /> Lore & Kinematics Library
           </h2>
           <p className="text-[10px] text-[#ff2a85]/60 mt-1">Excruciating study of fighting games, wrestling engines, and visceral combat.</p>
         </div>
         <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#ff2a85]/50" />
            <input 
              type="text" 
              placeholder="Search lore..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black border border-[#ff2a85]/30 focus:border-[#ff2a85] rounded px-6 py-1 text-xs text-white focus:outline-none transition-colors w-48"
            />
         </div>
      </div>

      <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto no-scrollbar pb-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-2 px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all rounded shadow-sm ${activeSection === item.id ? 'bg-[#ff2a85]/20 border-[#ff2a85] text-white shadow-[0_0_10px_rgba(255,42,133,0.3)]' : 'bg-black border-[#ff2a85]/30 text-[#ff2a85]/70 hover:text-[#ff2a85] hover:border-[#ff2a85]/50'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020202] border border-[#ff2a85]/30 p-4 rounded text-xs leading-relaxed text-gray-300 shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative">
         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ShieldAlert className="w-32 h-32" />
         </div>
         
         <h3 className="text-lg text-white font-bold mb-6 tracking-widest uppercase flex items-center gap-2 border-b border-[#ff2a85]/30 pb-2">
            <Database className="w-5 h-5 text-[#ff2a85]" />
            {contentDatabase[activeSection].title}
         </h3>

         <div className="space-y-6 relative z-10">
            {filteredData.length > 0 ? (
               filteredData.map((item, index) => (
                  <div key={index} className="bg-[#0a0a0a] border border-[#ff2a85]/20 rounded-lg p-4 hover:border-[#ff2a85]/50 transition-colors">
                     <h4 className="text-sm font-bold text-[#fbcfe8] mb-2 uppercase tracking-wide flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-[#ff2a85] rounded-full inline-block" />
                       {item.title}
                     </h4>
                     <p className="text-gray-400 font-sans text-xs sm:text-sm leading-relaxed">
                       {item.content}
                     </p>
                  </div>
               ))
            ) : (
               <div className="text-center py-10 opacity-50 font-bold uppercase tracking-widest">
                  No lore found matching structural vector "{searchQuery}"
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
