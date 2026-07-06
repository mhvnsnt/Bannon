"""
BANNON FORGE — our own prompt -> rigged-GLB generator (the in-game "make a character / attire").

This is the GPU-side service the daemon's `self` provider calls (OWN_GEN_URL). It runs an
open-source text/image -> 3D model + an auto-rigger, so generation is OURS — no Tripo/Meshy.

Contract (matches CharacterModelGen `runSelf`):
  POST /            { prompt, rig, kind, characterId }  -> { id }            (async)
  GET  /{id}                                            -> { status, progress, glbUrl, error }
  GET  /files/{name}.glb                                -> the generated GLB (served static)
  GET  /health                                          -> { ok, backend, ready }

`kind` is "character" or "attire" — both are just prompt-driven generations; the GAME decides whether
to store the result as a base look or an alt-attire look. We pass it through so the backend can bias
the prompt (e.g. attire = "full-body wrestling attire, worn on a T-pose mannequin").

Backends (set FORGE_BACKEND): "hunyuan" (text->3D native, recommended), "trellis" (image->3D, needs a
text->image step), or "stub" (default — no weights, returns a tiny placeholder so the whole pipeline
is testable end-to-end before the GPU box is wired). Auto-rig via UniRig when FORGE_RIG=1.

Deploy: Modal / RunPod / a GPU box / HF Space. Railway is CPU-only, so the daemon stays on Railway
and points OWN_GEN_URL here. See README.md.
"""
import os, time, uuid, threading, traceback
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

BACKEND = os.environ.get("FORGE_BACKEND", "stub").lower()
DO_RIG = os.environ.get("FORGE_RIG", "1") == "1"
OUT_DIR = os.environ.get("FORGE_OUT", "/tmp/bannon_forge")
PUBLIC_BASE = os.environ.get("FORGE_PUBLIC_BASE", "")  # e.g. https://your-gpu-host  (for absolute glbUrl)
AUTH = os.environ.get("OWN_GEN_KEY", "")               # optional shared secret (Bearer)
os.makedirs(OUT_DIR, exist_ok=True)

app = FastAPI(title="BANNON Forge")
JOBS: Dict[str, Dict[str, Any]] = {}
_LOCK = threading.Lock()

# Lazily-loaded model handles (so the server boots instantly; weights load on first job).
_MODELS: Dict[str, Any] = {}


class GenReq(BaseModel):
    prompt: str
    rig: bool = True
    kind: str = "character"        # "character" | "attire"
    characterId: Optional[str] = None


def _job(jid: str, **patch):
    with _LOCK:
        j = JOBS.setdefault(jid, {"id": jid, "status": "queued", "progress": 0})
        j.update(patch)
        return dict(j)


def _glb_url(name: str) -> str:
    base = PUBLIC_BASE.rstrip("/") if PUBLIC_BASE else ""
    return f"{base}/files/{name}"


# ─────────────────────────────────────────────────────────────────────────────
# BACKENDS — each returns the path to a written .glb. Heavy imports are inside the
# functions so the server starts without the weights and `stub` always works.
# ─────────────────────────────────────────────────────────────────────────────
def _shape_prompt(prompt: str, kind: str) -> str:
    if kind == "attire":
        return (f"full-body fighting attire / costume: {prompt}. "
                "Worn on a neutral T-pose humanoid mannequin, single connected mesh, game-ready.")
    return (f"full-body game character, {prompt}. "
            "Single connected humanoid mesh, T-pose, clean topology, PBR textured, game-ready.")


def gen_hunyuan(prompt: str, kind: str, out_glb: str, on_progress):
    # pip install: hy3dgen (Hunyuan3D-2), trimesh, torch
    from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
    from hy3dgen.texgen import Hunyuan3DPaintPipeline
    if "hy_shape" not in _MODELS:
        on_progress(5)
        _MODELS["hy_shape"] = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2")
        _MODELS["hy_paint"] = Hunyuan3DPaintPipeline.from_pretrained("tencent/Hunyuan3D-2")
    on_progress(15)
    mesh = _MODELS["hy_shape"](prompt=_shape_prompt(prompt, kind))[0]
    on_progress(60)
    mesh = _MODELS["hy_paint"](mesh, prompt=_shape_prompt(prompt, kind))
    on_progress(80)
    mesh.export(out_glb)
    return out_glb


def gen_trellis(prompt: str, kind: str, out_glb: str, on_progress):
    # TRELLIS is image->3D; make a concept image first (any SD text->image), then reconstruct.
    import torch, trimesh  # noqa
    from diffusers import AutoPipelineForText2Image
    from trellis.pipelines import TrellisImageTo3DPipeline
    from trellis.utils import postprocessing_utils
    if "t2i" not in _MODELS:
        on_progress(4)
        _MODELS["t2i"] = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo", torch_dtype=torch.float16).to("cuda")
        _MODELS["trellis"] = TrellisImageTo3DPipeline.from_pretrained("microsoft/TRELLIS-image-large")
        _MODELS["trellis"].cuda()
    on_progress(12)
    img = _MODELS["t2i"](prompt=_shape_prompt(prompt, kind), num_inference_steps=4, guidance_scale=0.0).images[0]
    on_progress(30)
    out = _MODELS["trellis"].run(img)
    on_progress(70)
    glb = postprocessing_utils.to_glb(out["gaussian"][0], out["mesh"][0], simplify=0.95, texture_size=1024)
    glb.export(out_glb)
    return out_glb


