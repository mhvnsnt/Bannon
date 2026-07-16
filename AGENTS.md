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
- **Overpass API Environment Generator**: Built the `server/world/environmentGenerator.ts` script to act as the Node.js orchestrator pulling raw JSON vector paths from `https://overpass-api.de`. This script reads latitude/longitude nodes and maps them cleanly into `GameSplinePath` objects ready to pipe straight into Unreal Engine 5 PCG (Procedural Content Generation) and C++ spline configurations for free-roaming zones.
- **World Generation Diagnostics UI**: Pushed the real-time Overpass data pipeline monitor to `src/pages/Dashboard.tsx`, confirming live hook states for UE5 splines and explicit GAS boundaries.
- **Multi-Stage Submission Core Logic**: Built the submission mathematics in `server/modes/submissionSystem.ts`. The state machine dynamically calculates a pressure gauge delta by scaling the attacker's analog input against their stamina pool, weighed against the defender's remaining stamina and isolated `LimbHealth`. Added `distanceToRopes` triggers to force automatic rope breaks.
- **Submission Diagnostics UI**: Wired up the "Submission Loop Diagnostics" monitor on the front-end dashboard to track real-time gauge pressure, stamina advantages, and specific targeted limb HP.
- **Grapple & Tie-Up State Machine**: Architected the collar-and-elbow tie-up core loop mathematically weighting `LimbHealth` vs. active `stamina`.
- **Limb Targeting & IK Translators**: Built discrete hitbox logic (`server/hitboxLogic.ts`) mapping 6 physical quadrants to active UE5 FBIK offsets.

### PLANNED

**PHASE 1: UE5 AAA Framework Integration & Core Physics**
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
