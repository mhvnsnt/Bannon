#!/usr/bin/env python3
"""BANNON model rigging via a hosted UniRig Gradio Space (no local GPU needed).

Quick path when we don't want to self-host UniRig: submit a mesh to a community UniRig Space
(default MohamedRashad/UniRig) which runs on HF GPU, and download the rigged GLB/FBX back.
This is the open-source auto-rigger the owner asked for — NOT our deprecated tools/rigready/skin.cjs.

    python3 tools/unirig/rig_via_space.py input.glb assets/models/KEY.glb [--space MohamedRashad/UniRig]

Notes:
- Community spaces sleep / error / queue; if it fails, self-host per docs/MODEL_RIGGING.md.
- We introspect the space's API at runtime (view_api) because endpoint names vary between forks,
  so we don't hardcode a signature that silently breaks.
- Requires `gradio_client` (present in the sandbox). Set HF_TOKEN for queue priority if available.
"""
import sys, os, argparse, shutil

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inp"); ap.add_argument("out")
    ap.add_argument("--space", default="MohamedRashad/UniRig")
    a = ap.parse_args()
    try:
        from gradio_client import Client, handle_file
    except Exception as e:
        print("gradio_client not available:", e); sys.exit(2)

    tok = os.environ.get("HF_TOKEN")
    print(f"connecting to space {a.space} ...")
    client = Client(a.space, hf_token=tok)
    api = client.view_api(return_format="dict")
    named = (api or {}).get("named_endpoints", {}) or {}
    # pick the endpoint that takes a file input and returns a model file (rig/skeleton/skin/generate)
    pref = ("rig", "generate", "process", "skin", "predict", "run")
    cand = sorted(named.keys(), key=lambda n: next((i for i, p in enumerate(pref) if p in n.lower()), 99))
    if not cand:
        print("no named endpoints on this space; check it manually:", a.space); sys.exit(3)
    ep = cand[0]
    print("using endpoint:", ep)
    try:
        res = client.predict(handle_file(a.inp), api_name=ep)
    except Exception as e:
        print("space call failed (may be asleep/queued/errored):", e)
        print("fall back to self-host: docs/MODEL_RIGGING.md"); sys.exit(4)
    # result may be a path or a (path, ...) tuple
    path = res[0] if isinstance(res, (list, tuple)) else res
    if isinstance(path, dict):
        path = path.get("path") or path.get("name") or path.get("value")
    if not path or not os.path.exists(path):
        print("unexpected result from space:", res); sys.exit(5)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    shutil.copy(path, a.out)
    print("rigged ->", a.out)
    print("next: node tools/decimate/decimate.mjs", a.out, a.out, " then verify in the harness")

if __name__ == "__main__":
    main()
