# BANNON → Unreal Engine 5 bridge

The migration from the single-file Three.js engine to a native UE5 runtime. Physics + combat LAWS
carry over verbatim (they already live in `native/`); rendering, skinning, and animation move to the
engine. This doc is the map + the exact steps to stand it up.

## Why we don't clone EpicGames/UnrealEngine into this repo
- **Access is gated:** `EpicGames/UnrealEngine` is private; you must link your GitHub to an Epic
  account and accept the EULA before you can even see it. A sandbox agent can't do that handshake.
- **Session scoping:** this agent session can only add repos owned by `mhvnsnt` — a cross-owner add
  of `EpicGames/…` is rejected. So the engine has to live under your own account first.
- **Size:** the source is 100+ GB; it would blow the sandbox's disk allowance and never finish.
- **You don't need it in-repo anyway.** UE integration is a `.uproject` + C++ game modules that
  *link against* the installed engine — you never vendor engine source into the game repo.

## Mirror it (your machine, once)
On a machine that already has UE source access (you said you jumped through the hoops):
```
# option A — GitHub fork (simplest; keeps it updatable):
#   on github.com, open EpicGames/UnrealEngine → Fork → owner: mhvnsnt  (private fork)

# option B — CLI mirror to your account:
gh repo create mhvnsnt/UnrealEngine --private
git clone --mirror https://github.com/EpicGames/UnrealEngine.git
cd UnrealEngine.git && git push --mirror https://github.com/mhvnsnt/UnrealEngine.git
```
Then start a **fresh** agent session with `mhvnsnt/UnrealEngine` as the initial source — a same-owner
repo — and the agent can reference the engine directly. (You do NOT add it to *this* session; it's
too big and cross-tier. It's a reference source for the UE port work, not something we vendor.)

## The bridge that already exists (this repo, testable today)
`native/` is the engine-agnostic core — the same laws drive Three.js now and UE later:
- `bannon_core.h` — immutable constants (MAX_HP 10000, DMG_SCALE 8, MAX_BODY_VEL 3.8, MAX_STAMINA 440).
- `bannon_ragdoll.h` / `bannon_rig.h` — 15-joint active ragdoll + PD drive (→ Chaos + Physical Animation).
- `bannon_strike/grapple/weapon/referee/universe/solvers/persona.h` — combat, weapons, referee LoS,
  submissions, modes, booking math (→ plain UStructs + UObjects, 1:1).
- **`bannon_anim_bridge.h` (new)** — the animation/skinning port layer:
  - `rollStableAim(restFwd, targetDir)` — deterministic-roll bone aim = a UE **Control Rig "Aim"**
    node with a stable up axis. Fixes the "spiral leg" without engine-specific hacks.
  - `limbFamily()` / `isCrossLimbEdge()` / `seedAllowed()` — the **A-pose skin separation** (arm/leg
    families, cut the hand↔thigh contact). In UE this is skin-weight authoring / a pose-space fixup;
    the classification is identical. Verified in `test_anim_bridge`.

## Port sequence (proposed)
1. **UE project skeleton** — `Bannon.uproject` + a `BannonCore` C++ module that #includes the
   `native/include/*.h` headers unchanged (they're header-only, no renderer deps). ctest stays the
   source of truth for the laws.
2. **Skeletal mesh** — import the owner's GLB bodies as USkeletalMesh; author skin weights with the
   `bannon_anim_bridge` limb-family rules (or a Control Rig pose fixup) so the A-pose deform is clean
   at the engine level — the proper version of the JS v4.4 skinner.
3. **Ragdoll** — PhysicsAsset + Physical Animation Component; map each of the 15 joints to a body,
   drive with `bannon_rig` PD targets. MAX_BODY_VEL clamp = a Chaos per-body velocity limit.
4. **Retarget** — Control Rig that aims each bone at the ragdoll joint via `rollStableAim`'s method.
5. **Modes / rules / booking** — `bannon_universe.h` + `bannon_referee.h` into an AGameMode state
   machine. UI (2K-style pre-match/promo) as UMG.
6. Three.js build becomes the **low-poly retro / training-dummy tier** (per PORT_MAP), not thrown away.

## Status
- `bannon_anim_bridge.h` + `test_anim_bridge` landed (9/9 ctest). The two deformation fixes are now
  portable C++, not JS-only — they transfer to UE without re-derivation.
- Next when the mirror exists: scaffold `Bannon.uproject` + `BannonCore` module referencing these headers.
