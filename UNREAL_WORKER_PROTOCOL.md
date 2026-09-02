# M. Engine — Unreal Federated Worker Protocol

**Date:** 2026-09-01
**Branch:** `integration/bannon-engine-content-recovery`

## Overview
This document specifies the communication and evidence-return protocol between M. Engine (the Governor) and the Remote Unreal Workstation (the Execution Worker). 

The goal of this protocol is to explicitly maintain the Reality Contract. Success must be backed by physical evidence (build logs, .uassets, exit codes), not assumptions.

## 1. Worker Lifecycle States

- `UNAVAILABLE`: Worker process is not running or unreachable.
- `PARTIALLY_VERIFIED`: Worker has started and reported telemetry, but is missing critical capabilities (e.g., `UnrealEditor-Cmd` missing, repository inaccessible).
- `AVAILABLE`: Worker has verified physical access to `UnrealEditor-Cmd`, the Git repository, and network connectivity.
- `BUSY`: Worker is executing an allowlisted job.

## 2. Capability Enrollment Payload

When the worker boots, it POSTs an enrollment payload to M. Engine:

```json
{
  "action": "ENROLLMENT",
  "workerId": "ue5-worker-[hostname]-[hash]",
  "state": "AVAILABLE",
  "capabilities": {
    "os": "win32",
    "unrealVersion": "5.3.2-27405482+++UE5+Release-5.3",
    "gitInstalled": true,
    "repository": "Bannon",
    "currentBranch": "integration/bannon-engine-content-recovery",
    "currentCommit": "a4ff67f0..."
  },
  "submodules": "Initialized"
}
```

## 3. Structured Artifact Return (The Evidence Graph)

Upon completion of a job, the worker uploads structured evidence. M. Engine processes this evidence into the canonical Project/Library system.

**Upload Payload Structure:**
- `jobId`: The assigned execution mission (e.g., `BANNON_VERTICAL_SLICE_001`)
- `operation`: The allowlisted command (`COMPILE_BANNON`, `IMPORT_ASSET`)
- `timestamp`: Execution time
- `exitStatus`: Integer (e.g., `0` for success)
- `evidenceLevel`: Categorized level of proof (`BUILD_EVIDENCE_OBSERVED`, `IMPORT_EVIDENCE_OBSERVED`, `CAPABILITY_GAP`)
- `stdout`/`stderr`: Truncated or full log files
- `artifacts`: Array of file hashes and physical upload URIs (e.g., `SK_JAGER.uasset`, `SK_JAGER_Skeleton.uasset`)
- `commitSha`: The exact Git commit tested

## 4. Allowlisted Operations

To prevent arbitrary remote shell execution, the worker only accepts strictly bounded operations:
1. `SYNC_REPO`: Fetch, checkout, and `submodule update`.
2. `COMPILE_BANNON`: Invoke `Build.bat BannonEditor Win64 Development`.
3. `IMPORT_ASSET`: Run specific Python asset-import commandlets via `UnrealEditor-Cmd.exe`.
4. `VERIFY_ASSET_LOAD`: Execute a commandlet to test `.uasset` instantiation.

## Note on Current Status
The Unreal Federated Worker framework is implemented in `tools/unreal-worker/`. However, the physical compilation of `BannonEngine` and the import of `JAGER.glb` remain **IMPLEMENTED_UNVERIFIED**. The integration branch will not be merged into `main` until the physical worker connects and produces verifiable `BUILD_EVIDENCE_OBSERVED`.
