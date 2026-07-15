# Three.js → Unreal Engine 5 conversion tracker

Every system in `../BANNON_v150.html` (~35k lines) and its UE port target + status. The `native/`
core is the shared brain; UE owns rendering, skeletal mesh, physics bodies, UI. Bricks, not a big-bang
rewrite. `[x]` = landed in `unreal/`, `[~]` = laws in `native/` (ready to wire), `[ ]` = not started.

## Foundation
- [x] UE project skeleton — `Bannon.uproject`, targets, `BannonCore` module, Config.
- [x] Native-core bridge — `BannonCore.Build.cs` adds `../../../native/include`; `BannonBridge.h`
      converts UE⇄native (cm/Z-up ⇄ m/Y-up). Verified: every native call typechecks (`/tmp/uecheck`).
- [x] Laws surface — `UBannonLaws` (constants, RollStableAim, SubmissionStep, PinKickout).

## Combat & physics (laws already in native/, wire to Chaos/AnimBP)
- [x] Active ragdoll (15 joints, PD drive) — `UBannonRagdollComponent`: PhysicsAsset + Physical
      Animation, poise-scaled motors, MAX_BODY_VEL per-body clamp AFTER the solve. Needs the engine to test.
- [~] Strikes / weight-transfer power / knockback — `bannon_strike.h` → on-hit events on `ABannonFighter`.
- [~] Grapple positions / lift / carry / release matrix — `bannon_grapple.h` + `bannon_weapon.h`
      releaseImpulse → animation-driven pose + Physical Animation profiles per phase.
- [~] Weapons (mass stamina tax, integrity, TLC table/ladder) — `bannon_weapon.h`/`bannon_universe.h`.
- [x] Referee entity (LoS pin gating, avoidance, bumps) — `ABannonReferee` (native refHasLineOfSight/refAvoidanceVelocity/refBump).
- [~] Submissions (torque→limb-HP→organic tap) — `bannon_referee.h submissionStep` (surfaced in UBannonLaws).
- [x] Two-layer health (HP + poise decoupled) + stamina — `ABannonFighter`.

## Models / skinning (THE deform fix, ported)
- [x] Roll-stable bone aim (spiral-leg fix) — `bannon_anim_bridge.rollStableAim` → Control Rig Aim node.
- [x] A-pose skin separation (arm/leg families, hand↔thigh cut) — `bannon_anim_bridge.limbFamily/…`.
- [ ] Import owner GLB bodies as USkeletalMesh; author weights with the limb-family rules (the proper
      engine-side version of tools/rigready/skin.cjs v4.4). Base male/female + DNA morph targets.
- [ ] DNA-CAW (`BANNON_DNA`) → SetMorphTarget + bone scale + dynamic material (see docs/DNA_SCHEMA.md).

## Modes / universe
- [x] Booking math (show rating/revenue/morale) + injury consequences — `ABannonGameMode` (native scoreShow/matchConsequence).
- [~] Match types (multi-man / LMS / Iron Man / First Blood / Hardcore) — `bannon_universe.h` → AGameMode state machine.
- [~] Friction politics (script-break → shoot AI / slow counts) — `bannon_universe.h processAction`.
- [ ] 2K-style pre-match suite + promo/branch UI — UMG.
- [ ] God Within RPG mode / skill trees — later.

## Presentation
- [x] Arena impacts (post/table) — `ABannonArena` (native env-contact + tableImpact). Meshes: Tripo env set, TODO.
- [x] Crowd kinetic reaction — `UBannonCrowd` (native crowdReaction). Niagara/instanced visual: TODO.
- [ ] BROADCAST_GRADE post pass — PostProcessVolume + material.
- [ ] REALITY CHECK glitch — post-process material (triggerRealityCheck → a material param).

## Creation suite (WWE-2K-style menus — owner spec, BINDING)
- [ ] Superstar creation (CAW) — UMG mirroring the 2K create-a-wrestler flow; backed by BANNON_DNA schema.
- [ ] Arena creation/editor — ring, apron, barricades, ramp, trons/mini-trons/Titantron, stage, bowl, lighting.
- [ ] Moveset creation — per-position slots + sig/fin, 2K moveset-editor layout; backed by MOVESET_DB.
- [ ] Entrance creation — tron video, pyro, lighting, music, motion timeline.
- [ ] Menus match 2K layout + contents exactly (owner requirement).

## Retained
- Three.js `BANNON_v150.html` becomes the low-poly retro / training-dummy tier + rapid design sandbox.

## Next brick
Wire the ragdoll: PhysicsAsset for the 15-joint rig + a `UBannonRagdollComponent` that drives PD
targets from `bannon_rig` and clamps velocity to MAX_BODY_VEL — the first system to move off Three.js
into live Chaos. (Needs the engine present to test.)
