#!/usr/bin/env bash
# ingest_character.sh — a raw generated body -> a wired, gated, in-game wrestler. One command.
#
#   bash tools/models/ingest_character.sh "assets/models/incoming/jager default no beard.glb" JAGER
#   bash tools/models/ingest_character.sh <raw.glb> <KEY> [donor.glb] [targetTris]
#
# Written after doing this by hand three times (TARZANIAN_DEVIL, JAGER, JAGER no-beard) and hitting
# the SAME four traps each time. Every step below is a trap, not a preference:
#
# 1. DECIMATE FIRST, AND ITERATE. A 2,000,000-triangle Tripo body will not reach 18k in one pass —
#    meshoptimizer's error bound stops it (measured 2.0M -> 143k -> 71k -> 50k). Weights are assigned
#    per FINAL vertex, so decimating first is also 25x cheaper than transferring onto 1.1M verts.
#
# 2. PRE-SCALE THE MESH TO THE DONOR'S HEIGHT BEFORE TRANSFERRING. transfer_weights aligns with a
#    single uniform yScale, so a 0.98m body against a 1.8m rig does every nearest-neighbour lookup in
#    a stretched space. MEASURED: mean correspondence 0.0506m and the widest piece spanning 20 of 58
#    joints; pre-scaled, 0.0182m and 35 joints.
#
# 3. RESCALE THE MESH TO THE SKELETON AFTERWARDS. The transfer copies the donor's 1.8m skeleton onto
#    the body, leaving bone/mesh ratio ~1.94 — the engine's fit-to-1.78m reads the BONE span, so the
#    visible body ends up half height. Same defect as TARZANIAN_DEVIL 1.936 and CODY_gear 1.944.
#
# 4. LOOK AT IT. The first mesh ever generated here came out lying on its back with a perfect vertex
#    count, and skinqa cannot see a severed rig at all. The snapshot is not a formality.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
RAW="$1"; KEY="$2"; DONOR="${3:-assets/models/VIPER.glb}"; TARGET="${4:-18000}"
[ -f "$RAW" ] || { echo "no such file: $RAW"; exit 2; }
[ -n "$KEY" ] || { echo "usage: ingest_character.sh <raw.glb> <KEY> [donor.glb] [targetTris]"; exit 2; }

WORK="/tmp/ingest_$KEY"; rm -rf "$WORK"; mkdir -p "$WORK"
cp "$RAW" "$WORK/raw.glb"
echo "== $KEY  <- $(basename "$RAW")"

echo "-- 1. decimate (iterated: one pass cannot cross the simplifier's error bound)"
for i in 1 2 3 4; do
  node --max-old-space-size=8192 tools/assets/decimate_rigs.cjs "$WORK/raw.glb" \
       --target "$TARGET" --error 0.05 2>&1 | grep -E "^  ok|REJECT" || true
done

echo "-- 2. pre-scale to the donor's height"
node --max-old-space-size=8192 -e '
const {NodeIO}=require("@gltf-transform/core"),{ALL_EXTENSIONS}=require("@gltf-transform/extensions");
const {MeshoptEncoder,MeshoptDecoder}=require("meshoptimizer");
const {normalizeBuffer}=require("./tools/model_diag/fix_extensions_used.cjs");const fs=require("fs");
const [IN,OUT,DON]=process.argv.slice(1);
(async()=>{ await MeshoptEncoder.ready; await MeshoptDecoder.ready;
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({"meshopt.encoder":MeshoptEncoder,"meshopt.decoder":MeshoptDecoder});
 const H=async p=>{ const d=await io.readBinary(normalizeBuffer(fs.readFileSync(p)));
   let lo=1e9,hi=-1e9; for(const m of d.getRoot().listMeshes())for(const pr of m.listPrimitives()){
     const P=pr.getAttribute("POSITION"); if(!P)continue; const e=[0,0,0];
     for(let i=0;i<P.getCount();i++){P.getElement(i,e); if(e[1]<lo)lo=e[1]; if(e[1]>hi)hi=e[1];}} return {d,h:hi-lo}; };
 const want=(await H(DON)).h;
 const {d,h}=await H(IN); const k=want/h; const seen=new Set();
 for(const m of d.getRoot().listMeshes())for(const pr of m.listPrimitives()){
   const P=pr.getAttribute("POSITION"); if(!P||seen.has(P))continue; seen.add(P);
   const a=P.getArray(); for(let i=0;i<a.length;i++)a[i]*=k; P.setArray(a); }
 fs.writeFileSync(OUT, Buffer.from(await io.writeBinary(d)));
 console.log("   height %s -> %s (donor %s)", h.toFixed(3), (h*k).toFixed(3), want.toFixed(3));
})();' "$WORK/raw.glb" "$WORK/scaled.glb" "$DONOR"

echo "-- 3. transfer the donor rig"
node --max-old-space-size=8192 tools/model_diag/transfer_weights.cjs "$DONOR" "$WORK/scaled.glb" "$WORK/rigged.glb" 2>&1 | grep -E "align|mean|wrote"

echo "-- 4. mesh to skeleton"
cp "$WORK/rigged.glb" "assets/models/$KEY.glb"
node tools/model_diag/rescale_mesh.cjs "assets/models/$KEY.glb" "assets/models/$KEY.glb" 2>&1 | grep -E "scaling|ratio|OK" || true

echo "-- 5. gates"
node tools/model_diag/skinqa.cjs "$KEY.glb" 2>&1 | head -1
node tools/model_diag/rig_continuity.cjs "$KEY.glb" 2>&1 | grep -E "WHOLE|SEVERED|MIXED|RIGID"
node tools/model_diag/rescale_mesh.cjs "assets/models/$KEY.glb" --check 2>&1 | grep -E "ratio"

echo "-- 6. SEE IT (this step is not a formality — read the note at the top of this file)"
node tools/model_preview/snapshot.cjs "assets/models/$KEY.glb" "/tmp/shot_$KEY" "$KEY" 2>&1 | grep -E "RIG|SHOTS"
echo "   -> /tmp/shot_$KEY/${KEY}_fq.png"
