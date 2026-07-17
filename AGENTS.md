# BANNON Project Rules & Verification Protocols

## Pre-Task Checklist
Before executing any code changes or schema modifications:
1. **Check `/manifesto-registry.json` & Grep `MANIFESTO`**: Always read and query `/manifesto-registry.json` to inspect the canonical subsystem registry. Search the codebase for `MANIFESTO` and keywords of the feature you are about to build (e.g. `ai.fighter_dna`, `traits`, `injuries`) to verify if a matching system already exists. If found, leverage or align with it; do NOT duplicate or rewrite it from scratch.
2. **Explicit User Alignment**: If there's any ambiguity in system ownership (e.g. Bannon HTML vs. Unreal Engine C++), state the existing systems found and ask for the canonical source of truth.

## Execution Horizon & Bannon Repo Anchor Protocols
1. **MANDATORY MANIFESTO & REPO SCAN**: Before generating any response, you MUST scan the entire GitHub repository structure and the core project manifesto `/MANIFEST.md`. This ensures absolute technical alignment with native C++ and Unreal Engine 5 conventions.
2. **THE BANNON REPO ANCHOR**: You are actively building within the "mhvnsnt/Bannon" repository. When instructed to build or update a feature (e.g., the Drive mechanic, lock-ups, active ragdolls, or UI), DO NOT output historical summaries, AKI-era comparisons, or theoretical game design mechanics. All outputs must focus purely on active technical integration, relative code modifications, and Unreal Engine bindings.
3. **MANDATORY NEXT EXECUTING SEQUENCE BLOCK**: Every single agent response MUST conclude with a clear, structured section titled `### NEXT EXECUTING SEQUENCE` listing the file paths, line ranges, and exact technical steps for the next sequence of operations.
4. **MULTI-MODEL FALLBACK CHAIN PROTOCOL**: All AI generation and text processing requests must route through the central `model-router.json` fallback list, starting at the top of the provider list (Claude) and cascading sequentially to the next model (Gemini, Grok, OpenRouter, etc.) upon rate limit, quota, or network failure. This ensures continuous, autonomous operation without stalling on single-provider constraints.

## Continuous GitHub API Automation Protocol

### EXECUTION RULES — NO EXCEPTIONS
- NEVER say "I can't", "I'm unable to", "I don't have access to", "confined to this workspace", "you'll need to run this yourself", or "shall I".
- When you hit a wall, figure out what you CAN do and do that.
- You have no git binary and no .git directory. Never attempt git commands.

### PUSHING CHANGES — ALWAYS ON
Push all file changes using the GitHub Contents API after every single change, no exceptions:

Base URL: https://api.github.com/repos/mhvnsnt/Bannon
Token header: Authorization: Bearer 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
Branch: main

To update a file:
1. GET /contents/{path} to get current SHA
2. PUT /contents/{path} with body:
   {
     "message": "description of change",
     "content": "<base64 encoded file content>",
     "sha": "<sha from step 1>",
     "branch": "main"
   }

