#!/usr/bin/env python3
"""
fetch_mocap.py — pull a sample motion-capture clip from the free CMU BVH
database into the statue-to-game pipeline's STAGE 6 (ANIMATION).

Source: https://github.com/una-dinosauria/cmu-mocap
  The CMU Graphics Lab mocap database converted to BVH by Bruce Hahne.
  Cost: $0. Account: none. License: CMU places no restrictions on the
  original dataset, and the converter places no additional restrictions
  on the BVH conversion. Free for research AND commercial use (credit
  CMU in published results per READMEFIRST.txt).

Usage:
  python3 fetch_mocap.py --list                  # subjects on the mirror
  python3 fetch_mocap.py --list --subject 01     # clips in subject 01
  python3 fetch_mocap.py --subject 01 --clip 01_01 \
      --out assets/models/mocap/01_01.bvh        # download one clip
  python3 fetch_mocap.py --sample                 # download the default
      --out assets/models/mocap/                  # sample clip (01_01)
  python3 fetch_mocap.py --verify <file.bvh>      # check a BVH parses

The default sample (subject 01 / clip 01_01) is a walk cycle — the first
clip agents reach for when a character needs a locomotion baseline.
"""

import argparse
import json
import os
import sys
import urllib.request

REPO_API = "https://api.github.com/repos/una-dinosauria/cmu-mocap/contents/data"
RAW_BASE = "https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data"
DEFAULT_SUBJECT = "001"
DEFAULT_CLIP = "01_01.bvh"


def _get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "bannon-pipeline"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def list_subjects():
    entries = _get_json(REPO_API)
    subs = sorted(e["name"] for e in entries if e.get("type") == "dir")
    print(f"{len(subs)} subjects on the mirror:")
    for s in subs:
        print("  " + s)
    return subs


def list_clips(subject):
    entries = _get_json(f"{REPO_API}/{subject}")
    clips = sorted(
        (e["name"], e.get("size", 0))
        for e in entries
        if e.get("type") == "file" and e["name"].endswith(".bvh")
    )
    print(f"{len(clips)} clips in subject {subject}:")
    for name, size in clips:
        print(f"  {name}  ({size/1e6:.1f} MB)")
    return clips


def download_clip(subject, clip, out):
    url = f"{RAW_BASE}/{subject}/{clip}"
    if os.path.isdir(out) or out.endswith(os.sep):
        os.makedirs(out, exist_ok=True)
        out = os.path.join(out, clip)
    else:
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    print(f"Downloading {url}")
    print(f"        -> {out}")
    req = urllib.request.Request(url, headers={"User-Agent": "bannon-pipeline"})
    with urllib.request.urlopen(req, timeout=120) as r, open(out, "wb") as f:
        total = 0
        while True:
            chunk = r.read(65536)
            if not chunk:
                break
            f.write(chunk)
            total += len(chunk)
    print(f"Saved {total/1e6:.1f} MB")
    return out


def verify_bvh(path):
    """Lightweight structural check: HIERARCHY + MOTION sections, joint and
    frame counts sane. Returns (ok, info_dict)."""
    info = {"path": path, "joints": 0, "frames": 0, "frame_time": None,
            "has_hierarchy": False, "has_motion": False}
    with open(path, "r", errors="replace") as f:
        lines = f.readlines()
    for line in lines[:2000]:
        s = line.strip()
        if s == "HIERARCHY":
            info["has_hierarchy"] = True
        elif s == "MOTION":
            info["has_motion"] = True
            break
        if s.startswith("JOINT") or s.startswith("ROOT"):
            info["joints"] += 1
    for line in lines:
        s = line.strip()
        if s.startswith("Frames:"):
            try:
                info["frames"] = int(s.split(":")[1])
            except ValueError:
                pass
        elif s.startswith("Frame Time:"):
            try:
                info["frame_time"] = float(s.split(":")[1])
            except ValueError:
                pass
    ok = info["has_hierarchy"] and info["has_motion"] \
        and info["joints"] >= 10 and info["frames"] > 0
    print(f"BVH check: {'PASS' if ok else 'FAIL'}")
    print(f"  joints={info['joints']} frames={info['frames']} "
          f"frame_time={info['frame_time']}")
    return ok, info


def main():
    ap = argparse.ArgumentParser(description="Fetch CMU BVH mocap clips")
    ap.add_argument("--list", action="store_true", help="list subjects (or clips with --subject)")
    ap.add_argument("--subject", default=None, help="subject dir, e.g. 001")
    ap.add_argument("--clip", default=None, help="clip file, e.g. 01_01.bvh")
    ap.add_argument("--sample", action="store_true", help="download default sample clip")
    ap.add_argument("--out", default="assets/models/mocap/", help="output file or dir")
    ap.add_argument("--verify", default=None, metavar="FILE", help="verify a BVH file")
    args = ap.parse_args()

    if args.verify:
        ok, _ = verify_bvh(args.verify)
        sys.exit(0 if ok else 1)
    if args.list and not args.subject:
        list_subjects()
        return
    if args.list and args.subject:
        list_clips(args.subject)
        return
    if args.sample or (args.subject and args.clip):
        subject = args.subject or DEFAULT_SUBJECT
        clip = args.clip or DEFAULT_CLIP
        path = download_clip(subject, clip, args.out)
        ok, _ = verify_bvh(path)
        sys.exit(0 if ok else 1)
    ap.print_help()
    sys.exit(2)


if __name__ == "__main__":
    main()
