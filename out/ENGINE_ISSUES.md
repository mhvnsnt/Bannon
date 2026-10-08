# Engine-Side Issues (NOT model-side — do not fix in the GLBs)

These defects live in the engine retarget / game code, not in the character models.
My track covered the model side only.

## 1. Retarget arm-aim bug — `_aimLocal` (BANNON_v150.html ~14508-14556)
From `tools/model_diag/README.md` (measured 2026-07-18 via `objcheck.cjs` + pwtest harness):
the procedural fight rig is the yardstick; a correct bind puts both hands forward of the
chest (guard), LeftHand +Z / RightHand −Z, feet grounded at ±Z. Measured on BANNON_rigged:
**RightHand driven BEHIND the body** (x=−2.29 vs chest −2.16) while LeftHand thrust forward
(x=−1.71), Z collapsed to center — reversed/asymmetric guard. Fix target is the arm branch
of `_aimLocal`/the retarget, validated by re-running objcheck until GLB bones match the
procedural reference. **Not reproducible from my side**: objcheck needs the Playwright
harness (Chromium install stalled in this environment); I did not re-verify.

## 2. Foot mesh not deforming with foot bones
Same README finding: feet geometry present (mesh reaches y~0, foot bones at correct ±Z)
but the foot MESH isn't deforming with the bones. Bind/retarget-side, not a weight defect.

## 3. Engine fit-to-1.78m reads the BONE span
Per `tools/model_diag/rescale_mesh.cjs` header: the engine normalizes characters by bone
span. A GLB whose mesh and skeleton disagree on scale (e.g. post-transfer before rescale)
renders at the wrong size and tears under physics (joint positions are in metres, not
scale-free). **My repaired transfer outputs are bone/mesh-consistent** (mesh baked into
donor bind space before transfer); no rescale needed afterwards. Anyone re-running
`transfer_weights.cjs` on a differently-scaled target MUST normalize first
(`normalize_to_donor.cjs` pattern) or run `rescale_mesh.cjs` after.

## 4. `transfer_weights.cjs` drops `EXT_texture_webp` from extensionsUsed (tool bug)
Found during this program: the tool copies texture JSON (which references
`EXT_texture_webp`) but writes no `extensionsUsed`/`extensionsRequired`, so strict
glTF readers (e.g. @gltf-transform) fail the file. Three.js is lenient here, but the
output is spec-invalid. I patched all my `out/*_repaired.glb` (re-added the declaration).
**The tool itself should be fixed** (one-line: preserve webp in extensionsUsed).

## 5. Nameplate canon-data bug — PLACEHOLDER TEXT POLICY (owner directive, binding)
The El Toro de Oro entrance video renders "HOMETOWN: [PLACEHOLDER - NOT IN CANON]".
Canon data issue. Owner rule: **no deliverable (video, card, commercial) may ever render
placeholder / "not in canon" / TODO-style text.** If billing info (hometown etc.) is missing
from canon: **ASK THE OWNER first**; if you cannot ask, default to **"parts unknown"**
(wrestling tradition). Owner suggested El Toro de Oro could be billed from Spain (e.g.
Pamplona, city of the bull runs) — **treat as UNCONFIRMED until he locks it**.

## 6. Non-issues confirmed
- Video's dark opening ~5 s: DELIBERATE dramatic effect (dark brooding matador in an
  underground library; rim-light reflections) — owner says do NOT flag lighting as a defect.
- Blobby hands/fingers on El Toro (frame_06): low-poly hand GEOMETRY — weights can't fix;
  needs denser hand mesh or finger-bone-aware remodel (Repo Co Dev mesh track). Finger bones
  exist and are weighted (see QA_BASELINE.md §QA checks); the gap is geometry, not rigging.
- Shoulder/deltoid pinching (video frames 6–7): owner-confirmed TOP priority defect family —
  weird twisting where shoulders/chest/pecs connect; expect similar small-joint issues across
  many models. Weights improved it on El Toro (p95 0.0206 → 0.0140, spikes −33%); the
  remainder is the mesh-bridge family (see QA_AFTER.md). Keep shoulder deformation at the
  top of every QA pass.
- Brutal Fist assets: intentionally PS1-style low-poly — do NOT "fix" as defects.
