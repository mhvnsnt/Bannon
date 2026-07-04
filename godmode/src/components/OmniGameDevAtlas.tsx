import React, { useState } from 'react';
import { BookOpen, Monitor, Cpu, Gamepad2, Blocks, Code2, Network, Swords, Target, Database } from 'lucide-react';

type Section = 'CORE_ENGINEERING' | 'PRODUCTION_PIPELINE' | 'GENRE_DEEP_DIVES' | 'SPECIFIC_TITLES' | 'ANATOMICAL_PHYSICS';

export function OmniGameDevAtlas() {
  const [activeSection, setActiveSection] = useState<Section>('CORE_ENGINEERING');

  const navItems: { id: Section, label: string, icon: React.ReactNode }[] = [
    { id: 'CORE_ENGINEERING', label: 'Core Engineering Pillars', icon: <Cpu className="w-4 h-4" /> },
    { id: 'PRODUCTION_PIPELINE', label: 'Production Pipelines', icon: <Blocks className="w-4 h-4" /> },
    { id: 'GENRE_DEEP_DIVES', label: 'Genre Mechanics', icon: <Target className="w-4 h-4" /> },
    { id: 'SPECIFIC_TITLES', label: 'Specific Title Analysis', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'ANATOMICAL_PHYSICS', label: 'Anatomical Physics & SIM', icon: <Swords className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full h-full bg-[#050505] text-amber-500 font-mono p-4 flex flex-col border-l border-amber-900/40 overflow-hidden">
      <div className="border-b border-amber-900/50 pb-3 mb-4 shrink-0 flex items-center justify-between">
         <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
           <BookOpen className="w-4 h-4" /> Omni Game Dev Atlas
         </h2>
         <div className="text-[10px] bg-amber-900/20 text-amber-500 border border-amber-900/50 px-2 py-1 flex items-center gap-2">
            <Monitor className="w-3 h-3" /> Excruciating Detail Matrix Loaded
         </div>
      </div>

      <div className="flex gap-4 mb-4 shrink-0 overflow-x-auto no-scrollbar">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border transition-colors ${activeSection === item.id ? 'bg-amber-900/40 border-amber-500 text-amber-300' : 'bg-black border-amber-900/30 text-amber-700 hover:border-amber-700'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020202] border border-amber-900/30 p-4 rounded text-xs leading-relaxed text-amber-100">
        
        {activeSection === 'CORE_ENGINEERING' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-amber-400 font-bold mb-2 border-b border-amber-900/30 pb-1">1. GAME ENGINE ARCHITECTURE</h3>
              <p className="mb-2">Modern AAA games require a highly multithreaded architecture separating systems into jobs/tasks. Core loops include input polling, simulation (physics, gameplay), and rendering.</p>
              <ul className="list-disc pl-4 space-y-1 text-amber-600">
                <li><strong className="text-amber-500">Memory Allocation:</strong> Custom memory pools, stack allocators, and double-buffered frame allocators are mandatory to prevent fragmentation and garbage collection spikes.</li>
                <li><strong className="text-amber-500">Entity Component System (ECS):</strong> Data-oriented design. Arrays of Structs (AoS) converted to Structs of Arrays (SoA) for massive CPU cache coherency benefits. Used in Unity's DOTS and Unreal's MassEntity.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm text-amber-400 font-bold mb-2 border-b border-amber-900/30 pb-1">2. GRAPHICS PROGRAMMING (DX12 / VULKAN)</h3>
              <p className="mb-2">Moving away from state machine APIs (OpenGL/DX11) to Command Buffer architectures.</p>
              <ul className="list-disc pl-4 space-y-1 text-amber-600">
                <li><strong className="text-amber-500">Compute Shaders:</strong> Culling non-visible triangles via GPU before they hit the rasterizer.</li>
                <li><strong className="text-amber-500">Raytracing (Hardware):</strong> BVH (Bounding Volume Hierarchy) generation for real-time global illumination, soft shadows, and accurate reflections.</li>
                <li><strong className="text-amber-500">Mesh Shaders:</strong> Replacing the vertex/geometry/tessellation pipeline. Dynamically creating geometry inside the GPU (Unreal Engine 5 Nanite).</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm text-amber-400 font-bold mb-2 border-b border-amber-900/30 pb-1">3. NETWORKING (SERVER AUTHRORITY)</h3>
              <ul className="list-disc pl-4 space-y-1 text-amber-600">
                <li><strong className="text-amber-500">Client Prediction:</strong> Client simulates actions immediately physically assuming the server will agree. If disagreement occurs, a rubber-band correction happens.</li>
                <li><strong className="text-amber-500">Rollback Netcode (GGPO):</strong> Used in fighting games. The engine constantly saves game states. If delayed inputs arrive from a remote player, the engine loads the past state, injects the inputs, and mathematically simulates forward 5-10 frames instantaneously to catch up.</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'PRODUCTION_PIPELINE' && (
          <div className="space-y-6">
             <h3 className="text-sm text-amber-400 font-bold mb-2 border-b border-amber-900/30 pb-1">THE STUDIO PIPELINE</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-amber-900/50 p-3 bg-black">
                  <h4 className="text-[10px] font-bold text-amber-500 tracking-widest mb-1">PRE-PRODUCTION & PROTOTYPING</h4>
                  <p className="text-[10px] text-amber-700">Greyboxing, core mechanic definition, art bible creation. This ends with a 'Vertical Slice'—a highly polished 15-minute chunk of gameplay proving the game is fun and viable.</p>
                </div>
                <div className="border border-amber-900/50 p-3 bg-black">
                  <h4 className="text-[10px] font-bold text-amber-500 tracking-widest mb-1">ASSET PIPELINE</h4>
                  <p className="text-[10px] text-amber-700">High-poly sculpting (ZBrush) &rarr; Retopology limits for engine &rarr; UV unwrapping &rarr; Baking maps &rarr; Texturing (Substance Painter) &rarr; Engine import &rarr; PBR Material setup.</p>
                </div>
                <div className="border border-amber-900/50 p-3 bg-black">
                  <h4 className="text-[10px] font-bold text-amber-500 tracking-widest mb-1">ANIMATION & RIGGING</h4>
                  <p className="text-[10px] text-amber-700">Skeleton creation (Maya/Blender). Motion capture ingestion, optical tracking cleanup, retargeting to master skeletons, blending spaces (idle&rarr;walk&rarr;run math), and Inverse Kinematics setup.</p>
                </div>
                <div className="border border-amber-900/50 p-3 bg-black">
                  <h4 className="text-[10px] font-bold text-amber-500 tracking-widest mb-1">ALPHA / BETA / GOLD MASTER</h4>
                  <p className="text-[10px] text-amber-700">Alpha: Feature complete. Beta: Content complete. Gold Master: Certified by Sony/Microsoft/Nintendo for deployment.</p>
                </div>
             </div>
          </div>
        )}

        {activeSection === 'GENRE_DEEP_DIVES' && (
          <div className="space-y-6">
             <div>
                <h3 className="text-sm text-amber-400 font-bold mb-2 border-b border-amber-900/30 pb-1">FIGHTING GAMES (Competitive Physics Variables)</h3>
                <p className="mb-2 text-[#ff2a85] font-bold text-[10px] uppercase tracking-widest">Excruciating Metric: Frame Data Math</p>
                <div className="text-[10px] text-amber-600 bg-[#0a0a0a] border border-amber-900/30 p-2 font-mono">
                   Frames operate at 60 FPS. 1 Frame = 16.66ms.<br />
                   - Startup: Frames before a hitbox becomes active.<br />
                   - Active: Frames the hitbox can deal damage.<br />
                   - Recovery: Frames the attacker is stuck in animation after an attack.<br />
                   - Hit Stun / Block Stun: Frames the defender is staggered.<br />
                   Frame Advantage = (Hit Stun) - (Active + Recovery). If positive, you are "Plus on Block". Action precedence mathematically dictates the winner.
                </div>
             </div>

             <div>
                <h3 className="text-sm text-amber-400 font-bold mb-2 border-b border-amber-900/30 pb-1">PHYSICS SANDBOXES & SIMULATORS</h3>
                <p className="mb-2 text-cyan-400 font-bold text-[10px] uppercase tracking-widest">Excruciating Metric: Biological / Mechanical Tearing</p>
                <div className="text-[10px] text-amber-600 bg-[#0a0a0a] border border-amber-900/30 p-2 font-mono">
                   Finite Element Method (FEM) is used instead of rigid bodies to simulate soft tissue or metal bending. A mesh is divided into tetrahedrons. Stress vectors are calculated linearly. When stress exceeds "Yield Strength" in megapascals (MPa), the tetrahedron separates dynamically from its neighbor. This creates hyper-realistic tearing, breaking, and biological fluid release.
                </div>
             </div>
          </div>
        )}

        {activeSection === 'SPECIFIC_TITLES' && (
          <div className="space-y-6">
             <div className="bg-black border border-amber-900/50 p-4">
                <h3 className="text-lg font-bold text-white mb-1 tracking-widest uppercase">STELLAR BLADE / NIER AUTOMATA</h3>
                <h4 className="text-[10px] text-fuchsia-500 border-b border-amber-900/30 pb-1 mb-2 font-bold">Category: High-Octane Action Character Action / Spectacle Fighter</h4>
                <p className="text-amber-600 text-xs mb-2">
                  <strong className="text-amber-500">Physics Engine Architecture:</strong> Extensive reliance on specialized soft-body constraint solvers for hair/clothing dynamics (often utilizing Havok Cloth or custom compute shaders). Complex state machine transitioning utilizing "Animation Canceling" via guard/dodge buffers.
                </p>
                <p className="text-amber-600 text-xs">
                  <strong className="text-amber-500">Biological / Kinematic Rigging:</strong> High bone count (often 500+ specifically for secondary motion in glutes, thighs, breasts, and hair) utilizing driven keys—when a femur rotates, secondary bones translate to simulate muscle flexing and tissue displacement without full FEM biological simulation load.
                </p>
             </div>

             <div className="bg-black border border-amber-900/50 p-4">
                <h3 className="text-lg font-bold text-white mb-1 tracking-widest uppercase">TEARDOWN</h3>
                <h4 className="text-[10px] text-cyan-500 border-b border-amber-900/30 pb-1 mb-2 font-bold">Category: Voxel-Based Destruction Engine</h4>
                <p className="text-amber-600 text-xs mb-2">
                  <strong className="text-amber-500">Custom Engine:</strong> Built entirely on a custom C++ engine. Everything is a voxel grid. When damage physics applies a stress vector, the engine recalculates voxel connectivity. If a voxel cluster's connectivity graph splits off from the static world graph, it instantly converts into an active RigidBody with physics calculated by AABB colliders. Raytraced global illumination runs purely dynamically because world geometry breaks every frame.
                </p>
             </div>
          </div>
        )}

        {activeSection === 'ANATOMICAL_PHYSICS' && (
          <div className="space-y-6">
             <div className="bg-black border border-red-900/50 p-4">
                <h3 className="text-lg font-bold text-red-500 mb-1 tracking-widest uppercase flex items-center gap-2">
                  <Database className="w-5 h-5"/> EXCRUCIATING DETAIL: Biological Sim & Fluid Systems
                </h3>
                <h4 className="text-[10px] text-[#ff2a85] border-b border-red-900/50 pb-1 mb-2 font-bold">DAZ Genesis Gen 9+ / Tomodachi Sandbox</h4>
                
                <p className="text-amber-600 text-xs mb-4">
                  For extremely high-fidelity anatomical simulations, standard vertex skinning is completely insufficient. Next-generation systems employ:
                </p>

                <ul className="list-disc pl-4 space-y-3 text-[10px] text-amber-500">
                  <li><strong className="text-red-400">Jiggle Deformers & GPU Spring Physics:</strong> Assigning mass and string-tension (Hooke's Law: F = -kx) to vertices directly based on weight maps. Viscoelastic fluid formulas calculate the damping necessary to simulate fat and muscle jiggle vs rigid bone limits.</li>
                  <li><strong className="text-red-400">Dynamic Morph Injection (FACS):</strong> Facial Action Coding System mapped across 100+ separate blendshapes, allowing autonomous programmatic muscle firing tied to internal AI neurochemical status (e.g., Dopamine spike = AU12 + AU6 smile with eye-crinkle).</li>
                  <li><strong className="text-[#ff2a85]">Tissue Stretch & Tearing Vectors (Excruciating Level):</strong> Measuring the distance between vertex points on specialized tissue membranes. When tensile yield limits (MPa) are surpassed during collision geometry overlap, shaders dynamically adjust UV mapping to display micro-tearing normal maps, transitioning into mesh separation if forced.</li>
                  <li><strong className="text-cyan-400">Autonomous Particle Secretions (Arousal/Biological Fluids):</strong> Real-time Navier-Stokes fluid approximations localized to specific bone joints. Particle emitters dynamically spawn metaballs with high viscosity values (cSt). Emitters are tied strictly to state-machine triggers (Pulse rate, collision friction persistence). Surface tension and adhesion algorithms lock these particles to skin UVs allowing them to dynamically run down the biological mesh tracing normal maps based on world gravity vector.</li>
                </ul>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
