# imports/ — folded-in projects (added as organized modules; wire in as needed)

- **modly/** — Modly: open-source image/model generation project (Tripo/Meshy-style). Aligns with the
  BANNON self-hosted gen pipeline (gen_selfhosted_server.mjs + Hunyuan3D notebook). Its api/ has the 3D
  post-processing (uv_unwrapper, texture_baker) reference. Windows build .obj artifacts stripped.
- **kinetic-sandbox/** — Vite/React/TS physics sandbox (HardCylinder etc.). Reference for physics
  interaction UX; concepts port to the native engine, not the web HTML directly.
- **m-craft/** — Vite/React/TS model creator (ModelViewer). Reference for the in-app model
  authoring/preview UX; overlaps the MODEL FORGE viewer already in the engine.

codedummy was intentionally left out (on ice). These are standalone apps kept for reference/integration;
specific parts get wired into the engine or native stack surgically when called for, not bulk-ported.
