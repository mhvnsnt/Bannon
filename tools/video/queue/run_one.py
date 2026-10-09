#!/usr/bin/env python3
"""run_one.py — the video machine's one-character orchestrator.

Takes the head of tools/video/queue/queue.json with status "queued"
(or --character NAME to override) and runs the full chain for exactly
one character:

  capture (capture_entrance.cjs — ENTRANCE CINEMATIC, El Toro grade)
    -> fail-closed gates (entrance-specific checks)
    -> assemble (assemble_character_video.py, beat-synced, loudness-normalized)
    -> thumbnail (make_thumbnail.py, beat-aligned)
    -> encode (delivery profile, inside assemble)
    -> SHA256SUMS
    -> VIDEO_LOG.md entry
    -> queue entry marked done

One character per run. Exit nonzero on any gate failure; the character
stays "queued" (never marked done on failure). Real capture only —
no placeholders, no fake footage.

The capture is an ENTRANCE CINEMATIC (not a fight recording): the game's
cinematic entrance kit stages the character's walkout with directed
multi-angle takes, beat-synced in assembly. This is the El Toro de Oro
standard — owner-rejected fight-recordings are not produced by default.

Usage:
  python3 tools/video/queue/run_one.py                 # queue head
  python3 tools/video/queue/run_one.py --character VIPER
  python3 tools/video/queue/run_one.py --dry-run       # print the plan, run nothing
"""
import argparse
import glob
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
QUEUE_DEFAULT = os.path.join(HERE, "queue.json")
LOG_PATH = os.path.join(HERE, "VIDEO_LOG.md")


def sh(cmd, cwd=ROOT, env=None):
    """Run cmd (list). Returns (rc, combined output). Never raises."""
    e = dict(os.environ)
    if env:
        e.update(env)
    p = subprocess.run(cmd, cwd=cwd, env=e, capture_output=True, text=True)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def fail(msg):
    print(f"BLOCK: {msg}", file=sys.stderr)
    sys.exit(1)


def load_queue(path):
    with open(path) as f:
        data = json.load(f)
    return data.get("queue", [])


def save_queue(path, entries):
    with open(path, "w") as f:
        json.dump({"_note": "Owner-edited priority queue. See run_one.py.",
                   "queue": entries}, f, indent=1)
        f.write("\n")


def pick(entries, override):
    if override:
        for e in entries:
            if e["character"] == override:
                return e
        fail(f"character '{override}' not in queue.json")
    for e in entries:
        if e.get("status") == "queued":
            return e
    fail("queue is empty — nothing with status 'queued'")


def check_gates(report_path, outdir):
    """Fail-closed gates for an ENTRANCE-CINEMATIC capture.

    Verifies the capture_entrance.cjs contract: take PNG sequences exist,
    the cine setup staged (HUD hidden, fighter found), the repaired model
    loaded (no fallback), zero page/console errors, and the walkout takes
    actually ran.
    """
    if not os.path.isfile(report_path) or os.path.getsize(report_path) == 0:
        fail(f"no playtest_report.json at {report_path}")
    r = json.load(open(report_path))
    if r.get("scenario") != "entrance":
        fail(f"report scenario is {r.get('scenario')!r}, not 'entrance' — "
             "this is not an entrance-cinematic capture")
    beats = r.get("beats") or []
    if not any("cine setup:" in (x.get("what") or "") for x in beats):
        fail("cine setup never ran; this is not a staged entrance")
    cine = r.get("cineSetup") or {}
    if not cine.get("cine"):
        fail("cine CSS did not stage (HUD would be visible)")
    if not cine.get("hudHidden"):
        fail("HUD was not hidden during the cinematic")
    if (cine.get("idx") or -1) < 0:
        fail("fighter not found in fighters[] — cannot certify the entrance")
    if (r.get("pageErrorCount") or 0) > 0:
        fail("page errors during capture: " + " | ".join(r.get("pageErrors") or []))
    if (r.get("errorCount") or 0) > 0:
        fail("console errors during capture: " + " | ".join(r.get("consoleErrors") or []))
    # take PNG sequences: each take dir must hold real frames
    takes = r.get("takes") or []
    if not takes:
        fail("no takes recorded in the report")
    for t in takes:
        tdir = os.path.join(outdir, "take_" + t)
        frames = sorted(glob.glob(os.path.join(tdir, "f*.png")))
        if len(frames) < 20:
            fail(f"take {t} has only {len(frames)} frames — the walkout did not run")
    # the model gate: the capture refuses fallbacks, but double-check the report
    if not any("model wait:" in (x.get("what") or "") and "ok" in (x.get("what") or "")
               for x in beats):
        fail("repaired-model load not confirmed in beats; refusing to certify")
    d = r.get("deformation") or {}
    if (d.get("spikes") or 0) > 0:
        fail(f"runtime deformation sentinel found {d['spikes']} stretched triangle "
             "samples; keep this model out of delivery until repaired")
    print(f"PASS entrance-cinematic gates: {len(takes)} takes, "
          f"{sum(len(glob.glob(os.path.join(outdir, 'take_'+t, 'f*.png'))) for t in takes)} frames, "
          "0 errors, model verified")
    return r


