# AGENTS.md — Statue-to-Game Agent Runbook

This is the executable companion to `PIPELINE.md` (the owner-facing checklist).
Any worker can run the full chain by following these steps in order. Do not skip
steps. Do not claim a stage is done without the evidence named in its
"Evidence" line.

Environment: Blender 4.0.2 headless at
`~/workspace/tools/blender/blender-4.0.2-linux-x64/blender`.
Always run it as `env -u PYTHONPATH <blender> -b --python <script> -- <args>`
(the `env -u PYTHONPATH` avoids the system-numpy conflict — see `~/TOOLS.md`).

Branch rule: all work on a feature branch, commit incrementally, push, open a
PR. Never push to main. Never overwrite the owner's source statue file.

---

## STAGE 0 — DIAGNOSE (mandatory, before any repair)

Run the diagnostic suite FIRST — no rig/mesh repair attempt runs without it
(diagnose-before-repair law, owner 2026-10-09):
```
env -u PYTHONPATH ~/workspace/tools/blender/blender-4.0.2-linux-x64/blender -b \
  --python tools/rig-repair/diagnose_rig.py -- \
  --glb <input.glb> --json /tmp/diag.json
```
The suite reports rest-pose angles, skeleton sanity, weight-bleed detection,
severed-mesh check, and a plain-language diagnosis. The repair plan must
address what it finds before any weights get touched.
- Evidence: `/tmp/diag.json` + the printed DIAG lines.
- If the file is already T-pose with clean weights, skip to STAGE 8 (verify).

## STAGE 0b — RECEIVE

- Input: owner drops a Tripo export (`.glb` or `.obj`) into
  `assets/models/intake/<character>_statue.<ext>`. Never rename or move it.
- Write a checkpoint FIRST (`~/workspace/agent-ops/ckpt.sh`) with a complete
  `resume_brief`, heartbeat every 15 min, per the checkpoint-first law.

## STAGE 1 — INTAKE

Run:
```
env -u PYTHONPATH ~/workspace/tools/blender/blender-4.0.2-linux-x64/blender -b \
  --python tools/statue-to-game/mesh_intake_check.py -- \
  --input assets/models/intake/<character>_statue.glb \
  --json /tmp/intake_<character>.json \
  --target-height <canon height, default 1.88>
```
- Evidence: `/tmp/intake_<character>.json` + the printed summary.
- Decision:
  - `rig.state == ALREADY_RIGGED` → skip to STAGE 4 (verify the existing rig).
  - `pose.verdict == ASYMMETRIC_OR_POSED?` → STOP and report to parent. The
    statue must be re-posed to neutral standing before auto-rigging. Do NOT
    attempt to auto-rig a posed statue.
  - `scale.verdict == RESCALE_NEEDED` → note the factor for STAGE 2.

## STAGE 2 — CLEANUP (Blender headless, scripted)

Write a one-off bpy script (commit it under `tools/statue-to-game/`) that:
1. Imports the statue.
2. Applies `scale_factor_needed` from the intake JSON (uniform scale).
3. Moves the mesh so the lowest point sits at z=0.
4. If triangles > 60000: add a Decimate modifier (ratio = 25000/tris, planar
   mode off) and apply — record before/after counts.
5. Exports to `assets/models/work/<character>_clean.glb`.
- Evidence: re-run the intake checker on the clean file; `scale.verdict == OK`.

## STAGE 3 — AUTO-RIG

Three options, in preference order. Document which one you used and why.

### Option A — Mixamo auto-rigger (best free quality)
- Requires an Adobe account. **There is no public API** — this step is
  interactive: upload `work/<character>_clean.glb` (or OBJ) to mixamo.com in a
  T-pose/A-pose, place the chin/wrist/ankle/elbow/knee/groin markers, download
  the rigged FBX. An agent cannot do this headlessly; either the owner does the
  clicking or a browser-task worker does.
- Convert FBX → GLB (Blender headless import/export), save as
  `assets/models/work/<character>_rigged.glb`.

### Option B — AccuRIG (Reallusion, free)
- Requires a Reallusion account + the desktop app. Same interactivity caveat as
  Mixamo. Output → convert → `work/<character>_rigged.glb`.

### Option C — Rigify, fully agent-runnable (fallback, no accounts, no clicking)
- Headless bpy: import clean mesh, add Rigify human meta-rig, scale/position it
  to match the mesh (pelvis at hips, etc.), generate the rig, parent mesh with
  automatic weights.
- Honest caveat: meta-rig fitting is approximate; expect more weight cleanup in
  STAGE 5 than with Option A.
- Output: `work/<character>_rigged.glb`.

- Evidence: intake checker on the rigged file shows `ALREADY_RIGGED` with
  bone count ≥ 40.

## STAGE 4 — SKINNING (auto-weights, agent-runnable)

Headless bpy on the rigged file:
1. Select mesh + armature → `bpy.ops.paint.weight_from_bones(type='AUTOMATIC')`.
2. `bpy.ops.object.vertex_group_normalize_all()` — every vert sums to 1.0.
3. `bpy.ops.object.vertex_group_smooth()` ×2 on deform groups (factor 0.5).
4. Mirror check: if left/right bone pairs exist, mirror weights from the better
   side.
5. Save as `assets/models/work/<character>_skinned.glb`.
- Evidence: `verify_character.py` G3 passes on the skinned file.

## STAGE 5 — PROBE (agent-runnable) → PAINT (owner, only if flagged)

