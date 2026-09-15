# bannonengine_2.zip — integration verdict (2026-07-12)

Owner drop: "everything it was supposed to have added" from the AI-Studio "CAW Suite" app
(`ai.studio/apps/feb53f64-…`). Audited file-by-file against the Prime Directive.

## What the zip actually was
An Android Studio project (Kotlin WebView shell + Gemini chat) wrapping ~60 tiny C++ files.
**Every C++ "system" was a cout-narrative stub** — functions that PRINT what the physics would do
("Injecting massive upward kinetic burst…") without computing anything. The bundled
`services/ik_solver/app.py` returns `np.random.rand(3)*360` as "optimized joint angles". The two
bundled `BANNON_v150.html` snapshots were older than the live file (2.0 MB / 5 KB vs 2.25 MB).
`AnatomicalWeightClamps.kt` was a toy restatement of our own skin.cjs v4.2 constants.

Per Prime Directive §7, all of that is DESIGN INPUT, not landed work.

## What was extracted and implemented FOR REAL
| Spec in the zip (stub) | Real implementation | Verified |
|---|---|---|
| RefereeAI LoS cone to shoulders, occlusion, predictive whip avoidance, ref bump w/ DMG_SCALE | `native/include/bannon_referee.h` (`refHasLineOfSight`, `refAvoidanceVelocity` — lateral escape, not backpedal; `refBump` with own HP/poise pool) | `test_referee` ctest |
| PinHybrid kickout tiers (1-count burst / 2-count / 2.9 epic struggle, mass-delta gravity) | `pinKickout()` — reserve-driven kinetic burst, count-tier struggle time, MAX_BODY_VEL capped | `test_referee` |
| SubmissionMatrix joint torque → rotation limit → local limb HP → tap | `SubJoint` + `submissionStep()` — organic tap-out = constraint failure (limb HP 0, or >92% strain with no stamina). NO timing minigame (owner veto respected) | `test_referee` |
| TraitSystem / ArchetypeModifierMatrix subtype overrides | `traitMods()` in `bannon_universe.h` — Agile Heavyweight bypasses the mass-speed law at 2.5× stamina tax **but never exceeds MAX_BODY_VEL** (their version violated the immutable cap — vetoed and clamped); Mat Technician trades speed for +15 poise, 0.8× tax | `test_universe` |
| TLCPhysics table integrity (350 N), ladder climb IK gate | `tableImpact()` (shatter = poise bomb + localized spine damage), `canBindLadderClimb()` (distance+facing+stamina gate) | `test_universe` |
| IronManRulesetDirector fall processing | `ironManFallReset()` — HP resets, 35% stamina wear compounding +5%/fall, 10% floor | `test_universe` |
| HiveMindCrowdEngine kinetic pops | `crowdReaction()` — pops scale on real impact velocity, botches draw heat | `test_universe` |
| GMModeBookingMath show rating/revenue/morale | `scoreShow()` | `test_universe` |
| FrictionPoliticsMatrix cooperation index → shoot AI, heat → slow counts/mutiny | `PoliticsState` + `processAction()` | `test_universe` |
| GodWithinConsequenceAI injury→strip titles→revenge seed | `matchConsequence()` — severity-scaled 1–9 months, >60 days strips titles | `test_universe` |
| Reality Check GLSL (BANNON_BRICKS.js — the one piece of real code) | Ported into the live composer as a ShaderPass after BROADCAST_GRADE: `window.triggerRealityCheck(intensity)` + auto-decay. God Within / "The Anchor" distortion moments | harness screenshot |

## Vetoed (Superiority Veto §3)
- The old HTML snapshots (older than live).
- The random-number "IK solver" service (live engine already has real PD/verlet solvers; the zip's
  CCD sketch has no FK update — our solver is superior).
- `AnatomicalWeightClamps.kt` (derivative of our v4.2 skinner, weaker: pelvis-only clamp vs our
  full zone matrix).
- FirstBloodRuleset velocity threshold (live FIRSTBLOOD already attributes blood via __spawnBlood).
- WeaponPhysics/WeaponDeformation stubs (live `bannon_weapon.h` already implements the same specs
  with more: grip-drop, integrity, injury velocity cap).
- The Android wrapper/Gemini chat shell, swarm/quantum/substrate agent stubs — out of game scope.

## Wiring queue (JS side)
The native functions are the reference laws. Next JS bricks: referee entity in the match scene
(LoS-gated counts via `refHasLineOfSight` math), submission hold using `submissionStep` in place of
the flat sub-minigame branch, TLC props when the table/ladder meshes land.
