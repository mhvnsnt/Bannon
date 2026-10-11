#!/usr/bin/env bash
# optimize_glb.sh — lossy/lossless GLB optimization via gltf-transform (Apache-2.0).
# Requires: npx @gltf-transform/cli (auto-fetched on first run).
# Usage: bash optimize_glb.sh input.glb output.glb
set -euo pipefail
IN="${1:?usage: optimize_glb.sh input.glb output.glb}"
OUT="${2:?usage: optimize_glb.sh input.glb output.glb}"
if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found; install Node.js first" >&2; exit 1
fi
npx --yes @gltf-transform/cli optimize "$IN" "$OUT" \
  --compress draco \
  --texture-compress webp \
  --simplify false
echo "optimized -> $OUT"
