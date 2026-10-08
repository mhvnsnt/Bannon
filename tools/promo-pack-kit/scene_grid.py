#!/usr/bin/env python3
"""scene_grid.py — BPM-parameterized beat grid + cut sheet for promo-kit videos.

Every cut lands on a beat. BPM is a parameter (never hardcoded 120): shots are
defined in beats, so the same shot list works at any tempo.

The built-in EL_TORO template encodes the canonical El Toro v1 blueprint:
50 s @ 120 BPM -> 100 beats.  beat = 60/bpm seconds.

  beat   time(s)  shot
  0      0.00     shadow push-in (music swelling)
  8      4.00     GOLDEN HIT: logo slam + name card (0.25 s dead air just before)
  24     12.00    walk-out starts (2 steps/s, beat-locked)
  38     19.00    walk-out ends -> entrance gesture, mask orbit begins
  56     28.00    slow-motion breakdown: black bars, strobes, music half-time
  72     36.00    high wide + pyro, win poses, signature-move graphic
  92     46.00    end card, final hit
  100    50.00    ring out / end of video

Usage:
  scene_grid.py [--bpm 120] [--duration 50] [--fps 24] [--template el_toro]
                [--out grid.json] [--table]

A custom shot list can be supplied with --shots shot_list.json:
  {"shots": [{"name": "...", "beat_start": 0, "beat_end": 8,
              "camera": "...", "audio": "...", "graphics": "..."}]}
Shot times are computed from beat positions; anything not on a beat is reported
as a warning (cuts must land on beats) unless the shot sets
"intentional_offbeat": true (e.g. the dead_air dropout before the golden hit).
"""
import argparse
import json
import sys

EL_TORO_SHOTS = [
    {"name": "shadow_pushin", "beat_start": 0, "beat_end": 8,
     "camera": "character in shadow, slow push-in",
     "lighting": "near-black, single dim key",
     "audio": "music swelling",
     "graphics": "none"},
    {"name": "dead_air", "beat_start": 7.5, "beat_end": 8,
     "camera": "hold push-in",
     "lighting": "near-black",
     "audio": "0.25 s of silence (dropout before the hit)",
     "graphics": "none",
     "intentional_offbeat": True},  # deliberate quarter-beat dropout, not a cut error
    {"name": "golden_hit", "beat_start": 8, "beat_end": 24,
     "camera": "cut to lit medium, slight dolly",
     "lighting": "full reveal",
     "audio": "the golden hit: sub boom + crack + gold bell + glass-like pings",
     "graphics": "logo slams in, name card appears"},
    {"name": "walk_out", "beat_start": 24, "beat_end": 38,
     "camera": "side track, eye level",
     "lighting": "entrance spots",
     "audio": "beat-locked: 2 steps per second = 1 step per beat",
     "graphics": "name + finisher + hometown lower third"},
    {"name": "gesture_mask_orbit", "beat_start": 38, "beat_end": 56,
     "camera": "entrance gesture, then tight orbit around the mask",
     "lighting": "colored spots",
     "audio": "music full",
     "graphics": "none (mask is the graphic)"},
    {"name": "slowmo_breakdown", "beat_start": 56, "beat_end": 72,
     "camera": "slow motion, tighter frames",
     "lighting": "strobes",
     "audio": "music cut to half-time",
     "graphics": "black letterbox bars in"},
    {"name": "wide_pyro", "beat_start": 72, "beat_end": 92,
     "camera": "high wide",
     "lighting": "pyro hits, haze",
     "audio": "music peak",
     "graphics": "win poses, signature-move graphic"},
    {"name": "end_card", "beat_start": 92, "beat_end": 100,
     "camera": "locked end card frame",
     "lighting": "final look",
     "audio": "final hit, then ring out",
     "graphics": "end card"},
]

TEMPLATES = {"el_toro": EL_TORO_SHOTS}


def build_grid(bpm, duration_s, shots, fps):
    if bpm <= 0:
        raise ValueError("bpm must be positive")
    beat_s = 60.0 / bpm
    total_beats = int(round(duration_s / beat_s))
    beats = [{"beat": b, "time_s": round(b * beat_s, 4), "frame": int(round(b * beat_s * fps))}
             for b in range(total_beats + 1)]
    cut_sheet = []
    warnings = []
    for s in shots:
        bs, be = s["beat_start"], s["beat_end"]
        intentional = bool(s.get("intentional_offbeat"))
        for key, val in (("beat_start", bs), ("beat_end", be)):
            if abs(val - round(val)) > 1e-9 and not intentional:
                warnings.append(
                    f"shot '{s['name']}' {key}={val} is not on a beat; "
                    "cuts must land on beats (set intentional_offbeat: true "
                    "if the off-beat position is deliberate)")
        if be * beat_s > duration_s + 1e-9:
            warnings.append(
                f"shot '{s['name']}' ends at {be * beat_s:.2f}s, past duration {duration_s}s")
        cut_sheet.append({
            "name": s["name"],
            "beat_start": bs, "beat_end": be,
            "time_start_s": round(bs * beat_s, 4),
            "time_end_s": round(be * beat_s, 4),
            "frame_start": int(round(bs * beat_s * fps)),
            "frame_end": int(round(be * beat_s * fps)),
            "duration_s": round((be - bs) * beat_s, 4),
            "camera": s.get("camera", ""),
            "lighting": s.get("lighting", ""),
            "audio": s.get("audio", ""),
            "graphics": s.get("graphics", ""),
        })
    return {"bpm": bpm, "duration_s": duration_s, "fps": fps,
            "beat_s": round(beat_s, 6), "total_beats": total_beats,
            "beats": beats, "shots": cut_sheet, "warnings": warnings}


def main():
    ap = argparse.ArgumentParser(description="BPM-parameterized promo beat grid")
    ap.add_argument("--bpm", type=float, default=120.0)
    ap.add_argument("--duration", type=float, default=50.0)
    ap.add_argument("--fps", type=float, default=24.0)
    ap.add_argument("--template", default="el_toro",
                    choices=list(TEMPLATES))
    ap.add_argument("--shots", help="JSON file with custom shot list "
                    '{"shots": [...]}')
    ap.add_argument("--out", help="write grid JSON to this path")
    ap.add_argument("--table", action="store_true",
                    help="print human-readable cut table")
    args = ap.parse_args()

    shots = TEMPLATES[args.template]
    if args.shots:
        with open(args.shots) as f:
            shots = json.load(f)["shots"]

    grid = build_grid(args.bpm, args.duration, shots, args.fps)

    for w in grid["warnings"]:
        print("WARN: " + w, file=sys.stderr)

    if args.table or not args.out:
        print(f"BPM={grid['bpm']}  duration={grid['duration_s']}s  "
              f"beat={grid['beat_s']}s  beats={grid['total_beats']}  fps={grid['fps']}")
        print(f"{'shot':<20}{'beats':<12}{'time':<20}{'frames':<18}camera / graphics")
        for s in grid["shots"]:
            print(f"{s['name']:<20}{s['beat_start']}-{s['beat_end']:<8}"
                  f"{s['time_start_s']:.2f}-{s['time_end_s']:.2f}s{'':<4}"
                  f"{s['frame_start']}-{s['frame_end']:<10}"
                  f"{s['camera']}; {s['graphics']}")
    if args.out:
        with open(args.out, "w") as f:
            json.dump(grid, f, indent=2)
        print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
