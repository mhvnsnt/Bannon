# BANNON UE Upgrade + Open-Source Integration Matrix

## Upgrade policy

BANNON keeps the known-good playable branch while engine upgrades happen on isolated branches.

Current migration path:

`UE 5.3 -> UE 5.5 -> UE 5.6`

Never treat an engine-version edit as a successful migration. A migration is PASS only after the target editor/toolchain opens the project, generates project files, compiles the modules, cooks the target, and the playable P0 movement/pose tests pass.

## UE 5.5 integration targets

- Control Rig
- Full Body IK
- Physics Control
- Motion Warping
- Pose Search / Motion Matching where compatible with the existing animation data
- Chaos / Physical Animation
- CharacterMovement authority and BANNON pose-authority instrumentation

UE 5.5 has animation/runtime upgrade changes that can affect retarget sources and movement/navigation APIs. Code must be migrated deliberately rather than silencing deprecation warnings.

## Open-source sources to evaluate

| Source | Intended use | Integration rule |
|---|---|---|
| Vaei/FBIK | Full-body IK reference/integration | MIT; current releases target newer UE versions, so verify against target engine before vendoring |
| GASP-ALS-R | locomotion, overlays, traversal, motion systems reference | evaluate source/API compatibility; do not wholesale copy conflicting authority systems |
| Epic Game Animation Sample concepts | Motion Matching / Pose Search / modern animation architecture | use as architecture reference unless engine/content licensing and version compatibility are verified |
| Jolt Physics | physics algorithm/reference | BANNON remains Chaos-first; no second physics authority |
| GGPO | rollback networking reference | networking only; must not own character pose or movement transforms |
| llama.cpp | optional local/edge inference | isolated AI subsystem; must not become a gameplay authority |

## BANNON authority laws remain higher priority

1. CharacterMovement owns gameplay locomotion/root movement.
2. Pose Authority owns per-frame skeletal write ownership.
3. IK may solve only its declared targets/bones.
4. Physical simulation owns bones only while explicitly in a physical state.
5. No competing root/actor transform writers.
6. UNKNOWN is never PASS.
7. Open-source code is not considered integrated until license, engine compatibility, build, runtime behavior, and authority audits pass.

## Required migration evidence

- UE target version matches `.uproject`.
- Game and editor targets use the matching include-order version.
- All enabled plugins exist in the target engine.
- UHT/project generation succeeds.
- BannonCore and BannonEngine compile.
- Locomotion authority audit passes.
- IK writer audit passes.
- Physics writer inventory is reviewed.
- PWA provenance remains synchronized to the tested source revision.
- Android packaging is separately verified before calling the mobile build PASS.
