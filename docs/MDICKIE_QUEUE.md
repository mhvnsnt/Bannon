# MDickie integration — live queue (owner priority order, 2026-07-20)

Done this session (all committed + pushed to branch + main):
1. **UniRig kickoff** — `tools/unirig/batch_rerig.py --fails` (hosted jasongzy/UniRig). Self-QAs
   (rejects degenerate <16-joint rigs). Re-run any time; resumable (skips existing `_rigged.glb`).
   Committed so far: BANNON, CIPHER. The HF space intermittently refuses connections — just re-launch.
2. **Steel cage door** — fixed (shared fence frame, all 4 walls flush to apron).
3. **Hard Time III + Infinite Lives** — confirmed Unity (not .zf3d). `tools/mdickie_scraper/
   unity_extract.py` (UnityPy → GLB, `--go` = textured GameObject export). Catalogs in
   `assets/mdickie_extracted/{infinite_lives,hard_time_iii}_catalog.json`.
   ⚠ NOTE: AI-Studio clobbered `unity_extract.py` with a mock stub in a main commit — the REAL tool
   is at git rev `fb032eb:tools/mdickie_scraper/unity_extract.py` + the `--go` additions in a later
   commit. Restore it before running: `git show <rev>:tools/mdickie_scraper/unity_extract.py`.
4. **Moves/mocap resolution fix** — mapped moves that play their clip went 5/140 → 140/140
   (casing alias + complete `assets/mocap/drive_manifest.json`, CDN fallback).
5. **Proprietary per-promotion ring identity** — `PROMO_VIBES` (corrected owner mapping), generated
   apron-skirt branding (`_makeApronCanvas`), tron taglines, per-vibe mood lighting.
   Also: textured MDickie city/jail wired into God Within roam (CITY tiles the town block, JAIL = The Yard).

## #6 — MDickie character models → proprietary attire bases (NEXT)
Owner: use MDickie character models as ATTIRE BASES for our roster, progressively morphed away from
MDickie's look. NEVER real-wrestler names. Map parody/real-wrestler archetypes to OUR canon:
Kane-type → Vain Abel, Jericho-type → Judas Messiah, Batista-type → El Toro, etc (see CLAUDE.md cast).
Keep the BIG high-quality owner weapon GLBs AND the lean MDickie props — BOTH (owner wants options).
Steps:
 - Restore the real `unity_extract.py` (see note above).
 - Character meshes: WR3D `costumes/models/*.zf3d` (9, use decode_zf3d.mjs) + Unity SkinnedMeshRenderers
   (54 each in HT3/IL — needs a SkinnedMesh export path added to unity_extract.py, currently mesh-only).
 - Rig via the UniRig batch, then bind as CHAR_ALTS attire slots (not new characters).
 - Bank to assets/models/attire/mdickie/, wire into CHAR_ALTS + the CAW attire picker.

## #7 — More mocap (QUEUED, after #6)
On top of the 140 clips now resolving:
 - **WR3D move anims**: `assets/anims/*.zf3d` + `anims/moves/*.zf3d` — `.animation` = float3x4 per-bone
   keyframes (decode_zf3d already reads float3x4). Needs a 144→rig joint map (see
   docs/mocap_orientation_master_prompt.md — BINDING) → STUDIO.clips format.
 - **Unity AnimationClips**: 92 per game (HT3/IL). Add a UnityPy AnimationClip → STUDIO.clips exporter.
 - Extend `assets/moves/move_clip_map.json` coverage as new clips land (auto_map_moves.cjs).
 - Legibility pass on top of the catalog (orientation master prompt first: verify up-vector/facing
   BEFORE magnitude).
