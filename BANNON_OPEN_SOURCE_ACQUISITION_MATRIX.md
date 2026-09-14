# BANNON — ACQUISITION MATRIX

Every external source pulled into the Bannon programme, with what it is, where it
came from, and what has actually been proven about it.

`STRUCTURALLY_VERIFIED` = acquired and read. Nothing here has been compiled.

## Acquired this pass

| Source | Commit | Version | Licence | Purpose | Mode | Modified | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mhvnsnt/UnrealEngine` → `Samples/Games/Lyra` | `7deeb413` | UE 5.8.0 | UE EULA | Lyra **source** — 457 `LyraGame` C++ files across 26 subsystems | sparse `blob:none`, 101 MB | no | `STRUCTURALLY_VERIFIED` |
| `anti-hero-game-studio/LyraStarterGame_FPS` | `af1c7af8` | UE 5.0 | fork of Lyra | Lyra **content** — 9,624 `.uasset`, 13 `.umap`, 31 ABPs, 5 Control Rigs, 3 IK Rigs | `tree:0` metadata probe, 1.4 MB | fork, FPS-modified | `STRUCTURALLY_VERIFIED` |

## Probed and rejected

| Source | Why rejected |
| --- | --- |
| `GroundZero-Divine/LyraProject` | 48 files, 4 `.uasset`. Not a content source. |

## Already in the repository (pre-existing, recorded for completeness)

`native/ThirdParty` carries pinned git submodules — **JoltPhysics, GGPO,
llama.cpp**. An earlier pass wrongly reported these as empty directories; they
are submodules and populate with `git submodule update --init --recursive`
(measured: 1,251 files, `Jolt/Jolt.h` present). Recorded here so that mistake is
not repeated.

## Candidate sources, identified and NOT yet acquired

Named so the next pass starts from a list rather than a search. None of these has
been fetched, read, or verified — they are leads.

| Domain | Candidate | Why |
| --- | --- | --- |
| Rollback netcode | GGPO | already a submodule; unwired in `unreal/` |
| Physics | Jolt | already a submodule; Bannon's laws sit above it |
| Retargeting | Lyra `IK_Mannequin` / `ABP_*_Retarget` | acquired above; the path for Bannon's 182 mapped FBX clips |
| Foot IK | Lyra `CR_Mannequin_FootPlant` | acquired above |
| Paired grapple animation | Lyra 5.8 `ContextualAnimation` | acquired above (source); strongest reason to target 5.8 |
| Motion capture | CMU MoCap, Mixamo, Truebones CC0 | already the recorded ship-safe bulk sources |

## Rules this ledger enforces

1. Every entry records upstream, commit, version, purpose, mode, modified status, and verification state.
2. A source is not "integrated" because it is cloned. It is `STRUCTURALLY_VERIFIED` until something compiles or runs.
3. A fork is recorded as a fork. `LyraStarterGame_FPS` is FPS-modified and carries `_DEV/DontAdd` and `Temp/DontAddThisShit` directories that must not be treated as stock Lyra.
