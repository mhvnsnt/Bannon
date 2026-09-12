# External reference repos — harvest map + pull list (2026-07-17 owner drop)

The owner dropped 8 repos/zips to "upgrade our game, models, and full game infrastructure — especially
the Three.js → C++/Unreal migration" and asked us to "start pulling from more GitHub repos that match
our goal." This is the triage: what each one is, what's directly usable, and what to clone next. Nothing
here is committed as third-party source — we extract transformative/derived knowledge and cite the source
(same policy as the book manuscripts and MDickie's `.bb`).

## LANDED THIS PASS
### 1. UE5-active-ragdoll-with-floating-capsule (tigershan1130) — ⭐ ported
UE5 proof-of-concept: physical-animation active ragdoll + rigid-body "floating capsule" controller.
**Ported into `unreal/`** (v159): `UBannonRagdollComponent::DriveBodyVelocities()` (velocity-drive
active ragdoll — the `AnimNode_ActiveRagdoll` technique) + `ApplyHitReaction()` (hit-to-pelvis
coupling), and a new `UBannonFloatingCapsuleMovement` (spring-ride hover controller). See `unreal/CONVERSION.md`.

### 2. Wrestling MPire Remix (MDickie, Blitz3D) — ⭐ ingested
The MDickie fork the owner wants us to structure around. Built `tools/bbparse/` (Blitz3D lexer + domain
router + moves extractor) and distilled `tools/bbparse/out/` — 191-move catalog with frame ranges +
position taxonomy, 49-function AI state-machine map, Attacks/Anims/Gameplay function maps, Values
constants. Raw `.bb` NOT committed (third-party). See `tools/bbparse/README.md`.

## CLONED + MINED (2026-07-17 — owner: "clone them in and integrate", the big repos too large to upload)
Cloned into scratchpad (NOT committed — third-party source), mined for transferable technique:
- **sergioabreu-g/active-ragdolls** (Unity) — ⭐ the balance solver. Its `UPRIGHT_TORQUE` mode (corrective
  torque toward vertical, scaled nonlinearly by tilt angle) is exactly the "recover balance over planted
  feet instead of flailing" the owner wants. **INTEGRATED**: added the spring-target analog as ACTIVE
  UPRIGHT-BALANCE RECOVERY next to the foot-plant in BANNON_v150.html (`window.BALANCE_RECOVER`) — a
  shoved fighter now rights his torso over the base. Also has STABILIZER_JOINT + a grip module (parallels
  our grapple grip). This is the direct answer to the feet-flail complaint; the same `UPRIGHT_TORQUE`
  model is what the UE port's ragdoll should use for standing balance (feeds `UBannonRagdollComponent`).
- **batnom/Boxing-Mate** (Unity boxing) — punch/block **cadence + combo timing** (progressive speed, less
  delay between shots at higher levels). Reference for strike windup/recovery windows + the reversal
  timing window (our DODGE/REV) — fold into `bannon_strike.h` tuning + the MOVESET stat blocks.
- **shrekshao/SwordsmanshipU3D** (Unity, Mount&Blade/流星蝴蝶剑 scheme) — **directional swing** control
  (drag a pattern → swing direction + quality drives the skeleton anim). Reference for weapon-strike
  DIRECTIONALITY (our steel cable / weapon moves) + mocap-quality-from-input — informs the weapon combat
  + the move authoring, not a code port (it's Unity C#).
- **awillsousa/EyeofTiger** (Unity boxing, eye-tracking) — boxing movement only; the eye-gaze control is
  irrelevant to us. Not cloned (low transfer value); listed for completeness.

## HIGH-VALUE — CLONE / REFERENCE NEXT (UE combat port)
### 3. OnlyHands / ArenaBrawler_Demo (noahbutcher97) — UE5.3 physics fighting, source-only
The single best match for our UE combat port. Real, advanced C++ systems (69 headers), no content bloat:
- `OHPhysicsHandleController` / `OHPhysicsHandler` / `OHPhysicsManager` — physics-handle-driven grabbing
  (directly relevant to our grapple "connect/weld grip" gap).
- `OHCombatAbilitySystemComponent` / `OHCombatAttributeSet` / `OHCombatAbility` — GAS combat (a proven
  attribute/ability model for HP/poise/stamina + moves).
- `OHSkeletalPhysicsUtils` / `OHPhysicsStructs` / `IOHPhysicsBehaviorStrategy` — skeletal physics helpers
  + a strategy pattern for swappable physics behaviors (maps to our per-move logic priority).
- `OHAttackComponent` / `OHCombatCharacter` / `OHCombatAICharacter` — attack + character + AI split.
- HARVEST TARGET: the physics-handle grab + skeletal-physics utils → deepen our grapple weld + the UE
  `ABannonFighter`/grapple wiring. Repo: `github.com/noahbutcher97/OnlyHands`.

### 4. pitbeastsimulator (AI-Studio, ProjectSR base) — UE physics fighter sibling
Built on the SAME `ProjectSR` active-ragdoll base as #1. Headers to reference:
`PitBeast_ActiveRagdoll`, `PitBeast_CombatPhysics`, `PitBeastCombatComponent`, `PitBeast_GaitStateMachine`
(procedural gait — locomotion for the floating capsule), `PitBeast_ECSPhysicsLink` (ECS physics bridge),
`PitBeastCareerSaveGame` (career persistence → informs our DNA/career save). Also has a TS/React front
layer. HARVEST: the gait state machine (walk/run cycle for active ragdoll) + combat-physics component.

### 4b. urban-mayhem web prototype (owner remix) — React+Three open-world brawler
GTA/Def-Jam-lineage open world: `OSMCity`, `Vehicle`, `MassEntityCrowd`, `FactionMapUI`, `ChopShopUI`,
`CharacterCreation`, `CombatLogFeed`, and a **`MobileHUD`** (relevant to our mobile-first pass). HARVEST:
the MobileHUD touch layout + faction/city systems as reference for the Urban-Reign-style environmental
brawling + multi-man chaos the QUALITY_BAR calls for. Reference, not a port.
### 4c. God-Within "War Room" / Bannon base (owner remix) — React+Three fighter engine
A `FighterEngine.ts` + `CharacterState.ts` + `ChunkManager` + `InputStore` + `ParticleSystem` base
("Bannon base if we don't have one yet"). We DO have a deeper engine (BANNON_v150.html + native/), so
this is reference — mine `FighterEngine.ts`'s state model + the God-Within particle/war-room framing for
the God Within mode. Reference, not a port.

## REFERENCE-ONLY (mine selectively, not a port target)
### 5. mphysicsfightingsandbox_2 — Android (Kotlin) + UE content (740 uasset) + 29 more MDickie `.bb`
Mixed sandbox. The extra `.bb` files can be run through `tools/bbparse/` if the owner wants more MDickie
move data. The Kotlin/Android shell is a reference for the eventual APK path (we already have `app/`).
### 6. gtasamobile-source-code — GTA:SA mobile C++ (renderer/streaming)
Low direct relevance to combat, but a reference for **mobile C++ rendering + asset streaming** patterns
if/when we package the UE build to Android. Not a port target.
### 7. open-source-games — a curated README index of open-source games. Pure discovery list.
### 8. "Badass Quest" (owner mention, not uploaded) — evaluate if/when the owner links it.

## Pull-list — repos matching our goals (for `add_repo` when we work them)
| Repo | Why | Priority |
|------|-----|----------|
| noahbutcher97/OnlyHands | UE5 physics-fighting C++ (grab, GAS combat, skeletal physics) | HIGH |
| tigershan1130/UE5-active-ragdoll-with-floating-capsule | active ragdoll + floating capsule (ported) | done |
| MDickie Wrestling MPire fork | move taxonomy + AI + booking meta (ingested) | done |

## Owner's FULL repo library (from his phone screenshot 2026-07-17 — the "pull from more repos" roadmap)
The owner has a whole stash of physics-fighting / combat repos staged to share. Cataloged here so none
are forgotten. IN HAND = already uploaded + triaged above; PENDING = owner to upload, target for
`add_repo`/clone when we work it. All get the same guardrails (additive, superiority-veto, no 3rd-party
source committed, no trademarked content).
| Repo (zip) | Size | Status | Likely harvest value |
|------------|------|--------|----------------------|
| m-physics-fighting-sandbox (2) | 11 MB | IN HAND | Android/Kotlin + UE content + extra MDickie `.bb` |
| ArenaBrawler_Demo (OnlyHands) | 580 KB | IN HAND ⭐ | UE5 physics-fighting C++ — top UE-combat target |
| UE5-active-ragdoll-floating-capsule | 8 MB | IN HAND ✓ ported | active ragdoll + floating capsule |
| WrestlingMPireRemix | 409 KB | IN HAND ✓ ingested | move taxonomy + AI + booking |
| open-source-games | 16 KB | IN HAND | discovery index only |
| **EyeofTiger** | 252 MB | PENDING | large — likely a full fighting/boxing game (assets+code); eval on upload |
| **Fighting-Physics-Simulation** | 186 MB | PENDING ⭐ | physics-fight sim — directly on-goal; harvest combat physics |
| **FightingGame3D** | 87 MB | PENDING | 3D fighting game — combat/state-machine reference |
| **Boxing-Mate** | 88 MB | PENDING | boxing sim — strike/weight-transfer reference (EA-UFC-like) |
| **SwordsmanshipU3D** | 53 MB | PENDING | Unity melee/weapon physics — weapon-combat reference |
| **Retro3DGraphicsCollection** | 3 KB | PENDING | retro shader/graphics snippets (low-poly "training dummy" tier) |
| **remix_-urban-mayhem-web-proto** | 4 MB | PENDING | web brawler prototype — possibly our own remix lineage |
| **badass-quest** (owner mention, not shown) | — | PENDING | eval on link |

Priority order when the owner uploads them: Fighting-Physics-Simulation → Boxing-Mate → FightingGame3D →
SwordsmanshipU3D (weapons) → EyeofTiger → the rest. Each: triage → extract transformative patterns →
clamp to our physics laws → cite. NONE ship another game's names/assets/logos.

## Guardrails (unchanged, binding)
- **Additive-only, physics-first, superiority veto** (AGENTS.md): only pull a pattern in if it beats what
  we have. Our `MAX_BODY_VEL`, poise-decoupled HP, and post-constraint velocity clamp are immutable —
  anything ingested is clamped to them (same veto we applied to bannonengine_2's `traitMods`).
- **No third-party source committed** — extract derived/transformative data + cite; keep raw uploads out
  of the repo (like the book `.txt` and now the `.bb`).
- **No trademarked content** — reference the *systems*, never ship another game's names/assets/logos.
