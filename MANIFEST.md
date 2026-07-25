# MANIFESTO: The Bannon Engine Paradigm Shift
*Official System Architecture and Engineering Protocol*

---

## 1. Executive Declaration: Native C++ and Unreal Engine 5 Transition
The Bannon Engine has officially undergone a complete structural evolution. This project is no longer a single-page HTML or browser-bound application. All core gameplay loops, collision matrices, skeletal animations, character psychology runtimes, and rendering pipelines are natively built using **Unreal Engine 5 and Object-Oriented C++**.

### The Legacy Exception
To respect the origins of the engine, the legacy 25,000-line Three.js "Brick System" is **officially deprecated**. However, as a nostalgic nod and structural fallback, a lightweight Three.js subset remains active *exclusively* for:
- In-browser legacy arena preview widgets.
- Attire design texture maps and model viewport previews.

All production-ready systems, active match instances, physics interactions, and LiveLink network feeds are anchored completely in **native C++**.

---

## 2. Advanced combat Physics & Core Influences

### Active Ragdolls & Interceptive Air-Collisions
Inspired by the visceral weight of Steve Masson's *Neckbreaker: Visceral Pro Wrestling* and the realistic physics modeling of classic *UFC* and *Fight Night* engines, Bannon Engine deploys an **Active Ragdoll Physics System**:
- **Non-Canned Hit Reactions**: Upon receiving high-impact moves, characters transition dynamically into active ragdoll simulations, blending skeletal animation keys with physics constraints.
- **Interceptive Strikes (Falling Physics)**: Players can strike opponents out of mid-air during dives or falls. The engine calculates localized momentum vectors, skeletal torque, and impact forces to alter the trajectory of the falling character dynamically.
- **Environmental Collisions**: Characters thrown into barricades, ropes, ring posts, or steel steps collide with real-time physical constraints, creating realistic deformities and limp body reactions.

---

## 3. Modular Creation Suite (WWE 2K Architecture)
The Bannon Creation Suite is modeled after the industrial-standard modular layout of modern wrestling games like *WWE 2K26*:
- **FCreationItemRow Registry**: A structured DataTable driving all mesh references, unlock states, subcategory tags, and exclusive slot index limits.
- **GORO_RIG Layer Bindings**: Drives dynamic skeletal bone-scaling transformations within a custom AnimInstance, mapped directly from a React-based client's sliders to native parameters:
  - `Head_Size`, `Neck_Width`, `Shoulder_Width`, `Chest_Scale`, `Waist_Scale`, `Arm_Thickness`, `Leg_Thickness`.
- **Dynamic Layering & Color Overrides**: Fully supports stacked facepaint, makeup, masks, and accessories utilizing material instance dynamics for real-time visual parameters.

---

## 4. Kinematic Weaponry & Control Scheme
The Kinematic Weaponry system handles all weapon interactions (table dismantling, weapon wheels, weapon strikes).
- **Control Layout**: To prevent control overlap, the UI layout has been separated:
  - **Interact (L1/LB)**: Moved to the left side of the screen; handles managing weapons, table dismantling, and the weapon wheel.
  - **Zone (R1/RB)**: Moved to the right side of the screen; handles entering/exiting the ring, climbing, and traversal.

---

## 5. Dual-Layer Agent Architecture & Proactive Execution Loop
Our development and synchronization flows utilize a dual-layer AI agent architecture paired with a strict proactive execution loop to guarantee system-wide integrity.

### The Dual-Layer Agent Loop
1. **The Orchestration Layer (Web UI)**: Collects React state, coordinates OAuth/database operations, registers webhooks (e.g., BAMCODEVBot on Telegram), and maps live-link payloads.
2. **The Execution Layer (Unreal Engine C++)**: Compiles native code, parses psychology JSON, executes the 4-axis Finite State Machine (FSM), and drives the stamina-constrained active gameplay.

### Proactive Execution Loop (PE Loop)
Before writing any code or updating any C++ headers/source files, the AI agent is bound to run a **Codebase Awareness Check**:
- **Search First (DRY Verification)**: Execute strict `grep` searches to identify preexisting functions, classes, and structs across the `unreal/` and `src/` directories.
- **Redundancy Interception**: If a requested system already exists, do not duplicate or re-scaffold. Refactor, extend, or bind directly to the existing codebase.
- **Verification Gate**: Any edit must pass linter validation (`tsc --noEmit`) and C++ compile validation before it is labeled as complete. No feature is marked "complete" without verifiable, observed proof.

