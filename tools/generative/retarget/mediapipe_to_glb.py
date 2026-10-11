#!/usr/bin/env python3
"""mediapipe_to_glb.py — monocular video mocap retargeted to the Bannon 58-bone skeleton.

Built on MediaPipe Pose Landmarker (BlazePose GHUM, Apache-2.0 — the same class
of monocular 3D pose estimator that commercial tools like Plask / Move AI /
Rokoko Video wrap). Runs fully offline on CPU; the model is a ~9MB .task file.

Pipeline: video -> 33 BlazePose landmarks/frame -> bone-direction solve ->
bone-local quaternions -> glTF animation injected into a Bannon character GLB.

Setup (one time):
  pip install mediapipe opencv-python numpy

Usage:
  python3 mediapipe_to_glb.py --video ref.mp4 --on ../../out/STICKUP_repaired.glb \\
      --out proof/STICKUP_capture.glb --name POWERBOMB
  python3 mediapipe_to_glb.py --synthetic-test --on ../../out/STICKUP_repaired.glb \\
      --out proof/SYNTH_CAPTURE.glb     # no camera/model needed; proves the solve end-to-end

Quality note: captures are smoothed (One-Euro-ish moving average) and feet are
*not* contact-locked — treat output as a first pass for hand animation, the
same way commercial video-mocap output is treated.
"""
import argparse, json, math, os, struct, sys, urllib.request

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common.quat import quat_from_to, quat_mul, quat_normalize, slerp  # noqa: E402
from common import glb_anim  # noqa: E402
from common.fk import Skeleton  # noqa: E402

# BlazePose landmark indices
LM = {"nose": 0, "l_sh": 11, "r_sh": 12, "l_el": 13, "r_el": 14,
      "l_wr": 15, "r_wr": 16, "l_hip": 23, "r_hip": 24,
      "l_knee": 25, "r_knee": 26, "l_ank": 27, "r_ank": 28,
      "l_foot": 31, "r_foot": 32}

MODEL_URL = ("https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
             "pose_landmarker_full/pose_landmarker_full.task")

# bone -> (from_landmark, to_landmark, bannon_bone_alias)
BONE_RAYS = [
    ("l_sh", "l_el", "LA"), ("l_el", "l_wr", "LFA"),
    ("r_sh", "r_el", "RA"), ("r_el", "r_wr", "RFA"),
    ("l_hip", "l_knee", "LUL"), ("l_knee", "l_ank", "LL"), ("l_ank", "l_foot", "LF"),
    ("r_hip", "r_knee", "RUL"), ("r_knee", "r_ank", "RL"), ("r_ank", "r_foot", "RF"),
]
ALIAS2BONE = None  # filled lazily from procedural_moves.B

IDENT = np.array([0.0, 0.0, 0.0, 1.0])


def _load_skeleton(glb_path):
    with open(glb_path, "rb") as f:
        assert f.read(4) == b"glTF"
        f.read(8)
        jl = struct.unpack("<I", f.read(4))[0]
        f.read(4)
        js = json.loads(f.read(jl))
    return js, Skeleton(js["nodes"])


def _rest_bone_dirs(sk):
    """Rest world-space direction of each bone (joint -> primary child)."""
    P, Q = sk.fk()
    out = {}
    child_of = {}
    for i in range(sk.n):
        p = sk.parent[i]
        if p >= 0 and p not in child_of:
            child_of[p] = i
    for alias, full in _aliases().items():
        if full not in sk.name2idx:
            continue
        i = sk.name2idx[full]
        c = child_of.get(i)
        if c is None:
            continue
        d = P[c] - P[i]
        n = np.linalg.norm(d)
        if n > 1e-9:
            out[alias] = (d / n, Q[i])
    return out


def _aliases():
    global ALIAS2BONE
    if ALIAS2BONE is None:
        from motion.procedural_moves import B
        ALIAS2BONE = B
    return ALIAS2BONE


