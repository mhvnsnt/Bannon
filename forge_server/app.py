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
DO_DECIMATE = os.environ.get("FORGE_DECIMATE", "1") == "1"   # topology guard (see post_process)
TARGET_TRIS = int(os.environ.get("FORGE_TARGET_TRIS", "15000"))  # game-ready budget; keeps physics fast
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
    image: Optional[str] = None    # OPTIONAL image seed: http(s) URL or data: URI (base64). When
                                   # given, image->3D is used so a SKETCH or a book-derived concept
                                   # sheet drives the mesh (CLAUDE.md task #20). Text still refines it.


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
# ─────────────────────────────────────────────────────────────────────────────
# LORE -> PROMPT — "read Chapter 3, generate the villain". Turns a book excerpt / research blob into
# a structured character description + a shaped generation prompt. Deterministic keyword extraction so
# it runs with NO GPU/LLM (always testable); when OWN_LLM_URL is set it routes through that LLM first
# and falls back to the heuristic on any failure. This closes the autonomous loop's first stage.
# ─────────────────────────────────────────────────────────────────────────────
_COLOR_WORDS = ["black","white","red","blue","green","gold","golden","silver","gunmetal","steel",
                "crimson","purple","orange","yellow","brown","grey","gray","teal","bronze"]
_BUILD_WORDS = {"muscular":"muscular","hulking":"hulking heavyweight","lean":"lean","wiry":"wiry",
                "massive":"massive powerhouse","ripped":"ripped","stocky":"stocky","athletic":"athletic",
                "towering":"towering","huge":"huge","giant":"giant","slender":"slender","heavyset":"heavyset"}
_HAIR_WORDS = {"dreadlocks":"dreadlocks","dreads":"dreadlocks","bald":"bald","mohawk":"mohawk",
               "afro":"afro","ponytail":"ponytail","braids":"braided hair","long hair":"long hair",
               "buzzcut":"buzzcut","shaved":"shaved head"}


def lore_to_prompt(text: str, name: str = "", kind: str = "character") -> dict:
    """Extract physical attributes from lore text and compose a generation prompt."""
    import re
    llm_url = os.environ.get("OWN_LLM_URL", "")
    if llm_url:
        try:
            import urllib.request, json as _json
            body = _json.dumps({"prompt": (
                "Extract a wrestler character's physical appearance from this text as a single vivid "
                "image-generation prompt (build, attire, colours, hair, mask, height). Text:\n" + text[:4000])
            }).encode()
            req = urllib.request.Request(llm_url, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=45) as r:
                out = _json.loads(r.read())
            p = out.get("prompt") or out.get("text") or out.get("completion")
            if p and p.strip():
                return {"prompt": p.strip(), "attributes": {"source": "llm"}, "name": name}
        except Exception:
            pass  # fall through to the deterministic extractor
    low = text.lower()
    attrs = {}
    # colours (dedup, keep order of first appearance)
    cols = []
    for c in _COLOR_WORDS:
        if re.search(r"\b" + c + r"\b", low) and c not in cols:
            cols.append("gold" if c == "golden" else ("gray" if c == "grey" else c))
    if cols: attrs["colors"] = cols[:3]
    # build
    for w, phrase in _BUILD_WORDS.items():
        if re.search(r"\b" + w + r"\b", low): attrs["build"] = phrase; break
    # hair
    for w, phrase in _HAIR_WORDS.items():
        if w in low: attrs["hair"] = phrase; break
    # mask / attire cues
    if "mask" in low or "masked" in low: attrs["mask"] = True
    attire_cues = [w for w in ["jacket","tights","trunks","singlet","cape","hood","armor","armour",
                               "leather","tattered","suit","robe","gear"] if re.search(r"\b"+w+r"\b", low)]
    if attire_cues: attrs["attire"] = attire_cues[:3]
    # height / stature cue
    m = re.search(r"(\d(?:'|\s?ft|\s?foot|\s?feet)[\s\d\"']*)", low)
    if m: attrs["height"] = m.group(1).strip()
    elif any(w in low for w in ["towering","giant","huge"]): attrs["height"] = "very tall"
    # compose the prompt
    parts = []
    if name: parts.append(name)
    if attrs.get("build"): parts.append(attrs["build"])
    parts.append("professional wrestler")
    if attrs.get("mask"): parts.append("wearing a mask")
    if attrs.get("hair"): parts.append(attrs["hair"])
    if attrs.get("attire"): parts.append(", ".join(attrs["attire"]) + " attire")
    if attrs.get("colors"): parts.append(" and ".join(attrs["colors"]) + " colour scheme")
    prompt = ", ".join(parts) + "."
    return {"prompt": prompt, "attributes": attrs, "name": name}


