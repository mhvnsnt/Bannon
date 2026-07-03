# BANNON Forge — our own prompt→rigged-GLB generator

The GPU service behind the in-game "generate a character / attire from a prompt". The daemon's
`self` provider (`OWN_GEN_URL`) calls this, so generation runs on **our** stack — no Tripo/Meshy.

## Contract (what the daemon expects)
```
POST /            { prompt, rig, kind, characterId }  -> { id }
GET  /{id}                                            -> { status, progress, glbUrl, error }
GET  /files/{name}.glb                                -> the GLB
GET  /health
```
`kind` = `"character"` or `"attire"` (both prompt-driven; the game stores a character as a base look,
an attire as an alt look).

## Run it

**Local / CPU smoke test (stub backend — no weights, boots anywhere):**
```
pip install fastapi "uvicorn[standard]" pydantic
python app.py            # -> http://localhost:8080  (FORGE_BACKEND=stub)
```
The stub returns a minimal valid GLB so you can verify the whole loop (daemon → forge → game import)
before standing up a GPU.

**Real generation (GPU):** pick a backend, install its deps (see `requirements.txt`), then:
```
FORGE_BACKEND=hunyuan FORGE_RIG=1 FORGE_PUBLIC_BASE=https://<this-host> python app.py
```
- `hunyuan` — Tencent Hunyuan3D‑2, native text→3D + texture (recommended start).
- `trellis`  — Microsoft TRELLIS image→3D (MIT) + an sdxl-turbo text→image step.
- Auto‑rig via [UniRig](https://github.com/VAST-AI-Research/UniRig) when `FORGE_RIG=1` (wrap its
  inference as `unirig.rig_glb(in, out)`).

## Where to host the GPU
Railway is CPU‑only → keep the **daemon** on Railway, run **this** on a GPU host and point
`OWN_GEN_URL` at it:
- **HF Space** (duplicate `microsoft/TRELLIS.2`, ZeroGPU) — quickest.
- **Modal / RunPod / Replicate** — a dedicated GPU you own and can fine‑tune on our art (the real
  "our own version").

## Env
| var | meaning |
|-----|---------|
| `FORGE_BACKEND` | `stub` \| `hunyuan` \| `trellis` |
| `FORGE_RIG` | `1` to auto‑rig with UniRig |
| `FORGE_PUBLIC_BASE` | public URL of this host, so `glbUrl` is absolute the daemon/game can fetch |
| `OWN_GEN_KEY` | optional shared secret (Bearer), must match the daemon's `OWN_GEN_KEY` |
| `PORT` | listen port (default 8080) |

Then on the **daemon**: `OWN_GEN_URL=https://<this-host>` (and matching `OWN_GEN_KEY`). The in‑game
prompt flow is now fully ours.
