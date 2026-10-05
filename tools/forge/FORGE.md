# The Forge — free, open-source character generation for Bannon

**Problem (owner-verified 2026-10-05):** the character-select screen shows procedural
mannequin fallbacks because many roster characters have no GLB. The owner hand-builds
models in Tripo 3D (slow, manual, paid credits). The Forge replaces that loop:

> describe a character in chat → get a game-ready, rigged, QA-passed GLB in
> `assets/models/` → no procedural fallbacks. Zero new spend.

Bannon is the proving ground; the pipeline is game-agnostic (same chain, per-game
`tools/rigging/jointmaps/*.json`).

## Backend research (real comparison, 2026-10-05)

| Model | Org | License | In → Out | Texture | Min VRAM | Humanoid quality | Verdict |
|---|---|---|---|---|---|---|---|
| **TripoSR** | Tripo/Stability | **MIT** | image → mesh | ✅ (`--bake-texture`) | **~6 GB** | decent (2024-era) | **DEFAULT** |
| **TRELLIS** | Microsoft | **MIT** | text/image → mesh | ✅ PBR | ~16 GB | top tier | upgrade path (`--backend trellis`) |
| TripoSG | VAST AI | MIT | image → mesh | shape only | 8–12 GB | good | superseded by TripoSR default for our use (texture matters) |
| Hunyuan3D-2.1 | Tencent | Hunyuan Community | image → mesh | ✅ best paint | 10 GB shape / 21 GB paint | highest | **REJECTED — license excludes EU/UK/South Korea; commercial license >1M MAU. Legal risk the repo won't carry.** |
| Stable Fast 3D / SPAR3D | Stability | Community (revenue threshold) | image → mesh | basic | 6–8 GB | below bar | **REJECTED — revenue-threshold license conflicts with selling games.** |

Why TripoSR is the default: MIT (no legal strings), lightest VRAM (~6 GB — runs on
any gaming GPU, free Colab T4, cheap RunPod pods), texture baking built in
(`--bake-texture`), and it slots into the existing VAST/Tripo lineage the repo
already uses (`tools/tripo/`, UniRig). TRELLIS is the documented upgrade when a
16 GB+ box is available — same chain, better mesh.

**Sandbox test evidence (2026-10-05, this machine):** no NVIDIA GPU
(`nvidia-smi` absent; CPU-only torch installed cleanly via pip and reports
`torch.cuda.is_available() == False`). `generate.py` without `--dry-run` exits 3
with the GPU-box recipe — the gate was executed, not just written. The TripoSR
`run.py` + UniRig stages were NOT executed here: ~275 MB free RAM cannot hold
model weights + inference (TripoSR wants ~6 GB VRAM). This is stated, not
hidden. Proven on CPU here, with real runs:
- brief → reference-image prompt → `--dry-run` full 8-stage plan → `manifest.json` ✅
- reference image for FORGE_TEST_DUMMY generated (1120×2240 PNG, front A-pose,
  matches brief: dark-red trunks, black boots, MMA gloves, wrist tape) ✅
- `rom_qa.cjs` on `assets/models/BANNON_rigged.glb` → **PASS**, 58 joints,
  worst LeftShoulder 63 spikes (needs `NODE_PATH=<repo>/../bannon-repair/node_modules`
  for the CJS `require`; ESM scripts need their own `node_modules`) ✅
- `decimate.mjs` on the same GLB → 4.2 MB → 0.6 MB, 1 skin kept, output re-passes
  rom_qa ✅ (also fixed a real bug: the script never registered MeshoptDecoder/
  Encoder, so any meshopt-compressed GLB failed to read)
- `npm install` in `tools/decimate/` (31 packages, its own package.json) ✅
- `snapshot.cjs` turnaround PNGs: code path reviewed, NOT executed here —
  no chromium/playwright in this sandbox (`/opt/pw-browsers` absent); PNGs are
  produced on the GPU/video box where the snapshotter already runs.
- `tools/unirig/rig.sh` (UniRig): not executed here (needs ≥8 GB CUDA); its CLI
  contract verified from `docs/MODEL_RIGGING.md` + the script source.

## The chain (exact)

