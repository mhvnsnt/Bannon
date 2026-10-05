#!/usr/bin/env python3
"""BANNON Character Forge — free, open-source text/image -> game-ready GLB.

Pipeline (one command, zero spend on models):
  brief/prompt/image --> [1] reference image --> [2] 3D mesh (TripoSR, MIT)
  --> [3] auto-rig (UniRig, open weights) --> [4] rename bones -> Mixamo
  --> [5] decimate --> [6] deform QA --> [7] turnaround PNGs --> assets/models/

Usage:
  python tools/forge/generate.py --prompt "..." --out assets/models/FOO.glb
  python tools/forge/generate.py --image ref.png --out assets/models/FOO.glb
  python tools/forge/generate.py --brief tools/forge/briefs/FOO.md --out assets/models/FOO.glb
  python tools/forge/generate.py --brief ... --dry-run      # full plan, no GPU needed
  python tools/forge/generate.py --image ... --backend trellis --out ...

Backends:
  triposr (default) — MIT, image->3D, ~6 GB VRAM, --bake-texture for real textures.
  trellis           — MIT, text/image->3D, higher quality, needs ~16 GB VRAM.

GPU is REQUIRED for stages 2 and 3. Everything else (brief parse, QA, snapshots,
banking) runs on CPU. Without CUDA this script prints the exact GPU-box recipe
and exits 3 — see tools/forge/FORGE.md.
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FORGE = os.path.join(ROOT, "tools", "forge")
TRIPOSR_DIR = os.environ.get("TRIPOSR_DIR", os.path.expanduser("~/TripoSR"))
TRELLIS_DIR = os.environ.get("TRELLIS_DIR", os.path.expanduser("~/TRELLIS"))

A_POSE_SUFFIX = ("full-body front-facing symmetrical A-pose, arms slightly away from "
                 "the body, feet shoulder-width apart, plain flat white background, "
                 "even studio lighting, full figure head to boots centered")
NEGATIVE = ("suspenders, singlet straps, logos, brand logo, text, watermark, symbols, "
            "cartoon, superhero costume, floating gear, nonsensical straps")


def run(cmd, **kw):
    print("+ " + " ".join(cmd))
    return subprocess.run(cmd, check=True, **kw)


def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)


def has_cuda():
    try:
        import torch
        return bool(torch.cuda.is_available())
    except Exception:
        return False


def parse_brief(path):
    """Read a character_brief.md into a dict of the filled fields."""
    text = open(path, encoding="utf-8").read()
    fields = {}
    for m in re.finditer(r"^- \*\*(.+?)\:\*\*\s*(.+?)$", text, re.M):
        fields[m.group(1).strip().lower()] = m.group(2).strip()
    neg = re.search(r"## Negative.*?\n(.*?)(?:\n## |\Z)", text, re.S)
    if neg and "REPLACE" not in neg.group(1):
        fields["negative"] = neg.group(1).strip()
    return fields


def brief_to_image_prompt(fields):
    parts = []
    for key in ("ethnicity / skin", "body type", "trunks/tights", "boots",
                "gloves/pads", "hair", "face/body paint or tattoos", "colors", "vibe"):
        v = fields.get(key, "")
        if v and "REPLACE" not in v:
            parts.append(v)
    name = fields.get("name (display)", "wrestler")
    prompt = (f"semi-realistic pro-wrestler {name}, " + ", ".join(parts)
              + ", " + A_POSE_SUFFIX)
    return prompt


def stage_reference_image(args, fields, workdir):
    """Stage 1: produce the front A-pose reference image for image->3D."""
    if args.image:
        print(f"[1/7] reference image: using supplied {args.image}")
        return os.path.abspath(args.image)
    ref = os.path.join(workdir, "reference.png")
    if os.path.exists(ref):
        print(f"[1/7] reference image: reusing {ref}")
        return ref
    prompt = brief_to_image_prompt(fields) if fields else (args.prompt + ", " + A_POSE_SUFFIX)
    print("[1/7] reference image: NO --image supplied.")
    print("      Generate it with any image model using this exact prompt, save as")
    print(f"      {ref}, then re-run. Suggested: the agent's media pipeline, or")
    print("      HuggingFace Inference (FLUX/SDXL) — free tiers exist.")
    print("---- prompt start ----")
    print(prompt)
    print("negative: " + (fields.get("negative") if fields else NEGATIVE))
    print("---- prompt end ----")
    open(os.path.join(workdir, "reference_prompt.txt"), "w").write(
        prompt + "\nnegative: " + (fields.get("negative") if fields else NEGATIVE))
    if args.dry_run:
        return ref  # plan against the would-be path; image still pending for real runs
    return None


def stage_generate(args, image, workdir):
    """Stage 2: image -> textured GLB. NEEDS GPU."""
    raw = os.path.join(workdir, "raw.glb")
    if args.backend == "trellis":
        if not os.path.isdir(os.path.join(TRELLIS_DIR, "trellis")):
            sys.exit(f"[forge] TRELLIS not found at {TRELLIS_DIR}; see FORGE.md for the GPU-box recipe.")
        run([sys.executable, os.path.join(TRELLIS_DIR, "run.py"),
             "--image", image, "--output", raw])
    else:  # triposr
        runpy = os.path.join(TRIPOSR_DIR, "run.py")
        if not os.path.isfile(runpy):
            sys.exit(f"[forge] TripoSR not found at {TRIPOSR_DIR} "
                     f"(git clone https://github.com/VAST-AI-Research/TripoSR {TRIPOSR_DIR}); "
                     "see FORGE.md.")
        run([sys.executable, runpy, image,
             "--output-dir", workdir, "--bake-texture", "--texture-resolution", "1024"])
        # run.py writes <imagename>.glb into output-dir
        cands = [os.path.join(workdir, f) for f in os.listdir(workdir) if f.endswith(".glb")]
        if not cands:
            sys.exit("[forge] TripoSR produced no .glb — check its log above.")
        newest = max(cands, key=os.path.getmtime)
        shutil.move(newest, raw)
    size = os.path.getsize(raw)
    print(f"[2/7] generated {raw} ({size} bytes)")
    if size < 1024:
        sys.exit("[forge] generated GLB suspiciously small (<1KB) — aborting.")
    return raw


def stage_rig(raw, workdir):
    """Stage 3: UniRig auto-rig -> Mixamo-named skinned GLB. NEEDS GPU (>=8GB)."""
    rigged = os.path.join(workdir, "rigged.glb")
    rigsh = os.path.join(ROOT, "tools", "unirig", "rig.sh")
    run(["bash", rigsh, raw, rigged])
    return rigged


def stage_decimate(rigged, workdir):
    """Stage 5: phone-size decimate (keeps skin weights). CPU."""
    dec = os.path.join(workdir, "decimated.glb")
    run(["node", os.path.join(ROOT, "tools", "decimate", "decimate.mjs"), rigged, dec])
    return dec


def stage_qa(model):
    """Stage 6: deformation QA (pure JS, CPU). Prints verdict; returns JSON path."""
    out = model + ".romqa.json"
    r = sh(f"node {ROOT}/tools/rigging/rom_qa.cjs {model}")
    print(r.stdout[-2000:])
    if r.returncode != 0:
        print(f"[forge] QA WARNING: rom_qa exited {r.returncode} (see above)")
    open(out, "w").write(r.stdout)
    return out


def stage_snapshot(model, label, shots_dir):
    """Stage 7: turnaround PNGs via the model_preview snapshotter (needs playwright)."""
    os.makedirs(shots_dir, exist_ok=True)
    r = sh(f"node {ROOT}/tools/model_preview/snapshot.cjs {model} {shots_dir} {label}")
    print(r.stdout[-1500:])
    if r.returncode != 0:
        print(f"[forge] snapshot WARNING (exit {r.returncode}); RIG diagnostics above. "
              "PNGs may be missing — check playwright/chromium install.")
    return shots_dir


def stage_bank(model, out):
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    shutil.copy2(model, out)
    h = sh(f"sha256sum {out}").stdout.split()[0]
    print(f"[bank] {out}  sha256={h}")
    return out, h


def main():
    ap = argparse.ArgumentParser(description="BANNON Character Forge")
    ap.add_argument("--prompt", help="text description (image step generates the ref first)")
    ap.add_argument("--image", help="reference image (front A-pose) — skips the image step")
    ap.add_argument("--brief", help="character_brief.md path")
    ap.add_argument("--out", required=True, help="final GLB path, e.g. assets/models/FOO.glb")
    ap.add_argument("--backend", choices=["triposr", "trellis"], default="triposr")
    ap.add_argument("--dry-run", action="store_true", help="print the plan, run no GPU stages")
    ap.add_argument("--skip-rig", action="store_true")
    ap.add_argument("--skip-qa", action="store_true")
    ap.add_argument("--skip-snapshot", action="store_true")
    args = ap.parse_args()

    if not (args.prompt or args.image or args.brief):
        ap.error("need one of --prompt / --image / --brief")

    fields = parse_brief(args.brief) if args.brief else {}
    label = (fields.get("charkey") or os.path.splitext(os.path.basename(args.out))[0]).upper()
    workdir = os.path.join(FORGE, "work", label)
    os.makedirs(workdir, exist_ok=True)
    manifest = {"label": label, "backend": args.backend, "stages": {}}

    # Stage 1 — reference image (CPU / agent media pipeline)
    image = stage_reference_image(args, fields, workdir)
    manifest["stages"]["reference_image"] = image or "PENDING — generate from reference_prompt.txt"
    if image is None:
        json.dump(manifest, open(os.path.join(workdir, "manifest.json"), "w"), indent=2)
        print("[forge] stopped: produce the reference image, then re-run with --image.")
        return 0

    gpu = has_cuda()
    if args.dry_run:
        print(f"[forge] DRY RUN for {label} (backend={args.backend}, cuda={gpu})")
        plan = [
            f"2. generate : {args.backend} {image} -> raw.glb  (NEEDS GPU)",
            f"3. rig      : tools/unirig/rig.sh raw.glb -> rigged.glb  (NEEDS GPU >=8GB)",
            "4. rename   : inside rig.sh (rename_bones.cjs) -> Mixamo names",
            "5. decimate : tools/decimate/decimate.mjs -> decimated.glb (CPU)",
            "6. qa       : tools/rigging/rom_qa.cjs (CPU, pure JS)",
            "7. snapshot : tools/model_preview/snapshot.cjs -> turnaround PNGs (CPU+chromium)",
            f"8. bank     : copy -> {args.out} + sha256",
        ]
        print("\n".join(plan))
        manifest["dry_run_plan"] = plan
        json.dump(manifest, open(os.path.join(workdir, "manifest.json"), "w"), indent=2)
        print(f"[forge] plan written to {workdir}/manifest.json")
        return 0

    if not gpu:
        print("[forge] BLOCKED: no CUDA GPU in this environment (torch.cuda.is_available()=False).")
        print("The generation (TripoSR) and rig (UniRig) stages need a GPU box.")
        print("See tools/forge/FORGE.md 'GPU box recipe' — then copy this workdir over and re-run.")
        print(f"Reference image ready at: {image}")
        return 3

    # Stages 2-8
    raw = stage_generate(args, image, workdir);      manifest["stages"]["raw_glb"] = raw
    model = raw
    if not args.skip_rig:
        model = stage_rig(raw, workdir);             manifest["stages"]["rigged_glb"] = model
        model = stage_decimate(model, workdir);      manifest["stages"]["decimated_glb"] = model
    if not args.skip_qa:
        manifest["stages"]["qa"] = stage_qa(model)
    if not args.skip_snapshot:
        shots = os.path.join(FORGE, "work", label, "shots")
        manifest["stages"]["shots"] = stage_snapshot(model, label, shots)
    out, h = stage_bank(model, args.out)
    manifest["stages"]["banked"] = {"path": out, "sha256": h}
    json.dump(manifest, open(os.path.join(workdir, "manifest.json"), "w"), indent=2)
    print(f"[forge] DONE: {label} -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
