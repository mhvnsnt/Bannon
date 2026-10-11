#!/bin/bash
# repair_one.sh — full node-only repair pipeline for one character GLB.
# Usage: repair_one.sh <CHAR>   (reads assets/models/<CHAR>.glb, writes out/<CHAR>_repaired.glb)
# Skinned: decompress -> prune(2.5) -> subtree-prune -> webp-decl patch
# No-skin:  normalize_to_donor -> transfer_weights -> webp patch -> prune -> subtree-prune
set -u
REPO="$HOME/workspace/bannon-repair"
TOOLS="$REPO/tools/model_diag"
OUT="$REPO/out"
CHAR="$1"
MODE="${2:-auto}"  # auto | prune | transfer
SRC="$REPO/assets/models/${CHAR}.glb"
DST="$OUT/${CHAR}_repaired.glb"
[ -f "$SRC" ] || { echo "missing $SRC"; exit 1; }

cd "$REPO"
HAS_SKIN=$(node /tmp/work/tools/qa_pose.cjs "$SRC" 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['joints']>0)")
echo "== $CHAR has_skin=$HAS_SKIN mode=$MODE"

WORK="/tmp/work/repair_$CHAR.glb"
# transfer path if: no skin, or explicitly requested, or (auto + has skin + flagged bad)
if [ "$HAS_SKIN" = "False" ] || [ "$MODE" = "transfer" ]; then
  TGT_SRC="$SRC"
  # multi-part target? merge to single primitive first (transfer requires it)
  NPRIM=$(python3 -c "
import json,struct
with open('$SRC','rb') as fh: data=fh.read()
clen,ctype=struct.unpack('<II',data[12:20])
js=json.loads(data[20:20+clen])
print(sum(len(m['primitives']) for m in js['meshes']))")
  if [ "$NPRIM" -gt 1 ]; then
    echo "-- merge_parts ($NPRIM primitives)"
    node /tmp/work/tools/merge_parts.cjs "$SRC" /tmp/work/${CHAR}_merged.glb 2>&1 | tail -1
    TGT_SRC=/tmp/work/${CHAR}_merged.glb
  fi
  echo "-- normalize to donor space"
  node /tmp/work/tools/normalize_to_donor.cjs "$REPO/assets/models/BANNON_rigged.glb" "$TGT_SRC" /tmp/work/${CHAR}_norm.glb 2>&1 | tail -2
  echo "-- transfer_weights from BANNON_rigged"
  node "$TOOLS/transfer_weights.cjs" "$REPO/assets/models/BANNON_rigged.glb" /tmp/work/${CHAR}_norm.glb "$WORK" 2>&1 | grep -E "align|transferred"
  python3 /tmp/work/fix_webp_decl.py "$WORK"
else
  echo "-- decompress"
  node /tmp/work/tools/decompress.cjs "$SRC" "$WORK" 2>&1 | tail -1
fi

echo "-- prune_weights (factor 2.5)"
node "$TOOLS/prune_weights.cjs" "$WORK" "$WORK.pruned.glb" 2>&1 | grep -E "pruned" | head -1
mv "$WORK.pruned.glb" "$WORK"

echo "-- subtree_prune"
node /tmp/work/tools/subtree_prune.cjs "$WORK" "$WORK" 2>&1 | tail -1
python3 /tmp/work/fix_webp_decl.py "$WORK" 2>/dev/null
cp "$WORK" "$DST"
echo "-- QA before/after"
node /tmp/work/tools/qa_pose.cjs "$SRC" "$DST" | python3 -c "
import json,sys
for l in sys.stdin:
    r=json.loads(l)
    print(r['file'],'joints=',r.get('joints'),'p95=',r.get('p95'),'p999=',r.get('p999'),'spikes=',r.get('spikes'),'worst=',r.get('worstSpike'))"
echo "wrote $DST"