def solve_frame(sk, rest_dirs, lm):
    """lm: (33,3) world landmarks. Returns {node_idx: local quat}."""
    Bm = _aliases()
    keys = {}
    for a, b, alias in BONE_RAYS:
        d = lm[LM[b]] - lm[LM[a]]
        n = np.linalg.norm(d)
        if n < 1e-9 or alias not in rest_dirs:
            continue
        d_rest, q_rest_world = rest_dirs[alias]
        q_world = quat_from_to(d_rest, d / n)
        q_rest_inv = np.array([-q_rest_world[0], -q_rest_world[1],
                               -q_rest_world[2], q_rest_world[3]])
        q_local = quat_mul(quat_mul(q_rest_inv, q_world), q_rest_world)
        keys[sk.name2idx[Bm[alias]]] = quat_normalize(q_local)
    # spine: hip_mid -> shoulder_mid split across S/S1/S2
    hip_mid = (lm[LM["l_hip"]] + lm[LM["r_hip"]]) / 2
    sh_mid = (lm[LM["l_sh"]] + lm[LM["r_sh"]]) / 2
    d = sh_mid - hip_mid
    if np.linalg.norm(d) > 1e-9 and "S" in rest_dirs:
        d_rest, q_rest_world = rest_dirs["S"]
        q_world = quat_from_to(d_rest, d / np.linalg.norm(d))
        for alias, frac in (("S", 0.33), ("S1", 0.66), ("S2", 1.0)):
            if alias not in rest_dirs or Bm[alias] not in sk.name2idx:
                continue
            qq = slerp(IDENT, q_world, frac)
            q_rest_world_a = rest_dirs[alias][1]
            q_rest_inv = np.array([-q_rest_world_a[0], -q_rest_world_a[1],
                                   -q_rest_world_a[2], q_rest_world_a[3]])
            keys[sk.name2idx[Bm[alias]]] = quat_normalize(
                quat_mul(quat_mul(q_rest_inv, qq), q_rest_world_a))
    # head: shoulder_mid -> nose on Neck
    d = lm[LM["nose"]] - sh_mid
    if np.linalg.norm(d) > 1e-9 and "N" in rest_dirs:
        d_rest, q_rest_world = rest_dirs["N"]
        q_world = quat_from_to(d_rest, d / np.linalg.norm(d))
        q_rest_inv = np.array([-q_rest_world[0], -q_rest_world[1],
                               -q_rest_world[2], q_rest_world[3]])
        keys[sk.name2idx[Bm["N"]]] = quat_normalize(
            quat_mul(quat_mul(q_rest_inv, q_world), q_rest_world))
    return keys, hip_mid


def smooth_keys(frames_keys, window=5):
    """Moving-average smoothing over per-frame {node: quat} dicts."""
    if window <= 1:
        return frames_keys
    nodes = sorted({k for f in frames_keys for k in f})
    seqs = {nd: [] for nd in nodes}
    for f in frames_keys:
        for nd in nodes:
            seqs[nd].append(f.get(nd, IDENT))
    out = []
    hw = window // 2
    for i in range(len(frames_keys)):
        fr = {}
        for nd in nodes:
            lo, hi = max(0, i - hw), min(len(frames_keys), i + hw + 1)
            acc = np.zeros(4)
            for j in range(lo, hi):
                q = seqs[nd][j]
                if np.dot(acc, q) < 0:
                    q = -q
                acc += q
            fr[nd] = quat_normalize(acc)
        out.append(fr)
    return out


def ensure_model(path):
    if os.path.exists(path) and os.path.getsize(path) > 1_000_000:
        return path
    print(f"downloading pose model -> {path} ...")
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    urllib.request.urlretrieve(MODEL_URL, path)
    return path


def landmarks_from_video(video_path, model_path, max_frames=600, every=2):
    try:
        import mediapipe as mp
        import cv2
    except ImportError:
        sys.exit("need: pip install mediapipe opencv-python")
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    base = mp_python.BaseOptions(model_asset_path=ensure_model(model_path))
    opts = mp_vision.PoseLandmarkerOptions(
        base_options=base, running_mode=mp_vision.RunningMode.VIDEO,
        num_poses=1, min_pose_detection_confidence=0.4)
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frames, i, ts = [], 0, 0
    with mp_vision.PoseLandmarker.create_from_options(opts) as lm:
        while len(frames) < max_frames:
            ok, img = cap.read()
            if not ok:
                break
            if i % every == 0:
                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                res = lm.detect_for_video(mp_img, int(ts * 1000))
                if res.pose_world_landmarks:
                    frames.append(np.array(
                        [[p.x, p.y, p.z] for p in res.pose_world_landmarks[0]],
                        dtype=float))
            i += 1
            ts += 1.0 / fps
    cap.release()
    print(f"captured {len(frames)} landmark frames from {video_path}")
    return frames, fps / every


