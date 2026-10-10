# BANNON Character Customizer — the 7-item suite (Phase 2 port)

Ported from AshLanev2's Phase 1 suite (PRs #24/#26/#29 + pendant fix a6162b58),
adapted to Bannon's engine (plain global script, three.js r128). Implementation:
`bannon_customizer.js` (additive — loads after the engine via the script tag at
the end of `index.html`). Assets: `assets/customizer/` (40 accessory entries +
12 face-paint patterns). Menu: "🎨 CUSTOMIZE" tile in the main menu's CREATION
SUITE hub (+ `CUSTOMIZE` entry in the `bannon_ui_controller.html` dock).

## What already existed (NOT duplicated — the suite merges with these)

| Existing system | File | What it does | Suite relationship |
|---|---|---|---|
| CharacterForge `Attire` | `CharacterForge.ts` | CAW data spec: gearStyle, colors, boots, pads, wrists, facePaint string | **EXTENDED** with optional suite fields (mask, gloves, wristbands, shoes, hood, chain, hairstyle, eyeColor, morphs). No parallel model. |
| `BANNON_DNA` capture/apply | `index.html` | CAW "DNA payload" recipe: morphs, boneScale, palette, model URL, gnmFace | **EXTENDED**: recipe now carries the customizer build (`customizer` field, keyed by fighter name); apply stashes it on `f._customBuild` for the bind path. 6 surgical lines, additive. |
| `window.__boneOf` / `__buildBoneNorm` | `index.html` (rig-hardening lane) | Bone-name resolution across mixamorig/J_/UniRig conventions | **REUSED**: the suite's `findBone()` calls `window.__boneOf` first; the preview builds `userData.boneByName` so the engine resolver works there too. Not reimplemented. |
| `window.ATTIRE` + `bannon_attire_defaults.js` | repo root | Non-canon roster GLB defaults (TITAN/VIPER/GOLEM/RONIN/ZEPHYR) | **Untouched.** The suite stores per-fighter builds separately (`bannon:customizer:builds`). |
| `window.applyAttire` / `window.applyHair` | `index.html` | Procedural-body attire (fabric material swaps) + hair-sphere styles | **Untouched.** The suite is the GLB-attachment lane for banked models; procedural systems keep working. |
| `_bindFighterGltf` | `index.html` | GLB bind path (orientation normalize, bone index, applyShapeMorphs) | **Wrapped** (repo-conventional monkeypatch): applies the saved build after bind. Original behavior preserved; every step guarded. |
| ATTIRE / MODEL FORGE dock | `bannon_ui_controller.html` | Menu dock entries | **Extended** with a `CUSTOMIZE` entry (additive row + `fn` handler). |

## What the suite adds (the 7 items)

1. **Chain pendant orientation fix** — the 4 FIXED chain GLBs
   (pendant baked vertical per a6162b58). **Render-verified 2026-10-09 on
   Bannon's CIPHER_rigged.glb AND AshLanev2's ASTRID.glb (same code, same
   byte-identical GLB):** the chain attaches at the Neck, renders (fixed a
   frustum-culling bug that made skinned accessories invisible), and the
   manifest `attach.rotation` knob now actually affects skinned accessories
   (it was dead — the bind math cancelled the holder transform; fixed by
   injecting the holder rotation into the bind inverses). **Known limitation
   (upstream design, not a port bug):** the authored chain is a 0.9m oval
   drape — it hangs to the waist on 1.5–1.8m fighters, and its 3D spread
   means a +90° Y facing correction (to put the pendant on the chest of
   Bannon's +X-facing rigs) trades a side-drape for an overhead antenna, so
   no per-fighter chain rotation is applied. Matches AshLanev2's own
   reference renders. If the owner wants a shorter/front-corrected chain,
   tune `SLOT_ROTFIX` in `bannon_customizer.js` (the knob now works).
   (`assets/customizer/chains/`, pendant baked vertical per a6162b58) +
   per-rig rotation knob (`attach.rotation` / `rotFix`). Bone: `Neck`, scale 0.15.
2. **Masks** — 7 GLBs (`assets/customizer/masks/` + manifest). ⚠ `mask_hollow_superdragon`
   carries the lane's likeness flag (does not match the Super Dragon look — owner
   correction 2026-10-06 requires the Super Dragon version); badged in the UI.
