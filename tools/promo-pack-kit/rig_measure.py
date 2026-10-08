#!/usr/bin/env python3
"""rig_measure.py — measure rig quality DIRECTLY from GLB files.

promo_gates.py v1 only EVALUATED a metrics JSON someone else measured — a gate
that trusts unmeasured inputs proves nothing. This module measures the rig
itself, straight from the GLB, with stdlib + numpy only (no new dependency).

Measurements (all computed from file bytes, never trusted inputs):
  1. rotation eff-deg vs a reference rig (default: the repo's XBot):
       rest-pose eff-deg  = mean quaternion angle between name-matched joints'
                            world rotations in rest pose. XBot vs XBot = 0.0.
       clip eff-deg       = same, but with both rigs driven by an animation
                            clip (e.g. Body_Jab_Cross.glb, 2.08 s mixamo):
                            the clip's local rotations are applied to matched
                            joints, sampled over N frames, mean angle.
                            This mirrors the QA chart setup (same clip on each
                            rig; XBot ref 0.0deg PASS / BANNON_v1 5.1deg FAIL /
                            Cody tripo 7.0deg FAIL, 2026-10-07). The chart's
                            exact generator was not recoverable from the repos,
                            so the definition is documented here and the
                            measured numbers are quoted raw for comparison.
  2. feet min-Y from skinned bind-pose geometry (proper linear blend skinning:
     sum_j w_ij * (jointWorld_j @ invBind_j) * pos_i). Floating = min_y > 0.
  3. skin-weight audit: verts with zero total weight, verts bound to >4 joints,
     max single-joint dominance (the shoulder-flap class of defect).
  4. rest-pose sanity: zero-length bones, left/right bone-length symmetry,
     A/T-pose classification from arm abduction.

Usage:
  python3 rig_measure.py MODEL.glb [--ref REF.glb] [--clip CLIP.glb]
      [--frames 8] [--metrics-out metrics.json] [--shot NAME]

  The --metrics-out JSON has a "gates" block promo_gates.py consumes, or run:
  python3 promo_gates.py --measure MODEL.glb [--ref ...] [--clip ...]

Takes any GLB path — no hardcoding (the owner runs this on arbitrary files).
"""
import argparse
import json
import math
import os
import struct
import sys

import numpy as np

# --------------------------------------------------------------------------
# glTF parsing (stdlib + numpy; GLB container: JSON chunk + BIN chunk)
# --------------------------------------------------------------------------

_COMP = {5120: ("b", 1, False), 5121: ("B", 1, True), 5122: ("h", 2, False),
         5123: ("H", 2, True), 5125: ("I", 4, False), 5126: ("f", 4, False)}
_TYPE_N = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
_NORM_DIV = {(5120, True): 127.0, (5121, True): 255.0, (5122, True): 32767.0,
             (5123, True): 65535.0}


def load_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    if data[:4] != b"glTF":
        raise ValueError(f"not a GLB file: {path}")
    jlen = struct.unpack("<I", data[12:16])[0]
    js = json.loads(data[20:20 + jlen].decode("utf-8"))
    off = 20 + jlen
    blen = struct.unpack("<I", data[off:off + 4])[0]
    assert data[off + 4:off + 8] == b"BIN\x00", "missing BIN chunk"
    blob = data[off + 8:off + 8 + blen]
    return js, blob


def read_accessor(js, blob, idx):
    acc = js["accessors"][idx]
    bv = js["bufferViews"][acc["bufferView"]]
    fmt, size, _ = _COMP[acc["componentType"]]
    n = _TYPE_N[acc["type"]]
    start = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    stride = bv.get("byteStride", n * size)
    count = acc["count"]
    out = np.zeros((count, n), dtype=np.float64)
    for i in range(count):
        chunk = blob[start + i * stride:start + i * stride + n * size]
        vals = struct.unpack("<" + fmt * n, chunk)
        if acc.get("normalized"):
            div = _NORM_DIV[(acc["componentType"], True)]
            out[i] = [v / div for v in vals]
        else:
            out[i] = vals
    return out


# --------------------------------------------------------------------------
# quaternions / matrices (glTF quats are x,y,z,w)
# --------------------------------------------------------------------------

