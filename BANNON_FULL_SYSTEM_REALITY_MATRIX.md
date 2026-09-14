# BANNON FULL SYSTEM REALITY MATRIX

Generated 2026-09-01 from direct inspection of the **whole repository**, not the
Unreal directory alone.

---

## Correction to a previous, too-narrow reading

An earlier audit reported "Bannon has gameplay code and no game content." That
statement was scoped to the **Unreal content layer** and is accurate there — but
presented as a diagnosis of Bannon it was materially too narrow, and the audit
that produced it had two scope defects worth naming:

1. It examined `unreal/` and inferred from it.
2. It used a `--depth 1`, **single-branch** clone, so 8 other branches were never
   looked at, and submodules read as missing when they are correctly pinned.

The accurate statement is:

> Bannon is a large, multi-layer game system. Its Unreal **C++** port is far more
> advanced than the earlier reading implied — every named wrestling system has
> Unreal presence. What is missing is the Unreal **content/asset layer** and the
> engine glue (PlayerController, Enhanced Input usage, GAS), and that absence is
> itself downstream of an unregistered module.

---

## Repository scale

| Layer | Measured |
| --- | --- |
| Total repo on disk | 3.8 GB |
| `assets/` | 2.2 GB |
| `unreal/` | 46 MB, 706 `.h`/`.cpp`, 354 `UCLASS` |
| `native/include/` | 15 header-only law files |
| Web runtime | `BANNON_v150.html` at **60,064 lines** + 180 `.ts`/`.tsx` in `src/` |
| Remote branches | **9** |

---

## Cross-layer system inventory

Files matching each subsystem's symbols, per layer. Measured, not estimated.

| System | web | native | unreal | Reading |
| --- | ---: | ---: | ---: | --- |
| Grapple | 9 | 3 | 37 | ported (law + UE) |
| Strike | 18 | 4 | 39 | ported (law + UE) |
| Submission | 9 | 1 | 40 | ported (law + UE) |
| Pin | 1 | 1 | 5 | ported (law + UE) |
| Reversal / Counter | 11 | 3 | 22 | ported (law + UE) |
| Throw / Slam | 4 | 1 | 11 | ported (law + UE) |
| Rope / Ring | 21 | 2 | **114** | ported (law + UE) |
| Ragdoll / PhysAnim | 10 | 10 | 46 | ported (law + UE) |
| Weight / Momentum | 22 | 2 | 49 | ported (law + UE) |
| Referee | 2 | 1 | 18 | ported (law + UE) |
| Entrance | 7 | 0 | 12 | UE + web, no law layer |
| CAW / Fighter DNA | 8 | 1 | 14 | ported (law + UE) |
| Moveset | 8 | 0 | 5 | UE + web, no law layer |
| Mocap / Animation | 2 | 1 | 8 | ported (law + UE) |
| AI | 3 | 0 | 7 | UE + web, no law layer |
| Universe / Career | 9 | 1 | 30 | ported (law + UE) |
| Zone combat | 11 | 1 | 12 | ported (law + UE) |
| Weapon | 5 | 2 | 47 | ported (law + UE) |
| Arena | 12 | 2 | 24 | ported (law + UE) |
| Persona / God Within | 14 | 1 | 9 | ported (law + UE) |

**Not one system is web-only.** All 20 have Unreal C++ presence, 5–114 files
each. The Unreal port is substantially advanced — it has never been compiled.

---

## The actual blocker, and its cause

`unreal/Source/BannonEngine` had 31 source files, **no `Build.cs`**, and **no
entry in `Bannon.uproject`**. It owns **all four** `UPrimaryDataAsset` classes —
the entire Unreal content schema. `BannonCore` has none.

```
no Build.cs → module undeclared → UBT never builds it
  → MovesetLibrary / Entrance / Arena / CreationPart asset types don't exist
  → no .uasset can be authored against them
  → 0 .uasset, 0 .umap
```

**The missing content layer is a consequence, not an independent problem.**
Resolved this pass — see `BANNONENGINE_MODULE_DECISION.md`. State:
`IMPLEMENTED_UNVERIFIED` (no engine available to compile it).

---

## Engine glue that is genuinely absent

Measured across the whole `unreal/Source` tree:

| Item | Count | State |
| --- | ---: | --- |
| `APlayerController` subclasses | **0** | MISSING |
| Files referencing `EnhancedInput` | **0** | declared in `Build.cs`, never used |
| Files referencing `UAbilitySystemComponent` / `UGameplayAbility` / `FGameplayTag` | **0** | GAS entirely absent |
| `.uasset` / `.umap` | **0** / **0** | MISSING (cause above) |

