# BANNON — Unreal Engine 5 project

The native UE5 port of the Three.js engine (`../BANNON_v150.html`). The combat/physics **laws** are
NOT reimplemented here — this project links the same header-only core in `../native/include` that the
web build runs and `../native` ctest validates. One source of truth, two runtimes.

## Layout
```
unreal/
  Bannon.uproject              — module BannonCore; plugins ControlRig + PhysicsControl
  Config/                      — DefaultEngine.ini (BannonGameMode + Chaos substep), DefaultGame.ini
  Source/
    Bannon.Target.cs           — Game target (UE5.8: BuildSettings V7, include order 5_8)
    BannonEditor.Target.cs     — Editor target
    BannonCore/
      BannonCore.Build.cs      — deps: Core/Engine/Chaos/PhysicsCore/ControlRig; adds ../../../native/include
      BannonCore.{h,cpp}       — primary game module
      Public/BannonBridge.h    — FVector/FQuat <-> bannon::Vec3/Quat (UE cm/Z-up <-> native m/Y-up)
      Public/BannonLaws.h      — Blueprint library surfacing the native laws (constants, RollStableAim,
                                 SubmissionStep, PinKickout)
      Public/BannonFighter.h   — ACharacter with two-layer health (HP + poise, decoupled) + stamina
      Public/BannonGameMode.h  — AGameModeBase: ScoreShow + MatchConsequence booking math
```

## Build / open
This project needs the UE5.8 source engine (mirrored at `mhvnsnt/UnrealEngine`; cloned in the agent
session at `/workspace/unrealengine`). It cannot be compiled in the web sandbox — UBT needs the full
editor toolchain. On a UE dev machine:
1. Build the engine once (`Setup` + `GenerateProjectFiles` + build `UnrealEditor`), OR point at an
   installed 5.8.
2. Right-click `Bannon.uproject` → *Generate Visual Studio/Xcode project files* (or set
   `EngineAssociation` to your build), then build the `BannonEditor` target.
3. The `native/` API is verified header-only C++20 — `/tmp/uecheck` compiles every call this module
   makes, so UBT will too once the engine is present.

## Why the laws live in ../native, not here
`native/include/*.h` is engine-agnostic (Vec3/Quat only) and ctest-green. Both the Three.js build
(via the JS mirror) and this UE build consume it, so a physics change is made ONCE and both runtimes
inherit it. See `../docs/UE_BRIDGE.md` and `CONVERSION.md`.
