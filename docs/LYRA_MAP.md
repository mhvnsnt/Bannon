# mhvnsnt/lyra — WHAT IS ACTUALLY IN IT (mapped 2026-09-04)

Owner: *"Map mhvnsnt/Lyra against the Bannon requirements ... establish what is actually already
present in your Lyra checkout — engine version, plugins, Content, Source modules, animation setup."*
And, importantly: *"inspect its actual contents, not assume it is stock Lyra or that it contains
everything."*

**MAPPED ONLY. Nothing copied, nothing built, nothing decided.** Cloned tree-only at `7e87d76`
(`--depth 1 --filter=blob:none --no-checkout`, the banked technique: the whole file tree, none of the
blob content — 1.1 MB on disk for a repo whose checkout would be gigabytes). Note the casing: the
session git proxy serves **lowercase** repo names, already banked law.

## IT IS REAL LYRA, WITH THE CONTENT, ON UE 5.3

    9,533 files      8,606 .uasset · 341 .h · 340 .cpp · 17 .uplugin · 16 .umap · 47 .ini · 23 .cs
    EngineAssociation 5.3      63 enabled plugins

**THAT IS THE FINDING THAT MATTERS MOST**, because it is the exact inverse of the one that decided
the UE plan a day ago. From `docs/M_ENGINE_MAP.md`:

    unreal/Bannon.uproject    706 .cpp/.h    0 .uasset    0 .umap    0 .uplugin

Bannon's own UE side is 706 source files and **nothing to render**. This repo is 681 source files
and **8,606 content assets**. The half each one is missing is the half the other has.

## THE LOCOMOTION VOCABULARY IS COMPLETE, AND THE UNARMED SET IS THE ONE WRESTLING NEEDS

    Locomotion/Unarmed  109 assets      Rifle 118 · Pistol 107 · Shotgun 5
    AimOffsets 98 · Actions 86 · Poses 41 · Interactions/Bench 28

The unarmed set carries exactly the vocabulary the owner listed as the locomotion requirement —
not one loop per direction, but the **starts, stops, pivots and turns** that are the difference
between a walk cycle and a character who moves:

    MF_Unarmed_Jog_Fwd / Bwd / Left / Right      each with  _Start  _Stop  _Pivot
    MF_Unarmed_TurnLeft_90 / _180 · TurnRight_90 / _180
    MF_Unarmed_Idle_Ready · MF_Unarmed_Idle_Break
    BS_MM_Unarmed_Jog_Walk        (the blend space)

Bannon's current build selects `GEN_WALK_FWD` and loops it. This is what the alternative looks like
as shipped data.

## LINKED ANIM LAYERS — THE ARCHITECTURE, NOT JUST THE ASSETS

    ABP_ItemAnimLayersBase
      ABP_UnarmedAnimLayers   ABP_RifleAnimLayers   ABP_PistolAnimLayers   ABP_ShotgunAnimLayers
      + a _Feminine variant of each
    ABP_Mannequin_Base · ABP_Mannequin_Retarget · ABP_UE4_Mannequin_Retarget · ABP_Mannequin_CopyPose
    ABP_Manny_PostProcess · ABP_Quinn_PostProcess

One base graph, and the PERFORMANCE swapped underneath it per context. That is structurally the
same idea as the owner's move-contract layering — the graph does not get rewritten to change what
the character is doing, the layer does. For Bannon that maps to fighting style / weapon / move
family rather than rifle-vs-pistol.

## PROCEDURAL: A SHIPPED FOOT PLANT, WHICH IS THE PROBLEM BANNON HAS OPEN RIGHT NOW

    CR_Mannequin_FootPlant      CR_Mannequin_Procedural      CR_Mannequin_Body
    IK_Mannequin                IK_UE4_Mannequin

Bannon's `BANNON_FOOTIK` is measured at 10% engagement with the lock breaking more often than it
plants, and the foot still travelling 6.74x body speed while locked. There is a working Control Rig
foot plant here. That is a reference implementation for an open defect, not a nice-to-have.

## GAS IS FULLY PRESENT

