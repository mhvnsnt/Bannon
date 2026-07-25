#!/usr/bin/env python3
# BANNON free model generation — the "our own Tripo, no credits" pipeline on Hugging Face's public
# GPU Spaces. text prompt -> concept image (FLUX) -> image-to-3D (Hunyuan3D-2 / InstantMesh / frogleo)
# -> raw GLB. Then run tools/rigready/skin.cjs to auto-skin+bank. Agent-owned fighters only
# (VIPER/KAGE/BRUTUS/ZEPHYR/MORTUS/RONIN/TITAN/GOLEM) per the MODEL OWNERSHIP DIRECTIVE.
#
#   pip install gradio_client
#   HF_TOKEN=hf_xxx python3 tools/gen/hf_pipeline.py [NAME ...]     # all if none given
#
# WHY HF_TOKEN matters: the text->image step runs anonymously fine, but the image-to-3D Spaces run on
# ZeroGPU — anonymous requests get "No GPU available after 60s". A free HF token (PRO = best) gives
# queue priority so the 3D step actually completes. Owner is authenticated as 'Dmn52'; drop a token in
# the env and this finishes end to end. Falls back across several 3D Spaces so one being down != fatal.
import json, os, sys, shutil, subprocess, traceback
import requests
from gradio_client import Client, handle_file

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROMPTS = json.load(open(os.path.join(ROOT, "tools/tripo/gen_prompts.json")))
IMG_DIR = os.path.join(ROOT, "assets/reference/agent_fighters")
INCOMING = os.path.join(ROOT, "assets/models/incoming")
os.makedirs(IMG_DIR, exist_ok=True); os.makedirs(INCOMING, exist_ok=True)
HF = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")

POSE = ("Full-body character reference, single pro wrestler standing front-facing in a symmetrical "
        "A-pose, arms slightly away from the body, feet shoulder-width. {desc}. Plain flat white "
        "background, even studio lighting, full figure head to boots centered, photorealistic 3D game "
        "character, clean symmetrical, no logos, no text, no watermark.")

def client(space):
    # gradio_client 2.5.x: auth kwarg is `token` (reads HF_TOKEN); a token gives ZeroGPU queue priority.
    return Client(space, token=HF, verbose=False) if HF else Client(space, verbose=False)

def text_to_image(key, desc):
    out = os.path.join(IMG_DIR, f"{key}.png")
    if os.path.exists(out): return out
    c = client("black-forest-labs/FLUX.1-schnell")
    r = c.predict(POSE.format(desc=desc), 0, True, 768, 1024, 4, api_name="/infer")
    img = r[0].get("path") if isinstance(r[0], dict) else r[0]
    shutil.copy(img, out); print("  image ->", out, flush=True); return out

def _find_glb(x):
    if isinstance(x, str) and x.endswith(".glb") and os.path.exists(x): return x
    if isinstance(x, dict):
        for v in x.values():
            g = _find_glb(v)
            if g: return g
    if isinstance(x, (list, tuple)):
        for v in x:
            g = _find_glb(v)
            if g: return g
    return None

def _dl_static(c, path, out):
    # some 3D Spaces (frogleo) return the GLB as a /static/ server path, not a local file — fetch it.
    url = c.src.rstrip("/") + path
    hdr = {"Authorization": f"Bearer {HF}"} if HF else {}
    r = requests.get(url, headers=hdr, timeout=180); r.raise_for_status()
    open(out, "wb").write(r.content)
    return out if r.content[:4] == b"glTF" else None

def image_to_3d(key, img):
    out = os.path.join(INCOMING, f"{key}_gen.glb")
    # TEXTURED spaces first (Hunyuan/TRELLIS) for real skin/gear; frogleo = geometry-only fallback.
    # Hunyuan /generation_all currently 500s intermittently — try it, then fall back.
    try:
        c = client("tencent/Hunyuan3D-2")
        g = _find_glb(c.predict(caption="", image=handle_file(img), steps=30, guidance_scale=5.0, seed=42,
                                octree_resolution=256, check_box_rembg=True, num_chunks=8000,
                                randomize_seed=False, api_name="/generation_all"))
        if g: shutil.copy(g, out); print("  glb[hunyuan textured] ->", out, flush=True); return out
    except Exception as e:
        print("   hunyuan failed:", str(e)[:120], flush=True)
    try:
        c = client("frogleo/Image-to-3D")
        r = c.predict(handle_file(img), 30, 5.0, 42, 256, 8000, api_name="/gen_shape")
        # r[2] = /static/.../white_mesh.glb (geometry only)
        if isinstance(r, (list, tuple)) and len(r) > 2 and isinstance(r[2], str) and r[2].endswith(".glb"):
            if _dl_static(c, r[2], out): print("  glb[frogleo geometry] ->", out, flush=True); return out
    except Exception as e:
        print("   frogleo failed:", str(e)[:120], flush=True)
    return None

def skin_and_bank(key, raw):
    banked = os.path.join(ROOT, "assets/models", f"{key}.glb")
    subprocess.run(["node", os.path.join(ROOT, "tools/rigready/skin.cjs"), raw, banked, "--height=1.9"], check=True)
    print("  banked ->", banked, flush=True)

def main():
    names = [a.upper() for a in sys.argv[1:]] or list(PROMPTS["characters"].keys())
    if not HF:
        print("WARNING: no HF_TOKEN — image gen works, but the ZeroGPU 3D step will likely be refused "
              "(anonymous queue). Set HF_TOKEN for the 3D step.", flush=True)
    for key in names:
        spec = PROMPTS["characters"].get(key)
        if not spec: print("skip (not an agent fighter):", key, flush=True); continue
        print("==", key, flush=True)
        try:
            img = text_to_image(key, spec["prompt"])
            raw = image_to_3d(key, img)
            if raw: skin_and_bank(key, raw)
            else: print("  3D step unavailable (need HF_TOKEN / GPU) — image seed saved for later.", flush=True)
        except Exception:
            traceback.print_exc()

if __name__ == "__main__":
    main()
