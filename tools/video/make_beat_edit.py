#!/usr/bin/env python3
"""
make_beat_edit.py — cut raw capture footage to the music beat grid.

Reads the capture's playtest_report.json (action timestamps) + the music
beat grid, then assembles a tight edit where:
  - every CUT lands on a beat
  - every key moment (taunt press, special/finisher press, strike flurry)
    lands on a beat
Output duration targets ~44.4s of footage (assembler adds ~3.6s name card +
2s end card = ~50.05s total to match the 50s audio cut).

Usage:
  python3 make_beat_edit.py --report dist/character-videos/STICKUP/playtest_report.json \
      --video dist/character-videos/STICKUP/bannon_match_*.webm \
      --beats stickup/audio/stickup_beats.json --out /tmp/stickup_edit.mp4
"""
import argparse, json, subprocess, sys

CARD_DUR = None  # set from beat grid like the assembler does
VIDEO_OFFSET = 2.0  # video_time ~= beat_t + OFFSET (page creation -> T0)

def run(*cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit("FAILED: " + " ".join(cmd) + "\n" + r.stderr[-2000:])
    return r

def nearest_beat(beats, t):
    return min(beats, key=lambda b: abs(b - t))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", required=True)
    ap.add_argument("--video", required=True)
    ap.add_argument("--beats", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--target", type=float, default=44.4)
    a = ap.parse_args()

    r = json.load(open(a.report))
    beats = [(b["t"], b["what"]) for b in r["beats"]]
    grid = json.load(open(a.beats))["beat_times_s"]
    import statistics
    ivs = [grid[i] - grid[i-1] for i in range(1, len(grid))]
    iv = statistics.median(ivs)
    n_beats = max(4, round(3.5 / iv))
    card_dur = round(n_beats * iv, 3)
    print(f"beat interval {iv:.4f}s | card {n_beats} beats = {card_dur}s")

    # key moments in VIDEO time
    moments = []  # (video_t, label)
    for t, what in beats:
        w = what.lower()
        if what.startswith("bell:"):
            moments.append((t + VIDEO_OFFSET, "bell"))
        elif w.startswith("taunt"):
            moments.append((t + VIDEO_OFFSET, "taunt"))
        elif w.startswith("special"):
            moments.append((t + VIDEO_OFFSET, "special"))
        elif w.startswith("strike flurry"):
            moments.append((t + VIDEO_OFFSET, "strike"))
        elif w.startswith("grapple"):
            moments.append((t + VIDEO_OFFSET, "grapple"))
    for m in moments:
        print(f"  moment {m[1]:8s} at video {m[0]:7.1f}s")

    bell = next((t for t, l in moments if l == "bell"), None)
    if bell is None:
        raise SystemExit("no bell beat — match never started, cannot edit")
    actions = [(t, l) for t, l in moments if l != "bell" and t > bell + 9]

    # --- build segments ---
    # seg1: entrance [bell+0.5, bell+8.5]
    segs = []  # (raw_start, raw_end, label)
    segs.append((bell + 0.5, bell + 8.5, "entrance"))
    prev_end = 8.0  # footage time

    # pick highlight moments: prefer special(s), taunts, then strikes/grapples, spread out
    scored = []
    for t, l in actions:
        prio = {"special": 0, "taunt": 1, "grapple": 2, "strike": 3}[l]
        scored.append((prio, t, l))
    scored.sort()
    # take up to 5, requiring >=6s raw separation
    # pick highlight moments: ensure at least 2 taunts + 2 specials, then fill
    # with strikes/grapples, requiring >=6s raw separation
    by_label = {}
    for t, l in actions:
        by_label.setdefault(l, []).append(t)
    picks = []
    def take(label, n):
        for t in sorted(by_label.get(label, [])):
            if len([p for p in picks if p[1] == label]) >= n:
                break
            if all(abs(t - p[0]) >= 6 for p in picks):
                picks.append((t, label))
    take("special", 2)
    take("taunt", 2)
    take("strike", 2)
    take("grapple", 1)
    take("special", 4)
    take("taunt", 4)
    picks.sort()
    print("picks:", [(l, round(t, 1)) for t, l in picks])

    for t, l in picks:
        post_min = 4.0 if l == "special" else 2.2
        # pre-roll: land the moment on a beat. out moment time = prev_end + pre.
        # audio time = card_dur + prev_end + pre -> nearest beat
        pre = None
        for cand in [i * 0.05 for i in range(20, 60)]:
            if abs(nearest_beat(grid, card_dur + prev_end + cand) - (card_dur + prev_end + cand)) < 0.03:
                pre = cand
                break
        if pre is None:
            pre = 1.5
        # post-roll: land the CUT on a beat too
        post = None
        for cand in [post_min + i * 0.05 for i in range(40)]:
            if abs(nearest_beat(grid, card_dur + prev_end + pre + cand) - (card_dur + prev_end + pre + cand)) < 0.03:
                post = cand
                break
        if post is None:
            post = post_min
        raw_start = max(0, t - pre)
        raw_end = t + post
        segs.append((raw_start, raw_end, l))
        prev_end = prev_end + pre + post
        print(f"  seg {l:8s} raw [{raw_start:7.1f},{raw_end:7.1f}] -> footage [{prev_end-pre-post:6.1f},{prev_end:6.1f}] moment@{prev_end-post:.1f}")

    total = prev_end
    # pad the tail with post-match footage to reach the target (keeps the music bed whole)
    if total < a.target - 0.5 and segs:
        need = a.target - total
        rs, re_, l = segs[-1]
        segs[-1] = (rs, re_ + need, l + "+tail")
        total = a.target
    print(f"edit total: {total:.2f}s (target {a.target})")
    if total > a.target + 1:
        print("WARNING: edit longer than target; assembler will pad audio with silence")

    # --- ffmpeg concat ---
    import tempfile, os
    tmp = tempfile.mkdtemp(prefix="beatcut_")
    flist = os.path.join(tmp, "list.txt")
    with open(flist, "w") as f:
        for i, (rs, re_, l) in enumerate(segs):
            seg = os.path.join(tmp, f"seg{i}.mp4")
            run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-ss", f"{rs:.3f}", "-to", f"{re_:.3f}", "-i", a.video,
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                "-an", seg)
            f.write(f"file '{seg}'\n")
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "concat", "-safe", "0", "-i", flist,
        "-c", "copy", a.out)
    print("wrote", a.out)

if __name__ == "__main__":
    main()
