#!/usr/bin/env python3
"""Self-hosted UniRig on Modal — the RELIABLE rig host (no free-queue stalls).

Research verdict (2026-07): UniRig (VAST-AI, SIGGRAPH'25) is the SOTA open-source auto-rigger
(+215% rigging accuracy over commercial). The unreliability we hit is the FREE HF Space queue
stalling / returning degenerate skeletons under load — NOT the algorithm. The fix is to run UniRig
on our own GPU. This is a one-time `modal deploy` and then rigging is push-button + reliable.

SETUP (once, on any machine with the owner's Modal account):
    pip install modal && modal token new
    modal deploy tools/unirig/modal_unirig.py

Then rig any mesh (reliable, ~2-4 min on an A10G, no queue):
    modal run tools/unirig/modal_unirig.py --inp assets/models/incoming/ECHO.glb --out assets/models/ECHO_rigged.glb
    # or point the batch driver at it:  UNIRIG_ENDPOINT=<modal-url>  python3 tools/unirig/batch_rerig.py --fails

Falls back cleanly: if Modal isn't configured, tools/unirig/batch_rerig.py still uses the hosted
HF Space with the joint-count guard + retry. See docs/MODEL_RIGGING.md for the whole stack.
"""
import sys, os, subprocess

try:
    import modal
except Exception:
    print("modal not installed. `pip install modal && modal token new`, then `modal deploy tools/unirig/modal_unirig.py`.")
    sys.exit(2)

app = modal.App("bannon-unirig")

# UniRig image: CUDA torch + the repo + its deps. Built once, cached by Modal.
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "libgl1", "libglib2.0-0", "blender")
    .run_commands(
        "pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121",
        "git clone https://github.com/VAST-AI-Research/UniRig /UniRig || true",
        "cd /UniRig && pip install -r requirements.txt || true",
        "pip install numpy==1.26.4 trimesh gradio_client huggingface_hub",
    )
)


@app.function(image=image, gpu="a10g", timeout=1200)
def rig_bytes(glb_bytes: bytes, out_format: str = "glb") -> bytes:
    """Run the 3-stage UniRig pipeline on a mesh and return the rigged GLB bytes."""
    import tempfile, os, subprocess
    d = tempfile.mkdtemp()
    src = os.path.join(d, "in.glb"); open(src, "wb").write(glb_bytes)
    skel = os.path.join(d, "skel.fbx"); skin = os.path.join(d, "skin.fbx"); out = os.path.join(d, "out." + out_format)
    R = "/UniRig"
    subprocess.run(["bash", "launch/inference/generate_skeleton.sh", "--input", src, "--output", skel], cwd=R, check=True)
    subprocess.run(["bash", "launch/inference/generate_skin.sh", "--input", skel, "--output", skin], cwd=R, check=True)
    subprocess.run(["bash", "launch/inference/merge.sh", "--source", skin, "--target", src, "--output", out], cwd=R, check=True)
    return open(out, "rb").read()


@app.local_entrypoint()
def main(inp: str, out: str, out_format: str = "glb"):
    data = open(inp, "rb").read()
    print(f"rigging {inp} on Modal GPU …")
    rigged = rig_bytes.remote(data, out_format)
    open(out, "wb").write(rigged)
    # rename bone_N -> Mixamo names so it binds our BONE_MAP
    try:
        subprocess.run(["node", os.path.join(os.path.dirname(__file__), "rename_bones.cjs"), out, out], check=True)
    except Exception as e:
        print("rename step skipped:", e)
    print("rigged ->", out, "(gate with tools/model_diag/skinqa.cjs, then promote)")
