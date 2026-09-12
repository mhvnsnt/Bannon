# BANNON FORGE — the full blueprint: your own Tripo3D / Convert3D, free, no credit limits, in-game

**Goal (owner):** prompts + images + book research → one-of-one CAW characters, straight into the
arena. No subscription, no API credits, no per-generation fee. Better than Tripo3D / Convert3D
*for a physics game* (game-ready topology that won't shatter the collision constraints), all
in-engine, AAA-tier.

**The honest headline: ~80% of this already exists in the repo.** This doc is the map — what's
built, what each piece does, and the exact remaining steps. It is grounded in the real files, not a
wishlist.

---

## The three-machine architecture (why it's free with no limits)

Commercial tools charge because *they* own the GPU that runs the model. The whole trick to "free, no
credit limits" is: **you** own (rent by the second) the GPU, and run **open-weights** models on it.
You pay pennies-per-second of actual compute, and nothing when idle — no per-asset toll.

```
 ┌─────────────────┐   prompt/image    ┌──────────────────────┐  POST { prompt,image }  ┌────────────────────┐
 │  GAME (browser) │ ────────────────▶ │  DAEMON (Railway,CPU) │ ─────────────────────▶  │  FORGE (GPU host)  │
 │ BANNON_v150.html│                   │  CharacterModelGen.ts │                          │  forge_server/     │
 │ generateChar…() │ ◀──────────────── │  proxies, hides keys  │ ◀─────────────────────  │  open-weights + rig│
 └─────────────────┘   rigged .glb URL └──────────────────────┘   { status, glbUrl }     └────────────────────┘
        │  loadFighterModel() binds GLB to the fight rig; BANNON_DNA captures an editable recipe
        ▼
   arena / CAW panel
```

- **GAME** — `window.generateCharacterModel(prompt, opts)` (BANNON_v150.html): submit → poll →
  `loadFighterModel(side, glbUrl)` → `assignCharModel(key, url)` so it's THEIRS and persists.
- **DAEMON** — `CharacterModelGen.ts`: `self` provider hits **our** forge via `OWN_GEN_URL`; `meshy`
  / `tripo` are only fallbacks. Runs on Railway (CPU) so it's always-on and cheap; the API keys/URLs
  never touch the client.
- **FORGE** — `forge_server/app.py`: FastAPI. Open-weights text/image→3D + topology guard + auto-rig
  → serves a rigged `.glb`. Runs on a **GPU host you rent by the second** (Modal / RunPod / HF Space).

The **immutable physics laws stay in the engine, never in the generated asset** — a forged mesh is
pure geometry + texture, so it can never smuggle in a law-breaking value. DNA-CAW (`window.BANNON_DNA`)
then captures the result as a ~0.5 KB editable recipe (see `docs/DNA_SCHEMA.md`).

---

## Model stack (all open weights — the "no fee" engine room)

| Stage | Job | Open-weights options (pick one per stage) | In repo |
|-------|-----|-------------------------------------------|---------|
| Text→image | prompt/book → clean orthographic concept sheet | **FLUX.1-dev/schnell**, SD3.5, SDXL-Turbo | SDXL-Turbo wired in `gen_trellis` |
| Image→3D | concept sheet / **sketch** → textured mesh | **Hunyuan3D-2.1**, TRELLIS, TripoSG, Pixal3D-class | `gen_hunyuan`, `gen_trellis` |
| Text→3D | prompt → mesh directly (skip the image) | **Hunyuan3D-2** native text→3D | `gen_hunyuan` |
| **Topology** | weld + decimate to a physics-safe budget | **meshoptimizer / fast-simplification (quadric)** | ✅ **`post_process` (this pass)** |
| Auto-rig | drop humanoid skeleton + skin weights | **UniRig** (VAST-AI), or headless Blender + Auto-Rig Pro | `auto_rig` (UniRig) + `tools/blender/` |

**Recommended start:** `FORGE_BACKEND=hunyuan` (native text→3D + texture, one model, fewest moving
parts). Add the image path (below) so sketches/book art seed it. Swap in FLUX for the text→image step
when you want art-directed concept sheets before reconstruction.

Note on "Pixal3D": treat the named models as *interchangeable image→3D backends* behind the same
`gen_*` contract — whichever has the best open weights the week you deploy drops in as one function.
The architecture doesn't care which; that's the point.

---

## The autonomous loop ("read Chapter 3, generate the villain")

1. **Lore/prompt extraction** — an LLM (your daemon's model / Ollama `Bannon.Modelfile`) reads a book
   excerpt or a web-research blob and emits a hyper-specific character prompt (height, build, attire,
   palette, faction). *Gap — see checklist.*
2. **Concept sheet** *(optional)* — FLUX/SDXL renders a shadowless front/back T-pose sheet, OR you
   pass an existing **sketch** from `assets/reference/bannon_sketches/` directly as the `image` seed.
3. **Mesh synthesis** — Hunyuan3D-2 / TRELLIS reconstructs a textured mesh (~seconds on a 4090/A100).
4. **Topology guard** — `post_process`: weld coincident verts, drop degenerate/duplicate faces, fix
   winding, quadric-decimate to `FORGE_TARGET_TRIS` (15k). **This is the differentiator** — a 300–500k
   tri marketing mesh would drag the solver and shatter `MAX_BODY_VEL`; 15k clean tris deform properly
   on the fight skeleton.
5. **Auto-rig** — UniRig (or headless Blender + Auto-Rig Pro, `tools/blender/`) binds a humanoid
   skeleton (Mixamo names → the game's `BONE_MAP` already accepts them).
6. **Import + bind** — `generateCharacterModel` imports the `.glb`, `assignCharModel` persists it,
   `BANNON_DNA.capture` snapshots an editable recipe. Optionally push the `.glb` to storage
   (`CloudPersistence.ts` / Supabase bucket) + a roster row.

---

## Deploy (the "free / no credit limits" part, concretely)

- **Daemon** → Railway (CPU, always-on). Set `OWN_GEN_URL=https://<gpu-host>` (+ optional
  `OWN_GEN_KEY`). No Meshy/Tripo keys needed once `self` is up.
- **Forge** → a GPU host you control:
  - **Modal / RunPod serverless** — scale-to-zero: the container spins up on a request, generates,
    returns the GLB, and shuts down. You pay only for the seconds of GPU used. This is the "bypass
    token limits entirely" model.
  - **HF Space (ZeroGPU)** — quickest to stand up; duplicate a TRELLIS/Hunyuan space and point
    `OWN_GEN_URL` at it.
  - **Your own box / Vast.ai** — cheapest per-hour if you batch; best when you fine-tune on your art.
- **Cold-start note:** `CharacterModelGen` polls every 4 s up to ~6 min, so a serverless cold boot
  (model load) is already tolerated by the client. The stub backend lets you validate the entire
  daemon→forge→game loop with zero GPU before you spend a cent.

---

## What this pass added (verified)

- **Topology guard** (`post_process` in `forge_server/app.py`): weld + degenerate/duplicate cull +
  winding fix + quadric decimation to `FORGE_TARGET_TRIS`. Verified: 327k-tri chaotic mesh → exactly
  15,000 tris, watertight, valid GLB. Degrades gracefully (no decimator installed ⇒ still welds +
  passes through, never fails a job).
- **Image→3D seeding** (`image` field on `GenReq` + `_load_image`): a `data:` URI or URL sketch/
  concept sheet drives shape (image→3D) instead of text-only. Verified: data-URI loader resolves to a
  PIL image; `gen_hunyuan`/`gen_trellis` use the seed when present.
- Stub end-to-end loop re-verified intact (daemon→forge→game-import contract unchanged).

## Remaining gaps (the last 20%, in priority order)

- [x] **Lore→prompt endpoint** — `POST /lore { text, name?, generate? }` on the forge: book excerpt /
      research text → structured character prompt. Deterministic extractor (build/attire/colours/hair/
      mask/height), routes through `OWN_LLM_URL` when set, `generate:true` chains to a job. Verified.
- [ ] **In-game image seed UI** — pass `image` from the model panel (pick a sketch from
      `assets/reference/*` or upload) through `genStart` → daemon → forge. (Backend path is now ready.)
- [ ] **Storage + roster injection** — on success, push the `.glb` to a bucket (`CloudPersistence.ts`
      / Supabase) and write a roster row so forged characters persist server-side, not just localStorage.
- [ ] **Curated per-character prompts** — seed prompts from `canon/00_cast_and_world.md` so canon
      fighters regenerate on-model.
- [ ] **Forge→DNA on generate** — auto-run `BANNON_DNA.capture` after import so every forged fighter
      is immediately editable/portable, not a frozen mesh.

The core is real and testable today. Bring up the GPU host with `FORGE_BACKEND=hunyuan`, and the
in-game prompt flow is entirely on your own stack — no Tripo, no Meshy, no per-asset fee.

## v157 addendum — creation-suite direction (owner spec)
- Target: MDickie-breadth × WWE-2K-depth × Blender-level freedom, ALL in-game/mobile. Reference apps:
  Nomad Sculpt-class mobile modelers (owner cites a Play-Store Blender alternative, name starts with
  "I" — candidates: iyan 3D / Prisma3D-class; confirm exact app with owner). The runtime-CAW
  (DNA payload + base-GLB morphs) is the architecture that delivers it without desktop Blender.
- Rig/skin pipeline is now fully ours: tools/rigready/skin.cjs v4.1 (geodesic weights, auto
  game-scale 1.85m bake) -> engine skinned path. UniRig on the GPU forge raises the ceiling later.
