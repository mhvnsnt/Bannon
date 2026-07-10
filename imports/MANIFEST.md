# imports/ — folded-in projects (added as organized modules; wire in as needed)

- **modly/** — Modly: open-source image/model generation project (Tripo/Meshy-style). Aligns with the
  BANNON self-hosted gen pipeline (gen_selfhosted_server.mjs + Hunyuan3D notebook). Its api/ has the 3D
  post-processing (uv_unwrapper, texture_baker) reference. Windows build .obj artifacts stripped.
- **kinetic-sandbox/**, **kinetic-sandbox-v2/** — Vite/React/TS physics sandbox (HardCylinder etc.).
  v2 is the newer remix. Reference for physics interaction UX; concepts port to the native engine, not
  the web HTML directly.
- **m-craft/**, **m-craft-v2/** — Vite/React/TS model creator (ModelViewer). Reference for the in-app
  model authoring/preview UX; overlaps the MODEL FORGE viewer already in the engine.
- **bannonengine/** — AI-Studio (Gemini) scaffolded **Android/Kotlin + Jetpack Compose** app titled
  "Bannon Engine — AAA combat depth and physics-driven grapple solvers." Boilerplate scaffold
  (MainActivity/Compose theme/GeminiApiService + tests). Reference for the NATIVE app direction as the
  engine moves off Three.js toward the AAA C++/native tier — the game logic (MAX_HP, DMG_SCALE,
  poise-driven crumple, grapple solver) ports 1:1; this is a starting shell, not the physics core.

## codedummy — UN-ICED (was mistakenly excluded)
codedummy is being integrated, NOT on ice — that was an over-inference and is corrected. The **full
codedummy zip is being added via desktop** (this channel has a 30 MB limit). Differentiation convention
so the two do not get confused:
  - **CODEDUMMY (standalone repo, mhvnsnt/CODEDUMMY)** — the source of truth for the God-Mode OS /
    codedummy app; synced via `.sync_hash_CODEDUMMY` + `repos_config.json`.
  - **In-Bannon CODEDUMMY integration layer** — files that live in Bannon and consume codedummy:
    `src/components/CodedummyLoader.tsx`, `docs/CODEDUMMY_capability_spec.md`,
    `docs/CODEDUMMY_merge_safety.md`, `supabase/migrations/*_codedummy_*.sql`.
  - **`imports/codedummy/`** (lands with the desktop zip) — the vendored snapshot of the CODEDUMMY repo
    kept inside Bannon for reference; the same content is pushed to BOTH repos. README in that folder
    will state its provenance so it is never mistaken for the standalone repo.

These are standalone apps kept for reference/integration; specific parts get wired into the engine or
native stack surgically when called for, not bulk-ported.
