#!/usr/bin/env python3
"""
pipeline.py v2 — Entrance video pipeline orchestrator.
Rebuilt to match EL TORO DE ORO quality.

Input config:
{
  "character": "STICK-UP",
  "glb": "/path/to/STICKUP_repaired.glb",
  "music": "/path/to/stickup_video_cut.mp3",
  "beats": "/path/to/stickup_beats.json",
  "cards": {
    "titantron": {"text": "STICK UP", "sub": "AMERICUS, GEORGIA"},
    "tagline":   {"text": "THE ENIGMATIC GANGSTER", "sub": ""},
    "endcard":   {"text": "STICK UP", "sub": "BANNON"}
  },
  "scenes": [
    {"name": "entrance", "mocap": "/path/to/Idle.fbx",
     "camera": "push_in", "lightshift": "blue", "beats": [8, 40]},
    {"name": "taunts", "mocap": "/path/to/Taunt.fbx",
     "camera": "closeup_34", "lightshift": "red", "beats": [40, 72]},
    {"name": "finish1", "mocap": "/path/to/Clip.fbx",
     "camera": "low_angle", "lightshift": "gold", "beats": [72, 96]},
    {"name": "finish2", "mocap": null,
     "camera": "wide", "lightshift": "gold", "beats": [96, 120]}
  ],
  "out": "/path/to/out/STICKUP_v2"
}

Cameras: push_in, orbit, low_angle, closeup_34, side_profile, wide, medium
Lightshifts: blue, red, gold, white (spotlight pool color per scene)
"""
import json
import subprocess
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

def run(cmd):
    print("+", " ".join(cmd[:8]), "..." if len(cmd) > 8 else "")
    r = subprocess.run(cmd)
    if r.returncode != 0:
        raise RuntimeError(f"failed: {cmd[0]}")

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("config")
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    ap.add_argument("--max-frames", type=int, default=0)
    pa = ap.parse_args()
    cfg = json.load(open(pa.config))
    fps = 30
    workdir = os.environ.get(
        "ENTRANCE_WORKDIR",
        os.path.join(HERE, "..", "..", "..", "out", "entrance_work_v2"),
    )
    workdir = os.path.abspath(workdir)
    os.makedirs(workdir, exist_ok=True)

    beats = json.load(open(cfg["beats"]))["beat_times_s"]
    print(f"Character: {cfg['character']}, {len(beats)} beats, "
          f"span {beats[0]:.1f}s -> {beats[-1]:.1f}s")

    # --- 1. render each 3D scene in Blender ---
    scene_specs = []
    for s in cfg["scenes"]:
        b0, b1 = s["beats"]
        dur = beats[b1] - beats[b0]
        nframes = max(30, int(dur * fps))
        if pa.max_frames > 0:
            nframes = min(nframes, pa.max_frames)
        fdir = os.path.join(workdir, f"frames_{s['name']}")
        os.makedirs(fdir, exist_ok=True)
        existing = [f for f in os.listdir(fdir) if f.endswith(".png")]
        if len(existing) >= nframes - 2:
            print(f"  [{s['name']}] {len(existing)} frames cached, skipping render")
        else:
            cmd = ["blender", "-b", "-P", os.path.join(HERE, "render_scene.py"), "--",
                   "--glb", cfg["glb"],
                   "--camera", s.get("camera", "push_in"),
                   "--lightshift", s.get("lightshift", "blue"),
                   "--frames", str(nframes),
                   "--fps", str(fps),
                   "--output", fdir + "/",
                   "--width", str(pa.width), "--height", str(pa.height)]
            if s.get("mocap"):
                cmd += ["--mocap", s["mocap"]]
            run(cmd)
        scene_specs.append({"frames_dir": fdir, "beats": [b0, b1]})

    # --- 2. edit ---
    scenes_json = os.path.join(workdir, "scenes.json")
    cards_json = os.path.join(workdir, "cards.json")
    json.dump(scene_specs, open(scenes_json, "w"))
    json.dump(cfg["cards"], open(cards_json, "w"))
    run([sys.executable, os.path.join(HERE, "edit.py"),
         "--scenes", scenes_json,
         "--beats", cfg["beats"],
         "--music", cfg["music"],
         "--cards", cards_json,
         "--out", cfg["out"],
         "--fps", str(fps),
         "--width", str(pa.width), "--height", str(pa.height)])
    print("PIPELINE DONE:", cfg["out"] + "_16x9.mp4")

if __name__ == "__main__":
    main()
