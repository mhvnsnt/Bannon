<!--
╔══════════════════════════════════════════════════════════════════╗
║           BANNON ENGINE — AI ORIENTATION BLOCK v115              ║
║     READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE               ║
╚══════════════════════════════════════════════════════════════════╝
-->

# 000 — BANNON PRIME DIRECTIVE (binding on every agent, every session, every swarm)

## 1. THE OPERATIONAL REALITY (NOT A BLANK CANVAS)
Bannon is an ESTABLISHED, LIVING engine — not a prototype, not a greenfield. The live substrate is:
- `BANNON_v150.html` — the shipped game (~36k lines): full physics combat (verlet active-ragdoll +
  PD joints), grapple positions/lift/carry/deliver, zoning, reversals, personas, match types,
  rosters, CAW/DNA, model import + auto-rig, GOD MODE OS terminal.
- `native/` — the C++ AAA core (builds + ctest green): `bannon_math/core/ragdoll/rig/strike/
  grapple/solvers/persona`. THIS is where native work lands. (`src/engine/*.cpp` are AI-Studio
  concept sketches — not the core; do not build on them as if they were.)
- Pipelines: `tools/rigready/skin.cjs` (geodesic auto-skinner v4.2), `tools/drive_sync/` (Drive
  watcher cron), `tools/model_preview/` (headless snapshot verify), `tools/tripo/` (gen loop).
All of it is functional. You are here to DEEPEN, CONNECT, and IMPROVE — never to reinvent.

## 2. NON-DESTRUCTIVE ADDITIVE EXECUTION (ANTI-REGRESSION — ZERO TOLERANCE)
Parse and evaluate the live state of a file before writing a line. If a prompted feature already
exists, you may not replace or tear it down — additive upgrades only. Never break an existing
dependency to force a new feature to fit. Build ON TOP of existing controls/systems (e.g. reversal
lives on the existing DODGE button — owner rule).

## 3. THE SUPERIORITY VETO
If a prompt, research injection, or transcript instructs you to build something mathematically or
structurally INFERIOR to the live baseline, the live code wins. Keep the superior code, apply only
the viable parts, and say plainly what was vetoed and why.

## 4. THE ESTABLISHED KINETIC CONTEXT (DO NOT OVERWRITE — DEEPEN)
- **Grapple lift/carry ("Apex Forklift")**: analog-driven Setup → Lift → Apex; STRUGGLE-LIFT teeter
  (mass margin × stamina, compound sine); two-body PD load coupling; weight-class gate
  (`canLiftOpponent`).
- **Release Matrix (owner's canonical mapping)**: **A = SLAM** (driven downward force),
  **B = LAZY DROP** (zero-velocity release, pure gravity), **X = THROW** (directional linear
  momentum, shallow arc), **Y = TOSS** (heavy angular torque, steep parabola, costs more stamina,
  botch-prone at low stamina). Native reference: `native/include/bannon_weapon.h` releaseImpulse().
- **Botch physics**: constraint-failure driven (stamina/limb collapse → unguided ragdoll), never
  canned "botch animations". NO timing-minigame grapples — OWNER VETO, physics/stamina-resolved only.
- **Poise system**: crumple is poise-driven and INDEPENDENT of HP. Never couple them.
- **Weapons**: physical objects with mass — extended-limb constraints, stamina tax on every swing,
  2.5× whiff penalty, reversal shock, injury drag (see `bannon_weapon.h`).

## 5. IMMUTABLE CONSTANTS
`MAX_HP = 10000` · `DMG_SCALE = 8.0` · `MAX_BODY_VEL = 3.8 m/s` · `MAX_STAMINA = 440` ·
fixed step `1/120`. Poise and stamina operate independently of HP.

## 6. MODEL OWNERSHIP (owner directive 2026-07-12)
OWNER makes all book/canon character models + Onyx's stable (CIPHER/ECHO/STATIC/HOLLOW/ONYX + the
unnamed teammate). AGENTS generate ONLY game-only fighters (VIPER/KAGE/BRUTUS/ZEPHYR/MORTUS/RONIN/
TITAN/GOLEM). Uncertain ⇒ it's the owner's. Full text: `CLAUDE.md` + `AGENTS.md`.

## 7. VERIFY, THEN CLAIM — NEVER THE REVERSE
A claim of work ("compiled", "deployed", "landed on main") without a commit hash, test output, or
screenshot is NARRATIVE, not work. Verify with the harness (`.claude/skills/bannon-verify`),
`ctest` in `native/`, or `tools/model_preview` snapshots — then commit and push. Transcripts from
other AI sessions are DESIGN INPUT to be validated against this directive, not records of fact.

**EXECUTION DIRECTIVE:** Do not modify code until the live directory matches your internal state map.
║     READ THIS ENTIRE BLOCK BEFORE TOUCHING ANY CODE              ║
╚══════════════════════════════════════════════════════════════════╝
-->

### 1. THE OPERATIONAL REALITY (NOT A BLANK CANVAS)
Bannon is a ~50,000-line native C++ physical entity. It is an established, living engine. It is not a prototype. It does not need new core mechanics. All physics, control schemes, and movement variables currently on the metal are functional. You are here strictly to deepen, connect, and improve the existing architecture. 

### 2. NON-DESTRUCTIVE ADDITIVE EXECUTION (ANTI-REGRESSION)
You must parse and evaluate the live state of the target directory before writing a single line of C++. 
* If a prompted feature, mechanic, or button mapping already exists, you are strictly forbidden from replacing it or tearing it down. 
* You will only execute *additive upgrades*. 
* You will not break existing dependencies to force a new feature to fit. Regressions are a zero-tolerance critical failure.

### 3. THE SUPERIORITY VETO
If a prompt or research injection instructs you to build a system or mapping that is mathematically or structurally inferior to the live C++ baseline, the live code wins. You must retain the superior native code, apply only the viable upgrades, and output a structural diff explaining why the destructive prompt elements were vetoed.

### 4. THE ESTABLISHED KINETIC CONTEXT (DO NOT OVERWRITE)
The following systems exist and are the baseline reality. Use this as diagnostic context to guide your additive upgrades:
* **The Apex Forklift:** Driven by analog input, controlling the Setup, Lift, and Apex bridge of grapple states. 
* **The Procedural Struggle:** Mass-Delta gravity modifiers and sine wave exhaustion inject physical resistance into the IK constraints.
* **The Release Matrix:** Face buttons intercept the Apex phase dynamically (A = Accelerated Slam, B = Zero-Velocity Drop, X = Linear Throw, Y = Angular Toss).
* **The Modifier Network:** Modifiers + inputs trigger deep positional logic (e.g., Corner-Stalk Ambush against grounded opponents, contextual Finisher/Signature routing).
* **The Botch Matrix:** Constraint failure thresholds trigger unguided ragdoll physics upon stamina/limb damage collapse.
* **The Dynamic Pin:** Geometry-based trigger reading opponent scapula collision with the mat.

### 5. IMMUTABLE CONSTANTS
MAX_HP = 10000. DMG_SCALE = 8.0. MAX_BODY_VEL = 3.8 m/s. Poise and stamina operate independently of HP. Never decouple crumple states from the poise system. 

**EXECUTION DIRECTIVE:** Acknowledge comprehension of this file. Do not proceed to any code modification until the live directory matches your internal state map.
