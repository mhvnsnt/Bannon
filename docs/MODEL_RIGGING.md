# BANNON model rigging/skinning — USE UNIRIG, not our hand-written skinner

**Owner directive (2026-07-18):** stop hand-writing skinning/auto-rig code. The in-house rigger
`tools/rigready/skin.cjs` produces broken fighters — stretched smears, invisible/torn limbs,
unrendered holes. It is **DEPRECATED**. All character rigging goes through a real open-source
auto-rigger: **UniRig**.

## Why UniRig
- **UniRig** — *One Model to Rig Them All* (SIGGRAPH 2025), by Tsinghua University + VAST/Tripo —
  the same VAST/Tripo lineage as our existing Tripo generation pipeline (`tools/tripo/`).
  - Repo: https://github.com/VAST-AI-Research/UniRig
  - Checkpoint: https://huggingface.co/VAST-AI/UniRig (auto-downloaded by the scripts)
  - Two learned stages: (1) GPT-style **skeleton prediction** (topologically valid hierarchy),
    (2) **bone-point cross-attention skinning** = smooth per-vertex weights. This is exactly the
    "proper skinning + auto-rigging" the in-house skinner faked with inverse-distance heuristics.
  - Inputs: `.obj .fbx .glb .vrm`. Output: rigged **GLB/FBX** (skeleton + skin weights) — drops
    straight into our engine's skinned bind path (`_bindFighterGltf`, Mixamo BONE_MAP).
  - Needs **≥8 GB CUDA VRAM** → runs on the owner's GPU host / `forge_server/` (HF Space / Modal /
    RunPod), NOT this CPU sandbox.

## Pipeline (self-host, authoritative)
```bash
# one-time (on the GPU host):
git clone https://github.com/VAST-AI-Research/UniRig && cd UniRig
conda create -n UniRig python=3.11 && conda activate UniRig
python -m pip install torch torchvision && python -m pip install -r requirements.txt
python -m pip install spconv-{cuda} torch_scatter torch_cluster numpy==1.26.4

# per model (skeleton -> skin -> merge onto the original textured mesh):
bash launch/inference/generate_skeleton.sh --input IN.glb              --output work/skel.fbx
bash launch/inference/generate_skin.sh     --input work/skel.fbx       --output work/skin.fbx
bash launch/inference/merge.sh --source work/skin.fbx --target IN.glb  --output OUT_rigged.glb
```
Then decimate for phones and bank:
```bash
node tools/decimate/decimate.mjs OUT_rigged.glb assets/models/<KEY>.glb   # keeps skin weights
```
`tools/unirig/rig.sh <IN.glb> <OUT.glb>` wraps the three UniRig steps (set `UNIRIG_DIR` to the clone).

## Quick path (no self-host): community HF Space
`MohamedRashad/UniRig` (Gradio, https://hf.co/spaces/MohamedRashad/UniRig) runs UniRig on HF GPU —
upload a GLB, download the rigged result. Availability is flaky (community space; may sleep/error).
`tools/unirig/rig_via_space.py` calls it through `gradio_client` and introspects the endpoint.

## PROVEN (2026-07-18): UniRig space → rename → clean bind
The hosted space **`jasongzy/UniRig`** (`/process_pipeline(input, 'glb')`) rigged the unskinned
BANNON.glb into a real 28-joint skinned mesh (~25 min on the free ZeroGPU queue; texture preserved).
UniRig names bones `bone_0..N`, so **`tools/unirig/rename_bones.cjs`** renames them to Mixamo names by
skeleton topology (root=Hips; spine→3-way branch at chest→Neck/Head + two arms by Z-sign; two legs off
Hips). Result binds through the engine's real skinned path (autoRig:false, 12 bones mapped, all 4 limbs
+ spine + head driven) and renders CLEAN in-harness — banked as `assets/models/BANNON_rigged.glb` and
set as BANNON's default. `rig_via_space.py` handles it (`gradio_client`); `rig.sh` step 4 runs the rename.
Batch the rest of the unskinned statues (MAIME/CODY_gear/ONYX*) the same way (the free space is serial +
slow, ~25 min each; a paid/self-host GPU is faster).

## Rules
- **Do NOT auto-rig canon/book models** the owner is authoring (Bannon/Maime/Solaris + Onyx stable +
  the canon roster) — owner supplies those per the MODEL OWNERSHIP DIRECTIVE. UniRig is for agent-made
  fighters and for re-rigging the UNSKINNED banked statues (BANNON.glb/MAIME.glb/CODY_gear.glb/ONYX*.glb
  are `skins:0` 15-part meshes that only rigid-chunk-rig — the "skeletal inversion" contortion).
- After any re-rig: verify in the harness (skinned bind, upright, limbs deform across frames — the
  candy-wrapper/stretch test), THEN update `CHAR_MODEL_DEFAULTS` to the rigged GLB.
- Keep `tools/rigready/skin.cjs` only as a historical reference; never point a default at its output.