def gen_stub(prompt: str, kind: str, out_glb: str, on_progress):
    # No weights: write a minimal valid GLB (a box) so the full pipeline + game import is testable.
    import struct, json as _json
    on_progress(40)
    # unit cube
    verts = [-.2,0,-.1, .2,0,-.1, .2,1.8,-.1, -.2,1.8,-.1, -.2,0,.1, .2,0,.1, .2,1.8,.1, -.2,1.8,.1]
    idx = [0,1,2, 0,2,3, 4,6,5, 4,7,6, 0,4,5, 0,5,1, 1,5,6, 1,6,2, 2,6,7, 2,7,3, 3,7,4, 3,4,0]
    vb = struct.pack("<%df" % len(verts), *verts)
    ib = struct.pack("<%dH" % len(idx), *idx)
    if len(ib) % 4: ib += b"\x00" * (4 - len(ib) % 4)
    bin_blob = vb + ib
    gltf = {
        "asset": {"version": "2.0", "generator": "bannon-forge-stub"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0, "name": "Forge_"+kind}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0}, "indices": 1}]}],
        "buffers": [{"byteLength": len(bin_blob)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": len(vb), "target": 34962},
            {"buffer": 0, "byteOffset": len(vb), "byteLength": len(ib), "target": 34963},
        ],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(verts)//3, "type": "VEC3",
             "min": [-.2,0,-.1], "max": [.2,1.8,.1]},
            {"bufferView": 1, "componentType": 5123, "count": len(idx), "type": "SCALAR"},
        ],
    }
    jb = _json.dumps(gltf).encode("utf-8")
    if len(jb) % 4: jb += b" " * (4 - len(jb) % 4)
    glb = b"glTF" + struct.pack("<II", 2, 12 + 8 + len(jb) + 8 + len(bin_blob))
    glb += struct.pack("<I", len(jb)) + b"JSON" + jb
    glb += struct.pack("<I", len(bin_blob)) + b"BIN\x00" + bin_blob
    with open(out_glb, "wb") as f:
        f.write(glb)
    on_progress(80)
    return out_glb


def auto_rig(in_glb: str, out_glb: str, on_progress) -> str:
    # UniRig: skeleton + skin weights so the result binds to the fight rig.
    try:
        from unirig import rig_glb  # thin wrapper around VAST-AI/UniRig inference
        on_progress(88)
        rig_glb(in_glb, out_glb)
        return out_glb
    except Exception:
        # rigging unavailable: keep the unrigged mesh — the game's in-browser auto-rig handles it.
        return in_glb


GEN = {"hunyuan": gen_hunyuan, "trellis": gen_trellis, "stub": gen_stub}


def run_job(jid: str, req: GenReq):
    def prog(p): _job(jid, status="running", progress=int(p))
    try:
        _job(jid, status="running", progress=2)
        gen = GEN.get(BACKEND, gen_stub)
        raw = os.path.join(OUT_DIR, f"{jid}_raw.glb")
        gen(req.prompt, req.kind, raw, prog)
        final = raw
        if req.rig and DO_RIG and BACKEND != "stub":
            rigged = os.path.join(OUT_DIR, f"{jid}.glb")
            final = auto_rig(raw, rigged, prog)
        else:
            final = os.path.join(OUT_DIR, f"{jid}.glb")
            if raw != final:
                os.replace(raw, final)
        name = os.path.basename(final)
        _job(jid, status="succeeded", progress=100, glbUrl=_glb_url(name))
    except Exception as e:
        traceback.print_exc()
        _job(jid, status="failed", error=str(e))


@app.get("/health")
def health():
    return {"ok": True, "backend": BACKEND, "rig": DO_RIG, "ready": True}


@app.post("/")
def submit(req: GenReq):
    if not req.prompt.strip():
        raise HTTPException(400, "prompt required")
    jid = "j_" + uuid.uuid4().hex[:10]
    _job(jid, status="queued", progress=0, kind=req.kind, characterId=req.characterId)
    threading.Thread(target=run_job, args=(jid, req), daemon=True).start()
    return {"id": jid}


@app.get("/{jid}")
def status(jid: str):
    with _LOCK:
        j = JOBS.get(jid)
    if not j:
        raise HTTPException(404, "no such job")
    return JSONResponse(j)


@app.get("/files/{name}")
def files(name: str):
    path = os.path.join(OUT_DIR, os.path.basename(name))
    if not os.path.exists(path):
        raise HTTPException(404, "not found")
    return FileResponse(path, media_type="model/gltf-binary")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