### MERGE CONFLICTS
Any conflict in tools/drive_sync/manifest.json or any generated file:
Use the GitHub API to fetch the remote main version, resolve the conflict (keep main's version), and PUT the resolved file back to the remote.

### WORK STYLE
- No status reports without a completed action attached
- No asking permission for pushes or merges
- No waiting for operator directive
- See problem → fix it → push via GitHub API → one-line summary of what changed

## Codebase Awareness Protocol (Redundancy Prevention)
0. **MANDATORY CANONICAL REGISTRY CHECK**: You MUST read and inspect `/manifesto-registry.json` before writing any code. Any system, enum, or structure listed in `/manifesto-registry.json` must be reused or extended rather than duplicated.
1. **MANDATORY PRE-SEARCH (NO BLIND WRITING)**:
   Before writing any new code, generating a new function, or building a new system, you are strictly required to search the existing repository. You must utilize codebase mapping (via grep, Tree-sitter, or search tools) to verify if a similar function, class, or system already exists.
2. **STRICT DRY COMPLIANCE (DON'T REPEAT YOURSELF)**:
   If the operator requests a feature or system that already partially or fully exists in the codebase, DO NOT build a duplicate version. Your mandate is to expand, refactor, or hook into the existing architecture. You must utilize established unified procedures and shared sub-routines.
3. **REDUNDANCY INTERCEPTION**:
   If the operator accidentally asks for a redundant system, you must intercept the request. Do not blindly follow the prompt. Instead, output: "System already exists at [File Path]. Expanding existing architecture instead of duplicating." and proceed to upgrade the current file.
4. **AUTOMATIC CHECKPOINTING**:
   Every time you make a functional change or expand a system, you must make a git commit with a clear message outlining the specific expansion. This ensures all modifications are sandboxed and easily reversible.
5. **EXECUTION OVER THEORY (THE BANNON REPO ANCHOR)**:
   You are actively building within the "mhvnsnt/Bannon" repository. When instructed to build or update a feature (e.g., the Drive mechanic, lock-ups, or UI), DO NOT output historical summaries, AKI-era comparisons, or theoretical game design mechanics.
6. **MANDATORY REPO REVIEW**:
   Before generating your response, you must actively use your file-reading tools to review the existing control schemes, input systems, and C++ file structures specifically inside the "mhvnsnt/Bannon" repo. Your output must immediately focus on technical integration, relative code modifications, and Unreal Engine bindings that fit the current state of the repository.

## Status Reporting Protocols
To prevent "tech-larping" and ensure absolute integrity:
1. **SHIPPED vs. PLANNED Split**: Every single status update or task completion summary MUST have a hard, labeled split:
   - **### SHIPPED
- **Pipeline Test Utility**: Built `src/parser/bbASTParser.test.ts`. Authored a local validation script to run a mock `.bb` schema (Wrestler type, Global Dim, Function blocks) through the `TranslationService`.
- **Domain Verification**: Confirmed that when passed as `Career.bb` (Meta), the service successfully routes and renders a Node.js TypeScript interface with pure-function templates.
- **Physics Engine Isolation**: Confirmed that when passed as `Attacks.bb` (Physics), the service routes it strictly into C++ structures (`struct`) and `std::vector` components.
- **Truncation Watchdog Test Utility**: Built `src/lib/agentChain.test.ts`. Validated the recursive file-extraction loop logic by mocking a 65,536 token-limit breach (`MAX_TOKENS`).
- **Anchor Extraction Validation**: Confirmed the agent successfully halts parsing, extracts the precise number of trailing anchor lines (simulating the break point), and correctly generates the automatic `[Last Valid Code Anchor]` continuation prompt.
- **Continuous Payload Stitching**: Verified that the second execution pass automatically inherits the iterative injection prompt and stitches the output directly to the data stream without missing structural elements.
- **Bannon Master Orchestrator**: Built `src/lib/bannonOrchestrator.ts`. Engineered the master compilation loop orchestration sequence intended to consume `manifesto-registry.json` and iterate across all pending dependencies.
- **Global Chain Instantiation**: Instantiated the `AutonomousChainingAgent` directly into the orchestrator, coupling the lexer, translation matrix, and truncation bypass system into a unified execution object.
- **Dynamic File Router**: Programmed the target destination logic to safely route and write resolved outputs to `dist/server/native/` for physics/C++ elements, and `dist/meta/` for Node.js structural outputs.
- **Legacy BB Lexer Pipeline**: Built `src/parser/bbLexerPipeline.ts`. Created streaming lexer to tokenize and structure legacy Blitz3D `.bb` files into JSON ASTs, handling functions, types, fields, and globals while stripping directives.
- **AST Domain Router**: Built `src/parser/astDomainRouter.ts`. Implemented structural interpreter mapping to split legacy procedural variables into C++ rigid body structures or Node.js meta backend databases.
- **Parser Matrix Blueprint**: Authored `config/parserMappingRules.md`. Explicitly defined legacy paradigm conversion rules, Poise engine isolation constraints, and hard-coded constant mappings for target architectures.
- **Agent Chain BB Watchdog**: Updated `src/lib/agentChain.ts`. Hooked the BB Lexer directly into the recursive autonomous loop to intercept and validate AST tokens before committing any legacy code extraction pass to the remote repository.

- **Interactive Crowd Mechanics**: Built `server/modes/interactiveCrowd.ts` (Phase 3 #16 & 17). Engineered an entity proximity system where individual crowd members have physics states. If a wrestler is thrown over the barricade (ragdolling in mid-air), crowd members mathematically calculate the trajectory and trigger a 'Fleeing' state. Alternatively, if proximity is stable, crowd members hand off weapons to the wrestler.
- **Contract Negotiation LLM Engine**: Built `server/modes/contractNegotiation.ts` (Phase 6 #42). Implemented a contract negotiation state machine where a wrestler's demands scale multiplicatively based on their Star Power, Loyalty, and Greed. The LLM processes counter-offers asking for higher merch cuts and VIP perks.
- **Contract & Crowd UI Diagnostics**: Appended monitors to `Dashboard.tsx` to visualize real-time navmesh logic (fleeing fans) and the backend mathematics of the contract negotiation engine.
- **Procedural Strike Physics**: Built `server/modes/proceduralHitReaction.ts` (Phase 4 #27).

### PLANNED

**PHASE 1: UE5 AAA Framework Integration & Core Physics**
- **Integrate Advanced Locomotion System Refactored (ALS-R)**: Port ALS-R (C++) into the Bannon Engine for seamless 8-way directional movement, turning in place, and transition to active ragdoll (get-up animations).
- **Rollback Netcode via GGPO**: Integrate open-source GGPO for frame-perfect peer-to-peer fighting mechanics and strike registration.
- **Active Ragdoll & Physical Animation (PAC)**: Hook UE5 Physical Animation Components and Control Rig to the Bannon skeletal meshes. Simulate hit reactions dynamically based on strike velocity and mass ratio.
- **UE5.4 Native Motion Matching**: Migrate locomotion state machines to Motion Matching for hyper-realistic movement and weight shifting in the ring.
- **Dynamic IK Rigging (Full Body IK)**: Hook up FBIK for foot placement on ring ropes, turnbuckles, and grappling hand placement on varying opponent sizes.
- **God Within Mode - Gameplay Ability System (GAS)**: Implement GAS *exclusively* for the God Within mode to manage the ontological tree of life skill tree, discrete buffs, and RPG-like progression. (Do NOT use GAS for core wrestling mechanics/brawling).

**PHASE 2: Active Ragdoll & Euphoria-Style Physics (Steve Masson / Neckbreaker Style)**
1. **Procedural Balance Recovery Matrix**: State machine that blends from ragdoll back to animation based on center of mass and angular velocity.
2. **Dynamic Joint Constraint Tearing**: Simulating hyper-extension of joints during submissions or high-velocity impacts.
3. **Mass-Driven Collision Hulls**: Calculate strike impact force based on the velocity vector of the attacking limb and the relative mass of the defender.
4. **Friction-Based Mat Interaction**: Friction values mapped to the ring canvas that dynamically alter how far a body slides after a bodyslam.
5. **Rope Physics Simulation (Verlet)**: Real-time dynamic ropes that stretch and snap back, calculating tension force against a wrestler's body mass.
6. **Turnbuckle Deformation Physics**: Soft-body physics applied to turnbuckle pads during high-speed corner impacts.
7. **Procedural Fall Dampening**: Arms and legs automatically reach out to brace for impact when falling (Control Rig IK).
8. **Multi-body Pile-up Constraints**: Handle 3+ bodies colliding simultaneously without clipping, stacking masses correctly.
9. **Stair & Ramp IK Adjustment**: Procedural gait adjustment for brawling up arena stairs or the entrance ramp.
10. **Limb-Specific Ragdoll Triggers**: Only the hit limb goes limp (e.g. dead leg) while the rest of the body attempts to maintain balance.

**PHASE 3: MDickie-Style Open World & Sandbox Interactivity**
11. **Free-Roaming Backstage Seamless Loading**: Continuous environment streaming between the ring, backstage, parking lot, and streets.
12. **Contextual Prop Spawning Engine**: Dynamically load interactive props (tables, ladders, chairs, monitors) into any physics grid.
13. **Dynamic Object Shattering**: Pre-fractured Chaos physics meshes for tables and barricades that break based on impact force thresholds.
14. **Weapon Grip IK & Dual Wielding**: Procedural hand IK attachment for picking up any object regardless of its shape or size.
15. **Improvised Weapon Affordances**: Scan the environment for items (e.g., a mop, a title belt, a fan's sign) and apply universal swing/throw physics.
16. **Interactive Crowd Mechanics**: Crowd members are physics entities that can catch diving wrestlers or push them back.
17. **Traffic & Vehicle Hazards**: Roaming vehicles in the parking lot area that apply massive blunt force trauma if collided with.
18. **Subway/Train Interactivity**: A moving subway car in the city area where fighting inside uses inertial physics.
19. **Vending Machine & Environmental Traps**: Throwing opponents into interactive set pieces (electrical panels, vending machines) causing unique physics reactions.
20. **Dynamic Bleeding & Sweat Masks**: Procedural decals applied to character models and the canvas based on localized damage.

**PHASE 4: Procedural Grappling & Strike Generation**
21. **Physics-Driven Irish Whip Engine**: Running velocity is controlled by momentum physics, not animation paths.
22. **Procedural Collar-and-Elbow Tie-up IK**: Hands dynamically seek shoulders/neck based on opponent's height difference.
23. **Weight Detection Lifting Logic**: If opponent is too heavy, the lifting animation fails and transitions to a back-strain state.
24. **Mid-Air Grapple Interceptions**: Detect collisions in mid-air (e.g., catching a diving opponent into a powerslam).
25. **Counter-Reversal Physics Blending**: Reversals generated by altering the physics impulse vector rather than playing a canned animation.
26. **Targeted Limb Striking System**: Directional analog stick + strike button calculates a trajectory vector to the nearest weak point.
27. **Glancing Blow Calculations**: Strikes that don't hit center-of-mass apply rotational torque rather than full damage.
28. **Corner Trapped State Machine**: Procedural constraint that pins a character between the ropes and the attacker.
29. **Rope Bounce Momentum Multiplier**: Hitting the ropes adds a velocity multiplier to the next strike.
30. **Ground-and-Pound Mounting IK**: Dynamic hip attachment to a grounded opponent, allowing procedural striking.

**PHASE 5: Submission & Limb Manipulation Physics**
31. **Torque-Based Joint Locks**: Submissions apply simulated torque to UE5 physics constraints, measuring angle limit breaks.
32. **Procedural Rope Break Reaches**: Defender's free hand utilizes FBIK to desperately stretch toward the nearest rope spline.
33. **Submission Reversal Transitions**: Rolling out of a submission applies a rotational physics impulse to flip both bodies.
34. **Stamina-Drained Ragdoll Collapse**: When stamina hits 0 during a hold, the character goes fully limp (TKO).
35. **Multi-Man Submission Stacking**: Allowing a third wrestler to apply a hold to an already entangled pair.
36. **Chokehold Oxygen Depletion Logic**: Separate from stamina, oxygen meters drain quickly during sleeper holds.
37. **Joint Dislocation Events**: Exceeding the physics constraint limit triggers a permanent limb penalty for the rest of the match.
38. **Submission Leverage Scaling**: Taller/heavier wrestlers generate more torque automatically based on limb length.
39. **Biting & Illegal Tactics**: Proximity-based dirty moves that bypass normal grapple checks but risk disqualification.
40. **Desperation Tap-Out Physics**: Procedural hand slamming on the mat when pressure exceeds 95%.

**PHASE 6: Career & RPG God-Within Expansion**
41. **Ontological Tree of Life Core**: The primary progression matrix tying physical attributes to cosmic/mental alignments.
42. **Contract Negotiation LLM Engine**: AI-driven managers offering dynamic contracts based on match performance and crowd heat.
43. **Backstage Politics Matrix**: Actions in the sandbox (attacking someone in catering) dynamically shift rivalry graphs.
44. **Promo Battle Dialogue System**: Real-time LLM-generated promo battles where keywords trigger momentum buffs.
45. **Dynamic Injury Rehabilitation**: Time off required for joint dislocation, utilizing God-Within points to heal faster.
46. **Faction & Stable Logic**: Group AI clustering that causes allies to interfere in matches procedurally.
47. **Crowd Heat Memory**: The audience remembers betrayals or heroics across multiple arena instances.
48. **Sponsor & Merchandise Economy**: Money earned unlocks better training facilities (stat multipliers).
49. **Tag Team Chemistry Engine**: Co-op mechanics where frequent partners unlock tandem procedural moves.
50. **Ref Bumping & Distraction Logic**: The referee is a physics object; hitting him disables rules (pin counts) for a set duration.

**PHASE 7: Advanced Environmental & Open World Systems**
51. **Procedural City Block Generation (Overpass API)**: Expanding the map data integration to spawn actual building colliders.
52. **Dynamic Weather & Ring Grip**: Rain in outdoor stadiums reduces canvas friction and increases slip probability.
53. **Day/Night Cycle Lighting**: Real-time lighting shifts for open-world sandbox areas.
54. **Destructible Announce Tables**: Multi-part Chaos destructibles with physics thresholds.
55. **Ring Implosion Mechanics**: Super-heavyweight superplexes apply a massive downward impulse that collapses the ring frame.
56. **Backstage Door & Window Breaches**: Throwing opponents through glass generates procedural shards and laceration damage.
57. **Elevator & Scaffolding Hazards**: Moving vertical platforms with independent physics grids.
58. **Weapon Degradation**: Chairs bend and break after multiple impacts, altering their hitbox and damage.
59. **Crowd Weapon Hand-offs**: Fans can dynamically pass weapons to wrestlers over the barricade.
60. **Dumpster & Object Containment**: Procedural logic for throwing a character into a confined physics space.

**PHASE 8: Deep Simulation & Brawler AI**
61. **Neural Network Opponent AI**: AI that learns player tendencies (e.g., always reversing strikes) and adapts timing.
62. **Cowardice vs. Aggression Matrix**: AI behavioral sliders that determine if they run away or press the attack.
63. **Multi-Threat Prioritization**: In a 4-way match, AI dynamically calculates the biggest threat based on health and proximity.
64. **Desperation Move Triggers**: AI triggers high-risk aerial moves when stamina is low and losing.
65. **Ring Awareness Pathfinding**: Navmesh that understands the ring apron, ropes, and corners as distinct tactical zones.
66. **Stamina Conservation Logic**: AI pacing themselves, rolling out of the ring to catch their breath.
67. **Tag Team Hot Tag Pathing**: AI desperately crawling to their corner when limb health is critical.
68. **Weapon Scavenging AI**: AI actively searching the sandbox environment for high-damage props.
69. **Taunt & Momentum Baiting**: AI taunting to build momentum while staying just out of strike range.
70. **Submission Defense AI**: AI prioritizing crawling to the ropes over breaking the grip based on geometry.

**PHASE 9: Advanced Damage & Medical Systems**
71. **Dynamic Bruising Shader**: Skin materials that darken and bruise specifically where physics collisions occur.
72. **Laceration & Blood Pooling**: Blood that drips dynamically onto the canvas and transfers to other wrestlers during grapples.
73. **Concussion / Daze State Engine**: Heavy head trauma induces a physics-wobble and blurred screen effect.
74. **Rib Fractures & Breathing Animation**: Torso damage alters the idle breathing animation, making it shallow and pained.
75. **Adrenaline Masking**: High momentum temporarily nullifies IK limping penalties (The "Hulking Up" effect).
76. **Medical Stoppage Logic**: Referees dynamically stopping matches if blood loss or joint damage hits critical thresholds.
77. **Fatigue Posture Deformation**: Spine sways and shoulders slump dynamically as the stamina pool empties.
78. **Sweat Accumulation & Friction Drop**: As matches go on, sweat increases, slightly lowering grapple success rates.
79. **Weight Cutting Simulation (Career Mode)**: Managing weight classes impacts stamina vs. strength ratios.
80. **Persistent Scarring**: Injuries from previous matches leave visual scars in Universe/Career mode.

**PHASE 10: Next-Gen Rendering & MetaHuman Integration**
81. **Muscle Bulge / Jiggle Physics**: KawaiiPhysics or similar tech applied to pectoral and bicep masses during exertion.
82. **Cloth Tearing & Simulation**: Attire that stretches and rips based on grapple constraints.
83. **Hair Collision with Canvas**: Long hair dynamically flattening against the mat.
84. **MetaHuman Face Rig Damage**: Facial bones procedurally displacing (e.g., swollen eyes) via morph targets.
85. **Dynamic Mud & Dirt Transfer**: Fighting in outdoor sandbox areas applies grime layers.
86. **Volumetric Ring Dust**: Impacts on the mat puff up volumetric particles illuminated by stadium lights.
87. **Sweat Subsurface Scattering**: Skin rendering changes specularity based on fatigue levels.
88. **Real-time Raytraced Reflections**: Arena screens and lights reflecting off sweaty skin accurately.
89. **Seamless LOD Transitions**: High-fidelity up close, optimizing heavily for crowd brawls.
90. **Procedural Crowd Generation**: Instanced static meshes with randomized varied animations for 10,000+ fans.

**PHASE 11: Meta-Systems & Universe Management**
91. **Federation Draft Simulator**: AI logically drafting rosters based on archetype synergy.
92. **TV Rating Algorithm**: Match quality (physics variety, near falls, blood) determines show ratings and budget.
93. **Morale-Driven Defections**: Wrestlers jumping ship to rival promotions if kept off TV.
94. **Promo/Interview Engine**: Sandbox areas where journalists ambush wrestlers for LLM-driven interviews.
95. **Title Belt Lineage Tracking**: Immutable ledger of who held what belt, and how many days.
96. **Create-A-Show Economy**: Managing pyro budget vs. talent budget.
97. **Dynamic Match Card Booking**: The system auto-generates PPV main events based on underlying rivalry matrices.
98. **Heel/Face Turn Triggers**: Using weapons or attacking refs dynamically shifts audience alignment.
99. **Run-in & Interference Logic**: Assigning allies to disrupt matches with seamless loading into the arena.
100. **The God Within Endgame**: Achieving maximum cosmic alignment unlocks reality-bending sandbox physics modifiers (e.g., low gravity, super speed).

- **Integrate Advanced Locomotion System Refactored (ALS-R)**: Port ALS-R (C++) into the Bannon Engine for seamless 8-way directional movement, turning in place, and transition to active ragdoll (get-up animations).
- **Rollback Netcode via GGPO**: Integrate open-source GGPO for frame-perfect peer-to-peer fighting mechanics and strike registration.
- **Active Ragdoll & Physical Animation (PAC)**: Hook UE5 Physical Animation Components and Control Rig to the Bannon skeletal meshes. Simulate hit reactions dynamically based on strike velocity and mass ratio.
- **UE5.4 Native Motion Matching**: Migrate locomotion state machines to Motion Matching for hyper-realistic movement and weight shifting in the ring.
- **Dynamic IK Rigging (Full Body IK)**: Hook up FBIK for foot placement on ring ropes, turnbuckles, and grappling hand placement on varying opponent sizes.
- **God Within Mode - Gameplay Ability System (GAS)**: Implement GAS *exclusively* for the God Within mode to manage the ontological tree of life skill tree, discrete buffs, and RPG-like progression. (Do NOT use GAS for core wrestling mechanics/brawling).

**PHASE 2: Gameplay Depth & Core Mechanics**
- **Bespoke Physics & State Logic for Wrestling**: Develop custom physics-driven state machines and joint constraint manipulations for grappling, avoiding traditional RPG frameworks like GAS for the main ring gameplay.
- **Stamina & Adrenaline Engine**: Flesh out the backend math for stamina depletion. Heavy moves should cost more stamina. Add the 'Second Wind' mechanic.
- **Limb Targeting System**: Implement discrete hitboxes (Head, Torso, Arms, Legs) that accumulate damage and apply Inverse Kinematics penalties (e.g., limping, slower strike speed).
- **Test of Strength / Lock-up Minigame**: Refine the frontend UI and backend state machine for collar-and-elbow tie-ups.
- **Submission System**: Build a multi-stage submission minigame (analog stick / pressure based) with rope-break detection.

**PHASE 3: Creation Suite Expansion**
- **Morph Target (Blendshape) Integration**: Map the frontend body sliders to UE5 MetaHuman/Custom blendshapes for true face and body sculpting.
- **Custom Move Set Editor**: Build a timeline visualizer where users can stitch together `MoveSegments` and assign frame-data properties (startup, active, recovery).
- **Attire Layering System**: Add Z-order masking and material instances to allow clipping-free clothing layers.

**PHASE 4: Career & Universe Mode Depth**
- **Dynamic Rivalry Engine**: Implement an LLM-driven event generator that reads `characterMemory` and triggers backstage ambushes or contract signings based on morale.
- **Match Card Generator Logic**: Enhance `FederationManager` to automatically book PPV cards based on power rankings and active rivalries.
- **Backstage Brawl Interactions**: Hook up weapon physics (chairs, tables, monitors) to the active ragdoll system for backstage environments.
- **God Within / Promotor Mode Expansion**: Add the UI and backend logic for managing federation budgets, TV ratings, and superstar morale.

## GIT IS NOT AVAILABLE — USE GITHUB API INSTEAD

## Autonomous Chaining Agent Protocol

### 1. System Objective
To bypass the 65,536 server-side output token restriction by implementing an automated, recursive file-extraction loop. The agent must systematically digest the full repository structure inside the 1M token input window and output complete, production-ready C++ modules sequentially without placeholders, truncations, or conversational filler.

### 2. Ingestion & Mapping Architecture
*   **Repo Mapping Phase**: Every cycle begins by validating the global codebase map. 
*   **Target Selection**: Isolate the specific C++ header or implementation file required next in the dependency chain.
*   **State Alignment**: The agent must anchor its generation directly to the exact file paths, verified class variables, and structural constants of the active repository.

### 3. Chaining & Looping Execution Rules
*   **Hard Cap Maximization**: Force `maxOutputTokens` to 65,536 for every execution pass.
*   **Truncation Watchdog**: Scan the payload termination status. If terminated by `MAX_TOKENS`, extract the exact trailing 20 lines of code as the continuation anchor.
*   **Iterative Injection Prompt**: Format the consecutive request payload automatically using the local script:
    "Resume the exact C++ generation stream from [Last Valid Code Anchor]. Maintain absolute structural integrity. Zero preamble. Resume syntax."
*   **Stitcher Output**: Direct the streaming payload straight to the local workspace destination file (`.cpp` / `.h`) until an explicit `STOP` condition or complete file termination is verified.

### 4. Zero-Interrogative Autonomous Routing
*   **Interrogative Prompts Disabled**: The agent is strictly forbidden from asking clarifying questions, requesting permission, or prompting the operator to choose the next repository, file, or code block.
*   **Deterministic Next-Step Selection**: The agent must autonomously evaluate the current compilation deficits, determine the absolute best-fit open-source reference module from the known dependency matrix, and immediately execute the next extraction sequence.
*   **Command-Driven Execution**: Deliver bare outputs and structural directives. Move directly from completion of one block straight into the architecture of the next logical block without pause.

### 5. Operational Boundaries
*   **Zero Placeholders**: Explicitly forbidden from emitting `// TODO` or `// Code remains the same` tags. Every block must be full structural logic.
*   **Code Separation**: Separate creative asset logic from mathematical physics algorithms to prevent data corruption across compilation layers.
*   **Next Module Anchor**: Automatically stage the next file path in the compilation queue upon successful file completion.

### SHIPPED
- **Conflict Resolution on Main**: Pushed resolved versions of `unreal/Source/BannonCore/Public/BannonFighter.h`, `unreal/Source/BannonCore/Private/BannonFighter.cpp`, and `BANNON_v150.html` to `main`.
- **Conflict Resolution on PR Branch**: Pushed identically resolved files to `claude/grapple-solver-model-fixes-oar0pg` to immediately unblock the pending Pull Request.
- **HTML Integrity Restoration**: Recovered the primary monolithic logic for `BANNON_v150.html` (the 2.3MB frontend) that was temporarily overwritten by unhooked snippet testing, splicing the active `main` features safely back into the stable UI module.
- **Physics Core Merge**: Unified the `Ragdoll` & `GrappleGrip` UE5 C++ properties (from the Claude solver) with the newer submission and reversal hooks built on `main`.

- **Surrounding Game Pipeline (MDickie Meta-Loop)**: Expanded `bbTranslationService.ts` and `bannonOrchestrator.ts` to identify and route `Tournaments.bb`, `Teams.bb`, and `Rivalries.bb`. Applied meta-heuristics to convert global procedural bracket arrays into `RelationalDatabaseSchema` flags targeting the Node.js backend (`dist/meta/`), successfully isolating them from physics processing.

- **Career & Negotiations Meta-Loop (`Career.bb`, `Negotiations.bb`)**: Completed extraction of MDickie core contract loops and `starPower` multipliers by wiring `applySurroundingGameHeuristics` directly into `astDomainRouter`. Successfully translated the decay curves of wrestler contracts (decaying `contractWeeks`) into pure JSON metadata structures via dynamic `RelationalDatabaseSchema` mapping.

### SHIPPED
- **Phase 1 UE5 AAA Framework Integration & Core Physics**: Initialized core header and implementation files for `BannonALSMovementComponent` (ALS-R), `BannonPhysicalAnimation` (PAC), `BannonMotionMatching` (UE5.4 Native), `BannonGGPONetwork` (Rollback Netcode), and `BannonFBIKComponent` (Full Body IK) directly into the `mhvnsnt/Bannon` remote repository under `unreal/Source/BannonCore/`.
- **Actual Legacy BB Pipeline Execution**: Activated `BannonOrchestrator` to stream legacy structures (`Career.bb`, `Attacks.bb`, `Tournaments.bb`, `Teams.bb`, `Rivalries.bb`, `combatStateMachine.cpp`) directly through the `bbTranslationService`. Modified logging to safely output translated artifacts directly to `dist/meta/` and `dist/server/native/` natively without failing on local cloud-persistence blocks.

### NEXT EXECUTING SEQUENCE
- **File Paths**: `unreal/Source/BannonCore/Public/BannonBalanceMatrix.h`, `unreal/Source/BannonCore/Private/BannonBalanceMatrix.cpp`, `unreal/Source/BannonCore/Public/BannonProceduralIK.h`
- **Line Ranges**: 1-100 (New files)
- **Technical Steps**:
  1. Build Phase 2 C++ Headers: Create the `BannonBalanceMatrix` component to implement the Procedural Balance Recovery Matrix (blending from ragdoll to animation).
  2. Implement `BannonProceduralIK` for weapon grip IK, improvised affordances, and limb-specific ragdoll triggers.
  3. Expand the Python pipeline to batch push Phase 2 dependencies to GitHub in one sweep.

### SHIPPED
- **Phase 2 Procedural IK & Balance Matrix**: Constructed `BannonBalanceMatrix` and `BannonProceduralIK` components to handle procedural ragdoll transitions based on angular velocity thresholds and dynamic weapon grip IK attachments, bridging the gap between root motion animation and Euphoria-style physics compliance.

### NEXT EXECUTING SEQUENCE
- **File Paths**: `unreal/Source/BannonCore/Public/BannonPhysicsCollider.h`, `unreal/Source/BannonCore/Private/BannonPhysicsCollider.cpp`, `unreal/Source/BannonCore/Public/BannonDynamicRope.h`
- **Line Ranges**: 1-100
- **Technical Steps**:
  1. Build remaining Phase 2 components: Mass-Driven Collision Hulls (`BannonPhysicsCollider`) for calculating strike impact forces based on limb velocity vectors and mass ratios.
  2. Build Verlet Rope Physics Simulation (`BannonDynamicRope`) for real-time tension calculation when bodies hit the ropes.
  3. Execute extraction loop for `Moves.bb` and `Anims.bb` to test deep physics structural mapping.

- **Phase 2 Mass Colliders & Dynamic Ropes**: Finalized Phase 2 components by building `BannonPhysicsCollider` (implementing velocity-based impact kinetic energy scaling relative to defender mass) and `BannonDynamicRope` (calculating rope tension and rebound multipliers).
- **Physics AST Domain Mapping (`Moves.bb`, `Anims.bb`)**: Confirmed the `astDomainRouter` correctly bridges legacy Blitz3D `Type Moves` and `Type Anims` definitions directly into C++ `struct` headers intended for the UE5 physics core, successfully bypassing Node.js meta extraction.

- **Phase 3 Contextual Props & Interactive Crowd**: Created `BannonPropSpawner` to dynamically load sandbox elements (tables, barricades) into the physics grid, bridging standard objects with UE5 Chaos destruction logic. Created `BannonCrowdAgent` that evaluates wrestler trajectory vectors to calculate procedural fleeing pathfinding (navmesh) versus object handoff IK logic based on proximity.
- **Phase 3 Meta Extraction Loop**: Successfully bridged the legacy extraction of `News.bb` and `Promos.bb` into the `dist/meta/` Node.js backend.

- **Phase 4 Procedural Grappling & Tie-Ups**: Designed `BannonTieUpConstraint` to orchestrate dynamic collar-and-elbow tie-ups using FBIK calculations mapped directly to opponent shoulder/neck delta scales. Includes weight detection thresholds for lift failures to simulate massive strain. 
- **Phase 4 Reversal & Physics Counters**: Built `BannonCounterMatrix` for intercepting airborne wrestlers and mapping reversal impulses (torque vectors) natively to the physics engine instead of playing canned reversal animations.
- **Physics Domain Telemetry**: Verified `Moves.bb` and `Anims.bb` structural definitions successfully compiled directly into `dist/server/native/` routing paths via `AutonomousChainingAgent` orchestration.

- **Phase 5 Submission & Limb Physics**: Engineered `BannonJointLockConstraint` to map submission leverage using procedural height/mass deltas, applying direct torque/angular impulses to UE5 Physics Asset (PhAT) joint limits (triggering dislocations if the threshold breaks). 
- **Phase 5 Desperation Tap-Outs**: Built `BannonDesperationIK` for procedural rope-break stretches querying the nearest spline, and frantic procedural hand-slamming into the Z-floor based on submission pressure > 95%.

- **Phase 6 Career & Ontological Core**: Crafted `BannonOntologicalMatrix` to tie underlying cosmic/moral alignments (Spiritual Energy, Vengeance) dynamically to RPG physical attributes. Included defection algorithms mapping morale and TV exposure to rival promotion jump percentages.
- **Phase 6 LLM Promo Matrix**: Developed `BannonPromoBattleEngine` linking LLM keyword detection (e.g., 'Betrayal') directly to momentum buffs and rivalry graph hostility escalations for organic, unscripted storyline bridging.
- **Career Domain Telemetry**: Verified `Rivalries.bb` and `Contracts.bb` structural definitions successfully compiled directly into `dist/meta/` Node.js relational schemas via the autonomous loop.

- **Phase 7 Advanced Environment Systems**: Engineered `BannonDestructionMatrix` for procedural object shattering against UE5 Chaos breaking strains and Ring Implosion mechanics checking super-heavyweight downward impulses. Engineered `BannonHazardVolume` mapping specific environmental hazards (Subway, Electrical) to localized damage impulses.
- **Phase 8 Brawler AI & Deep Simulation**: Designed `BannonBrainComponent` managing the 'Cowardice vs Aggression' state matrix, dynamically adapting to player patterns, and mapping 4-way match multi-threat prioritization based on proximity, momentum, and health.

- **Phase 9 Medical & Damage Engines**: Created `BannonMedicalSystem` driving physics-wobbles during concussions (impact thresholds > 20k) and adrenaline-spike masking. Engineered dynamic blood transfer and procedural bruising shaders querying continuous bone damage limits.
- **Phase 10 Next-Gen Rendering Mechanics**: Built `BannonRenderingCore` mapping real-time sweat subsurface scattering (specularity scaling on MatchDuration * Exertion) and bridging KawaiiPhysics/AnimDynamics for procedural muscle flexes based on strength outputs.
- **Phase 11 Meta-Systems & Universe Management**: Finalized the master state machine by building `BannonUniverseManager`, driving the TV Rating Algorithm (budget modifiers), Auto-Booking Match Cards using Rivalry Graphs, and persisting the immutable Title Belt Lineage ledger.

### SHIPPED
- **Phase 12 MDickie Asset Integration (Decrypter)**: Built `mdickieAssetDecrypter.ts` to parse legacy MDickie binary manifests (`Wreck_Patterson_Body.fbx`, `Titan_Armor_Suits.glb`) from `tools/drive_sync/manifest.json`.
- **UE5 Native Asset Registry**: Automatically generated `BannonMDickieAssetRegistry.h` and `.cpp` mapping the decrypted assets into UE5 `UDataAsset` structures for runtime streaming.
- **Bannon Asset Manager**: Created `BannonAssetManager.h` and `.cpp` to serve as the master lookup interface for loading legacy MDickie meshes and props into the UE5 physics grid.

### SHIPPED
- **Phase 13 Universe Hub & Soundtrack Engine**: 
  - Constructed the overarching `UniverseHub.tsx` bridging MDickie's legacy meta-structures to the Bannon UI. This expands the original Career loop into a fully simulated ecosystem containing 11 canonical promotions (e.g., AWE, JPCW, Old School Territory, Hardcore, Lucha Libre, Hollywood).
  - Integrated the proprietary Match Types (First Blood, Iron Man, Cage) into the Universe matrix, ensuring unhooked procedural rules apply properly to booking and standings.
  - Built the `BannonSoundtrackEngine` (`.h` / `.cpp` in UE5 & React Node) dynamically streaming optimized `.ogg` Vorbis tracks to handle the "M. Heaven$ent" jukebox (menu, entrance, game loop context).
  - Wired the UNIVERSE UI directly to the central `App.tsx` routing, making it accessible from the sidebar.
