#!/usr/bin/env python3
"""takes_to_footage.py — convert entrance-cinematic take PNG sequences to footage.

Each take_* dir holds frame-exact PNGs (f0000.png, f0001.png, ...) captured at
0.05s of game-time per frame. This script:
  1. encodes each take to a 20fps MP4 (1 frame = 1/20s => real-time motion),
  2. concatenates the takes in order into a single footage MP4.

Usage:
  python3 tools/video/takes_to_footage.py --takes out/take_stage_pyro out/take_ramp_track ... --out footage.mp4
  python3 tools/video/takes_to_footage.py --takes-glob "out/take_*" --out footage.mp4
"""
import argparse
import glob
import os
import subprocess
import sys
import tempfile


def run(*cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print(f"CMD FAILED: {' '.join(cmd)}\n{p.stderr[-1500:]}", file=sys.stderr)
        sys.exit(1)
    return p


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--takes", nargs="+", help="take dirs in order")
    g.add_argument("--takes-glob", help="glob for take dirs (sorted)")
    ap.add_argument("--out", required=True, help="output footage MP4")
    ap.add_argument("--fps", type=float, default=20.0,
                    help="output fps (capture is 0.05s/frame => 20fps is real-time)")
    a = ap.parse_args()

    takes = sorted(glob.glob(a.takes_glob)) if a.takes_glob else a.takes
    if not takes:
        print("no takes found", file=sys.stderr)
        sys.exit(1)

    tmp = tempfile.mkdtemp(prefix="takes_")
    clips = []
    for t in takes:
        frames = sorted(glob.glob(os.path.join(t, "f*.png")))
        if not frames:
            print(f"WARNING: no frames in {t}, skipping", file=sys.stderr)
            continue
        clip = os.path.join(tmp, os.path.basename(t) + ".mp4")
        # PNG sequence -> 20fps: each PNG is one frame (1/20s of game time)
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-framerate", str(a.fps), "-i", os.path.join(t, "f%04d.png"),
            "-c:v", "libx264", "-preset", "medium", "-crf", "16",
            "-pix_fmt", "yuv420p", clip)
        clips.append(clip)
        print(f"take {os.path.basename(t)}: {len(frames)} frames -> {len(frames)/a.fps:.1f}s")

    if not clips:
        print("no clips built", file=sys.stderr)
        sys.exit(1)

    lst = os.path.join(tmp, "concat.txt")
    with open(lst, "w") as f:
        for c in clips:
            f.write(f"file '{c}'\n")
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "concat", "-safe", "0", "-i", lst,
        "-c", "copy", a.out)
    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1", a.out],
        capture_output=True, text=True).stdout.strip().split("=")[1])
    print(f"wrote {a.out} ({dur:.1f}s from {len(clips)} takes)")


if __name__ == "__main__":
    main()
