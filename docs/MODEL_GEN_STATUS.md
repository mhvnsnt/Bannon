# Agent-owned model generation — status & blocker (VIPER/KAGE/BRUTUS/ZEPHYR/MORTUS/RONIN/TITAN/GOLEM)

Per the MODEL OWNERSHIP DIRECTIVE, agents are cleared to auto-generate the **game-only** fighters
that never appeared in the books and only have procedural three.js bodies. Straight answer on why
they're not generated yet:

## The blocker is the generation BACKEND, not the pipeline
The pipeline is built and ready (`tools/tripo/generate.mjs` + curated `gen_prompts.json`, then
`tools/rigready/skin.cjs` v4.4 auto-skins the result). What's missing is a working text→3D service:
- **Tripo:** the REST key authenticates, but the account balance is **0 credits** — every generate
  returns code 2010 ("need credit"). No credits ⇒ no models. Needs a credit top-up on the Tripo
  account (owner-side; agents can't buy credits).
- **Our own forge (`forge_server/`):** the code exists (TRELLIS/Hunyuan + UniRig, `stub` backend
  proves the loop) but it is **not deployed to a GPU host**. The daemon runs on CPU (Railway); the
  model needs a GPU (HF Space / Modal / RunPod). Until that GPU service is up and `OWN_GEN_URL`
  points at it, `self`-provider generation can't run either.

So it's not that the agents skipped the work — there is currently **no generation compute** they can
call. Both paths are one owner-side unblock away.

## Unblock options (pick one)
1. **Top up Tripo credits** (fastest): add credits to the Tripo account + set `TRIPO_API_KEY` in the
   env, and the agents run `node tools/tripo/generate.mjs` for all 8 → auto-skin → bank → wire. ~1 hr.
2. **Deploy `forge_server/` to a GPU** (free/cheap, no per-model credit cost): stand it up on a HF
   Space or Modal, set `OWN_GEN_URL`, and generation is unlimited + free from then on. This is the
   "our own Tripo alternative" endgame — worth it if you'll generate a lot.
3. **Upload seed images** for the 8 to Drive (concept art / any base) and the pipeline uses image→3D
   with whichever backend is live — better likeness than text-only.

## What agents CAN and DID do without compute
- Curated per-character prompts for all 8 (`tools/tripo/gen_prompts.json`).
- The full auto-skin/rig/scale/bank/wire path is ready (proven on 15 owner models this session with
  the v4.4 A-pose rigger) — the moment a generated GLB exists, it's in-game within minutes.

Tell me which unblock you want (credits, GPU deploy, or seed images) and the 8 fighters get bodies.


## UPDATE (2026-07-13) — free HF pipeline built + proven halfway
Built `tools/gen/hf_pipeline.py` (text→image→3D on HF public GPU Spaces, no Tripo credits) and ran it:
- **text→image WORKS anonymously** — generated all 8 concept sheets (front-facing A-pose, plain bg,
  ideal image→3D seeds) via FLUX.1-schnell → `assets/reference/agent_fighters/*.png`. These double as
  the reference art AND the seeds for the 3D step (and the owner's hybrid: swap any you don't like).
- **image→3D is one HF token away.** The 3D Spaces (Hunyuan3D-2 / InstantMesh / frogleo) run on
  ZeroGPU; anonymous requests are refused ("No GPU available after 60s — create an account for higher
  priority"). With `HF_TOKEN` set (owner is authenticated as Dmn52; a free/PRO token gives queue
  priority) the same script finishes end to end: `HF_TOKEN=hf_xxx python3 tools/gen/hf_pipeline.py`.
  Then it auto-skins (v4.4) + banks each as `assets/models/<NAME>.glb`.

So generation is no longer blocked on Tripo credits at all — it's a free HF token for GPU priority.
Drop `HF_TOKEN` in the env and the 8 fighters get bodies; or keep using Tripo credits with the
existing tools/tripo path. Concept images are committed now regardless.
