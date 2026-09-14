# BANNON — Unreal Engine 5.8 project

The native UE5 port of the Three.js engine (`../BANNON_v150.html`). The combat/physics **laws** are
NOT reimplemented here — this project links the same header-only core in `../native/include` that the
web build runs and `../native` ctest validates. One source of truth, two runtimes.

## Engine source

The migration target is the user's authorized Unreal Engine source fork:
`mhvnsnt/UnrealEngine`, currently exposing the `release` ref at UE 5.8.2.

The Bannon project is wired to **EngineAssociation 5.8** and enables the UE 5.8 `PhysicsControl`
plugin. The GitHub connector can modify the Bannon source tree, but it does not provide a local Unreal
Editor/UBT toolchain, so an actual editor build remains a separate verification step. **UNKNOWN is never
PASS**: repository wiring is recorded here without claiming a native build has succeeded.

## Layout
```
unreal/
  Bannon.uproject              — UE5.8 project; ControlRig + PhysicsControl
  Config/                      — DefaultEngine.ini (BannonGameMode + Chaos substep), DefaultGame.ini
  Source/
    Bannon.Target.cs           — Game target (UE5.8: BuildSettings V7, include order 5_8)
    BannonEditor.Target.cs     — Editor target
    BannonCore/
      BannonCore.Build.cs      — deps: Core/Engine/Chaos/PhysicsCore/ControlRig; adds ../../../native/include
      BannonCore.{h,cpp}       — primary game module
      Public/BannonBridge.h    — FVector/FQuat <-> bannon::Vec3/Quat (UE cm/Z-up <-> native m/Y-up)
      Public/BannonLaws.h      — Blueprint library surfacing the native laws
      Public/BannonFighter.h   — ACharacter with two-layer health (HP + poise, decoupled) + stamina
      Public/BannonGameMode.h  — AGameModeBase: ScoreShow + MatchConsequence booking math
```

## Build / open

This project targets the UE5.8 source engine from `mhvnsnt/UnrealEngine`. A native build requires the
full UE 5.8 editor/toolchain; the GitHub-side migration does not claim that toolchain is available.

1. Build the authorized UE 5.8 engine source with Epic's normal `Setup` / project-file / editor build
   process, or point the project at an installed UE 5.8 build.
2. Generate project files for `Bannon.uproject` and build the `BannonEditor` target.
3. Run the Bannon authority/audit harnesses and native tests; a native compile/build is required before
   calling the UE 5.8 migration PASS.

## Why the laws live in ../native, not here
`native/include/*.h` is engine-agnostic (Vec3/Quat only) and ctest-green. Both the Three.js build
(via the JS mirror) and this UE build consume it, so a physics change is made ONCE and both runtimes
inherit it. See `../docs/UE_BRIDGE.md` and `CONVERSION.md`.