111 ability-related files: `LyraGameplayAbility`, `LyraAbilityCost*`, `LyraAttributeSet`,
`LyraCombatSet`, `LyraHealthSet`, `LyraGameplayAbility_Death/Jump/Reset`.
Consistent with banked OWNER LAW: **GAS is IN for God Within, OUT of the cross-engine combat laws**
that must also compile to the web build.

## THE TWO PLUGINS THAT MATTER MOST ARE ENABLED AND **NOT USED**

    ContextualAnimation      ENABLED   ->  0 assets in the project
    AnimationWarping         ENABLED   ->  0 assets referencing it
    AnimationLocomotionLibrary  ENABLED
    ControlFlows                ENABLED

**`ContextualAnimation` is UE5's two-character synchronised interaction system** — paired actor
animation with roles, contact alignment and sync points. It is precisely the thing the owner
specified when he wrote *"grapples need a two-character animation contract ... attacker clip, victim
clip, contact anchors, relative transform, sync markers, move phase"*. Unreal ships it and this
checkout has it turned on.

**AND IT SHIPS NO SCENE THAT USES IT.** Zero assets. Same for AnimationWarping. Lyra is a shooter;
it enables these and never authors one. **CAPABILITY PROBED, NOT CONFIGURED** — the M. Engine law,
and the reason this section is worth more than a plugin list would be: *available infrastructure* and
*a working example to copy* are different claims, and only the first one is true here. The two-body
grapple contract still has to be authored from nothing; what exists is the framework to author it in.

## PHYSICS

    PA_Mannequin · SK_Mannequin_PhysicsAsset · SK_{Pistol,Rifle,Shotgun}_PhysicsAsset

A ragdoll physics asset for the body. No physical-animation / active-ragdoll blueprint content
beyond that — the animation→physics authority handoff the owner described is not demonstrated here
either.

## WHAT IS NOT IN IT, STATED PLAINLY

Zero wrestling anything: no grapple, no throw, no receiver/victim animation, no reversal, no pin,
no ring, no rope, no entrance, no run-in, no match rules, no two-body interaction of any kind.
16 maps, all shooter or test (`L_ShooterGym`, `L_FiringRange_WP`, `L_TopDownArenaGym`,
`L_Expanse`, `L_LyraFrontEnd`, `TransitionMap`). The Game Feature plugins are `ShooterCore`,
`ShooterMaps`, `ShooterTests`, `ShooterExplorer`, `TopDownArena`.

So the owner's framing holds exactly: **Lyra is a foundation, not a wrestling game.** It answers
"how does a human move naturally between actions"; it says nothing about "what is this fighter
trying to do to this other fighter".

## LICENCE — A SHIPPING CONSTRAINT, NOT A BLOCKER

Lyra's content is Epic's, under the Unreal Engine EULA. That is fine for a UE game built on UE and
it is what the sample exists for. It is **not** liftable into `BANNON_v150.html` — the Three.js
build is a different runtime under a different licence, and copying Lyra animation assets into it
would be the same class of mistake as baking a CC BY-NC motion dataset into the shipping game
(already banked law).

## WHAT THIS DOES AND DOES NOT CHANGE

**Does not change:** the build on the owner's phone is `BANNON_v150.html`. Every defect measured
this week — the clip authoring an inverted body, the retarget/clip torso contention, the plant lock,
the mesh tear on a transferred rig — is in that runtime and none of them is fixed by a repository
existing. The Three.js work is not blocked on this and should not wait for it.

**Does change:** the UE path is no longer "there is nothing there to render". There is a complete,
running, content-bearing UE 5.3 project with the locomotion vocabulary, the layered-animation
architecture, a Control Rig foot plant, GAS, and the two-actor interaction framework switched on.

## THE FIRST MILESTONE, IF AND WHEN THIS LANE OPENS

Owner's own ordering, and it is the right one: get the boring thing working before importing
anything. Project opens → compiles → Play → player spawns → camera → input → locomotion → second
character → AI. **Not 500 wrestling animations first.** Then one Bannon Experience, then one
vertical slice (2 fighters, 1 ring, idle/walk/run/turn, one strike, one grapple, one throw, one
reversal, one pin) with the Character Truth rules applied to each.

NOTHING HAS BEEN COPIED, FORKED OR BUILT. This is the survey the owner asked for.
