#!/usr/bin/env python3
"""
pose_orient.py — shared: build bone WORLD orientations from MediaPipe landmarks.

Convention (verified 2026-10-09 on Hardy footage):
  - Landmarks are y-UP (consumers negate MediaPipe's y-down).
  - Subject's LEFT is at +x in world coords.

Method: for each bone, construct a rotation matrix directly from the observed
bone direction + a stable twist hint. No hierarchical chaining, so a noisy
parent (e.g. foreshortened clavicle) cannot corrupt the children.
"""
import numpy as np

NOSE, L_EAR, R_EAR = 0, 7, 8
L_SH, R_SH = 11, 12
L_EL, R_EL, L_WR, R_WR = 13, 14, 15, 16
L_HIP, R_HIP, L_KNEE, R_KNEE, L_ANK, R_ANK = 23, 24, 25, 26, 27, 28

UP = np.array([0.0, 1.0, 0.0])
FWD = np.array([0.0, 0.0, 1.0])

def _norm(v):
    n = np.linalg.norm(v)
    return v / (n + 1e-9) if n > 1e-9 else v

def orient_from_dir(d, hint=FWD):
    """Rotation matrix with +Y along d, minimal twist around hint."""
    y = _norm(d)
    x = np.cross(hint, y)
    if np.linalg.norm(x) < 1e-4:
        x = np.cross(UP, y)
    x = _norm(x)
    z = np.cross(x, y)
    return np.column_stack([x, y, z])

def mat_to_quat(M):
    """3x3 rotation matrix -> (w,x,y,z)."""
    t = np.trace(M)
    if t > 0:
        s = 0.5 / np.sqrt(t + 1.0)
        return np.array([0.25 / s, (M[2,1]-M[1,2])*s, (M[0,2]-M[2,0])*s, (M[1,0]-M[0,1])*s])
    i = int(np.argmax([M[0,0], M[1,1], M[2,2]]))
    if i == 0:
        s = 2.0*np.sqrt(1.0+M[0,0]-M[1,1]-M[2,2]); q=[(M[2,1]-M[1,2])/s, 0.25*s, (M[0,1]+M[1,0])/s, (M[0,2]+M[2,0])/s]
    elif i == 1:
        s = 2.0*np.sqrt(1.0+M[1,1]-M[0,0]-M[2,2]); q=[(M[0,2]-M[2,0])/s, (M[0,1]+M[1,0])/s, 0.25*s, (M[1,2]+M[2,1])/s]
    else:
        s = 2.0*np.sqrt(1.0+M[2,2]-M[0,0]-M[1,1]); q=[(M[1,0]-M[0,1])/s, (M[0,2]+M[2,0])/s, (M[1,2]+M[2,1])/s, 0.25*s]
    q = np.array(q); return q/np.linalg.norm(q)

def joint_positions(lm):
    """lm: (33,3) y-up world landmarks -> dict of joint positions."""
    mid = lambda a, b: (lm[a] + lm[b]) / 2
    hips, sh = mid(L_HIP, R_HIP), mid(L_SH, R_SH)
    to_hips = hips - sh
    P = {
        "hips": hips,
        "spine": sh + to_hips * 0.55,
        "spine1": sh + to_hips * 0.25,
        "neck": sh + UP * 0.04,
        "head": mid(L_EAR, R_EAR),
        "l_sh": lm[L_SH], "l_el": lm[L_EL], "l_wr": lm[L_WR],
        "r_sh": lm[R_SH], "r_el": lm[R_EL], "r_wr": lm[R_WR],
        "l_hip": lm[L_HIP], "l_knee": lm[L_KNEE], "l_ank": lm[L_ANK],
        "r_hip": lm[R_HIP], "r_knee": lm[R_KNEE], "r_ank": lm[R_ANK],
        "nose": lm[NOSE],
    }
    return P

# bone -> (joint, child_joint) for direction measurement
BONE_DIRS = {
    "Hips": None,  # special: yaw from shoulders
    "Spine": ("spine", "spine1"),
    "Spine1": ("spine1", "neck"),
    "Neck": ("neck", "head"),
    "Head": ("neck", "head"),  # direction only; position at head
    "LeftArm": ("l_sh", "l_el"),
    "LeftForeArm": ("l_el", "l_wr"),
    "LeftHand": ("l_el", "l_wr"),
    "RightArm": ("r_sh", "r_el"),
    "RightForeArm": ("r_el", "r_wr"),
    "RightHand": ("r_el", "r_wr"),
    "LeftUpLeg": ("l_hip", "l_knee"),
    "LeftLeg": ("l_knee", "l_ank"),
    "LeftFoot": ("l_ank", "l_ank"),  # static-ish; direction down-forward
    "RightUpLeg": ("r_hip", "r_knee"),
    "RightLeg": ("r_knee", "r_ank"),
    "RightFoot": ("r_ank", "r_ank"),
}

def world_orientations(P):
    """P: joint dict -> {bone: 3x3 world rotation matrix}."""
    Q = {}
    # Hips: yaw from shoulder axis, upright
    sh_ax = _norm(P["r_sh"] - P["l_sh"])
    yaw = np.arctan2(sh_ax[0], sh_ax[2])
    cy, sy = np.cos(yaw), np.sin(yaw)
    # yaw about Y: x' = (cy, 0, -sy)? use matrix
    Q["Hips"] = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    for bone, spec in BONE_DIRS.items():
        if bone == "Hips":
            continue
        if bone.endswith("Foot"):
            d = np.array([0.0, -0.7, 0.7])
        else:
            a, b = spec
            d = P[b] - P[a]
        if np.linalg.norm(d) < 1e-6 or np.isnan(d).any():
            Q[bone] = Q.get("Hips", np.eye(3))
        else:
            Q[bone] = orient_from_dir(d)
    return Q

def smooth_orientations(Q_seq):
    """Light temporal smoothing on world-orientation matrices (sign-aware)."""
    # convert to quats, flip signs for continuity, box-blur, renormalize
    N = len(Q_seq)
    bones = list(Q_seq[0].keys())
    qseq = {b: np.array([mat_to_quat(Q_seq[f][b]) for f in range(N)]) for b in bones}
    for b in bones:
        q = qseq[b]
        for f in range(1, N):
            if np.dot(q[f], q[f-1]) < 0:
                q[f] = -q[f]
        w = np.array([0.25, 0.5, 0.25])
        qs = q.copy()
        for f in range(1, N-1):
            qs[f] = w[0]*q[f-1] + w[1]*q[f] + w[2]*q[f+1]
            qs[f] /= np.linalg.norm(qs[f]) + 1e-9
        qseq[b] = qs
    # back to matrices
    out = []
    for f in range(N):
        Q = {}
        for b in bones:
            w, x, y, z = qseq[b][f]
            Q[b] = np.array([
                [1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
                [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
                [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
        out.append(Q)
    return out