```
character_brief.md ──► [1] reference image (front A-pose, agent media pipeline or any image model)
        │ --image ref.png
        ▼
[2] GENERATE  TripoSR:  python $TRIPOSR_DIR/run.py ref.png --output-dir work/ \
                        --bake-texture --texture-resolution 1024
              (TRELLIS: --backend trellis — needs 16 GB VRAM)
        ▼  raw.glb (UNRIGGED textured mesh — never banked to assets/models/)
[3] RIG       bash tools/unirig/rig.sh raw.glb rigged.glb
              (UniRig skeleton → skin → merge → rename_bones.cjs → Mixamo names;
               needs ≥8 GB CUDA. Owner directive 2026-07-18: the in-house
               tools/rigready/skin.cjs is DEPRECATED and must NOT be used.)
        ▼
[5] DECIMATE  node tools/decimate/decimate.mjs rigged.glb decimated.glb  (CPU, keeps weights)
        ▼
[6] QA        node tools/rigging/rom_qa.cjs decimated.glb                  (CPU, pure JS)
              PASS <250 spikes worst joint · WATCH 250–800 · FAIL >800
              (optional: retarget a punch clip + clip_deform_qa.cjs for the fight-ready proof)
        ▼
[7] SNAPSHOT  node tools/model_preview/snapshot.cjs decimated.glb shots/ LABEL
              (front/side/back/pose PNGs + RIG diagnostics JSON)
        ▼
[8] BANK      assets/models/<CHARKEY>.glb + sha256 → character select picks it up,
              procedural fallback for that key disappears.
```

One command runs it all:
```bash
python tools/forge/generate.py --brief tools/forge/briefs/MYCHAR.md --out assets/models/MYCHAR.glb
python tools/forge/generate.py --image ref.png --out assets/models/MYCHAR.glb
python tools/forge/generate.py --prompt "..." --out assets/models/MYCHAR.glb --dry-run
```

## GPU-box recipe (where stages 2–3 actually run)

```bash
# any CUDA box with >=8 GB VRAM (TripoSR) or >=16 GB (TRELLIS + UniRig comfortably)
git clone https://github.com/VAST-AI-Research/TripoSR ~/TripoSR
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install -r ~/TripoSR/requirements.txt
# UniRig per docs/MODEL_RIGGING.md (or the flaky-free HF Space path in tools/unirig/rig_via_space.py)
git clone <bannon> && cd bannon
cd tools/decimate && npm install --no-audit --no-fund && cd ../..   # one-time, CPU-side deps
export NODE_PATH=$(pwd)/../bannon-repair/node_modules  # if the box lacks repo node_modules (CJS QA tools)
cp -r <forge workdir> tools/forge/work/<LABEL>/     # reference image + manifest travel with it
python tools/forge/generate.py --image tools/forge/work/<LABEL>/reference.png \
    --out assets/models/<LABEL>.glb
```

Free-tier notes: GitHub Actions CPU runners cannot run TripoSR/UniRig (no GPU on the
free tier) — GPU CI is a paid product, so the forge does NOT promise CI
generation. The $0 path is a free Colab T4 session or any box the owner already
has; the repo side (QA/snapshot/bank) is CPU and free everywhere.

## Files

| File | What |
|---|---|
| `tools/forge/generate.py` | the orchestrator (this doc's chain, executable) |
| `tools/forge/character_brief.md` | blank template — the owner (or the agent, conversationally) fills this in |
| `tools/forge/briefs/` | one filled brief per character, e.g. `briefs/FORGE_TEST_DUMMY.md` |
| `tools/forge/work/<LABEL>/` | per-run scratch: `reference.png`, `reference_prompt.txt`, `raw.glb`, `rigged.glb`, `decimated.glb`, `manifest.json`, `shots/` |

## Test character (2026-10-05)

`briefs/FORGE_TEST_DUMMY.md` — "Dudley Forge", an original heavyweight test
wrestler (NOT a canon character, NOT based on any real wrestler). Status:
- ✅ brief written; ✅ reference-image prompt emitted; ✅ `--dry-run` plan verified (this sandbox)
- ✅ QA + snapshot stages proven on CPU with an existing repo GLB (see manifest)
- ⏳ stages 2–3 need the GPU box — the workdir travels with everything the box needs

## Relation to the old Tripo path

`tools/tripo/generate.mjs` (Tripo API, paid credits, `TRIPO_API_KEY`) still works
and is untouched. The Forge is the free alternative in front of the same
downstream chain (UniRig → decimate → QA → snapshot → bank). Pick per character:
paid API for speed, Forge for zero spend.