def first_beat_at(beats_path, fallback=12.0):
    try:
        b = json.load(open(beats_path))["beat_times_s"]
        # a beat a few seconds in, so the thumbnail isn't the sting frame
        for t in b:
            if t >= 10.0:
                return float(t)
        return float(b[0])
    except Exception:
        return fallback


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def log_entry(entry, outdir, artifacts):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [f"\n## {now} — {entry['character']}\n",
             f"- glb: `{entry.get('glb')}` | opponent: `{entry.get('p2', 'BANNON')}`",
             "- capture: ENTRANCE CINEMATIC (capture_entrance.cjs) — El Toro grade",
             "- gates: cine staged, HUD hidden, fighter found, repaired model loaded, "
             "0 page/console errors, take frames>=20 each, deformation spikes==0 — PASS"]
    for label, path in artifacts:
        lines.append(f"- {label}: `{os.path.relpath(path, ROOT)}` "
                     f"(sha256 `{sha256_file(path)[:16]}…`)")
    header = "# VIDEO_LOG.md — one entry per delivered character video\n"
    if not os.path.exists(LOG_PATH):
        with open(LOG_PATH, "w") as f:
            f.write(header)
    with open(LOG_PATH, "a") as f:
        f.write("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser(description="Video machine: one character, full chain.")
    ap.add_argument("--character", default=None, help="override queue head")
    ap.add_argument("--queue", default=QUEUE_DEFAULT)
    ap.add_argument("--dry-run", action="store_true", help="print plan, run nothing")
    args = ap.parse_args()

    entries = load_queue(args.queue)
    e = pick(entries, args.character)
    char = e["character"]
    outdir = os.path.join(ROOT, "dist", "character-videos", char)
    report = os.path.join(outdir, "playtest_report.json")

    glb_path = os.path.join(ROOT, e.get("glb", ""))
    music = e.get("music_cut")
    beats = e.get("beats")
    # repo-canonical relative paths resolve against the repo root
    if music and not os.path.isabs(music):
        music = os.path.join(ROOT, music)
    if beats and not os.path.isabs(beats):
        beats = os.path.join(ROOT, beats)

    plan = [
        f"[1] verify GLB: {e.get('glb')}",
        f"[2] capture ENTRANCE CINEMATIC: node tools/harness/capture_entrance.cjs "
        f"--p1 {char} --p2 {e.get('p2', 'BANNON')} --out {outdir}",
        "[3] fail-closed entrance gates on playtest_report.json "
        "(cine staged, HUD hidden, model loaded, 0 errors, takes>=20f each, spikes==0)",
        f"[4] assemble: assemble_character_video.py --takes {outdir}/take_* "
        f"--audio {music} --beats {beats} --profile delivery -> {outdir}",
        "[5] thumbnail: make_thumbnail.py (beat-aligned frame)",
        "[6] SHA256SUMS + VIDEO_LOG.md entry + mark queue entry done",
    ]
    print(f"=== video machine: {char} ===")
    print("\n".join(plan))

    if not os.path.isfile(glb_path):
        fail(f"no real GLB for {char} at {e.get('glb')}")
    if not music or not os.path.isfile(music):
        fail(f"no music_cut configured for {char} — add music_cut + beats to queue.json")
    if not beats or not os.path.isfile(beats):
        fail(f"no beats file configured for {char} — add beats to queue.json")
    if args.dry_run:
        print("dry-run: plan printed, nothing executed.")
        return 0

    os.makedirs(outdir, exist_ok=True)

    # [2] capture the entrance cinematic
    rc, out = sh(["node", "tools/harness/capture_entrance.cjs",
                  "--p1", char, "--p2", e.get("p2", "BANNON"),
                  "--out", outdir])
    print(out[-2000:])
    if rc != 0:
        fail(f"entrance capture exited {rc} for {char}")

    # [3] entrance gates
    rep = check_gates(report, outdir)

    # [4] takes -> footage -> assemble
    take_dirs = sorted(glob.glob(os.path.join(outdir, "take_*")))
    if not take_dirs:
        fail(f"no take_* dirs in {outdir}")
    footage = os.path.join(outdir, "footage_takes.mp4")
    rc, out = sh(["python3", "tools/video/takes_to_footage.py",
                  "--takes", *take_dirs,
                  "--out", footage])
    print(out[-1000:])
    if rc != 0:
        fail(f"takes_to_footage exited {rc} for {char}")
    rc, out = sh(["python3", "tools/video/assemble_character_video.py",
                  "--footage", footage,
                  "--audio", music,
                  "--beats", beats,
                  "--name", e.get("name", char),
                  "--nicknames", e.get("nicknames", ""),
                  "--billing", e.get("billing", ""),
                  "--slug", char,
                  "--outdir", outdir,
                  "--profile", "delivery"])
    print(out[-2000:])
    if rc != 0:
        fail(f"assembly exited {rc} for {char}")

    mp4_16x9 = os.path.join(outdir, f"{char}_16x9.mp4")
    mp4_9x16 = os.path.join(outdir, f"{char}_9x16.mp4")
    if not (os.path.isfile(mp4_16x9) and os.path.isfile(mp4_9x16)):
        fail(f"assembly did not produce both deliverables for {char}")

    # [5] thumbnail
    thumb = os.path.join(outdir, f"{char}_thumb.jpg")
    nick_first = (e.get("nicknames") or "").split("|")[0]
    rc, out = sh(["python3", "tools/video/make_thumbnail.py",
                  "--video", mp4_16x9,
                  "--at", str(first_beat_at(beats)),
                  "--name", e.get("name", char),
                  "--nickname", nick_first,
                  "--out", thumb])
    print(out[-500:])
    if rc != 0:
        fail(f"thumbnail exited {rc} for {char}")

    # [6] hashes + log + mark done
    artifacts = [("16:9 delivery", mp4_16x9), ("9:16 delivery", mp4_9x16),
                 ("thumbnail", thumb)]
    with open(os.path.join(outdir, "SHA256SUMS.txt"), "w") as f:
        for _, p in artifacts:
            f.write(f"{sha256_file(p)}  {os.path.basename(p)}\n")
    log_entry(e, outdir, artifacts)
    e["status"] = "done"
    save_queue(args.queue, entries)
    print(f"DONE {char}: package in {outdir}, queue entry marked done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