def _load_image(spec: str):
    """Resolve an image seed (data: URI or http(s) URL) to a PIL.Image. Lazy imports so the server
    boots without Pillow when no image path is used."""
    from PIL import Image
    import io, base64, urllib.request
    if spec.startswith("data:"):
        b64 = spec.split(",", 1)[1]
        return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
    with urllib.request.urlopen(spec, timeout=30) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def post_process(in_glb: str, out_glb: str, on_progress) -> str:
    """TOPOLOGY GUARD — the step that makes us better than Tripo/Convert3D for a PHYSICS game.
    AI meshes ship chaotic (500k+ tris, non-manifold shards, unwelded seams) — that drags the solver
    and can shatter the MAX_BODY_VEL collision constraints. We weld, drop degenerate/duplicate faces,
    fix winding, and quadric-decimate to a game-ready budget (FORGE_TARGET_TRIS) BEFORE rigging so the
    result deforms cleanly on the fight skeleton. Degrades gracefully: if the decimator isn't
    installed, we still weld/clean and pass the mesh through rather than fail the job."""
    try:
        import trimesh, numpy as np  # noqa: F401
    except Exception:
        return in_glb  # no mesh tooling — leave the raw mesh for the game's in-browser handling
    try:
        loaded = trimesh.load(in_glb, force="scene")
        mesh = loaded.to_geometry() if hasattr(loaded, "to_geometry") else loaded
        if not hasattr(mesh, "faces") or len(mesh.faces) == 0:
            return in_glb
        # 1) CLEAN — weld coincident verts, drop degenerate + duplicate faces, fix normals/winding
        mesh.merge_vertices()
        mesh.update_faces(mesh.nondegenerate_faces())
        mesh.update_faces(mesh.unique_faces())
        mesh.remove_unreferenced_vertices()
        try: mesh.fix_normals()
        except Exception: pass
        on_progress(84)
        # 2) DECIMATE — quadric edge-collapse to the triangle budget (meshoptimizer-class). trimesh
        #    routes to fast-simplification when available; skip if already under budget.
        n = len(mesh.faces)
        if DO_DECIMATE and n > TARGET_TRIS:
            try:
                mesh = mesh.simplify_quadric_decimation(face_count=TARGET_TRIS)
            except TypeError:
                # older trimesh signature takes a ratio, not a face_count
                mesh = mesh.simplify_quadric_decimation(TARGET_TRIS / float(n))
        on_progress(87)
        mesh.export(out_glb)
        return out_glb
    except Exception:
        traceback.print_exc()
        return in_glb


def _shape_prompt(prompt: str, kind: str) -> str:
    if kind == "attire":
        return (f"full-body fighting attire / costume: {prompt}. "
                "Worn on a neutral T-pose humanoid mannequin, single connected mesh, game-ready.")
    return (f"full-body game character, {prompt}. "
            "Single connected humanoid mesh, T-pose, clean topology, PBR textured, game-ready.")


