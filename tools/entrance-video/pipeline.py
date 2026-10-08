#!/usr/bin/env python3
"""
pipeline.py — Entrance video pipeline orchestrator.
Takes a character config JSON and produces a 50-second 5-beat
entrance video (16x9 + 9x16), beating the Grok producer bot's lane.

Input config:
{
  "character": "STICK-UP",
  "glb": "/path/to/STICKUP_repaired.glb",
  "music": "/path/to/stickup_video_cut.mp3",
  "beats": "/path/to/stickup_beats.json",
  "cards": {
    "titantron": {"lines": ["STICK UP", "AMERICUS, GEORGIA", "6'1\" - 155 LBS"]},
    "tagline":   {"lines": ["THE ENIGMATIC GANGSTER"]},
    "endcard":   {"lines": ["STICK UP", "BANNON"]}
  },
  "scenes": [
    {"name": "entrance", "mocap": "/path/to/Idle.fbx", "camera": "push_in", "beats": [8, 40]},
    {"name": "taunts",   "mocap": "/path/to/Taunt.fbx", "camera": "orbit", "beats": [40, 72]},
    {"name": "finish1",  "mocap": "/path/to/AssistedCutter.fbx", "camera": "low_angle", "beats": [72, 96]},
    {"name": "finish2",  "mocap": "/path/to/Big Jump.fbx", "camera": "static", "beats": [96, 120]}
  ],
  "out": "/path/to/out/STICKUP_test"
}

Beat spans: titantron uses beats[0..first_scene_start], tagline/endcard use the tail.
All tools free/open-source: Blender (GPL) + ffmpeg (LGPL/GPL).
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
    cfg_path = sys.argv[1]
    cfg = json.load(open(cfg_path))
    fps = 30
    workdir = "/tmp/entrance_work"
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
        fdir = os.path.join(workdir, f"frames_{s['name']}")
        os.makedirs(fdir, exist_ok=True)
        # skip re-render if frames exist (iterate fast)
        existing = [f for f in os.listdir(fdir) if f.endswith(".png")]
        if len(existing) >= nframes - 2:
            print(f"  [{s['name']}] {len(existing)} frames cached, skipping render")
        else:
            cmd = ["blender", "-b", "-P", os.path.join(HERE, "render_scene.py"), "--",
                   "--glb", cfg["glb"],
                   "--camera", s.get("camera", "push_in"),
                   "--frames", str(nframes),
                   "--fps", str(fps),
                   "--output", fdir + "/",
                   "--width", "1920", "--height", "1080"]
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
         "--fps", str(fps)])
    print("PIPELINE DONE:", cfg["out"] + "_16x9.mp4")

if __name__ == "__main__":
    main()
