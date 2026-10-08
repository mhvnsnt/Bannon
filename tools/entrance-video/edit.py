#!/usr/bin/env python3
"""
edit.py — Beat-synced entrance video editor.
Takes rendered scene frame sequences + beat grid + music, produces
the 50-second 5-beat entrance video (16x9 + 9x16).

Beats (from entrance kit):
  1. titantron  — lower-third name card over dark arena
  2. entrance   — character walk-in + taunts (3D renders)
  3. finishers  — finisher montage (3D renders)
  4. tagline    — nickname/tagline card
  5. endcard    — end card

Cuts land on beat boundaries from the beat grid JSON.
Free/open-source: ffmpeg only.
"""
import json
import subprocess
import os
import sys

def run(cmd, **kw):
    print("+", " ".join(cmd[:6]), "..." if len(cmd) > 6 else "")
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print(r.stderr[-2000:])
        raise RuntimeError(f"ffmpeg failed: {cmd[0]}")
    return r

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenes", required=True, help="JSON: list of {frames_dir, beats} in order")
    ap.add_argument("--beats", required=True, help="beat grid JSON")
    ap.add_argument("--music", required=True, help="music file (50s cut)")
    ap.add_argument("--cards", required=True, help="JSON: {titantron:{...}, tagline:{...}, endcard:{...}} text cards")
    ap.add_argument("--out", required=True, help="output prefix")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    a = ap.parse_args()
    W, H = a.width, a.height

    beats = json.load(open(a.beats))["beat_times_s"]
    scenes = json.load(open(a.scenes))
    cards = json.load(open(a.cards))
    tmp = "/tmp/entrance_edit"
    os.makedirs(tmp, exist_ok=True)

    # --- 1. build each 3D scene clip, trimmed to its beat span ---
    scene_clips = []
    for i, s in enumerate(scenes):
        if s.get("kind") == "card":
            continue  # handled below
        b0, b1 = s["beats"]  # beat indices into beat grid
        t0, t1 = beats[b0], beats[b1]
        dur = t1 - t0
        frames = os.path.join(s["frames_dir"], "frame_%04d.png")
        out = f"{tmp}/scene{i}.mp4"
        # render frames to clip, then loop/pad to exact beat duration
        raw = f"{tmp}/scene{i}_raw.mp4"
        run(["ffmpeg", "-y", "-framerate", str(a.fps), "-i", frames,
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", raw])
        run(["ffmpeg", "-y", "-stream_loop", "3", "-i", raw,
             "-t", f"{dur:.3f}",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
             out])
        scene_clips.append((out, t0, dur))

    # --- 2. text cards via ffmpeg drawtext ---
    def card(text_lines, dur, out, fontsize=None):
        fontsize = fontsize or max(36, H // 15)
        # black bg with gold text, multi-line
        w, h = W, H
        # build drawtext chain
        vf = f"color=c=black:s={w}x{h}:d={dur}"
        y = h // 2 - (len(text_lines) * (fontsize + 20)) // 2
        for j, line in enumerate(text_lines):
            # escape for drawtext: backslash-escape quotes and colons
            esc = line.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:")
            vf += f",drawtext=text='{esc}':fontcolor=0xFFD700:fontsize={fontsize}:x=(w-text_w)/2:y={y}"
            y += fontsize + 20
        # subtle fade in/out
        vf += f",fade=t=in:st=0:d=0.4,fade=t=out:st={dur-0.4:.2f}:d=0.4"
        run(["ffmpeg", "-y", "-f", "lavfi", "-i", vf,
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out])

    card_clips = {}
    # titantron: beats[0] to first scene's start beat
    first_b0 = scenes[0]["beats"][0]
    card(cards["titantron"]["lines"], beats[first_b0] - beats[0], f"{tmp}/titantron.mp4")
    card_clips["titantron"] = (f"{tmp}/titantron.mp4", beats[0], beats[first_b0] - beats[0])
    # tagline: last scene's end beat to 8 beats before end
    last_b1 = scenes[-1]["beats"][1]
    tag_end_idx = len(beats) - 8
    if tag_end_idx <= last_b1:
        tag_end_idx = last_b1 + 4
    card(cards["tagline"]["lines"], beats[tag_end_idx] - beats[last_b1], f"{tmp}/tagline.mp4")
    card(cards["endcard"]["lines"], beats[-1] - beats[tag_end_idx], f"{tmp}/endcard.mp4")
    card_clips["tagline"] = (f"{tmp}/tagline.mp4", beats[last_b1], beats[tag_end_idx] - beats[last_b1])
    card_clips["endcard"] = (f"{tmp}/endcard.mp4", beats[tag_end_idx], beats[-1] - beats[tag_end_idx])
    eb = [tag_end_idx, len(beats) - 1]

    # --- 3. assemble timeline in beat order ---
    # order: titantron | scene clips... | tagline | endcard
    ordered = [card_clips["titantron"][0]] + [c[0] for c in scene_clips] + \
              [card_clips["tagline"][0], card_clips["endcard"][0]]
    lst = f"{tmp}/concat.txt"
    with open(lst, "w") as f:
        for p in ordered:
            f.write(f"file '{p}'\n")
    v_nosound = f"{tmp}/video_nosound.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst,
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", v_nosound])

    # --- 4. music: 50s cut, loudnorm, mux ---
    total_dur = beats[eb[1]] - beats[0]
    v_16x9 = f"{a.out}_16x9.mp4"
    run(["ffmpeg", "-y", "-i", v_nosound, "-i", a.music,
         "-t", f"{total_dur:.2f}",
         "-filter:a", "loudnorm=I=-14:TP=-1:LRA=11",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-shortest", v_16x9])

    # --- 5. vertical: center crop to 9x16 ---
    v_9x16 = f"{a.out}_9x16.mp4"
    crop_w = int(H * 9 / 16)
    crop_x = (W - crop_w) // 2
    out_h = 1920
    out_w = 1080
    run(["ffmpeg", "-y", "-i", v_16x9,
         "-vf", f"crop={crop_w}:{H}:{crop_x}:0,scale={out_w}:{out_h}",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
         "-c:a", "copy", v_9x16])

    print(f"DONE: {v_16x9} + {v_9x16} ({total_dur:.1f}s)")

if __name__ == "__main__":
    main()
