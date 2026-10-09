#!/bin/bash
set -u
BLENDER="$HOME/workspace/tools/blender/blender-4.0.2-linux-x64/blender"
SCRIPT="$HOME/workspace/bannon-video-pipe/scripts/render_take.py"
GLB="$HOME/workspace/bannon-video-pipe/repo/assets/models/STICKUP_repaired.glb"
WALK="$HOME/workspace/bannon-video-pipe/repo/assets/mocap/walking.fbx"
OUT="$HOME/workspace/bannon-video-pipe/out/STICKUP_V2/takes"
export LD_LIBRARY_PATH="$HOME/workspace/tools/egl-stack/usr/lib/x86_64-linux-gnu"
run_take() {
  local name="$1" frames="$2" camera="$3" overlay="$4" headshake="$5"
  local dir="$OUT/$name"; mkdir -p "$dir"
  local have=$(ls "$dir"/frame_*.png 2>/dev/null | wc -l)
  if [ "$have" -ge "$frames" ]; then echo "SKIP $name ($have/$frames)"; return 0; fi
  echo "=== RENDER $name ($frames frames) ==="
  xvfb-run -a env -u PYTHONPATH "$BLENDER" -b -P "$SCRIPT" -- \
    --glb "$GLB" --mocap "$WALK" --inplace 1 --facing -90 \
    --overlay "$overlay" --headshake "$headshake" \
    --camera "$camera" --frames "$frames" --fps 24 \
    --output "$dir/" --width 960 --height 540 2>&1 | grep -E "Retargeted|DONE|Error|OSError" | head -6
  echo "=== $name done: $(ls "$dir"/frame_*.png 2>/dev/null | wc -l)/$frames ==="
}
run_take take1 192 push_in  relaxed   0
run_take take2 288 closeup  fingerguns 0
run_take take3 240 low_angle relaxed  120
run_take take4 240 wide     relaxed   0
run_take take5 72  wide     armshold  0
echo "ALL TAKES COMPLETE"
