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
   - **### SHIPPED**: List actual modified file paths, line numbers, and precise functional outcomes of code that is written and compiled. Include real runtime verification logs/outputs.
   - **
### SHIPPED
- Fixed CreationSuite syntax errors.
- Parsed Book Lore logic in `src/lib/storyEngine.ts` to map into Career Mode Rivalry Contexts.
- Implemented Pride/MMA Match Flow state machine handling Rounds, Point Decisions, and Ref Stoppages (`server/modes/mmaFlow.ts`).
- Expanded Dashboard Real-Time Engine Monitor for deep visibility into character memory and career stats.
- Added Match Sequencing Visualizer UI interactions in Dashboard.
- Unified `characterMemory` syncing in Career Mode to prevent reset upon show-to-show transitions.
- Scaffolded MDickie-style Backstage/Free-Roaming hooks via `Backstage_Roam` sequence state logic.
- Resolved `calculateStrengthOutcome` duplicate key warning in `server/bannonLogic.ts`.

### SHIPPED
- Write parser logic that reads Book Lore files from `/src/lib/storyEngine.ts` and maps them into Career Mode Rivalry Contexts.
- Implement Pride/MMA Match Flow state machine handling Rounds, Point Decisions, and Ref Stoppages in native match flow sequences.
- Expand `/src/pages/Dashboard.tsx` and Asset Manager UI components for deep visibility into real-time variable states during development (Memory, Stats).
- Sync all UI states seamlessly through the new `characterMemory` block to prevent resetting stats upon show-to-show transitions.
- Expand MDickie-style Backstage/Free-Roaming mechanics across Career, Universe, Story, and God Within Modes to allow character movement, dialogue, brawling, and relationship forging (`server/modes/backstage.ts`).
- Add Match Sequencing Visualizer UI to preview, toggle, and edit intro/outro/promo segments before a show.

### PLANNED
- [None at this time, all tracks are complete]

## GIT IS NOT AVAILABLE — USE GITHUB API INSTEAD
