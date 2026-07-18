#!/usr/bin/env bash
# BANNON model rigging via UniRig (VAST-AI-Research) — the open-source replacement for the deprecated
# tools/rigready/skin.cjs. Runs UniRig's skeleton -> skin -> merge pipeline on a mesh and produces a
# properly SKINNED GLB (smooth per-vertex weights, valid skeleton) that binds to the engine's Mixamo
# BONE_MAP path. Needs a CUDA GPU (>=8GB VRAM) + a UniRig clone — see docs/MODEL_RIGGING.md.
#
#   UNIRIG_DIR=/path/to/UniRig  bash tools/unirig/rig.sh  input.glb  assets/models/KEY.glb
#
# NOT runnable in the CPU sandbox; run on the owner's GPU host / forge_server.
set -euo pipefail
IN="${1:?usage: rig.sh <input.glb|obj|fbx|vrm> <output.glb>}"
OUT="${2:?usage: rig.sh <input> <output.glb>}"
UNIRIG_DIR="${UNIRIG_DIR:-$HOME/UniRig}"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

if [ ! -d "$UNIRIG_DIR/launch/inference" ]; then
  echo "UniRig not found at UNIRIG_DIR=$UNIRIG_DIR"
  echo "  git clone https://github.com/VAST-AI-Research/UniRig && follow docs/MODEL_RIGGING.md"
  exit 2
fi
cd "$UNIRIG_DIR"
echo "[1/3] skeleton prediction..."
bash launch/inference/generate_skeleton.sh --input "$IN"          --output "$WORK/skel.fbx"
echo "[2/3] skinning weight prediction..."
bash launch/inference/generate_skin.sh     --input "$WORK/skel.fbx" --output "$WORK/skin.fbx"
echo "[3/3] merge onto original textured mesh..."
bash launch/inference/merge.sh --source "$WORK/skin.fbx" --target "$IN" --output "$OUT"
echo "rigged -> $OUT"
echo "next: node tools/decimate/decimate.mjs \"$OUT\" \"$OUT\"   # phone-size, keeps skin weights"
echo "then: verify in the harness before pointing CHAR_MODEL_DEFAULTS at it (docs/MODEL_RIGGING.md)"
