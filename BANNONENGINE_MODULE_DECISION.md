# BANNONENGINE MODULE DECISION

Generated 2026-09-01. Every classification below is measured from the actual
files, not inferred from names.

---

## The finding

`unreal/Source/BannonEngine` contained **31 source files**, **no `Build.cs`**, and
**no entry in `Bannon.uproject`'s Modules array**. UnrealBuildTool therefore never
saw it, and nothing it declares existed as an engine type.

That is worse than an ordinary unbuilt module, because of what lives in it.

## Why this explains the missing content layer

**Every `UPrimaryDataAsset` class in the project is in `BannonEngine`. `BannonCore`
has none.**

| Content schema class | Module |
| --- | --- |
| `UMovesetLibraryAsset` | BannonEngine |
| `UBannonEntranceAsset` | BannonEngine |
| `UBannonArenaAsset` | BannonEngine |
| `UCreationPartAsset` | BannonEngine |

So:

```
no Build.cs  →  module not declared  →  UBT never builds it
             →  the four asset types do not exist as engine classes
             →  no .uasset can be authored against them
             →  0 .uasset, 0 .umap
```

The repository's missing Unreal content layer is **downstream of this module's
absence**, not an independent problem. Authoring content was never possible,
because the classes that content would instantiate were never compiled.

## Classification

Per the required scheme, the whole directory resolves to one class:

**`CORE_UNREAL_MODULE`** — a coherent, Unreal-facing subsystem.

| Group | Files | Classes |
| --- | --- | --- |
| Wrestling gameplay managers | 9 | `UBannonChainWrestlingManager`, `UBannonGroundGameManager`, `UBannonSubmissionManager`, `UBannonReversalManager`, `UBannonInjuryManager`, `UBannonTauntManager`, `UBannonArchetypeManager`, `UBannonCreationManager`, `UBannonPsychologyParser` |
| Actors | 4 | `ABannonFighterCharacter`, `ABannonLadderWeapon`, `ABannonWeaponManager`, `ABannonPromotionManager` |
| **Content schema** | 5 | the four `UPrimaryDataAsset`s above, plus `UBannonStitchedFinisher` |

No file classified as `DUPLICATE` or `OBSOLETE`. Nothing here duplicates
`BannonCore`.

## Why NOT fold it into BannonCore

Coupling was measured, not assumed:

```
BannonCore references to BannonFighterCharacter   0
BannonCore references to MovesetLibraryAsset      0
BannonCore references to BannonEntranceAsset      0
BannonCore references to BannonArenaAsset         0
BannonCore references to BannonCreationManager    0
```

**Zero.** `BannonEngine` is already an independent module in everything but
declaration. Folding it into `BannonCore` would merge two cleanly separated
layers — the low-level laws/components and the high-level wrestling systems plus
content schema — for no benefit.

It also has a different dependency shape. `BannonCore` pulls Chaos, ControlRig,
RigVM, AnimGraphRuntime and the `native/include` law headers. `BannonEngine` uses
**none of them**: measured 0 files including any `bannon_*` native header, and
its only engine surface is `CoreMinimal`, `Engine/DataAsset`, GameFramework
`Actor`/`Character`/`CharacterMovementComponent`, and
`USkeletalMesh`/`UAnimMontage`/`UStaticMesh`.

That separation is worth keeping: it is exactly the shape a Lyra **Game Feature**
wants — high-level gameplay and data assets, no hard engine-global dependencies.

## Action taken

1. Created `unreal/Source/BannonEngine/BannonEngine.Build.cs` with dependencies
   derived from measured usage (`Core`, `CoreUObject`, `Engine`, `InputCore`) —
   deliberately **not** copied from `BannonCore`, which would have added Chaos
   and ControlRig this module does not use.
2. Registered `BannonEngine` as a `Runtime` module in `Bannon.uproject`. The file
   was re-validated as JSON afterwards; `EngineAssociation` remains `5.3`.

## Verification state

**`IMPLEMENTED_UNVERIFIED`.**

No Unreal toolchain exists in the environment where this change was made, so the
module has not been compiled. What is verified: the dependency list matches
measured usage, the coupling analysis is complete, and the `.uproject` remains
valid JSON with both modules declared.

The first real build is what confirms or corrects this. If the compiler asks for
a module `BannonEngine` does not declare, add it there — do not copy
`BannonCore`'s list wholesale, or the separation this decision preserves is lost
on the first error.

## What this unblocks

Once `BannonEngine` compiles, the four content-schema classes exist as engine
types, and Unreal content can be authored against them for the first time:

```
UMovesetLibraryAsset   → moveset data assets
UBannonEntranceAsset   → entrance data assets
UBannonArenaAsset      → arena data assets
UCreationPartAsset     → CAW part data assets
```

That is the entry point to the content layer whose absence has been the standing
diagnosis. It should be attempted immediately after the first successful compile
and before any Lyra migration work.
