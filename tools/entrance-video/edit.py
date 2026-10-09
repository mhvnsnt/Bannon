#!/usr/bin/env python3
"""
edit.py v2 — Beat-synced entrance video editor.
Rebuilt to match EL TORO DE ORO.

v2 fixes:
1. TITLE CARDS float over the 3D scene (PIL-rendered PNG overlays with
   gold fill + black stroke + red glow + red rule) — NO black background
   panels, NO ffmpeg drawtext.
2. Card timing: titantron overlays the opening 3D scene; tagline/endcard
   overlay the closing scenes.

Beats (from entrance kit):
  1. titantron  — name card over 3D scene
  2. entrance   — character walk-in + taunts (3D renders)
  3. finishers  — finisher montage (3D renders)
  4. tagline    — nickname card over 3D
  5. endcard    — end card over 3D

Cuts land on beat boundaries from the beat grid JSON.
Free/open-source: ffmpeg + PIL.
"""
import json
import subprocess
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

def run(cmd, **kw):
    print("+", " ".join(cmd[:8]), "..." if len(cmd) > 8 else "")
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print(r.stderr[-2000:])
        raise RuntimeError(f"ffmpeg failed: {cmd[0]}")
    return r

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenes", required=True)
    ap.add_argument("--beats", required=True)
    ap.add_argument("--music", required=True)
    ap.add_argument("--cards", required=True,
                    help="JSON: {titantron:{text,sub}, tagline:{text,sub}, endcard:{text,sub}}")
    ap.add_argument("--out", required=True)
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
        b0, b1 = s["beats"]
        t0, t1 = beats[b0], beats[b1]
        dur = t1 - t0
        frames = os.path.join(s["frames_dir"], "frame_%04d.png")
        out = f"{tmp}/scene{i}.mp4"
        raw = f"{tmp}/scene{i}_raw.mp4"
        run(["ffmpeg", "-y", "-framerate", str(a.fps), "-i", frames,
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", raw])
        run(["ffmpeg", "-y", "-stream_loop", "3", "-i", raw,
             "-t", f"{dur:.3f}",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
             out])
        scene_clips.append(out)

    # --- 2. PIL title cards (transparent PNG sequences) ---
    def make_card(card_cfg, style, name):
        cdir = f"{tmp}/card_{name}"
        os.makedirs(cdir, exist_ok=True)
        # card_cfg may use {"lines": [...]} (kit schema) or {"text":..., "sub":...} (legacy)
        if "lines" in card_cfg:
            lines = card_cfg["lines"]
            text = lines[0] if lines else ""
            sub = "\n".join(lines[1:]) if len(lines) > 1 else ""
        else:
            text = card_cfg["text"]
            sub = card_cfg.get("sub", "")
        # 3 seconds of card frames at 30fps
        nframes = 90
        r = subprocess.run([
            sys.executable, os.path.join(HERE, "cards.py"),
            "--text", text,
            "--sub", sub,
            "--style", style,
            "--out", cdir,
            "--width", str(W), "--height", str(H),
            "--frames", str(nframes),
        ], capture_output=True, text=True)
        if r.returncode != 0:
            print(r.stderr[-1000:])
            raise RuntimeError("cards.py failed")
        # card frames -> looping clip
        raw = f"{tmp}/card_{name}_raw.mp4"
        run(["ffmpeg", "-y", "-framerate", str(a.fps),
             "-i", os.path.join(cdir, "card_%04d.png"),
             "-c:v", "libx264", "-pix_fmt", "yuva420p", "-crf", "18", raw])
        return raw

    card_titantron = make_card(cards["titantron"], "name", "titantron")
    card_tagline = make_card(cards["tagline"], "name", "tagline")
    card_endcard = make_card(cards["endcard"], "end", "endcard")

    # --- 3. assemble: overlay cards on 3D scenes at beat positions ---
    # Timeline: [titantron card over scene0] [scenes...] [tagline over last-1] [endcard over last]
    # For simplicity and El Toro fidelity:
    #   - titantron card overlays the FIRST scene's clip
    #   - tagline overlays the SECOND-TO-LAST scene
    #   - endcard overlays the LAST scene
    n = len(scene_clips)
    final_clips = []
    for i, clip in enumerate(scene_clips):
        overlay = None
        if i == 0:
            overlay = card_titantron
        elif i == n - 2 and n >= 3:
            overlay = card_tagline
        elif i == n - 1:
            overlay = card_endcard
        # card overlays the middle 60% of the scene clip
        b0, b1 = scenes[i]["beats"]
        dur = beats[b1] - beats[b0]
        if overlay:
            out = f"{tmp}/final{i}.mp4"
            # loop card to scene duration, overlay centered, fade card in/out
            run(["ffmpeg", "-y",
                 "-i", clip,
                 "-stream_loop", "5", "-i", overlay,
                 "-filter_complex",
                 f"[1:v]trim=0:{dur:.3f},setpts=PTS-STARTPTS,"
                 f"fade=t=in:st=0:d=0.5:alpha=1,"
                 f"fade=t=out:st={dur-0.8:.2f}:d=0.8:alpha=1[ov];"
                 f"[0:v][ov]overlay=0:0:shortest=1",
                 "-t", f"{dur:.3f}",
                 "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
                 out])
            final_clips.append(out)
        else:
            final_clips.append(clip)

    # --- 4. concat ---
    lst = f"{tmp}/concat.txt"
    with open(lst, "w") as f:
        for p in final_clips:
            f.write(f"file '{p}'\n")
    v_nosound = f"{tmp}/video_nosound.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst,
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", v_nosound])

    # --- 5. opening fade from black (El Toro: 5s intentional fade) ---
    v_faded = f"{tmp}/video_faded.mp4"
    run(["ffmpeg", "-y", "-i", v_nosound,
         "-vf", "fade=t=in:st=0:d=3",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
         "-c:a", "copy", v_faded])

    # --- 6. music mux ---
    # total video duration = last scene end beat - first scene start beat
    total_dur = beats[scenes[-1]["beats"][1]] - beats[scenes[0]["beats"][0]]
    v_16x9 = f"{a.out}_16x9.mp4"
    run(["ffmpeg", "-y", "-i", v_faded, "-i", a.music,
         "-t", f"{total_dur:.2f}",
         "-filter:a", "loudnorm=I=-14:TP=-1:LRA=11",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-shortest", v_16x9])

    # --- 7. vertical crop ---
    v_9x16 = f"{a.out}_9x16.mp4"
    crop_w = int(H * 9 / 16)
    crop_x = (W - crop_w) // 2
    run(["ffmpeg", "-y", "-i", v_16x9,
         "-vf", f"crop={crop_w}:{H}:{crop_x}:0,scale=1080:1920",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
         "-c:a", "copy", v_9x16])

    print(f"DONE: {v_16x9} + {v_9x16} ({total_dur:.1f}s)")

if __name__ == "__main__":
    main()
