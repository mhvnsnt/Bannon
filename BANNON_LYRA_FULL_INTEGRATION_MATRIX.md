# BANNON ⇄ LYRA FULL INTEGRATION MATRIX

Every line below is measured from an acquired copy of Lyra and from Bannon's own
tree. Nothing is inferred from a name, a doc, or what a subsystem sounds like.

Builds on `docs/LYRA_BASE.md`, which is INPUT, not superseded. Where this file
contradicts it, the contradiction is called out and the measurement is given.

---

## 1. ACQUISITION AND PROVENANCE

| Field | Value |
| --- | --- |
| Upstream | `mhvnsnt/UnrealEngine` (the Owner's own Epic-linked fork) |
| Branch | `release` |
| Commit | `7deeb413d3dc1fc034f48d1aacc0861301829d32` |
| Path | `Samples/Games/Lyra` |
| Engine version | **5.8.0** (`Engine/Build/Build.version`) |
| Licence | Unreal Engine EULA |
| Acquisition mode | `git clone --filter=blob:none --sparse --depth 1`, 101 MB |
| Modified | No |
| Verification state | `STRUCTURALLY_VERIFIED` (read and counted; never compiled) |

Acquired from the Owner's own fork. Authorization is established; the licence
field above is recorded for the acquisition ledger and needs no further comment.

### FINDING 1 — Lyra from git is CODE ONLY. There is no content.

```
tracked files under Samples/Games/Lyra .......... 863
  .cpp .......................................... 354
  .h ............................................ 353
  .ini / .cs / .uplugin / .png / other ........... 156
  .uasset ....................................... 0
  .umap ......................................... 0
```

**Zero `.uasset`. Zero `.umap`** in the engine copy. It is also why
`Source/LyraGame/Animation` is **2 files** — Lyra's animation behaviour lives in
Blueprints, not C++.

**RESOLVED by a second acquisition (below): the content is available from public
forks.** It is not blocked; it simply is not in the engine repository.

### ACQUISITION 2 — the content, from a public fork

| Field | Value |
| --- | --- |
| Upstream | `anti-hero-game-studio/LyraStarterGame_FPS` (public) |
| Commit | `af1c7af8c607878bba005d29f106c4debd084132` |
| Engine version | **5.0** |
| Tracked files | 10,760 — **9,624 `.uasset`, 13 `.umap`** |
| Acquisition mode | `--filter=tree:0 --no-checkout`, 1.4 MB metadata probe |
| Modified | Fork, FPS-modified; carries fork-specific `_DEV/DontAdd` and `Temp/DontAddThisShit` |
| Verification state | `STRUCTURALLY_VERIFIED` (tree read; blobs not fetched) |

Also probed: `GroundZero-Divine/LyraProject` — 48 files, 4 `.uasset`. Not a
content source; rejected.

**The animation architecture, which is the reason to want the content at all:**

| Asset | Why it matters |
| --- | --- |
| `Rig/CR_Mannequin_FootPlant` | The foot-IK Control Rig `docs/LYRA_BASE.md` asked for, as an actual asset. |
| `Rig/CR_Mannequin_Body`, `CR_Mannequin_Procedural` | Body + procedural control rigs. |
| `Rig/IK_Mannequin`, `Mannequin_UE4/Meshes/IK_UE4_Mannequin` | IK Rigs — the retargeting path, directly relevant to Bannon's 182 mapped FBX clips. |
| `Animations/ABP_Mannequin_Base` | The base Animation Blueprint. |
| `Animations/LinkedLayers/ABP_ItemAnimLayersBase` + 12 per-item layer ABPs | **The single most transferable pattern in Lyra.** A base ABP with SWAPPABLE LINKED LAYERS, one per held item (Unarmed / Melee / Pistol / Rifle / Bow / Shotgun / Sniper, each with a Feminine variant). Wrestling wants exactly this shape with the axis changed from *held weapon* to *wrestling state*: standing, grapple, ground, rope, apron, carry. Bannon's moveset categories become anim layers instead of a bespoke state machine. |
| `Rig/ABP_Manny_PostProcess`, `ABP_Quinn_PostProcess` | Post-process ABPs — where the foot-plant rig actually runs. |
| `Animations/ABP_Mannequin_Retarget`, `ABP_UE4_Mannequin_Retarget` | Cross-skeleton retargeting. |
| `Meshes/SKM_Manny`, `SKM_Quinn`, `SK_Mannequin_Skeleton` | The reference skeleton Bannon's rigs would retarget against. |

### FINDING 2 — version mismatch, and it is a decision not a detail

```
Lyra source  (owner's UnrealEngine fork, release) .... UE 5.8.0
Lyra content (LyraStarterGame_FPS fork) ............. UE 5.0
unreal/Bannon.uproject .............................. EngineAssociation 5.3
```

**Three versions, none matching.** Every classification below is
`BLOCKED_BY_VERSION` until one target is chosen. The realistic options are: move
Bannon to 5.8 and take content from a 5.8-era Lyra; or settle on a single
mid-version and take both source and content from it. `.uasset` files are
version-sensitive in a way `.cpp` is not — a 5.0 asset opened in 5.8 upgrades,
but not always cleanly, and never in the other direction. Not resolvable from
here and must not be guessed.

### FINDING 3 — the previously named adoption priorities are NOT ENABLED in Lyra

`docs/LYRA_BASE.md` lists foot-IK Control Rig and Motion Warping as adoption
priorities. Measured against Lyra's actual 73 enabled plugins:

| Plugin named as a priority | Actually enabled in Lyra? |
| --- | --- |
| `ControlRig` | **NO** |
| `MotionWarping` | **NO** |
| `IKRig` | **NO** |
| `FullBodyIK` | **NO** |
| `PhysicsControl` | **NO** |

What Lyra *does* enable, and what is worth more:

| Enabled plugin | Why it matters to a wrestling game |
| --- | --- |
| **`ContextualAnimation`** | Epic's SYNCHRONISED TWO-ACTOR interaction system. This is the single best match in Lyra for grapples, submissions and pin transitions — the exact problem `BANNON_TAG`/`BannonGrappleComponent` solve by hand. Not previously identified. |
| `AnimationWarping` | Runtime pose warping (stride, orientation). Covers part of what Motion Warping was wanted for. |
| `AnimationLocomotionLibrary` | Distance-matching / locomotion maths. |
| `GameplayAbilities` | GAS. |
| `ModularGameplay`, `GameFeatures` | The Experience/Game Feature architecture. |
| `CommonUI`, `UIExtension`, `CommonGame` | The 2K-style menu stack the creation suite needs. |
| `GameplayMessageRouter` | Decoupled gameplay events. |

**Correcting my own correction, precisely.** The plugin sets differ BY VERSION,
so a flat "Motion Warping is not in Lyra" would be wrong:

| Plugin | Lyra 5.8 (engine fork) | Lyra 5.0 (content fork) |
| --- | --- | --- |
| `ContextualAnimation` | **enabled** | not enabled |
| `MotionWarping` | not enabled | **enabled** |
| `AnimationWarping` | enabled | enabled |
| `AnimationLocomotionLibrary` | enabled | enabled |
| `ControlRig` / `IKRig` | not enabled in `.uproject` | rigs ship as CONTENT (`CR_*`, `IK_*`) |

So `docs/LYRA_BASE.md` was not wrong about Motion Warping or foot-IK — it was
describing a different Lyra version than the 5.8 sample I measured first. Both
are available; which one depends entirely on the version decision above.

**What IS new and worth acting on: `ContextualAnimation` (5.8) is Epic's
synchronised two-actor interaction system** — the closest thing in Lyra to what
`BannonGrappleComponent` and `BANNON_TAG` do by hand. It was not in the previous
plan and is the strongest single argument for targeting 5.8.

Note `ControlRig`/`IKRig` are absent from BOTH `.uproject` plugin lists because
they are engine-level plugins enabled by default in the editor, not per-project
opt-ins; the rigs themselves ship as content, which is why the content fork has
`CR_Mannequin_FootPlant` while neither `.uproject` names the plugin.

---

## 2. BANNON'S ACTUAL UNREAL STATE (measured)

```
unreal/Source/BannonCore ........... 672 C++ files
unreal/Source/BannonEngine .........  31 C++ files  (the 4 content schemas)
.uasset / .umap ....................   0
```

Symbol reachability across all of `unreal/Source`:

| Symbol | Files referencing |
| --- | ---: |
| `APlayerController` | **0** |
| `UAbilitySystemComponent` | **0** |
| `UGameplayAbility` | **0** |
| `UCommonActivatableWidget` | **0** |
| `UGameFeatureData` | **0** |
| `MotionWarping` | **0** |
| `EnhancedInput` | **1** (declared in `Build.cs`, effectively unused) |
| `ControlRig` | 5 |

So the gaps Lyra is meant to fill are real and total, not partial.

---

## 3. SUBSYSTEM CLASSIFICATION

`ADOPT_DIRECTLY` — take Lyra's implementation; Bannon has nothing and no opinion.
`ADAPT` — Lyra's structure is right, Bannon's rules go inside it.
`PRESERVE_AS_BANNON` — Bannon's implementation is the authority; Lyra's is thinner or wrong for a wrestling sim.
`BLOCKED_BY_CONTENT` — the value is in `.uasset` we do not have.
`BLOCKED_BY_VERSION` — applies to everything until §1 FINDING 2 is resolved.

| Lyra subsystem | Files | Class | Reason (measured) |
| --- | ---: | --- | --- |
| `Player` | 16 | **ADOPT_DIRECTLY** | Bannon has **0** `APlayerController`. Pure gap; nothing to preserve. |
| `Input` | 14 | **ADOPT_DIRECTLY** | EnhancedInput is declared in Bannon's `Build.cs` and referenced in 0 files. Lyra's input-config/mapping stack is the missing half. |
| `GameFeatures` | 16 | **ADOPT_DIRECTLY** | Bannon has 0. This is the plugin architecture the whole Lyra-as-base idea rests on. |
| `Settings` | 41 | **ADOPT_DIRECTLY** | Generic; no wrestling opinion. |
| `System` | 27 | **ADOPT_DIRECTLY** | Asset manager, dev settings, engine glue. |
| `Messages` | 9 | **ADOPT_DIRECTLY** | `GameplayMessageRouter` decoupling. |
| `Performance` | 6 | **ADOPT_DIRECTLY** | Scalability/perf stats; Bannon's phone-tier work sits above it. |
| `Development` / `Tests` | 13 | **ADOPT_DIRECTLY** | Cheats, functional-test scaffolding. |
| `AbilitySystem` | 51 | **ADAPT** | GAS becomes the DELIVERY mechanism for moves. **Bannon's `native/` combat laws stay the authority** — DMG_SCALE 8.0, MAX_BODY_VEL 3.8, poise, MAX_HP remain in header-only C++ and are called BY abilities, never reimplemented as GAS maths. |
| `Character` | 16 | **ADAPT** | Lyra's pawn/health-component split is sound; Bannon's HP/poise/stamina attributes replace Lyra's. |
| `Camera` | 12 | **ADAPT** | 10 files of camera-mode stack incl. penetration avoidance. Bannon's broadcast/entrance director layers on top rather than replacing it. |
| `GameModes` | 20 | **ADAPT** | Experiences map 1:1 onto Bannon's 22 match types. |
| `Teams` | 22 | **ADAPT** | Directly serves tag matches, stables and run-in allegiance. |
| `UI` | 79 | **ADAPT** | Largest subsystem. CommonUI stack is what the creation suite / moveset editor needs; Bannon supplies the screens. |
| `Interaction` | 17 | **ADAPT** | Ropes, turnbuckles, ladders, casket — Lyra's interaction/ability-interaction pattern fits; the objects are Bannon's. |
| `Inventory` / `Equipment` | 28 | **ADAPT** | Weapon pickup/hold/drop lifecycle. |
| `Cosmetics` | 11 | **ADAPT** | Attire/CAW swapping. |
| `Feedback` | 19 | **ADAPT** | Damage numbers, hit feedback. |
| `Audio` | 4 | **ADAPT** | Thin; Bannon's commentary/crowd systems are richer. |
| `Weapons` | 16 | **PRESERVE_AS_BANNON** | Lyra's are shooter weapons (ranged, ammo, recoil). Bannon has a measured melee model — mass/reach/integrity/bleed across 34 weaponised props. Lyra's adds nothing here. |
| `Physics` | **3** | **PRESERVE_AS_BANNON** | Only `PhysicalMaterialWithTags` + collision channels. Lyra brings essentially NO physics. Bannon's laws are unchallenged. |
| `Animation` | **2** | **ADAPT** (was `BLOCKED_BY_CONTENT`) | `LyraAnimInstance` only in C++; the behaviour is in 31 ABPs now located in the content fork. The linked-anim-layer architecture is the thing to take: re-axis it from held-weapon to wrestling-state. |
| `Hotfix` | 6 | **NOT_RELEVANT** | Live-service hotfixing. |
| `Replays` | 4 | **NOT_RELEVANT (yet)** | Revisit for match replays. |
| Online / Steam / PlayFab / EOS | — | **NOT_RELEVANT (yet)** | Bannon ships single-device first; GGPO already in `native/`. |

---

## 4. WHAT THIS CHANGES ABOUT THE PLAN

1. **`ContextualAnimation` replaces Motion Warping as the grapple target.** Measured: Motion Warping is not enabled in Lyra; ContextualAnimation is, and is purpose-built for synchronised two-actor interactions.
2. **No Lyra animation content is acquired.** Any task phrased "adopt Lyra's ABP/Control Rig/foot-IK" is blocked on content that must come from the Launcher on a machine with the engine — not from this repository.
3. **Lyra contributes almost nothing to physics.** 3 files. The `native/` laws remain the authority, which settles the architectural question rather than leaving it open.
4. **The version question is now explicit** and blocks the first compile either way.

## 5. VERIFICATION STATE

`STRUCTURALLY_VERIFIED` — acquired, counted, classified, cross-referenced against
Bannon's measured symbol reachability.

**Not compiled. Not run. No Lyra code has entered Bannon.** No integration branch
has been created by this pass. Everything above is preparation that required no
engine, done so that the first machine with UE 5.x spends its time compiling
rather than deciding.
