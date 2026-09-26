#!/usr/bin/env bash
# setup_motion_models.sh — MoMask / MDM / MotionGPT, ready to generate, in one command.
#
# Owner asked for these wired into the mocap pipeline. They are. This script exists so the setup is
# reproducible rather than living in one machine's shell history, and so every workaround below is
# written down instead of rediscovered.
#
#   bash tools/mocap/setup_motion_models.sh            # MoMask only (the CPU-friendly one)
#   bash tools/mocap/setup_motion_models.sh --all      # + MDM and MotionGPT code
#
# Then:  python3 tools/mocap/text_to_clip.py "a person springs off the ground to their feet" --name X
set -uo pipefail

DEST="${MOTION_MODELS_DIR:-/tmp}"
ALL=0; [ "${1:-}" = "--all" ] && ALL=1

echo "── deps ────────────────────────────────────────────────────────────────────"
# CPU-ONLY torch index. Using --extra-index-url instead pulls ~3 GB of NVIDIA CUDA libraries onto a
# machine with no GPU and fills the disk; that happened, and this is the fix.
pip install -q --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch || exit 1
pip install -q --no-cache-dir einops scipy ftfy regex gdown numpy || exit 1
# CLIP's text encoder is what MoMask conditions on. torchvision is NOT installed on purpose: CLIP only
# needs it for image preprocessing, matching a build to this torch is a version rabbit hole, and
# text_to_clip.py stubs the image half out.
pip install -q --no-cache-dir "clip @ git+https://github.com/openai/CLIP.git" || exit 1
python3 - <<'PY' || exit 1
import sys, types
tv=types.ModuleType('torchvision'); tr=types.ModuleType('torchvision.transforms')
class N:
    def __init__(s,*a,**k): pass
    def __call__(s,x): return x
for n in ('Compose','Resize','CenterCrop','ToTensor','Normalize'): setattr(tr,n,N)
tr.InterpolationMode=types.SimpleNamespace(BICUBIC='bicubic'); tv.transforms=tr
sys.modules['torchvision']=tv; sys.modules['torchvision.transforms']=tr
import torch, clip
print('  torch', torch.__version__, '| CLIP ok | threads', torch.get_num_threads())
PY

echo "── MoMask (default backend: its authors state the demo runs on CPU, no GPU) ─"
if [ ! -d "$DEST/momask" ]; then
  # NOTE: codeload.github.com returns 403 through this environment's proxy, but `git clone` works.
  git clone --depth 1 -q https://github.com/EricGuo5513/momask-codes "$DEST/momask" || exit 1
fi
if [ ! -f "$DEST/momask/checkpoints/t2m/length_estimator/model/finest.tar" ]; then
  mkdir -p "$DEST/momask/checkpoints/t2m"
  # gdown in this environment has no --fuzzy; pass the bare Drive file id instead of a share URL.
  ( cd "$DEST/momask/checkpoints/t2m" \
    && gdown 1vXS7SHJBgWPt59wupQ5UUzhFObrnGkQ0 -O humanml3d_models.zip \
    && unzip -q -o humanml3d_models.zip && rm -f humanml3d_models.zip ) || exit 1
fi
echo "  weights:"; for d in "$DEST/momask"/checkpoints/t2m/*/model; do
  echo "    $(basename "$(dirname "$d")")/$(ls "$d" | head -1)"; done

if [ "$ALL" = "1" ]; then
  echo "── MDM + MotionGPT (code only — both want a GPU to be pleasant) ─────────────"
  [ -d "$DEST/motion-diffusion-model" ] || git clone --depth 1 -q https://github.com/GuyTevet/motion-diffusion-model "$DEST/motion-diffusion-model"
  [ -d "$DEST/MotionGPT" ] || git clone --depth 1 -q https://github.com/OpenMotionLab/MotionGPT "$DEST/MotionGPT"
  echo "  MDM:       $DEST/motion-diffusion-model   (weights: see its README; 1000-step diffusion)"
  echo "  MotionGPT: $DEST/MotionGPT                (weights: huggingface.co/OpenMotionLab; carries a T5)"
  echo "  Both emit the same HumanML3D 22-joint motion, so text_to_clip.py's converter already fits them."
fi

cat <<'EOT'

── ready ───────────────────────────────────────────────────────────────────
  python3 tools/mocap/text_to_clip.py "a person springs off the mat to their feet" \
      --name GETUP_KIPUP --frames 60

  --frames N   ask for a length. The length estimator returned its 196-frame maximum (9.8 s) for
               every prompt tested — a get-up, a taunt and an elbow drop all came back the same
               length, padded with the model holding still. Output is also auto-trimmed to the span
               where the body actually moves (--no-trim keeps the padding).

  Generated clips land in assets/moves/clips/ in the engine's own format, indistinguishable from a
  baked capture. Multiply them: python3 tools/mocap/harvest.py --variants <KEY>
────────────────────────────────────────────────────────────────────────────
EOT