def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return np.array([
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz])


def qnorm(q):
    n = np.linalg.norm(q)
    return q / n if n > 1e-12 else np.array([0, 0, 0, 1.0])


def qangle_deg(a, b):
    d = abs(float(np.dot(qnorm(a), qnorm(b))))
    d = min(1.0, d)
    return 2.0 * math.degrees(math.acos(d))


def trs_to_mat(t, r, s):
    x, y, z, w = r
    n = x * x + y * y + z * z + w * w
    s_ = 2.0 / n if n > 1e-12 else 0.0
    xx, yy, zz = x * x * s_, y * y * s_, z * z * s_
    xy, xz, yz = x * y * s_, x * z * s_, y * z * s_
    wx, wy, wz = w * x * s_, w * y * s_, w * z * s_
    m = np.eye(4)
    m[0, 0], m[0, 1], m[0, 2] = 1 - (yy + zz), xy - wz, xz + wy
    m[1, 0], m[1, 1], m[1, 2] = xy + wz, 1 - (xx + zz), yz - wx
    m[2, 0], m[2, 1], m[2, 2] = xz - wy, yz + wx, 1 - (xx + yy)
    m[0, 3], m[1, 3], m[2, 3] = t
    m[0, 0] *= s[0]; m[1, 0] *= s[0]; m[2, 0] *= s[0]
    m[0, 1] *= s[1]; m[1, 1] *= s[1]; m[2, 1] *= s[1]
    m[0, 2] *= s[2]; m[1, 2] *= s[2]; m[2, 2] *= s[2]
    return m


