# CHARACTER PIPELINE — tooling map (2026-10-06)

The ingest→repair→package chain every character GLB passes through.
Lives in `~/workspace/api-wiring/` (shared kit) + `venv-charpipe`.
This is the product behind the Asset Doctor concept: pipeline reliability
IS the product.

## Stages

```
ingest_qc.py  →  repair/surgery  →  package_glb.sh  →  ship
   (gate)        mesh_surgery.py     gltf-transform
                 reunwrap.py         + gltfpack -cc (opt)
```

### 1. Ingest QC gate — `api-wiring/bin/ingest_qc.py`
Every GLB entering the pipeline gets checked. Verdicts: PASS / QUARANTINE / REJECT.
Catches: missing buffer data (the BANNON_muscular_skinned.glb 712KB disaster —
proven: gate flags `missing_buffer_bytes: 712596`), degenerate faces,
non-finite verts, empty JOINTS_0, missing external buffers. Non-watertight
and unwelded verts are warnings (normal for characters), not failures.

```
python3 api-wiring/bin/ingest_qc.py model.glb --out report.json --quarantine-dir ./quarantine
```

### 2. Surgical mesh ops — `api-wiring/bin/mesh_surgery.py` (Manifold, Apache-2.0)
- `split <in.glb> <prefix>` — connected-components split. Proven on Cain Elias
  gear: 78 parts. Use for: isolating/deleting the backwards-facing duplicate
  twin (Cain Elias job), splitting the 3-back-to-back Maime triangle into 3
  attires. Skinning/UVs preserved per part.
- `cut <in.glb> <mesh#> <nx> <ny> <nz> <off> <a.glb> <b.glb>` — Manifold plane
  cut into two watertight capped halves. GEOMETRY ONLY (new cut verts have no
  skinning) — re-skin after. Refuses non-manifold input instead of writing
  empty files.
- Use the venv: `api-wiring/venv-charpipe/bin/python`

### 3. UV re-unwrap — `api-wiring/bin/reunwrap.py` (xatlas, MIT)
Fresh 0–1 UV atlas for white/untextured models (Bannon, Cody gear, Maime,
Onyx corset queue). Original UVs noted in metadata; nothing destroyed.

### 4. Final packaging — `api-wiring/bin/package_glb.sh`
QC gate (refuses failures) → `gltf-transform optimize` (dedupe/prune/flatten)
→ optional `--compress` (etc1s textures) → optional `--meshopt`
(gltfpack -cc, 937KB→419KB proven, `gltf-transform validate` after).
NOTE: trimesh cannot decode meshopt buffers — QC runs before this step by design.

### 5. Animations — `api-wiring/anims/`
Quaternius Universal Animation Library (CC0, Mixamo replacement) → retarget to
the 58-bone skeleton. Fetch is click-gated on itch.io: `bin/fetch_quaternius.sh`
prints the harvester handoff; once the zip lands in `anims/incoming/`, ingest
(unzip → license receipt → QC every GLB → clip manifest) is automatic.
STAGED items: ROMP/MotionBERT video→BVH (`bin/stage_romp.sh --install` needs
torch ~2.5GB; stub `bin/video_to_bvh.py` ready).

### 6. Pose QA — `api-wiring/bin/pose_qa.py` + `render_tpose.py` (MediaPipe, Apache-2.0)
Headless Blender (Cycles CPU) renders the model front view — full arm reach in
frame per the T-pose rule, mid-grey backdrop for detector contrast — then
MediaPipe PoseLandmarker checks: person detected, torso present, head present,
structure not collapsed. Proven: El Toro render → PASS (33/33 keypoints,
0.983 mean visibility); non-person texture → FAIL. Shared with the AshLanev2
verification gate.

## Box quirks (2026-10-06)
- `/tmp` is a 100%-full 512MB tmpfs. ALL pip/npm work needs
  `TMPDIR=$HOME/workspace/tmp PIP_CACHE_DIR=$HOME/workspace/tmp/pip-cache`
  (npm: `NPM_CONFIG_CACHE=$HOME/workspace/tmp/npm-cache`).
- No system libEGL/libGLESv2 on the box (EEVEE headless + MediaPipe native need
  them). RESOLVED 2026-10-06 without root: Ubuntu debs dpkg-deb-extracted to
  `~/workspace/vendor/egl`; `pose_qa.py` self-bootstraps LD_LIBRARY_PATH.
  Blender renders use Cycles CPU regardless (EEVEE still can't init EGL here).
- venv: `api-wiring/venv-charpipe` (trimesh 5.1.1, manifold3d, xatlas,
  networkx, mediapipe 1.1.0, pyglet<2 unused).

## License posture
Prototype freely; audit before ship. All pipeline tools are permissive
(MIT/Apache-2.0/BSD/CC0) — see `api-wiring/LICENSE-MANIFEST.md`. GPL/AGPL
(PyMeshLab/Materialize) stay in repair-lane tooling only, never in shipped
game code.
