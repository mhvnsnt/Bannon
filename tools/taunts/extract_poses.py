#!/usr/bin/env python3
"""
extract_poses.py — video -> MediaPipe PoseLandmarker 3D landmarks -> .npz

Usage:
  python3 extract_poses.py footage/hardy_entrance.mp4 --fps 10 --out poses/hardy_entrance.npz

Each frame: 33 landmarks x (x, y, z, visibility) in WORLD coordinates (meters,
hip-centered). Missing detections are NaN.
NOTE: MediaPipe Tasks world landmarks use y-DOWN (image convention), verified
2026-10-09. Consumers (landmarks_to_bvh.py, segment_taunts.py) negate y to y-up
on load. Do not "fix" the raw files without updating them.
"""
import argparse, os, sys
import numpy as np

TASK_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "..", "..", "..", "taunt-mocap", "pose_landmarker_full.task")
# fallback: sibling of this script's repo-independent location
ALT_TASK = "/home/hatch/workspace/taunt-mocap/pose_landmarker_full.task"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--fps", type=float, default=10.0)
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-frames", type=int, default=0)
    ap.add_argument("--task", default=None)
    args = ap.parse_args()

    import cv2
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision

    task = args.task or (ALT_TASK if os.path.exists(ALT_TASK) else TASK_FILE)
    if not os.path.exists(task):
        sys.exit(f"pose landmarker task file not found: {task}")
    base = mp_python.BaseOptions(model_asset_path=task)
    opts = vision.PoseLandmarkerOptions(
        base_options=base, running_mode=vision.RunningMode.IMAGE, num_poses=1,
        min_pose_detection_confidence=0.5)
    landmarker = vision.PoseLandmarker.create_from_options(opts)

    cap = cv2.VideoCapture(args.video)
    if not cap.isOpened():
        sys.exit(f"cannot open {args.video}")
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, int(round(src_fps / args.fps)))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"{args.video}: {src_fps:.1f}fps, {total} frames, sampling every {step} -> ~{total//step} poses")

    frames, stamps = [], []
    idx = n_done = 0
    while True:
        ok, img = cap.read()
        if not ok:
            break
        if idx % step == 0:
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB,
                                data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            res = landmarker.detect(mp_img)
            if res.pose_world_landmarks:
                lm = np.array([[l.x, l.y, l.z, getattr(l, 'visibility', 1.0)]
                               for l in res.pose_world_landmarks[0]], dtype=np.float32)
            else:
                lm = np.full((33, 4), np.nan, dtype=np.float32)
            frames.append(lm)
            stamps.append(idx / src_fps)            n_done += 1
            if n_done % 200 == 0:
                det = sum(1 for f in frames if not np.isnan(f).all())
                print(f"  {n_done} sampled, {det} with detection", flush=True)
            if args.max_frames and n_done >= args.max_frames:
                break
        idx += 1
    cap.release()
    landmarker.close()

    arr = np.stack(frames)
    det = int(sum(1 for f in frames if not np.isnan(f).all()))
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    np.savez_compressed(args.out, poses=arr, t=np.array(stamps, dtype=np.float32),
                        src=args.video, sample_fps=np.float32(args.fps))
    print(f"saved {args.out}: {arr.shape[0]} frames, {det} detections ({100*det/max(1,arr.shape[0]):.0f}%)")

if __name__ == "__main__":
    main()
