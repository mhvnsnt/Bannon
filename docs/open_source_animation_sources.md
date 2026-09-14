# BANNON Open-Source Animation / IK Compatibility Ledger

BANNON remains Unreal/Chaos-first. External projects are reference or integration candidates only after engine-version, license, dependency, and runtime-authority checks pass.

## Compatibility rules

1. Engine version must match the BANNON project contract (currently Unreal Engine 5.3) or the integration must be explicitly ported and compiled against 5.3.
2. License must permit the intended use and redistribution before source is vendored.
3. No external system may silently become a second root/pose writer. BANNON authority contracts remain the source of truth.
4. A source is not considered integrated until it has a reproducible build/test result.
5. UNKNOWN is never PASS.

## Candidates

| Source | License | Current engine signal | BANNON action |
|---|---|---|---|
| Vaei/FBIK | MIT | Current release documentation lists UE 5.5/5.6 binaries | Reference/port candidate; do not vendor unverified binaries into UE 5.3 |
| GASP-ALS-R / Game Animation Sample-derived projects | Project-specific/open-source mix | UE5 projects, generally newer engine APIs | Reference for layering, traversal, Motion Warping, Mover, Physics Control; port only behind build verification |
| Epic Full Body IK / Control Rig | Epic/engine feature | Available through Unreal plugin stack | Existing BANNON dependency; use as native baseline before replacing it |
| UE active-ragdoll prototypes | Varies by repository | UE5 | Reference physics-state patterns only until license and 5.3 build are verified |
| Jolt Physics animation/ragdoll references | MIT/open source | Engine-agnostic physics research | Algorithm/reference only; BANNON runtime remains Chaos-first |

## Immediate integration target

The safest near-term open-source leverage is **not** wholesale plugin import. It is extracting verified patterns into BANNON's existing authority model: animation-layer separation, explicit locomotion state, motion-warping measurements, physical-state transitions, and test fixtures. Each adopted pattern must still pass the locomotion, IK-writer, physics-writer, PWA, and Unreal-version gates.
