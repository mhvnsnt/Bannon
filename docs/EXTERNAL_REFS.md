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

## Guardrails (unchanged, binding)
- **Additive-only, physics-first, superiority veto** (AGENTS.md): only pull a pattern in if it beats what
  we have. Our `MAX_BODY_VEL`, poise-decoupled HP, and post-constraint velocity clamp are immutable —
  anything ingested is clamped to them (same veto we applied to bannonengine_2's `traitMods`).
- **No third-party source committed** — extract derived/transformative data + cite; keep raw uploads out
  of the repo (like the book `.txt` and now the `.bb`).
- **No trademarked content** — reference the *systems*, never ship another game's names/assets/logos.