Present and substantial: 5 `ACharacter` subclasses, 2 `AGameMode`, 160
`UActorComponent`, 1 `UAnimInstance`, 6 `AActor`.

---

## Branches — 8 unaudited, and one confirmed to hold unmerged work

| Branch | Tip date | Subject |
| --- | --- | --- |
| `main` | 2026-09-01 | drive-sync |
| `claude/grapple-solver-model-fixes-oar0pg` | 2026-08-04 | shader-queue removal after honest measurement |
| `feat/normalize-fbx-and-logging` | 2026-07-27 | clip normalization, logging, diagnostics |
| `rescue/aistudio-main-8be335c` | 2026-07-19 | APK rebuild |
| `claude/gen-selfhosted` | 2026-07-10 | Forge image-ref input, asset categories |
| `claude/bannon-dna-native-port-digjqw` | 2026-07-07 | v156 pass, AAA base library, aerials |
| `master` | 2026-07-06 | Firebase/Supabase storage |
| `claude/aaa-bannon-leg-stepping-sdwcjb` | 2026-07-06 | DNA-CAW save/load schema, port map |
| `Branch-2` | 2026-06-27 | merge of the leg-stepping branch |

**Content-diffed** `claude/grapple-solver-model-fixes-oar0pg` against `main`:
**11 files exist on that branch and are absent from main**, including
`assets/models/JAGER_coat.glb` and five `src/modules/` UI modules
(`appearance`, `appearance_ui`, `sculpt`, `late_bodies`, `gpuq`), plus five
harness/diagnostic tools.

**Honest limit:** ancestry was tested against `main`'s most recent 373 commits.
A squash-merge or an older merge point would produce the same "not an ancestor"
result, so the other seven branches are **UNAUDITED for merge status** — the
content diff above is the only branch claim made with evidence. Each needs the
same treatment before anything is deleted.

---

## The Lyra plan already exists in this repository

`docs/LYRA_BASE.md` (6.8 KB) already contains a subsystem mapping table,
an adoption priority list (foot-IK Control Rig, Motion Warping, GAS, physical
animation + hit reactions, CommonUI) and the honest "Lyra needs a desktop" note.
**It should be built on, not rewritten.**

One claim in it is worth testing against this audit: it states `BannonCore` is
"Game-Feature-ready … `UActorComponent`/`AActor` classes with no hard engine-global
deps." Measured, that is **mostly right and usefully imprecise**: 160
`UActorComponent` and 6 `AActor` are genuinely Game-Feature shaped, but 2
`AGameMode` and 4 `ACharacter` are not — Lyra replaces GameModes with Experiences
and expects components on `ALyraCharacter`. The doc's own mapping table already
anticipates this ("components on the Lyra character, or a BANNON pawn variant"),
so the fix is small; it just is not a pure move.

Note also that `BannonEngine` — not `BannonCore` — is the more natural Game
Feature: high-level wrestling systems plus the data-asset schema, with **zero**
`native/` dependencies (measured) and zero coupling to `BannonCore`.

---

## State summary

| Item | State |
| --- | --- |
| Web runtime (60k lines) | IMPLEMENTED — the currently playable Bannon |
| `native/` law layer (15 headers) | IMPLEMENTED — shared authority for both runtimes |
| Unreal C++ port, all 20 systems | **IMPLEMENTED_UNVERIFIED** — never compiled |
| `BannonEngine` module registration | IMPLEMENTED_UNVERIFIED — fixed this pass, not compiled |
| Unreal content layer | MISSING — downstream of the above |
| PlayerController / Enhanced Input / GAS | MISSING |
| Third-party submodules | IMPLEMENTED — pinned; `git submodule update --init --recursive` |
| Lyra integration | DOCUMENTED_ONLY — plan exists, nothing executed |
| 8 non-main branches | UNAUDITED for merge status; one confirmed to hold 11 absent files |

---

## Ordered next steps

1. `git submodule update --init --recursive`
2. Run the Unreal worker on a machine with UE 5.3; `POST /op/probe`.
3. `POST /op/build` — **first real signal.** Capture the log either way.
4. Correct `BannonEngine.Build.cs` from what the compiler actually asks for.
   Do **not** copy `BannonCore`'s dependency list wholesale; that would erase the
   module separation this audit found worth keeping.
5. Author the first content against the four data-asset classes.
6. Then Lyra, per `docs/LYRA_BASE.md`.
7. Audit the remaining 7 branches for unmerged work before any cleanup.

Steps 1 and 4–7 are bounded work. Step 2 is the only one that needs hardware, and
nothing after it is verifiable without it.
