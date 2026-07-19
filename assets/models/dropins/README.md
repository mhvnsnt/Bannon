# Drop-in model auto-rig

Drop any raw GLB character model here, then run:

    HF_TOKEN=... python3 tools/unirig/batch_rerig.py --dropins

Each GLB is auto-rigged through UniRig (real skeleton + smooth skin weights), bone-renamed to the
engine BONE_MAP, and banked as `assets/models/<NAME>_rigged.glb`. Gate it with
`tools/model_diag/skinqa.cjs`, then attach it to a character in the Creation Suite (the model file
input / MODEL_LIBRARY) or point CHAR_MODEL_DEFAULTS at it. Needs a GPU (the hosted UniRig space) —
it can't run in the browser, which is why drop-in rigging is a tool step, not an in-app button.
