# M. Engine — Unreal Worker Manifest
**Task ID:** `BANNON_VERTICAL_SLICE_001`
**Target Environment:** Physical UE 5.3 Workstation (Remote)

## Execution Instructions for Remote Worker

When the remote Unreal worker receives this manifest, it MUST execute the following pipeline and return physical evidence.

### 1. Repository Sync
- **Repository:** `https://github.com/mhvnsnt/Bannon.git`
- **Branch:** `integration/bannon-engine-content-recovery`
- **Action:** Clone/Pull and switch to exact branch.
- **Evidence Required:** Output of `git log -1` verifying the integration branch head.

### 2. Physical Compilation (BannonEngine Verification)
- **Command:** Execute standard UnrealBuildTool (UBT) compilation for `Bannon.uproject` (Development Editor).
- **Action:** Compile the newly recovered `BannonEngine` module.
- **Evidence Required:**
  - Build log (stdout/stderr).
  - Exit code of UBT.
  - Verification that dependencies on `BannonCore` and `native/include` resolved successfully.
  - Success explicitly recorded as `OBSERVED_RESULT`.

### 3. Asset Provenance & Import (JAGER)
- **Source Files:**
  - `assets/models/JAGER.glb`
  - `assets/models/JAGER_coat.glb`
- **Action:** Import as Skeletal Meshes into `/Game/Bannon/Characters/JAGER/` and `/Game/Bannon/Characters/JAGER_Coat/`.
- **Evidence Required:**
  - Presence of physical `.uasset` files on disk (Skeletal Mesh, Skeleton, Physics Asset).
  - Material and Texture dependency graph generation successful.
  - Skeleton validation (did UE successfully parse the GLB bone hierarchy?).

### 4. Minimum Viable Vertical Slice Validation
- **Action:** Load the generated Skeletal Mesh (`SK_JAGER`) in the Unreal Editor. Verify it can be assigned to a basic Animation Blueprint or displayed in the viewport.
- **Evidence Required:** Screenshot or commandlet log confirming the asset loads in the engine without fatal warnings.

## Status: WAITING_ON_WORKER
Currently `IMPLEMENTED_UNVERIFIED`. M. Engine will hold state until the physical worker connects, executes, and uploads evidence.