def mat_to_quat(m):
    t = m[0, 0] + m[1, 1] + m[2, 2]
    if t > 0:
        s = 0.5 / math.sqrt(t + 1.0)
        w = 0.25 / s
        x, y, z = (m[2, 1] - m[1, 2]) * s, (m[0, 2] - m[2, 0]) * s, (m[1, 0] - m[0, 1]) * s
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = 2.0 * math.sqrt(1.0 + m[0, 0] - m[1, 1] - m[2, 2])
        w = (m[2, 1] - m[1, 2]) / s
        x, y, z = 0.25 * s, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s
    elif m[1, 1] > m[2, 2]:
        s = 2.0 * math.sqrt(1.0 + m[1, 1] - m[0, 0] - m[2, 2])
        w = (m[0, 2] - m[2, 0]) / s
        x, y, z = (m[0, 1] + m[1, 0]) / s, 0.25 * s, (m[1, 2] + m[2, 1]) / s
    else:
        s = 2.0 * math.sqrt(1.0 + m[2, 2] - m[0, 0] - m[1, 1])
        w = (m[1, 0] - m[0, 1]) / s
        x, y, z = (m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, 0.25 * s
    return qnorm(np.array([x, y, z, w]))


# --------------------------------------------------------------------------
# rig model
# --------------------------------------------------------------------------

_SYNONYMS = {
    "sh": "upperarm", "shoulder": "upperarm", "upperarm": "upperarm", "arm": "upperarm",
    "el": "forearm", "elbow": "forearm", "forearm": "forearm", "lowerarm": "forearm",
    "ha": "hand", "hand": "hand",
    "hip": "thigh", "thigh": "thigh", "upleg": "thigh",
    "kn": "calf", "knee": "calf", "calf": "calf", "leg": "calf", "shin": "calf",
    "ft": "foot", "foot": "foot", "toebase": "foot", "toes": "foot",
    "hips": "pelvis", "pelvis": "pelvis",
    "headtop": "head", "head": "head", "neck": "neck",
    "chest": "chest", "spine": "spine", "spine1": "spine1", "spine2": "spine2",
}
_ROOT_NAMES = {"world", "rootnode", "scene", "armature", "root"}


def norm_name(n):
    n = (n or "").lower()
    n = "".join(c for c in n if c.isalnum())
    if n.startswith("mixamorig"):
        n = n[len("mixamorig"):]
    if n.startswith("mixamo"):
        n = n[len("mixamo"):]
    return n


def core_and_side(n):
    nn = norm_name(n)
    side = None
    for suf, s in (("left", "L"), ("right", "R")):
        if nn.startswith(suf) and len(nn) > len(suf):
            side, nn = s, nn[len(suf):]
        elif nn.endswith(suf) and len(nn) > len(suf):
            side, nn = s, nn[:-len(suf)]
    if not side and len(nn) > 1 and nn[-1] in ("l", "r") and nn[-2].isalpha():
        side, nn = nn[-1].upper(), nn[:-1]
    core = _SYNONYMS.get(nn, nn)
    return core, side


class Rig:
    """A GLB's joint hierarchy with rest-pose world transforms."""

    def __init__(self, path):
        self.path = path
        self.js, self.blob = load_glb(path)
        nodes = self.js.get("nodes", [])
        self.names = [n.get("name") or f"node{i}" for i, n in enumerate(nodes)]
        parent = [-1] * len(nodes)
        for i, n in enumerate(nodes):
            for c in n.get("children", []) or []:
                parent[c] = i
        self.parent = parent
        self.local = []
        for n in nodes:
            t = np.array(n.get("translation", [0, 0, 0]), dtype=float)
            r = qnorm(np.array(n.get("rotation", [0, 0, 0, 1]), dtype=float))
            s = np.array(n.get("scale", [1, 1, 1]), dtype=float)
            self.local.append((t, r, s))
        self.world_mat = [None] * len(nodes)
        self.world_quat = [None] * len(nodes)
        self.world_pos = [None] * len(nodes)
        for i in range(len(nodes)):
            self._world(i)
        # joint set: skin joints if present, else named non-root nodes
        skins = self.js.get("skins", [])
        if skins and skins[0].get("joints"):
            self.joints = list(skins[0]["joints"])
            self.skin = skins[0]
        else:
            self.joints = [i for i, nm in enumerate(self.names)
                           if norm_name(nm) not in _ROOT_NAMES]
            self.skin = None
        self.ibms = None
        self.geom_readable = True
        if self.skin and self.skin.get("inverseBindMatrices") is not None:
            try:
                raw = read_accessor(self.js, self.blob, self.skin["inverseBindMatrices"])
                self.ibms = [np.asarray(m).reshape(4, 4).T for m in raw.reshape(-1, 16)]
            except Exception as e:
                # e.g. EXT_meshopt_compression buffers: hierarchy metrics still
                # work from the JSON node transforms; geometry metrics are n/a
                self.ibms = None
                self.geom_readable = False
                self._geom_note = f"compressed buffers ({type(e).__name__})"

    def _world(self, i):
        if self.world_mat[i] is not None:
            return self.world_mat[i]
        t, r, s = self.local[i]
        m = trs_to_mat(t, r, s)
        p = self.parent[i]
        if p >= 0:
            m = self._world(p) @ m
        self.world_mat[i] = m
        self.world_quat[i] = mat_to_quat(m)
        self.world_pos[i] = m[:3, 3]
        return m

    def match_joints(self, ref):
        """Match my joints to ref joints. Returns [(mi, ri)].

        Tier 1: exact normalized-name match (mixamorig:Hips == mixamorigHips).
        Tier 2: (core, side) synonym match, only when unique on both sides
        (prevents HeadTop_End colliding with Head, etc).
        """
        ref_exact = {}
        for ri in ref.joints:
            ref_exact.setdefault(norm_name(ref.names[ri]), []).append(ri)
        ref_cs = {}
        for ri in ref.joints:
            ref_cs.setdefault(core_and_side(ref.names[ri]), []).append(ri)
        mine_cs = {}
        for mi in self.joints:
            mine_cs.setdefault(core_and_side(self.names[mi]), []).append(mi)
        out, used_ri = [], set()
        for mi in self.joints:
            ex = ref_exact.get(norm_name(self.names[mi]), [])
            ex = [ri for ri in ex if ri not in used_ri]
            if ex:
                out.append((mi, ex[0]))
                used_ri.add(ex[0])
        for mi in self.joints:
            if any(a == mi for a, _ in out):
                continue
            key = core_and_side(self.names[mi])
            rc, mc = ref_cs.get(key, []), mine_cs.get(key, [])
            rc = [ri for ri in rc if ri not in used_ri]
            if len(rc) == 1 and len(mc) == 1:
                out.append((mi, rc[0]))
                used_ri.add(rc[0])
        return out


def eff_deg_rest(model, ref):
    """Mean local-quaternion angle over name-matched joints.

    Local (not world): a root-orientation or hierarchy-depth difference must
    not inflate every joint. XBot vs XBot = 0.0 by construction.
    """
    matched = model.match_joints(ref)
    if not matched:
        return None, 0
    angs = [qangle_deg(model.local[mi][1], ref.local[ri][1]) for mi, ri in matched]
    return float(np.mean(angs)), len(matched)


# --------------------------------------------------------------------------
# animation clip
# --------------------------------------------------------------------------

def load_clip(path, anim_index=0):
    js, blob = load_glb(path)
    anims = js.get("animations", [])
    if not anims:
        raise ValueError(f"no animations in {path}")
    anim = anims[anim_index]
    nodes = [n.get("name") or f"node{i}" for i, n in enumerate(js.get("nodes", []))]
    chans = []  # (node_idx, path, times, values)
    for ch in anim["channels"]:
        tgt = ch["target"]
        if tgt["path"] not in ("rotation", "translation"):
            continue
        smp = anim["samplers"][ch["sampler"]]
        times = read_accessor(js, blob, smp["input"]).ravel()
        vals = read_accessor(js, blob, smp["output"])
        chans.append((tgt["node"], tgt["path"], times, vals))
    return js, nodes, chans


def sample_clip(chans, n_frames):
    """Resample rotation channels to n_frames evenly spaced frames.
    Returns list of frames; each frame is {norm_core_side: quat}."""
    # per node: nearest-key sample
    frames = []
    # global time range
    t0 = min(t[0] for _, _, t, _ in chans)
    t1 = max(t[-1] for _, _, t, _ in chans)
    ts = np.linspace(t0, t1, n_frames)
    per_node = {}
    for node, path, times, vals in chans:
        if path != "rotation":
            continue
        idx = np.clip(np.searchsorted(times, ts), 0, len(times) - 1)
        per_node[node] = [qnorm(v) for v in vals[idx]]
    for f in range(n_frames):
        frames.append({node: per_node[node][f] for node in per_node})
    return frames


def drive_world_quats(rig, joint_match_map, frame_rots):
    """World quats with clip rotations substituted on matched joints.

    joint_match_map: {rig_joint_idx: clip_node_idx}
    frame_rots: {clip_node_idx: quat} for this frame
    """
    n = len(rig.names)
    local_q = [None] * n
    for i in range(n):
        _, r, _ = rig.local[i]
        local_q[i] = r
    for ji, cn in joint_match_map.items():
        if cn in frame_rots:
            local_q[ji] = qnorm(frame_rots[cn])
    wq = [None] * n
    for i in range(n):
        q = local_q[i]
        p = rig.parent[i]
        wq[i] = qmul(wq[p], q) if p >= 0 else qnorm(q)
    return wq, local_q


def eff_deg_clip(model, ref, clip_path, n_frames=8):
    """Clip-driven eff-deg: same clip drives both rigs; compare how each joint
    ROTATES relative to its own rest pose (delta-from-rest).

    For pair (mj, rj) at frame f:
        dM = q_clip(mj,f) (*) conj(q_rest_local(mj))
        dR = q_clip(rj,f) (*) conj(q_rest_local(rj))
        err = angle(dM, dR)
    Mean over frames x matched joints. Root-orientation and hierarchy-depth
    differences cancel: this measures whether the rig reproduces the
    reference's motion. XBot driven by its own clip = 0.0 by construction.
    Mirrors the QA chart setup (Body_JabCross.glb, 2.08 s, mixamo clip).
    """
    _, clip_nodes, chans = load_clip(clip_path)
    frames = sample_clip(chans, n_frames)

    targeted = {c[0] for c in chans}  # clip nodes with animation channels
    def build_map(rig):
        # rig joint idx -> clip node idx, via (core, side).
        # Clip files often duplicate joint names (bind + animated copies):
        # prefer the copy the animation channels actually target.
        rmap, cmap = {}, {}
        for ji in rig.joints:
            rmap.setdefault(core_and_side(rig.names[ji]), []).append(ji)
        for cn, nm in enumerate(clip_nodes):
            if nm:
                cmap.setdefault(core_and_side(nm), []).append(cn)
        jmap = {}
        for key, jis in rmap.items():
            if key not in cmap or len(jis) != 1:
                continue
            cands = cmap[key]
            pick = [c for c in cands if c in targeted] or cands
            jmap[jis[0]] = pick[0]
        return jmap

    mmap, rmap = build_map(model), build_map(ref)
    m_by_key = {core_and_side(model.names[j]): j for j in mmap}
    r_by_key = {core_and_side(ref.names[j]): j for j in rmap}
    pairs = []
    for k in m_by_key:
        if k in r_by_key:
            mj, rj = m_by_key[k], r_by_key[k]
            pairs.append((mj, rj, mmap[mj], rmap[rj]))
    if not pairs:
        return None, 0
    angs = []
    per_joint = {}
    for mj, rj, cn_m, cn_r in pairs:
        vals = []
        for fr in frames:
            if cn_m not in fr or cn_r not in fr:
                continue
            dM = qmul(qnorm(fr[cn_m]), qconj(model.local[mj][1]))
            dR = qmul(qnorm(fr[cn_r]), qconj(ref.local[rj][1]))
            vals.append(qangle_deg(dM, dR))
        if vals:
            per_joint[model.names[mj]] = float(np.mean(vals))
            angs.extend(vals)
    detail = {"per_joint_deg": dict(sorted(per_joint.items(),
                                           key=lambda kv: -kv[1]))}
    return (float(np.mean(angs)) if angs else None), len(pairs), detail


def qconj(q):
    q = qnorm(q)
    return np.array([-q[0], -q[1], -q[2], q[3]])


# --------------------------------------------------------------------------
# geometry: skinned bind-pose positions, feet, skin audit
# --------------------------------------------------------------------------

def skinned_positions(rig):
    """Bind-pose skinned vertex positions (N,3). Falls back to raw positions.
    Returns (None, False) when buffers are unreadable (e.g. meshopt)."""
    js, blob = rig.js, rig.blob
    if not getattr(rig, "geom_readable", True):
        return None, False
    all_pos = []
    skinned_any = False
    for mesh in js.get("meshes", []):
        for prim in mesh.get("primitives", []):
            attrs = prim.get("attributes", {})
            if "POSITION" not in attrs:
                continue
            try:
                pos = read_accessor(js, blob, attrs["POSITION"])[:, :3]
                joints = (read_accessor(js, blob, attrs["JOINTS_0"]).astype(int)
                          if "JOINTS_0" in attrs else None)
                weights = (read_accessor(js, blob, attrs["WEIGHTS_0"])
                           if "WEIGHTS_0" in attrs else None)
            except Exception:
                return None, False
            if (rig.skin and rig.ibms is not None and joints is not None
                    and weights is not None):
                n = pos.shape[0]
                ph = np.hstack([pos, np.ones((n, 1))])
                nj = len(rig.joints)
                sms = np.zeros((nj, 4, 4))
                for jj, jnode in enumerate(rig.joints):
                    ibm = (rig.ibms[jj] if rig.ibms and jj < len(rig.ibms)
                           else np.eye(4))
                    sms[jj] = rig.world_mat[jnode] @ ibm
                out = np.zeros((n, 3))
                for k in range(joints.shape[1]):
                    j = np.clip(joints[:, k], 0, nj - 1)
                    w = weights[:, k]
                    contrib = np.einsum("ni,nij->nj", ph, sms[j])
                    out += w[:, None] * contrib[:, :3]
                all_pos.append(out)
                skinned_any = True
            else:
                all_pos.append(pos)
    if not all_pos:
        return None, False
    return np.vstack(all_pos), skinned_any


def skin_audit(rig):
    js, blob = rig.js, rig.blob
    res = {"skinned": False, "verts": 0, "zero_weight_verts": 0,
           "over4_joint_verts": 0, "max_single_dominance": 0.0,
           "max_single_joint": None, "dominant_095_verts": 0}
    if not rig.skin:
        return res
    if not getattr(rig, "geom_readable", True):
        res["note"] = "unavailable: " + getattr(rig, "_geom_note", "unreadable buffers")
        return res
    jnames = [rig.names[j] for j in rig.joints]
    for mesh in js.get("meshes", []):
        for prim in mesh.get("primitives", []):
            attrs = prim.get("attributes", {})
            if "JOINTS_0" not in attrs or "WEIGHTS_0" not in attrs:
                continue
            try:
                joints = read_accessor(js, blob, attrs["JOINTS_0"]).astype(int)
                weights = read_accessor(js, blob, attrs["WEIGHTS_0"])
            except Exception:
                res["note"] = "unavailable: unreadable weight buffers"
                return res
            n = weights.shape[0]
            res["skinned"] = True
            res["verts"] += n
            sums = weights.sum(axis=1)
            res["zero_weight_verts"] += int((sums <= 1e-9).sum())
            nz = (weights > 1e-6).sum(axis=1)
            res["over4_joint_verts"] += int((nz > 4).sum())
            mx = weights.max(axis=1)
            mi = weights.argmax(axis=1)
            res["dominant_095_verts"] += int((mx > 0.95).sum())
            k = int(np.argmax(mx))
            if float(mx[k]) > res["max_single_dominance"]:
                res["max_single_dominance"] = float(mx[k])
                ji = int(joints[k, mi[k]])
                res["max_single_joint"] = jnames[ji] if ji < len(jnames) else f"joint{ji}"
    return res


# --------------------------------------------------------------------------
# rest-pose sanity
# --------------------------------------------------------------------------

def rest_sanity(rig):
    bones = []  # (parent_name, child_name, length)
    for i in range(len(rig.names)):
        p = rig.parent[i]
        if p < 0:
            continue
        ln = float(np.linalg.norm(rig.world_pos[i] - rig.world_pos[p]))
        bones.append((rig.names[p], rig.names[i], ln))
    zero = [f"{a}->{b}" for a, b, ln in bones if ln < 1e-6]
    # L/R symmetry over bone lengths
    def key(nm):
        c, s = core_and_side(nm)
        return c, s
    bmap = {}
    for a, b, ln in bones:
        c, s = key(b)
        if s:
            bmap.setdefault((c, s), ln)
    diffs = []
    for (c, s), ln in bmap.items():
        other = "R" if s == "L" else "L"
        if (c, other) in bmap:
            a1, a2 = ln, bmap[(c, other)]
            if (a1 + a2) > 1e-9:
                diffs.append(abs(a1 - a2) / ((a1 + a2) / 2))
    sym = float(1.0 - np.mean(diffs)) if diffs else None
    # A/T-pose: arm abduction from straight-down
    down = np.array([0, -1, 0])
    abds = []
    arm_cores = {"upperarm", "forearm"}
    for i in rig.joints:
        c, s = core_and_side(rig.names[i])
        if c in arm_cores and rig.parent[i] >= 0:
            d = rig.world_pos[i] - rig.world_pos[rig.parent[i]]
            n = np.linalg.norm(d)
            if n > 1e-9:
                abds.append(math.degrees(math.acos(
                    min(1.0, max(-1.0, float(np.dot(d / n, down)))))))
    abd = float(np.mean(abds)) if abds else None
    pose = ("T-pose" if abd is not None and abd > 70 else
            "A-pose" if abd is not None and abd > 15 else
            "arms-down/unknown")
    return {"zero_length_bones": zero, "lr_symmetry": sym,
            "lr_pairs": len(diffs), "arm_abduction_deg": abd,
            "pose_class": pose, "bones": len(bones)}


# --------------------------------------------------------------------------
# driver
# --------------------------------------------------------------------------

def measure(model_path, ref_path=None, clip_path=None, n_frames=8, shot=None):
    model = Rig(model_path)
    ref = Rig(ref_path) if ref_path else None
    out = {"model": os.path.basename(model_path),
           "shot": shot or os.path.splitext(os.path.basename(model_path))[0],
           "joints": len(model.joints), "skinned": model.skin is not None}
    if ref is not None:
        eff, nm = eff_deg_rest(model, ref)
        out["rig"] = {"rotation_error_eff_deg": eff, "joints_matched": nm,
                      "ref": os.path.basename(ref_path)}
        if clip_path:
            ceff, cnm, cdetail = eff_deg_clip(model, ref, clip_path, n_frames)
            out["rig"]["rotation_error_eff_deg_clip"] = ceff
            out["rig"]["clip"] = os.path.basename(clip_path)
            out["rig"]["clip_frames"] = n_frames
            out["rig"]["clip_detail"] = cdetail
    pos, _ = skinned_positions(model)
    if pos is not None and len(pos):
        min_y = float(pos[:, 1].min())
        out["feet_min_y_m"] = min_y
        out["feet_above_ground_max_mm"] = max(0.0, min_y) * 1000.0
    else:
        out["geometry_note"] = "unavailable: " + getattr(
            model, "_geom_note", "no mesh positions readable")
    out["skin_audit"] = skin_audit(model)
    out["rest_sanity"] = rest_sanity(model)
    # gate-facing block (promo_gates.py consumes this)
    def _r(x):
        return round(float(x), 3) if isinstance(x, (int, float)) else x
    out["gates"] = {
        "rig": {"rotation_error_eff_deg": _r((out.get("rig") or {}).get("rotation_error_eff_deg"))},
        "feet_above_ground_max_mm": _r(out.get("feet_above_ground_max_mm")),
    }
    return out


def main():
    ap = argparse.ArgumentParser(description="measure rig quality directly from a GLB")
    ap.add_argument("model", help="GLB model file (any path)")
    ap.add_argument("--ref", help="reference GLB (default: none; eff-deg needs one)")
    ap.add_argument("--clip", help="animation GLB to drive clip eff-deg")
    ap.add_argument("--frames", type=int, default=8, help="clip sample frames")
    ap.add_argument("--metrics-out", help="write gate-facing metrics JSON here")
    ap.add_argument("--shot", help="shot name for the metrics JSON")
    ap.add_argument("--pretty", action="store_true")
    args = ap.parse_args()
    try:
        out = measure(args.model, args.ref, args.clip, args.frames, args.shot)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(2)
    if args.metrics_out:
        with open(args.metrics_out, "w") as f:
            json.dump(out, f, indent=2)
        print(f"wrote {args.metrics_out}")
    # human summary to stdout
    r = out.get("rig") or {}
    print(f"model: {out['model']}  joints: {out['joints']}  skinned: {out['skinned']}")
    if "rotation_error_eff_deg" in r:
        print(f"rest eff-deg vs {r.get('ref')}: {r['rotation_error_eff_deg']:.3f} deg "
              f"(matched {r['joints_matched']} joints)")
    if r.get("rotation_error_eff_deg_clip") is not None:
        print(f"clip eff-deg vs {r.get('ref')} [{r.get('clip')}]: "
              f"{r['rotation_error_eff_deg_clip']:.3f} deg over {r.get('clip_frames')} frames")
    if "feet_above_ground_max_mm" in out:
        print(f"feet min-Y: {out['feet_min_y_m']:.4f} m  "
              f"floating: {out['feet_above_ground_max_mm']:.1f} mm")
    sa = out["skin_audit"]
    print(f"skin: verts={sa['verts']} zero-weight={sa['zero_weight_verts']} "
          f">4-joint={sa['over4_joint_verts']} max-single-dominance={sa['max_single_dominance']:.3f} "
          f"({sa['max_single_joint']}) dominant>0.95 verts={sa['dominant_095_verts']}")
    rs = out["rest_sanity"]
    sym = f"{rs['lr_symmetry']:.3f}" if rs["lr_symmetry"] is not None else "n/a"
    abd = f"{rs['arm_abduction_deg']:.1f}" if rs["arm_abduction_deg"] is not None else "n/a"
    print(f"rest: bones={rs['bones']} zero-length={len(rs['zero_length_bones'])} "
          f"LR-symmetry={sym} ({rs['lr_pairs']} pairs) pose={rs['pose_class']} "
          f"(abduction {abd} deg)")
    if args.pretty:
        print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
