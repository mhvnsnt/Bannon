# RIG PIPELINE STATUS — foundation audit & repair (2026-10-05)

Owner's #1 priority: rigs, skeletons, model animations. Characters must animate
correctly in the first place. No cosmetic work in this track.

## Canonical convention

**`mixamorig:`-prefixed 58-joint skeleton** (Mixamo lineage). This is what the
repaired roster uses and what the game's `BONE_MAP_EXACT` maps. Adapters for the
rest live in `BANNON_v150.html` (`BONE_MAP_EXACT` 19 rows, fuzzy `BONE_MAP`,
`BONE_MAP_OVERRIDES` for `jin`/`chunli`).

## Audit results (measured 2026-10-05, `glb_audit.cjs` over all 76 GLBs)

| Convention | Count | Notes |
|---|---|---|
| mixamorig 58-joint | 61 | canonical |
| mixamorig 52-joint | 1 | CIPHER_rigged (+ its repaired) |
| mixamorig 65-joint | 1 | xbot.glb (Mixamo reference, not roster) |
| bare 49-joint | 1 | wrestler_base.glb (template, not roster) |
| bare 46-joint | 1 | EDWIN_KENNEDY_unchained (missing spineChain/clavicles) |
| zero joints | 11 | raw sources / rigready intermediates — ALL have repaired counterparts |

## What was fixed this session

1. **Clip map normalisation** (`tools/moves/audit_clip_refs.cjs --fix`):
   `combat_clip_map.json`, `move_clip_map.json`, `roster_movesets.json` — 42 refs
   that silently 404'd (e.g. `GermanSuplex` vs `GERMANSUPLEX`) now resolve.
2. **Repaired roster promoted into the game**: 46 of 59 model URLs in
   `BANNON_v150.html` now point at QA-verified repaired GLBs
   (`*_repaired.glb`, plus plateau mesh-surgery `*_v2.glb` for TITAN, TITAN_white,
   CIPHER_feral, EDWIN_KENNEDY_unchained). Before this, the game loaded the
   UNREPAIRED originals — including 15-part zero-joint kits — while 55 repaired
   models sat unused in `bannon-repair/out/`.
3. **Plateau v2 promoted where strictly better**: TITAN (worst spike 122→23),
   TITAN_white (102→27), CIPHER_feral (257→24). EDWIN_KENNEDY_unchained_v2 is the
   best automated result (1062 vs 1199 spikes) but still needs Blender re-skin —
   flagged below.

## Clip library (973 JSON) — CORRECTED 2026-10-05 evening

Re-measured (the "298 empty" in the earlier audit was a misclassification):

- **673 clips: `mixamorig*` bone names** — map DIRECTLY to the canonical 58-joint
  skeletons via `window.__boneOf` (prefix strip). No retargeting needed.
- **298 clips: MDickie convention** (`J_*` joints, `F_*` facial, `N_*` prop/aim
  helpers, `Root`). `J_*` maps via the same `__boneOf` prefix-strip
  (`J_LeftArm`→`leftarm`→hit). `N_*`/`F_*` are prop/aim/facial helpers — safe
  to miss for body animation. **NOT empty:** CHOKESLAM has 24 keys/519 bones,
  SUPLEX 24/607, DDT 24/712.
- 2 clips truly empty (no keys). 45 refs have no file (garbage like
  `2026-07-27` — needs map cleanup).
