#!/usr/bin/env python3
"""BATCH re-rig BANNON fighters through the hosted UniRig space — the automatic, no-Blender fix for
the smearing skin.cjs weights (see docs/MODEL_QA.md for why + the objective gate that proved it).

For each KEY it:
  1. uploads the current banked mesh to jasongzy/UniRig  /process_pipeline(input,'glb')
  2. downloads the freshly rigged GLB (real 28-joint skeleton + smooth cross-attention weights)
  3. renames bone_N -> Mixamo names by topology (tools/unirig/rename_bones.cjs) so it binds our BONE_MAP
  4. writes assets/models/<KEY>_rigged.glb   (does NOT overwrite the original until the gate passes)

RESUMABLE: skips any KEY whose _rigged.glb already exists. Logs to tools/unirig/rerig_log.txt.
The space is ~20-25 min/model on the free ZeroGPU queue, serial — run it in the background and let it
churn; each output is gated by tools/model_diag/skinqa (run separately) before being promoted to default.

    HF_TOKEN=... python3 tools/unirig/batch_rerig.py CIPHER ECHO STATIC ...
    HF_TOKEN=... python3 tools/unirig/batch_rerig.py --fails      # the known FAIL set

Not destructive: promotion to CHAR_MODEL_DEFAULTS is a separate, gated step.
"""
import os, sys, subprocess, shutil, time, traceback

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS = os.path.join(REPO, "assets", "models")
LOG = os.path.join(os.path.dirname(__file__), "rerig_log.txt")
SPACE = os.environ.get("UNIRIG_SPACE", "jasongzy/UniRig")

# KEY -> source mesh to feed UniRig (the current banked model; UniRig ignores any existing weights)
SRC = {
    "CIPHER": "CIPHER.glb", "ECHO": "ECHO.glb", "STATIC": "STATIC.glb",
    "CODY": "CODY_gear_skinned.glb", "CAIN_ELIAS": "CAIN_ELIAS_gear.glb",
    "STICKUP": "STICKUP.glb", "ONYX": "ONYX_skinned.glb",
    "HOLLOW": "HOLLOW.glb", "HALL_NIGHTER": "HALL_NIGHTER.glb", "EDWIN_KENNEDY": "EDWIN_KENNEDY.glb",
    "PABLO": "PABLO.glb", "TYNESHIA": "TYNESHIA.glb", "TRIPLE_XXX": "TRIPLE_XXX.glb",
    "EL_TORO_DE_ORO": "EL_TORO_DE_ORO.glb", "STAN_COMBS": "STAN_COMBS_gear.glb",
    "BRUTUS": "BRUTUS.glb", "TITAN": "TITAN.glb", "MASTER_SENSEI": "MASTER_SENSEI.glb",
    "WRECK_PATTERSON": "WRECK_PATTERSON.glb", "NPC_FINXSSE": "NPC_FINXSSE.glb",
}
FAILS = ["CIPHER", "ECHO", "STATIC", "CODY", "CAIN_ELIAS", "STICKUP", "ONYX"]


def log(msg):
    line = time.strftime("%H:%M:%S") + " " + msg
    print(line, flush=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")


def rerig(key):
    src = SRC.get(key)
    if not src:
        log(f"SKIP {key}: no source mapping"); return False
    src_path = os.path.join(MODELS, src)
    if not os.path.exists(src_path):
        log(f"SKIP {key}: source missing {src}"); return False
    out_path = os.path.join(MODELS, f"{key}_rigged.glb")
    if os.path.exists(out_path):
        log(f"SKIP {key}: already rigged ({os.path.basename(out_path)})"); return True
    from gradio_client import Client, handle_file
    tok = os.environ.get("HF_TOKEN")
    log(f"RIG  {key}: connecting {SPACE} ...")
    c = Client(SPACE, token=tok)
    t0 = time.time()
    res = c.predict(handle_file(src_path), "glb", api_name="/process_pipeline")
    path = res[0] if isinstance(res, (list, tuple)) else res
    if isinstance(path, dict):
        path = path.get("path") or path.get("name") or path.get("value")
    if not path or not os.path.exists(path):
        log(f"FAIL {key}: bad space result {res!r}"); return False
    tmp = out_path + ".raw.glb"
    shutil.copy(path, tmp)
    log(f"RIG  {key}: got rigged mesh in {int(time.time()-t0)}s -> renaming bones")
    r = subprocess.run(["node", os.path.join(os.path.dirname(__file__), "rename_bones.cjs"), tmp, out_path],
                       capture_output=True, text=True)
    log("     " + (r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr) else "     (rename done)")
    try: os.remove(tmp)
    except OSError: pass
    if not os.path.exists(out_path):
        log(f"FAIL {key}: rename produced no output"); return False
    log(f"DONE {key}: {os.path.basename(out_path)} ({os.path.getsize(out_path)//1024} KB). "
        f"Gate it: node tools/model_diag/skinqa (then promote if PASS).")
    return True


def main():
    args = sys.argv[1:]
    if "--fails" in args:
        keys = FAILS
    else:
        keys = [a for a in args if not a.startswith("--")]
    if not keys:
        print(__doc__); sys.exit(2)
    log(f"=== batch_rerig start: {keys} ===")
    ok = 0
    for k in keys:
        try:
            if rerig(k):
                ok += 1
        except Exception as e:
            log(f"ERROR {k}: {e}")
            log(traceback.format_exc())
    log(f"=== batch_rerig done: {ok}/{len(keys)} ===")


if __name__ == "__main__":
    main()