def synthetic_landmarks(n=45):
    """Deterministic fake capture: right-hand punch. No camera needed."""
    frames = []
    base = {
        "l_sh": (-0.20, 1.45, 0), "r_sh": (0.20, 1.45, 0),
        "l_hip": (-0.10, 0.95, 0), "r_hip": (0.10, 0.95, 0),
        "nose": (0, 1.62, 0.02),
    }
    for f in range(n):
        u = f / (n - 1)
        punch = math.sin(u * math.pi)  # 0 -> 1 -> 0
        lm = np.zeros((33, 3))
        lm[11] = base["l_sh"]; lm[12] = base["r_sh"]
        lm[23] = base["l_hip"]; lm[24] = base["r_hip"]
        lm[0] = base["nose"]
        lm[13] = (-0.20, 1.20, 0.02); lm[15] = (-0.20, 1.05, 0.05)   # left guard
        lm[14] = (0.22, 1.25 - 0.1 * punch, 0.02 + 0.35 * punch)      # right elbow
        lm[16] = (0.22, 1.30 - 0.1 * punch, 0.10 + 0.55 * punch)      # right fist -> forward
        lm[25] = (-0.10, 0.50, 0); lm[27] = (-0.10, 0.10, 0.02); lm[31] = (-0.10, 0.02, 0.10)
        lm[26] = (0.10, 0.50, 0); lm[28] = (0.10, 0.10, 0.02); lm[32] = (0.10, 0.02, 0.10)
        frames.append(lm)
    return frames, 30.0


def capture_to_tracks(sk, frames, fps, smooth=5):
    rest_dirs = _rest_bone_dirs(sk)
    per_frame = []
    hips_traj = []
    for lm in frames:
        keys, hip_mid = solve_frame(sk, rest_dirs, lm)
        per_frame.append(keys)
        hips_traj.append(hip_mid)
    per_frame = smooth_keys(per_frame, smooth)
    # normalize hip trajectory to offsets relative to frame 0
    h0 = hips_traj[0]
    root = [(0.0, 0.0, 0.0)] + []  # filled below
    root = [tuple((h - h0) * 1.0) for h in hips_traj]
    # MediaPipe world Y is up in meters; skeleton units differ -> keep small
    return per_frame, root, fps


def write_capture_glb(src_glb, dst_glb, anim_name, per_frame, root_traj, fps):
    js, bin_data = glb_anim.read_glb(src_glb)
    tracks = []
    nodes = sorted({k for f in per_frame for k in f})
    n = len(per_frame)
    times = [i / fps for i in range(n)]
    for nd in nodes:
        vals = [tuple(float(v) for v in per_frame[i].get(nd, IDENT)) for i in range(n)]
        tracks.append({"node": nd, "path": "rotation", "times": times, "values": vals})
    if root_traj:
        from motion.procedural_moves import B
        with open(src_glb, "rb") as f:
            pass
        name2idx = {nd.get("name", ""): i for i, nd in enumerate(js["nodes"])}
        if B["H"] in name2idx:
            tracks.append({"node": name2idx[B["H"]], "path": "translation",
                           "times": times,
                           "values": [tuple(float(v) for v in p) for p in root_traj]})
            glb_anim.add_animation(js, bin_data, anim_name, tracks,
                                   compose_translation=name2idx[B["H"]])
        else:
            glb_anim.add_animation(js, bin_data, anim_name, tracks)
    else:
        glb_anim.add_animation(js, bin_data, anim_name, tracks)
    glb_anim.write_glb(dst_glb, js, bin_data)
    return dst_glb


def main():
    ap = argparse.ArgumentParser(description="video mocap -> Bannon GLB animation")
    ap.add_argument("--video")
    ap.add_argument("--on", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default="MOCAP")
    ap.add_argument("--model", default=os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "pose_landmarker_full.task"))
    ap.add_argument("--synthetic-test", action="store_true")
    ap.add_argument("--smooth", type=int, default=5)
    ap.add_argument("--max-frames", type=int, default=600)
    a = ap.parse_args()

    js, sk = _load_skeleton(a.on)
    if a.synthetic_test:
        frames, fps = synthetic_landmarks()
    else:
        assert a.video, "--video required (or --synthetic-test)"
        frames, fps = landmarks_from_video(a.video, a.model, a.max_frames)
        assert frames, "no poses detected in video"
    per_frame, root, fps = capture_to_tracks(sk, frames, fps, a.smooth)
    write_capture_glb(a.on, a.out, f"CAPTURE_{a.name}", per_frame, root, fps)
    n_nodes = len({k for f in per_frame for k in f})
    print(f"wrote {a.out}: {len(frames)} frames @ {fps:.1f}fps, {n_nodes} animated nodes")


if __name__ == "__main__":
    main()