3. **Gloves / wrist pads / shoes / hoods** — 8+6+8+2 GLBs with manifests;
   L/R pairs group into single selections.
4. **Face paint system** — raycast-conformed decal overlay (28×30 grid, +2mm,
   rigidly head-bone-weighted, own CanvasTexture). **Base mesh/material/texture
   are never written — skin-tone likeness lock is structural.** 12 patterns,
   6 regions, 3 canon-locked presets (cipher-grin, onyx-clown, echo-stitched),
   custom layer builder. Per-fighter profiles are **verified-gated**:
   `FACE_PAINT_PROFILES[].verified` — Bannon's GLBs are different builds from
   AshLanev2's (hash-verified 2026-10-09), so the carried faceDirs stay disabled
   until the Blender face-direction QC flips them.
5. **Hairstyles** — 5 hair GLBs (`assets/customizer/hair/`) with per-character
   head fit (`HEAD_FIT`, measured on Bannon's GLBs 2026-10-09: hollow/echo/
   static/onyx/bannon/cain_elias/stick_up 0.4460, cipher 0.5360 vs ASTRID
   1.5232m). ECHO nudge carried as a flagged estimate — verify visually.
6. **Eye color customization** — 12-color iris palette, dedicated iris-material
   clone + procedural iris texture. **Measured 2026-10-09: none of the 8
   surveyed banked Bannon GLBs has a dedicated iris material** (single
   `tripo_mat_*`) — the palette honestly disables on all of them today and
   lights up automatically on any future model that ships iris materials.
   Skin is never tinted.
7. **In-menu customizer** — main menu → CREATION SUITE → 🎨 CUSTOMIZE:
   fighter picker (canon ★ first), live zoomable 3D preview on the REAL roster
   GLB (studio lighting, drag-orbit, wheel/pinch zoom, dbl-click reset, idle
   turntable), every control applies live, per-fighter save
   (`bannon:customizer:builds` + backup, versioned), Reset, JSON export.
   Saved builds apply to fight models automatically via the bind hook.

## Bone conventions (measured 2026-10-09, brief item 3)

All 8 surveyed banked GLBs (`BANNON_rigged`, `CIPHER_rigged`, `ONYX_skinned`,
`ECHO`, `STATIC`, `HOLLOW`, `CAIN_ELIAS_gear`, `STICKUP`) are skinned
`mixamorig:` skeletons (52–58 joints) — no 0-bone Tripo models in the banked
set. Every accessory slot resolves: Head, Neck/Spine2, LeftHand/RightHand
(exact), LeftForeArm/RightForeArm, LeftFoot/RightFoot/ToeBase. `BANNON_rigged`
carries 6 leftover `bone_N` UniRig joints — harmless (never match accessory
bones; the rebind fuzzy map ignores them). Morph dials offered per model by
`supportedMorphs()`: muscle/height/build on all 8; jaw disabled (no jaw bones).

## Fight-side application

`hookFightBind()` wraps `_bindFighterGltf`: after bind, loads the saved build
(`loadBuildSync(key)` → DNA-stashed `f._customBuild` fallback) and applies it
via `applyBuildToRoot(root, build, fighterId, forFight=true)`. Fight-side
skips `reground()` (the engine owns fighter placement). Morphs snapshot
post-DNA bone scales as base. Everything is try/caught — a failed apply can
never break a match.

## QC status

- `node --check bannon_customizer.js` clean.
- Bone/attach validation: `/tmp/bone_inspect.py` + `/tmp/head_height.py` runs
  2026-10-09 (see commit message for numbers).
- Face-paint profiles: `verified:false` until Blender face-direction renders
  confirm nose direction per Bannon GLB — then flip + re-QC.
- Visual proof frames: Blender headless renders (chain on BANNON, mask on
  HOLLOW, paint on CIPHER) — attached to the PR.

## Files

- `bannon_customizer.js` — the suite (this doc's implementation)
- `assets/customizer/{chains,masks,hair,hoods,gloves,wristbands,footwear}/` — GLBs + manifests
- `assets/customizer/facepaint/` — 12 pattern PNGs
- `docs/CUSTOMIZER.md` — this file
