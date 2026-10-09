# Stick-Up Weight Paint PWA

Mobile-first web tool for hand-painting skin weights on `STICKUP_repaired.glb`.
Owner-directed 2026-10-09: automated shoulder repair failed 6x — this puts the
brush in his hand on his phone.

## Use (on phone)

1. Open the link. The model loads from the Bannon repo (`assets/models/STICKUP_repaired.glb`).
2. Pick a bone (shoulders/arms pinned at top). Heat view: red = full weight, blue = none.
3. Drag on the model to paint. Add/Remove, radius, strength controls.
4. Drag the **Angle** slider (0–90°) to pose-test the arm raise live. Fix what tears.
5. **Export GLB** → send the file back to the pipeline.

## Send-back loop

1. Export downloads `STICKUP_painted.glb` with new weights baked in.
2. Hand the file to the pipeline (chat attach or repo).
3. Pipeline runs `tools/rig-repair/probe_shoulders.py` — renders the painted weights
   at 15/30/45/60/90° to prove zero webbing.
4. Clean → lands as the new model via PR. Not clean → probe frames come back
   showing where it still tears.

## Tech

Single `index.html`, Three.js r160 (vendored in `lib/`), ES modules + importmap.
No build step. Painting edits `skinIndex`/`skinWeight` in place (bind pose),
renormalizes to sum 1.0, GLTFExporter writes the result.

## Self-test (2026-10-09, headless Chromium + SwiftShader, localhost)

- Load: 12,633 verts / 58 bones, renders correct heat view.
- Paint: real pointer stroke changed 558 verts (max delta 0.82) on LeftArm.
- Pose: slider drives `LeftArm.rotation.x` to −1.047 rad at 60°, visually confirmed.
- Export: GLB re-parsed — 32,348 weight components differ, all vert weight sums = 1.0.
