# Building BANNON on Lyra (and other full-game bases) — the plan

You asked to pull the full **Lyra Starter Game** and build BANNON on top of it so our fragmented pieces
become one complete game. Here's the straight version of how that works, what I can do from here, and
what has to happen in the Unreal Editor on a desktop — because Lyra is a ~real UE project, not something
I can download and compile inside this sandbox.

## Why Lyra is the right base
Lyra is Epic's flagship sample — a **complete, shippable game framework**, not a demo. It already gives
us the "full game" scaffolding BANNON is missing:
- **Modular Gameplay (Game Features + Experiences)** — self-contained feature plugins you switch on per
  mode. A "match type" (singles / tornado / LMS / Iron Man) becomes a Lyra *Experience*.
- **GAS (Gameplay Ability System)** — abilities, attributes, cooldowns, effects. Our strikes, grapples,
  submissions, finishers map onto GAS abilities; HP/poise/stamina map onto an AttributeSet.
- **Enhanced Input**, **CommonUI** (menus/HUD that scale to phone), **save game**, settings, audio, and
  a working **third-person character** with networking already wired.
- Cross-platform incl. **Android** packaging out of the box.

So instead of building menus/input/save/networking/mode-flow from scratch, BANNON becomes a **Game
Feature plugin on Lyra**, and Lyra provides the "full game" shell.

## The mapping (our stuff → Lyra)
| BANNON piece (already built in `unreal/` + `native/`) | Lyra home |
|---|---|
| `bannon_core/rig/strike/grapple/weapon/referee/universe.h` (the laws) | stays header-only; compiled into our Game Feature module |
| `UBannonRagdollComponent`, `UBannonGrappleGrip`, `UBannonFloatingCapsuleMovement` | components on the Lyra character (or a BANNON pawn variant) |
| `ABannonFighter` (HP/poise/stamina) | GAS `AttributeSet` + our components on `ALyraCharacter` |
| strikes / grapples / submissions / finishers | GAS **GameplayAbilities** (one ability asset each), granted by an AbilitySet |
| match types (multi-man/LMS/Iron Man/First Blood/Hardcore) | Lyra **Experiences** (one per mode) |
| `ABannonArena` + `FBannonRingColors` + mat logo | a Lyra map/level + our ring actor |
| CREATION SUITE (CAW/moveset/arena/entrance) | **CommonUI** screens (the 2K-style menus), backed by our DNA/moveset schemas |
| God Within mode | a Lyra Experience + our persona physics state machine |

## What I can do from here (and am aligning now)
1. Keep `unreal/Source/BannonCore` **structured as a Game-Feature-ready module** (it already is: header-only
   laws + `UActorComponent`/`AActor` classes with no hard engine-global deps) so dropping it into a Lyra
   `Plugins/GameFeatures/BannonCombat/` is a move, not a rewrite.
2. Author the GAS/Experience/CommonUI **specs** (which ability = which native call, which Experience =
   which mode) so the editor work is assembly, not design.
3. Everything physics/law stays the single source of truth in `native/` — Lyra doesn't change the rules.

## What must happen on a desktop / CI (honest boundary)
- **Getting Lyra**: it comes with UE via the Epic Launcher (Samples) or the `EpicGames/UnrealEngine`
  GitHub (which you already have access to). It is not a standalone public repo I can `add_repo` here, and
  it's tens of GB — it can't be pulled or compiled in this sandbox.
- **The merge + build**: opening Lyra in **UE 5.x**, adding `BannonCombat` as a Game Feature, wiring the
  abilities/experiences, and packaging to Android — all done in the editor / a beefy CI runner. When we're
  there, the Android package flows through the same idea as `.github/workflows/android.yml` but for UE
  (heavy runner + Android NDK).

## Other full-game bases that fit (from your repo stash)
- **OnlyHands / ArenaBrawler** (UE5 physics-fighting C++) — closest combat match; already mined for the
  grapple grip. Good source of GAS-style combat structure to mirror in the Lyra feature.
- **pitbeastsimulator** (UE ProjectSR base) — gait state machine + combat physics for the active ragdoll.
- **EyeofTiger / Fighting-Physics-Simulation / Boxing-Mate / FightingGame3D** (your screenshot list, not
  uploaded yet) — pull when ready for more fighting styles/state machines; fold into the GAS ability set.
- **Lyra** = the shell that ties them all into one complete game.

## Bottom line
BANNON-on-Lyra is real and it's the right call — and the work splits cleanly: I keep our combat/physics a
drop-in Game Feature + write the assembly specs here; the Lyra pull, editor wiring, and Android package
happen on a desktop/CI with UE. This doc + the aligned `unreal/` module are that half done now.
