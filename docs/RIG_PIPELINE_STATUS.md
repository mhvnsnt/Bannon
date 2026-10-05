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

## Clip library (973 JSON, short-token procedural format)

- 510 clips: full 19-token vocab · 91: 20-token (+neck) · rest: 12–18 token subsets
- **298 clips are EMPTY (zero pose keys)** — 22 of them are REFERENCED by the move
  maps, including CHOKESLAM, SUPLEX, DDT, TOMBSTONE, GERMANSUPLEX, BRAINBUSTER,
  NECKBREAKER. A referenced-but-empty clip silently falls back to procedural
  posing = the marionette look. **This is the next fix.**
- 2 clips fail to parse.
- 45 refs have no file at all (includes garbage refs like `2026-07-27` —
  needs map cleanup).

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
