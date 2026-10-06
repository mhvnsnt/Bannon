# mesh/ — cleanup, LOD, optimization

- `mesh_doctor.py` — weld, degenerate removal, normal fix, hole fill, normalize.
  Emits a JSON report. **Caveat:** trimesh export drops skin/rig data — run on
  static meshes or pre-rig stages, never on a finished rigged character.
- `lod_chain.py` — LOD0/1/2. Backends tried in order: open3d (MIT) →
  fast-simplification (`pip install fast-simplification`). Refuses to run with
  no backend rather than shipping a bad LOD.
- `optimize_glb.sh` — gltf-transform (Apache-2.0) via npx: dedup, weld, prune,
  draco mesh compression, webp textures.

Complements (doesn't replace) the AshLanev2 `3d/postprocess.py` normalizer.