Run the verifier (STAGE 8's script) on the skinned file and read gate G4:
- **G4 PASSES** → skip painting entirely, go to STAGE 6.
- **G4 FAILS** → this is the owner's stage. Do NOT attempt more algorithmic
  repaints (six were tried on Stick-Up and all failed — see
  `tools/rig-repair/REPORT.md`). Instead:
  1. Note the failing angles from the report's `per_angle` data.
  2. Hand the owner: the PWA link + the GLB + the failing angles. The PWA's
     guided mode highlights the webbing verts and walks them through the fix.
  3. When the owner returns a painted GLB, place it at
     `work/<character>_painted.glb` and re-run the verifier. G4 must pass
     before continuing. If it still fails, hand it back with the new numbers —
     never ship a failing G4.

## STAGE 6 — ANIMATION (agent-runnable)

1. Pick clips — free sources, all verified in
   `tools/statue-to-game/INTEGRATIONS.md`:
   - Mixamo library (free, Adobe account) — boxing/karate for fighters,
     walks/idles for entrances.
   - **CMU BVH mirror** (free, no account — preferred for locomotion): agent
     fetches directly:
     ```
     python3 tools/statue-to-game/fetch_mocap.py --sample \
         --out assets/models/mocap/
     ```
     (downloads subject 001 clip `01_01.bvh`, a walk cycle, and runs a BVH
     structure check). Use `--list --subject <nnn>` to browse other clips.
   - **Quaternius Universal Animation Library** (CC0, no account) — alternative
     retargetable humanoid clips. Download the pack zip from quaternius.com,
     unzip, import the glTF into Blender headless.
   - **Kenney Animated Characters** (CC0, no account) — same flow, kenney.nl.
   - **PoseTrak** (Apache-2.0, no account) — custom-taunt input: the owner
     films the taunt on his phone; agent runs `posetrak track config.toml`
     on the footage and retargets the tracked skeleton onto the character.
     No packaged release yet — build from source per `docs/setup.md` in the
     PoseTrak repo; confirm export format feeds the retarget step before
     planning a run around it.
2. Retarget — two methods, in preference order:
   - **Rokoko Studio Live Blender addon** (LGPL-3.0, free, no account; the
     retarget panel works fully offline in Blender — no Studio app, no
     hardware). Install into headless Blender 4.0.2 (Blender 2.80+ supported):
     import source clip armature + character armature, run the retarget
     panel's "Build Bone List" → "Auto Detect" → "Retarget Animation" flow in
     a bpy script, save the preset for reuse across same-rig characters.
     Wire-up not yet done in our Blender — first use must install and smoke
     test the addon headless before trusting it in a run.
   - **Pure-bpy constraint-bake** (fallback, works today): per-bone Copy
     Rotation constraints from the source armature to the character rig using
     a versioned bone-map dict, then `bpy.ops.nla.bake()`.
     (See `docs/AI_RIGGING_RESEARCH.md` Part 1C.)
3. Save each baked clip; render a 3-second preview per clip.
- Evidence: preview renders show the character performing the clip with no
  detached limbs or inverted joints.

## STAGE 7 — EXPORT (agent-runnable)

Headless bpy: import the rigged+animated working file, apply rest pose,
`bpy.ops.export_scene.gltf()` with:
- `export_format='GLB'`, `export_yup=True`, `export_apply=True`,
- `export_skins=True`, `export_morph=True` (corrective shape keys if any),
- textures embedded.
Output: `assets/models/<character>_v1.glb` (the game artifact).
- Evidence: file loads in a clean Blender session with armature + weights +
  textures intact (re-run the intake checker on it).

## STAGE 8 — VERIFY (agent-runnable)

```
env -u PYTHONPATH ~/workspace/tools/blender/blender-4.0.2-linux-x64/blender -b \
  --python tools/statue-to-game/verify_character.py -- \
  --input assets/models/<character>_v1.glb \
  --json /tmp/verify_<character>.json
```
- Exit 0 = all gates PASS (WARNs allowed). Exit 1 = FAIL.
- Gate G4 details: arms posed at 15/30/45/60/90° forward + lateral, both arms;
  worst-triangle stretch in the shoulder region must be < 3.0x at every angle.
  The metric is stricter than the eyeball — it catches sub-visual
  discontinuities at small angles that become visible webbing at large angles.
  If a visually-clean paint job fails G4, recalibrate the threshold against the
  per-angle curve and document the change here — do not silently loosen it.
- Evidence: `/tmp/verify_<character>.json` + printed report card.

## STAGE 9 — DELIVER

1. Commit everything incrementally on the branch; push; open the PR
   (branch → PR, never direct to main).
2. Assemble the owner packet: the report card, a turntable render, one animation
   preview, the GLB path + SHA.
3. Report to parent: PR link + `VERIFY PASSED` output. The parent shows the
   owner; nothing reaches the owner without the parent's own verification.

---

## Standing rules for this pipeline

- The owner's source statue is never modified. All work happens on copies under
  `assets/models/work/`.
- A worker's "verified" is a claim. The report card JSON is the evidence.
- Six algorithmic shoulder repaints already failed on Stick-Up
  (`tools/rig-repair/REPORT.md`). Do not retry blind algorithmic repainting —
  flag for the owner's paint pass instead.
- Mixamo/AccuRIG have no public API. Never claim an agent "ran Mixamo" — say
  who clicked (owner or browser worker).
