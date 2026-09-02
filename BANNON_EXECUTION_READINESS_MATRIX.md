# Bannon Execution Readiness Matrix

**Date:** 2026-09-01
**Branch:** `integration/bannon-engine-content-recovery`

This document serves as the ground-truth tracker for the Minimum Working Character Pipeline (The Vertical Slice). 

## 1. Physical Verification Rules

- **DO NOT** claim a subsystem works merely because the source code or module registry exists.
- **DO NOT** mark "Unreal Compile" complete until the remote Unreal Engine 5.3 worker provides build evidence.
- **DO NOT** mark "Asset Import" complete until physical `.uasset` evidence is produced.

## 2. Phase 3 Vertical Slice Readiness

| Component | Status | Evidence Level | Notes |
| :--- | :--- | :--- | :--- |
| **BannonCore Registry** | `IMPLEMENTED_UNVERIFIED` | `SOURCE_CODE_ONLY` | Registered. Waiting on UE 5.3 compile. |
| **BannonEngine Registry** | `IMPLEMENTED_UNVERIFIED` | `SOURCE_CODE_ONLY` | Registered. Waiting on UE 5.3 compile. |
| **native/include linkage** | `IMPLEMENTED_UNVERIFIED` | `SOURCE_CODE_ONLY` | Include path set in `Build.cs`. Needs compile check. |
| **JAGER.glb Recovery** | `VERIFIED` | `PHYSICAL_LOCAL_EVIDENCE` | Asset physically recovered to integration branch (SHA-256 matched). |
| **JAGER Unreal Import** | `WAITING_ON_WORKER` | `NONE` | Awaiting worker to generate `.uasset` Skeletal Mesh. |
| **Skeleton Validation** | `WAITING_ON_WORKER` | `NONE` | Must prove GLB bone hierarchy maps correctly in UE5. |
| **Animation Blueprint** | `PENDING` | `NONE` | Depends on valid Skeleton generation. |
| **Playable Character** | `PENDING` | `NONE` | Depends on AnimBP and BannonEngine compilation. |
| **Input & Locomotion** | `PENDING` | `NONE` | (Phase 4) To be validated once character exists physically. |

## 3. Remote Worker Contract

The Unreal worker is authorized to clone the `integration/bannon-engine-content-recovery` branch.
The worker must execute:
1. `Bannon.uproject` build via UnrealBuildTool.
2. JAGER `.glb` imports into `Content/Characters/JAGER/`.

Upon success or failure, the worker MUST push evidence logs (compilation output, commandlet logs) and any successfully generated binaries/assets, returning the execution flow to M. Engine.

| Artifact Transport | **PARTIALLY_VERIFIED** | Real HTTP file transport implemented in `worker.js` and verified with test bytes to M. Engine. |