def gen_hunyuan(prompt: str, kind: str, out_glb: str, on_progress, image=None):
    # pip install: hy3dgen (Hunyuan3D-2), trimesh, torch
    from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
    from hy3dgen.texgen import Hunyuan3DPaintPipeline
    if "hy_shape" not in _MODELS:
        on_progress(5)
        _MODELS["hy_shape"] = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2")
        _MODELS["hy_paint"] = Hunyuan3DPaintPipeline.from_pretrained("tencent/Hunyuan3D-2")
    on_progress(15)
    sp = _shape_prompt(prompt, kind)
    if image:  # SKETCH / concept-sheet seed -> image->3D (shape follows the drawing; text still guides paint)
        mesh = _MODELS["hy_shape"](image=_load_image(image))[0]
    else:
        mesh = _MODELS["hy_shape"](prompt=sp)[0]
    on_progress(60)
    mesh = _MODELS["hy_paint"](mesh, prompt=sp)
    on_progress(80)
    mesh.export(out_glb)
    return out_glb


def gen_trellis(prompt: str, kind: str, out_glb: str, on_progress, image=None):
    # TRELLIS is image->3D. Use the SUPPLIED image (sketch/concept sheet) when given; otherwise make a
    # concept image from text first (any SD text->image), then reconstruct.
    import torch, trimesh  # noqa
    from trellis.pipelines import TrellisImageTo3DPipeline
    from trellis.utils import postprocessing_utils
    if "trellis" not in _MODELS:
        on_progress(4)
        _MODELS["trellis"] = TrellisImageTo3DPipeline.from_pretrained("microsoft/TRELLIS-image-large")
        _MODELS["trellis"].cuda()
    if image:
        on_progress(20)
        img = _load_image(image)
    else:
        from diffusers import AutoPipelineForText2Image
        if "t2i" not in _MODELS:
            _MODELS["t2i"] = AutoPipelineForText2Image.from_pretrained(
                "stabilityai/sdxl-turbo", torch_dtype=torch.float16).to("cuda")
        on_progress(12)
        img = _MODELS["t2i"](prompt=_shape_prompt(prompt, kind), num_inference_steps=4, guidance_scale=0.0).images[0]
    on_progress(30)
    out = _MODELS["trellis"].run(img)
    on_progress(70)
    glb = postprocessing_utils.to_glb(out["gaussian"][0], out["mesh"][0], simplify=0.95, texture_size=1024)
    glb.export(out_glb)
    return out_glb


def gen_stub(prompt: str, kind: str, out_glb: str, on_progress, image=None):
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
        gen(req.prompt, req.kind, raw, prog, req.image)
        # TOPOLOGY GUARD: clean + decimate to a game-ready, physics-safe budget (skip the tiny stub).
        clean = raw
        if BACKEND != "stub":
            clean = post_process(raw, os.path.join(OUT_DIR, f"{jid}_clean.glb"), prog)
        final = clean
        if req.rig and DO_RIG and BACKEND != "stub":
            rigged = os.path.join(OUT_DIR, f"{jid}.glb")
            final = auto_rig(clean, rigged, prog)
        else:
            final = os.path.join(OUT_DIR, f"{jid}.glb")
            if clean != final:
                os.replace(clean, final)
        name = os.path.basename(final)
        _job(jid, status="succeeded", progress=100, glbUrl=_glb_url(name))
    except Exception as e:
        traceback.print_exc()
        _job(jid, status="failed", error=str(e))


class LoreReq(BaseModel):
    text: str
    name: str = ""
    kind: str = "character"
    generate: bool = False          # if true, immediately kick off a generation from the extracted prompt


@app.get("/health")
def health():
    return {"ok": True, "backend": BACKEND, "rig": DO_RIG, "ready": True}


@app.post("/lore")
def lore(req: LoreReq):
    if not req.text.strip():
        raise HTTPException(400, "text required")
    res = lore_to_prompt(req.text, req.name, req.kind)
    if req.generate:
        jid = "j_" + uuid.uuid4().hex[:10]
        greq = GenReq(prompt=res["prompt"], kind=req.kind)
        _job(jid, status="queued", progress=0, kind=req.kind)
        threading.Thread(target=run_job, args=(jid, greq), daemon=True).start()
        res["id"] = jid
    return res


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
