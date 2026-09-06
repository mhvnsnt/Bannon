# GNM head + Omniverse — fold-in notes (2026-07-20, from the owner's two askNK videos)

## Google GNM Head — INTEGRATED (the authored-face layer DNA-CAW was missing)
- **What**: google/GNM (Apache 2.0 — commercial-safe) — scan-learned parametric 3D head:
  17,821 verts / 35,324 tris (skin + eyes + teeth + tongue), 253 identity PCA components,
  383 expression components, 4 joints (neck/head/eyes), UVs + textures. The npz IS the model —
  runs pure NumPy on CPU, no GPU, no external service.
- **What we built**: `tools/gnm/export_head.py` bakes the npz into
  `assets/models/face/gnm_head.glb` (9.1MB): base head + **38 glTF morph targets**
  (20 top-variance identity axes at 2σ + 10 lower-face / 6 eye-region / 2 tongue expressions),
  welded per-vertex UVs, computed normals, targetNames in mesh.extras (three.js
  morphTargetDictionary reads them). Sliders map to `morphTargetInfluences` — negative values
  give the −σ side of each axis, so one target per component covers the full range.
- **Verified**: loads in the vendored three.js r128 GLTFLoader headless; 38-entry
  morphTargetDictionary; max vertex delta 17.3mm (id axis 0) / 7.9mm (lower-face 0); rendered
  3 visibly distinct heads from slider values alone (pwtest/gnm_heads.png).
- **Why it matters**: MODEL GAP ANALYSIS #2 said our face = "primitive nose/mouth boxes + sphere
  eyes on a tube head" vs 2K's "50+ blendshapes". GNM Head is scan-grade with MORE controls than
  2K, free, commercial-safe, and already in the morph→slider architecture the engine uses.
- **NEXT bricks**: (1) CAW FACE tab driving the GNM head's influences + save into the DNA payload
  (`morphs.gnm_*` keys); (2) graft the head onto the wrestler base body (neck ring weld / scale to
  BODY.headSize); (3) GNM textures (data/textures) → skin-tone variants; (4) the semantic sampler
  (.h5, "happy"/"surprise", gender/ethnicity identity presets) for one-click faces; (5) more
  expression targets for the promo/dialogue system (CHAR_VOICE lip flap → real visemes).

## Nvidia Omniverse Enterprise — now free (owner-side tool, NOT sandbox-runnable)
- Omniverse needs an RTX GPU + desktop; it cannot run in this build sandbox. It slots into the
  OWNER's side of the pipeline (like Blender):
  - **Audio2Face**: audio → facial animation. Pairs directly with GNM Head expression targets +
    CHAR_VOICE/BANNON_DIALOGUE lines → animated promos. Export blendshape weights → our engine.
  - **Retargeting/machinima**: alternative to Auto-Rig Pro for retargeting the 202-clip FBX mocap
    library onto our rigs; USD round-trip to Blender.
  - **USD scenes**: arena/stage authoring if the owner prefers it over Blender.
- No code changes needed until the owner installs it; when he does, the export targets are:
  blendshape weight curves (JSON) for GNM heads, and FBX/GLB clips for STUDIO.

## UniRig fleet audit (same pass)
- VAST-AI/UniRig + Zhengyi/UniRig are DEAD (401) — removed from batch_rerig fallbacks.
- Live mirrors added: MohamedRashad/UniRig, monaverse/UniRig, MajorDaniel/UniRig, netw1z/UniRig.
- `_ordered_spaces()`: 6s HF-API probe per space ranks RUNNING first, sleeping/unknown second
  (connect wakes ZeroGPU), errored last — seconds of probing instead of 20-minute blind connects.
  `UNIRIG_SPACES=a/b,c/d` overrides the fleet.