---

## 7. Archetype & Injury Persistence Systems
The Bannon Engine supports character uniqueness and cumulative damage:
- **Archetype Manager (`UBannonArchetypeManager`)**: Assigns archetype-specific stat modifiers (e.g., Powerhouse strength boost).
- **Injury Manager (`UBannonInjuryManager`)**: Tracks and persists injury damage to body parts, impacting locomotion and performance stats dynamically.

---

## 8. Next Executing Sequence Protocol (Bannon Repo Anchor)
In accordance with the project rules, all future responses must maintain the **Bannon Repo Anchor**:
- Never output historical summaries, AKI-era comparisons, or theoretical game design mechanics.
- Prioritize technical integration, relative C++ code structures, and actual React webhook mappings.
- Every response must conclude with a structured **Next Executing Sequence** block, defining the concrete upcoming file modifications or verification steps.

---
## 9. Autonomous Agent & Memory Infrastructure
- **Memory Layer (Mem0/Letta)**: Universal memory layer for cross-session context retention and autonomous agent memory management.
- **Autonomous Execution (Aider/OpenHands)**: CLI pair programming and sandboxed execution agents for native C++/Node.js repository maintenance.
- **Ingestion/Indexing (Repomix/Continue)**: High-speed repository packing and local RAG indexing for precise context ingestion.

## 10. Core Game Modes (Simulation & Narrative)
- **Universe Mode**: Dynamic, ongoing wrestling calendar management, championship division tracking, power rankings, and contender climbing mechanics mapped explicitly to WWE 2K's structural logic (Shows, Divisions, #1 Contender points). Can be toggled for a "Full Show Experience" (Promos, Intros, Outros) or "Matches Only". Supports MDickie-style Backstage Free-Roam to interact and forge relationships during the show.
- **Career Mode**: Superstar progression through ranked hierarchies, performance-based stat improvement, career milestones (e.g., Main Roster Draft, Championship Contention). 
  - **Starting Pathways**: Ability to start in any federation, including Indies, Pride/MMA, and any show/company from the Bannon lore. 
  - **Deep Integration**: Integrates specific managerial hierarchies, PPVs/PLEs, book-specific show flow and sequencing, and book lore into career progression. Mimics WWE 2K/MDickie ranked trajectories while using native Bannon match-flow mechanics hybridized with book-based sequencing.
  - **Free Roam/Backstage Interactions**: Implements MDickie-style walking around, controlling the character backstage, initiating brawls, dialogue, and tracking relationship variables (Alliances/Rivalries) that carry over into matches.
- **The God Within Mode**: High-concept narrative mode focusing on branching story nodes and RPG-style skill trees for psychological/supernatural status effects. Integrated with the physics engine via `SupernaturalTraits`, allowing specific gimmicks (Fiend, Undertaker-esque) to override standard simulation caps for strength, speed, and resilience (kayfabe-accurate superhuman feats), akin to Tekken's "Devil Within". Includes supernatural exploration/free-roam zones.
- **GM/Booking Mode**: Management and rating-based booking simulator. Balances financial health, roster morale, and audience popularity with dynamic match-quality impacts. Includes visual Match Sequencing tool.
- **Backyard/Hardcore Mode**: Low-budget, environment-agnostic arena rules and object-based combat mechanics.
- **Sandbox/Exploration (MDickie-style)**: Free-roaming 3D environment interactions with zone-based state controllers for backstage, locker rooms, and ringside.
- **Backstage/Arena Transitions**: Physics-based, seamless 3D zone-to-zone transitions (Arena/Backstage/Crowd) enabled by zone-triggers in the movement controller.

---

## 11. Design Philosophy: 3D Simulation Over Arcade
All systems MUST prioritize:
- **3D Physics-Based Combat**: Full integration with 3D physics wrappers (e.g., cannon.js/ammo.js equivalents). Trajectory calculations consider 3D mass, velocity vectors, and gravity.
- **Inverse Kinematics (IK) & Injury Persistence**: Cumulative limb damage affects the 3D locomotion rigs (gaits, sway, limp factors) and restricts move efficacy.
- **Simulation Consistency**: No arcade-style "floating" animations. Movement must respect locomotion cadences and character DNA in the 3D world space.
- **Modular System Integration**: All modes map back to the core `BANNON_AI_DNA` and `OTTR_DNA` statistics, while supernatural elements safely override them via isolated simulation multipliers.
