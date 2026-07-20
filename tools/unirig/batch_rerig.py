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
# FALLBACK SPACES — jasongzy/UniRig intermittently returns Connection refused (ZeroGPU outage). Try
# these in order so a single space being down doesn't block the whole batch. Override with UNIRIG_SPACE.
SPACES = [SPACE] + [s for s in ["VAST-AI/UniRig", "Zhengyi/UniRig", "MohamedRashad/UniRig"] if s != SPACE]

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
    t0 = time.time()
    res = None
    for sp in SPACES:
        try:
            log(f"RIG  {key}: connecting {sp} ...")
            c = Client(sp, token=tok)
            res = c.predict(handle_file(src_path), "glb", api_name="/process_pipeline")
            break
        except Exception as e:
            log(f"     {sp} unavailable ({str(e).splitlines()[0][:80]}) — trying next space")
            res = None
    if res is None:
        log(f"FAIL {key}: every UniRig space is down (tried {len(SPACES)}). Re-run later."); return False
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
    nj = _skin_joint_count(out_path)
    if nj < 16:
        # the hosted space sometimes returns a DEGENERATE rig (e.g. a 4-bone spine, no arms/legs) under
        # queue load. Reject it so it isn't banked as a false success that resume would skip — force a retry.
        log(f"REJECT {key}: degenerate rig ({nj} joints < 16) — deleting so it re-attempts next run")
        try: os.remove(out_path)
        except OSError: pass
        return False
    log(f"DONE {key}: {os.path.basename(out_path)} ({os.path.getsize(out_path)//1024} KB, {nj} joints). "
        f"Gate it: node tools/model_diag/skinqa (then promote if PASS).")
    return True


def _skin_joint_count(glb_path):
    """Count joints in the first skin of a GLB (cheap JSON-chunk read; no deps)."""
    try:
        b = open(glb_path, "rb").read()
        import struct, json as _json
        off = 12
        while off < len(b):
            clen = struct.unpack_from("<I", b, off)[0]; ctype = struct.unpack_from("<I", b, off+4)[0]
            if ctype == 0x4E4F534A:
                j = _json.loads(b[off+8:off+8+clen].decode("utf8"))
                return len(((j.get("skins") or [{}])[0]).get("joints") or [])
            off += 8 + clen
    except Exception:
        pass
    return 0


def _safe(fn, *a):
    try:
        return fn(*a)
    except Exception as e:
        log(f"ERROR {getattr(fn,'__name__',fn)}({a!r}): {e}"); return False


def rig_dropin(glb_path):
    """Auto-rig ANY dropped GLB (owner drops a raw model into assets/models/dropins/; this rigs it
    through UniRig, renames bones, and banks assets/models/<name>_rigged.glb ready to attach in the
    creation suite). Resumable: skips if the rigged output already exists."""
    from gradio_client import Client, handle_file
    name = os.path.splitext(os.path.basename(glb_path))[0]
    safe = "".join(c if c.isalnum() else "_" for c in name).strip("_").upper() or "DROPIN"
    out_path = os.path.join(MODELS, f"{safe}_rigged.glb")
    if os.path.exists(out_path):
        log(f"SKIP dropin {name}: already rigged"); return True
    tok = os.environ.get("HF_TOKEN")
    log(f"RIG  dropin {name}: connecting {SPACE} ...")
    c = Client(SPACE, token=tok)
    t0 = time.time()
    res = c.predict(handle_file(glb_path), "glb", api_name="/process_pipeline")
    path = res[0] if isinstance(res, (list, tuple)) else res
    if isinstance(path, dict):
        path = path.get("path") or path.get("name") or path.get("value")
    if not path or not os.path.exists(path):
        log(f"FAIL dropin {name}: bad space result {res!r}"); return False
    tmp = out_path + ".raw.glb"; shutil.copy(path, tmp)
    subprocess.run(["node", os.path.join(os.path.dirname(__file__), "rename_bones.cjs"), tmp, out_path],
                   capture_output=True, text=True)
    try: os.remove(tmp)
    except OSError: pass
    ok = os.path.exists(out_path)
    log(f"{'DONE' if ok else 'FAIL'} dropin {name}: {os.path.basename(out_path)} in {int(time.time()-t0)}s. "
        f"Gate it (tools/model_diag/skinqa.cjs), then attach in the creation suite.")
    return ok


def main():
    args = sys.argv[1:]
    if "--dropins" in args:
        # process every .glb in assets/models/dropins/ (or a folder passed after --dropins)
        i = args.index("--dropins")
        folder = args[i+1] if i+1 < len(args) and not args[i+1].startswith("--") else os.path.join(MODELS, "dropins")
        if not os.path.isdir(folder):
            print(f"no dropins folder: {folder} (create it and drop GLBs in)"); sys.exit(2)
        glbs = [os.path.join(folder, f) for f in sorted(os.listdir(folder)) if f.lower().endswith(".glb")]
        log(f"=== dropin rig: {len(glbs)} file(s) in {folder} ===")
        ok = sum(1 for g in glbs if _safe(rig_dropin, g))
        log(f"=== dropin rig done: {ok}/{len(glbs)} ==="); return
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
