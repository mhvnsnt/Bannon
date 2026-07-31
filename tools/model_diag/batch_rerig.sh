#!/usr/bin/env bash
# Re-rig every under-boned model onto the proven 28-joint skeleton.
#
#   bash tools/model_diag/batch_rerig.sh
#
# WHY: rig_audit.cjs measured 55 models wired into the game carrying 16-bone rigs (or no skin).
# 16 joints cannot deform a human torso -- there is no spine chain and no clavicles, so the rigger
# hands torso vertices a mix of Spine and UpLeg and the mesh smears when those bones separate.
# That is the deformation the owner has been reporting across the roster, not a one-model bug.
#
# transfer_weights.cjs copies BANNON_rigged.glb's 28-joint UniRig skeleton onto each mesh by
# spatial correspondence. This is the documented route that beat a degraded UniRig service for the
# Heavyweight (p95 0.3131 FAIL -> 0.0284 PASS).
#
# NOTHING IS OVERWRITTEN. Each result is written alongside as <NAME>_rig28.glb and gated; promotion
# is a separate, deliberate step so a bad transfer can never silently replace a shipped model.
set -u
cd /home/user/Bannon
SRC=assets/models/BANNON_rigged.glb
OUT=/tmp/rerig_log.txt
: > "$OUT"

mapfile -t TARGETS < <(/opt/node22/bin/node -e '
const {execSync}=require("child_process");
const out=execSync("/opt/node22/bin/node tools/model_diag/rig_audit.cjs",{encoding:"utf8",maxBuffer:1e8});
const lines=out.split("\n").filter(l=>/^\s*(>>)/.test(l));
const names=lines.map(l=>{const m=l.match(/([A-Za-z0-9_\-]+\.glb)/); return m?m[1]:null;}).filter(Boolean);
// never re-rig the reference itself, and skip anything already carrying a transferred rig
console.log([...new Set(names)].filter(n=>!/BANNON_rigged|_rig28/.test(n)).join("\n"));
')

echo "re-rigging ${#TARGETS[@]} models onto the 28-joint skeleton" | tee -a "$OUT"
ok=0; fail=0
for m in "${TARGETS[@]}"; do
  base="${m%.glb}"
  dst="assets/models/${base}_rig28.glb"
  if [ -f "$dst" ]; then echo "  skip (exists) $m" | tee -a "$OUT"; continue; fi
  if NODE_PATH=/opt/node22/lib/node_modules timeout 600 /opt/node22/bin/node \
       tools/model_diag/transfer_weights.cjs "$SRC" "assets/models/$m" "$dst" >>"$OUT" 2>&1; then
    if [ -f "$dst" ]; then ok=$((ok+1)); echo "  ok   $m -> ${base}_rig28.glb" | tee -a "$OUT";
    else fail=$((fail+1)); echo "  FAIL $m (no output)" | tee -a "$OUT"; fi
  else
    fail=$((fail+1)); echo "  FAIL $m" | tee -a "$OUT"
  fi
done
echo "done: $ok re-rigged, $fail failed. Log: $OUT" | tee -a "$OUT"
echo "GATE NEXT: node tools/model_diag/rig_audit.cjs   and   node tools/model_diag/skinqa.cjs <files>"
