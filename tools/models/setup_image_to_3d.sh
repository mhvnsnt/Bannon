#!/usr/bin/env bash
# setup_image_to_3d.sh — install OUR OWN image-to-3D generator. One command.
#
#   bash tools/models/setup_image_to_3d.sh
#   python3 tools/models/image_to_3d.py <reference.png> --name KAGE
#
# OWNER: "We would have more models if u had got a good tripo 3d alternative working."
#
# The alternative is TripoSR, and it IS Tripo: Stability AI built it WITH Tripo AI and released the
# weights MIT. Single image in, textured mesh out, no credits, no API key, no queue, no account.
# MEASURED HERE, GPU-LESS, CPU ONLY: 19s to load, 23-25s to reconstruct, 45,108 verts / 90,224 faces,
# and the render is unmistakably the input object. That speed is why it beats TRELLIS / Hunyuan3D /
# InstantMesh for us — those are better models and every one of them needs CUDA.
#
# FOUR PINS THAT ARE NOT OPTIONAL. Each cost a debugging round; do not "modernise" them.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CACHE="$ROOT/.cache/triposr"

echo "== 1. python deps"
# torchvision MUST be the +cpu build from PyTorch's own index. A plain `pip install torchvision`
# takes the PyPI wheel, which is built against a different torch ABI and dies at import with
# "operator torchvision::nms does not exist" — and pip then reports "already satisfied" and refuses
# to replace it, so the fix needs --force-reinstall. Use --index-url, NEVER --extra-index-url:
# the latter pulls ~3 GB of CUDA libraries onto a machine with no GPU (that happened, twice).
pip install -q --no-input transformers==4.46.3 einops omegaconf trimesh huggingface_hub PyMCubes xatlas
pip install -q --no-input --force-reinstall --no-deps \
    --index-url https://download.pytorch.org/whl/cpu "torchvision==0.28.0+cpu" || true

# transformers is PINNED TO THE 4.x LINE ON PURPOSE. v5 renamed the ViT internals
# (encoder.layer.N.attention.attention.query -> layers.N.attention.q_proj), so the 2024 TripoSR
# checkpoint no longer matches the model it builds and load_state_dict fails with 192 missing keys.

echo "== 2. TripoSR"
[ -d "$CACHE" ] || git clone -q --depth 1 https://github.com/VAST-AI-Research/TripoSR.git "$CACHE"

echo "== 3. torchmcubes shim"
# torchmcubes is a compiled CUDA extension with no wheel for a GPU-less box. PyMCubes is the same
# marching-cubes algorithm, prebuilt. THE AXIS FLIP IS THE WHOLE POINT: torchmcubes returns verts
# (x,y,z), PyMCubes (z,y,x). Unflipped you get a mesh that looks completely plausible and is
# MIRRORED — a defect no vertex count or file size can show you.
cat > "$CACHE/torchmcubes.py" <<'PY'
import numpy as np, torch, mcubes as _mcubes

def marching_cubes(vol, thresh):
    t = vol.detach().cpu().numpy() if isinstance(vol, torch.Tensor) else np.asarray(vol)
    verts, faces = _mcubes.marching_cubes(t.astype(np.float32), float(thresh))
    verts = np.ascontiguousarray(verts[:, ::-1])          # (z,y,x) -> (x,y,z). DO NOT REMOVE.
    return (torch.from_numpy(verts.astype(np.float32)),
            torch.from_numpy(np.ascontiguousarray(faces).astype(np.int64)))

def grid_interp(vol, points):
    v = vol if isinstance(vol, torch.Tensor) else torch.as_tensor(vol)
    p = points if isinstance(points, torch.Tensor) else torch.as_tensor(points)
    D, H, W = v.shape[:3]
    size = torch.tensor([W - 1, H - 1, D - 1], dtype=p.dtype, device=p.device)
    g = (p / size) * 2 - 1
    g = g[..., [2, 1, 0]] if g.shape[-1] == 3 else g
    src = v.permute(3, 0, 1, 2)[None] if v.dim() == 4 else v[None, None]
    out = torch.nn.functional.grid_sample(src.float(), g.view(1, 1, 1, -1, 3).float(),
                                          align_corners=True, mode='bilinear')
    return out.view(src.shape[1], -1).T
PY

echo "== 4. weights (1.6 GB, cached by huggingface_hub)"
python3 - <<'PY'
from huggingface_hub import hf_hub_download
import os
for f in ('config.yaml', 'model.ckpt'):
    p = hf_hub_download('stabilityai/TripoSR', f)
    print('   %-12s %6.0f MB' % (f, os.path.getsize(p) / 1048576))
PY

cat <<'EOF'

== ready.

  python3 tools/models/image_to_3d.py <reference.png> --name KAGE

It emits an UNRIGGED mesh. This repo already solves that — the same chain that fixed the
Heavyweight (skinqa p95 0.3131 FAIL -> 0.0284 PASS):

  node tools/model_diag/transfer_weights.cjs assets/models/VIPER.glb assets/models/incoming/KAGE.glb
  node tools/model_diag/skinqa.cjs KAGE_xfer.glb            # promote on the number, never a screenshot
  node tools/model_diag/rig_continuity.cjs KAGE_xfer.glb    # must read WHOLE, not SEVERED
  node tools/assets/decimate_rigs.cjs assets/models/KAGE.glb --gate
  node tools/model_preview/snapshot.cjs assets/models/KAGE.glb   # AND LOOK AT IT

The look step is not optional. The very first mesh generated here came out lying on its back —
bbox x 0.58, y 0.56, z 1.01, height on Z — and every number about it was perfect.
EOF