- **Bone-convention unification (task #1) is DONE in the engine:**
  canonical = `mixamorig:` 58-joint; adapters = `__boneOf` + `__buildBoneNorm`
  + `BONE_MAP_EXACT` + `BONE_MAP` + `BONE_MAP_OVERRIDES` (all in
  `BANNON_v150.html`). No new adapter code needed — the gap was the clips
  never being mapped because the MODELS were wrong (zero-joint kits), not the
  clip format.

## Per-character status

| Character (roster URL) | Bones | Repair path | In-game proof |
|---|---|---|---|
| STICK-UP | 58 mixamorig | prune (0.0161→0.0112) | PENDING smoke |
| BANNON | 58 mixamorig | merge+transfer (was 15-part, 0 joints) | PENDING smoke |
| EL_TORO_DE_ORO | 58 mixamorig | prune (0.0206→0.0140) | PENDING smoke |
| VIPER | 58 mixamorig | already repaired content | PENDING smoke |
| TITAN | 58 mixamorig | plateau v2 mesh surgery | PENDING smoke |
| TITAN_white / TITAN_unmasked | 58 | v2 / prune | PENDING smoke |
| EDWIN_KENNEDY_unchained | 46 bare | v2 interim — **NEEDS Blender re-skin** (MANUAL_RECIPE.md) | PENDING smoke |
| BANNON_muscular (Heavyweight) | 58 mixamorig | **HELD**: roster mesh (12,519 verts) ≠ repaired mesh (14,775 verts); repaired/v2 are a different mesh — owner call | PENDING smoke |
| CODY_gear_skinned, ONYX_corset_skinned, TARZANIAN_DEVIL_skinned | 58 mixamorig | **HELD**: no same-mesh repaired counterpart; already canonical 58j | PENDING smoke |
| CIPHER_rigged (52j) | 52 mixamorig | prune (0.0238→0.0212) | PENDING smoke |
| All others (38) | 58 mixamorig | prune/transfer per QA_AFTER.md | PENDING smoke |

(Full QA numbers: `~/workspace/bannon-repair/out/QA_AFTER.md`. Full audit JSON:
`/tmp/glb_audit_models.json`, `/tmp/glb_audit_repair.json`. Promote plan:
`/tmp/promote_final.json`.)

## In-game proof (2026-10-05 evening — measured, not claimed)

**Sandbox harness reality:** `tools/harness/smoke.cjs` cannot boot here —
Playwright's bundled Chromium path is wrong (`/opt/pw-browsers/chromium-1194/`
exists but the harness hardcodes a different layout), and the full game needs
external hosts (`raw.githubusercontent.com`, `esm.sh`, `fonts.googleapis.com`)
that hang in this sandbox, so `domcontentloaded` never fires without request
interception. The teardown (`~/workspace/bannon-teardown/`) hit the same wall
and solved it with interception (~95s boot).

**What was proven with a custom interception probe (this session):**
- Game boots to menu in ~89s. Screenshot `/tmp/bannon_boot4.png`: menu renders,
  KayKit crowd visible in the arena background (convergence import #1 working).
- Attract mode auto-starts BANNON vs VIPER ("ROUND 1" HUD).
- **BLOCKER for fight screenshots:** at 0 FPS under SwiftShader the page goes
  unresponsive after menu; `page.evaluate` stops returning. Fight-capture probe
  (`/tmp/probe_proof.cjs`, KayKit stripped from a /tmp copy — committed file
  untouched) is running; shots land in `/tmp/proof_fight_*.png` if the attract
  fight renders.
- All 46 promoted GLBs pass GLB 2.0 header validation (magic `glTF`, version 2,
  length matches).

**Per-character proof status:** method proven for the build; per-character
screenshots pending a faster harness or GPU. The "In-game proof" column stays
PENDING until pixels exist.

## Still broken / next steps

1. **22 referenced-but-empty clips** (CHOKESLAM, SUPLEX, DDT, TOMBSTONE, …) —
   rebuild from the Quaternius 50-clip CC0 wrestling bank (convergence plan
   import #4) or `gen_procedural_clips.cjs`; then re-run `audit_clip_refs --gate`.
2. **45 missing clip refs** — clean garbage refs (`2026-07-27`, prose strings)
   out of the maps.
3. **Blender track** (Repo Co Dev lane): EDWIN_KENNEDY_unchained re-skin per
   `out/plateau/MANUAL_RECIPE.md`; mesh-bridge family is topology, not weights.
4. **Per-character in-game proof**: smoke harness passes → per-character
   screenshot proof (this doc's "In-game proof" column).
5. **Other HTML builds** (`dist/BANNON.html`, `index.html`, `merged_…`,
   `app/…`, `godmode/…`) still point at old URLs — repoint or rebuild after
   the root build is proven.
