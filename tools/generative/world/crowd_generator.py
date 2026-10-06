#!/usr/bin/env python3
"""crowd_generator.py — procedural varied-humanoid arena crowd -> GLB.

Owner directive: the default crowd must be realistic varied humanoids
(varying build, skin tone, clothing, hair) — NOT chibi. Each fan is a rigid
node hierarchy (no skinning), randomized per individual, placed in the arena
stands, with 3 baked animation clips: CHEER, BOO, WAVE (mexican wave).

Pure trimesh + numpy (MIT). CPU-only, seconds to generate.

Usage:
  python3 crowd_generator.py --count 160 --out proof/crowd.glb
  python3 crowd_generator.py --count 48 --out proof/crowd_test.glb --seed 7
"""
import argparse, math, os, random, sys

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import glb_anim  # noqa: E402
from world.arena_generator import STAND_INNER_R, STAND_TIERS, STAND_TIER_DEPTH, STAND_TIER_H  # noqa: E402

SKIN_TONES = ["#2e1f16", "#5a3b28", "#8a5f43", "#b98a5e", "#e0b48c"]
SHIRTS = ["#a02727", "#1f4d8f", "#1f7a3a", "#c7a123", "#5b2a86", "#22262c",
          "#c65a1e", "#7a1f3d", "#2a7a7a", "#d8d8d8"]
PANTS = ["#1c2a44", "#222222", "#3a3a3a", "#4a3728", "#5a5f6a"]
HAIR_COLORS = ["#0d0d0d", "#2a1a10", "#6a4a22", "#b08a3e", "#8f1d1d", "#555a60"]


def _mat(hexcol, rough=0.9):
    h = hexcol.lstrip("#")
    rgb = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    return PBRMaterial(baseColorFactor=rgb + [1.0], roughnessFactor=rough)


def _part(geo, mat):
    geo.visual.material = mat
    return geo


def build_fan(rng):
    """Returns parts: list of (node, parent, translation, scale, geometry|None).
    Every mesh gets its own node (one mesh per glTF node); pivot nodes parent them."""
    h = rng.uniform(0.92, 1.09)          # height variation
    build = rng.uniform(0.85, 1.18)      # build/width variation
    skin = _mat(rng.choice(SKIN_TONES), rough=0.75)
    shirt = _mat(rng.choice(SHIRTS))
    pants = _mat(rng.choice(PANTS))
    hair_c = _mat(rng.choice(HAIR_COLORS), rough=0.95)
    hair_style = rng.choice(["none", "short", "afro", "long"])

    parts = [("FAN", None, (0, 0, 0), (build, h, build), None)]
    torso = trimesh.creation.box(extents=(0.24, 0.56, 0.36),
                                 transform=trimesh.transformations.translation_matrix((0, 0.88, 0)))
    parts.append(("TORSO", "FAN", (0, 0, 0), (1, 1, 1), _part(torso, shirt)))
    head = trimesh.creation.icosphere(subdivisions=1, radius=0.115)
    parts.append(("HEAD", "FAN", (0, 1.32, 0), (1, 1, 1), _part(head, skin)))
    if hair_style != "none":
        r = {"short": 0.12, "afro": 0.17, "long": 0.13}[hair_style]
        hy = {"short": 0.045, "afro": 0.06, "long": 0.02}[hair_style]
        hair = trimesh.creation.icosphere(subdivisions=1, radius=r,
                                          transform=trimesh.transformations.translation_matrix((0, hy, -0.01)))
        hair.apply_scale((1.0, 0.75, 1.05))
        geos = [hair]
        if hair_style == "long":
            geos.append(trimesh.creation.box(
                extents=(0.16, 0.3, 0.1),
                transform=trimesh.transformations.translation_matrix((-0.10, -0.14, 0))))
        hair_m = trimesh.util.concatenate(geos)
        parts.append(("HAIR", "HEAD", (0, 0, 0), (1, 1, 1), _part(hair_m, hair_c)))
    for side, sh, el, sgn in (("L", "SHL", "ELL", 1), ("R", "SHR", "ELR", -1)):
        ua = trimesh.creation.cylinder(radius=0.058, height=0.32, sections=8,
                                       transform=trimesh.transformations.translation_matrix((0, -0.16, 0)))
        parts.append((sh, "FAN", (0, 1.12, 0.235 * sgn), (1, 1, 1), _part(ua, shirt)))
        fa = trimesh.creation.cylinder(radius=0.05, height=0.30, sections=8,
                                       transform=trimesh.transformations.translation_matrix((0, -0.15, 0)))
        hand = trimesh.creation.icosphere(subdivisions=1, radius=0.06,
                                          transform=trimesh.transformations.translation_matrix((0, -0.32, 0)))
        parts.append((el, sh, (0, -0.32, 0), (1, 1, 1),
                      _part(trimesh.util.concatenate([fa, hand]), skin)))
    for hip, sgn in (("HIPL", 1), ("HIPR", -1)):
        th = trimesh.creation.cylinder(radius=0.085, height=0.58, sections=8,
                                       transform=trimesh.transformations.translation_matrix((0, -0.29, 0)))
        parts.append((hip, "FAN", (0, 0.62, 0.105 * sgn), (1, 1, 1), _part(th, pants)))
    return parts


def seat_positions(count, rng):
    """Distribute fans across the 4 stands / tiers, facing the ring."""
    seats = []
    per = max(1, count // (4 * STAND_TIERS))
    for side, rot in (("N", 0.0), ("S", math.pi), ("E", math.pi / 2), ("W", -math.pi / 2)):
        for t in range(STAND_TIERS):
            r = STAND_INNER_R + t * STAND_TIER_DEPTH + STAND_TIER_DEPTH / 2
            y = 0.4 + t * STAND_TIER_H + STAND_TIER_H / 2
            w = 2 * (r + STAND_TIER_DEPTH) * 0.55
            for k in range(per):
                lx = -w / 2 + (k + 0.5) / per * w + rng.uniform(-0.15, 0.15)
                # local (lx, 0, r) rotated by rot around Y
                x = lx * math.cos(rot) + r * math.sin(rot)
                z = -lx * math.sin(rot) + r * math.cos(rot)
                yaw = rot + math.pi + rng.uniform(-0.15, 0.15)
                seats.append((x, y, z, yaw, math.atan2(x, z)))
                if len(seats) >= count:
                    return seats
    return seats


def _euler_quat(rx, ry, rz):
    from common.quat import euler_to_quat
    return tuple(float(v) for v in euler_to_quat(rx, ry, rz))


def bake_crowd_animations(js, bin_data, fan_ids, node_index_of, phases, angs):
    """Bake CHEER / BOO / WAVE clips for every fan."""
    FPS = 30

    def ch(node, path, times, vals):
        return {"node": node, "path": path, "times": times, "values": vals}

    # ---- CHEER (2s loop): arms pump with per-fan phase
    dur, n = 2.0, 61
    times = [i / FPS for i in range(n)]
    tracks = []
    for i, fid in enumerate(fan_ids):
        ph = phases[i]
        ni = lambda n_: node_index_of[f"{n_}_{fid}"]
        shl = [ _euler_quat(0, 0, 105 + 28 * math.sin(2 * math.pi * (t / dur) + ph)) for t in times]
        shr = [ _euler_quat(0, 0, 105 + 28 * math.sin(2 * math.pi * (t / dur) + ph + 0.6)) for t in times]
        ell = [ _euler_quat(0, 0, 45 + 22 * math.sin(2 * math.pi * (t / dur) + ph + 1.2)) for t in times]
        elr = [ _euler_quat(0, 0, 45 + 22 * math.sin(2 * math.pi * (t / dur) + ph + 1.8)) for t in times]
        hed = [ _euler_quat(0, 0, -8 + 7 * math.sin(2 * math.pi * (t / dur) + ph)) for t in times]
        # note: left arm at +Z raises forward with rz+; mirrored arm uses rz+ too (symmetric rig)
        tracks += [ch(ni("SHL"), "rotation", times, shl),
                   ch(ni("SHR"), "rotation", times, shr),
                   ch(ni("ELL"), "rotation", times, ell),
                   ch(ni("ELR"), "rotation", times, elr),
                   ch(ni("HEAD"), "rotation", times, hed)]
    glb_anim.add_animation(js, bin_data, "CROWD_CHEER", tracks)

    # ---- BOO (2s loop): sway + head shake, arms low
    tracks = []
    for i, fid in enumerate(fan_ids):
        ph = phases[i]
        ni = lambda n_: node_index_of[f"{n_}_{fid}"]
        sway = [ _euler_quat(0, 10 * math.sin(2 * math.pi * (t / dur) + ph), 0) for t in times]
        shl = [ _euler_quat(0, 0, 18 + 8 * math.sin(2 * math.pi * (t / dur) + ph)) for t in times]
        shr = [ _euler_quat(0, 0, 18 + 8 * math.sin(2 * math.pi * (t / dur) + ph + 1.0)) for t in times]
        hed = [ _euler_quat(0, 22 * math.sin(2 * math.pi * (t / dur) * 2 + ph), 0) for t in times]
        tracks += [ch(ni("FAN"), "rotation", times, sway),
                   ch(ni("SHL"), "rotation", times, shl),
                   ch(ni("SHR"), "rotation", times, shr),
                   ch(ni("HEAD"), "rotation", times, hed)]
    glb_anim.add_animation(js, bin_data, "CROWD_BOO", tracks)

    # ---- WAVE (8s loop): mexican wave travels by seat angle
    dur, n = 8.0, 121
    times = [i / FPS for i in range(n)]
    tracks = []
    for i, fid in enumerate(fan_ids):
        ni = lambda n_: node_index_of[f"{n_}_{fid}"]
        ang = angs[i]
        vals = []
        for t in times:
            d = (ang - t * 1.6) % (2 * math.pi)
            amp = max(0.0, math.cos(d)) ** 6
            vals.append(_euler_quat(0, 0, 15 + 115 * amp))
        tracks += [ch(ni("SHL"), "rotation", times, vals),
                   ch(ni("SHR"), "rotation", times, vals)]
    glb_anim.add_animation(js, bin_data, "CROWD_WAVE", tracks)


def build_crowd(count=160, seed=1):
    rng = random.Random(seed)
    S = trimesh.Scene()
    fan_ids, phases, angs = [], [], []
    seats = seat_positions(count, rng)
    for i, (x, y, z, yaw, ang) in enumerate(seats):
        fid = f"{i:03d}"
        fan_ids.append(fid)
        phases.append(rng.uniform(0, 2 * math.pi))
        angs.append(ang)
        parts = build_fan(rng)
        # seat transform (world)
        Tseat = trimesh.transformations.translation_matrix((x, y, z)) @ \
            trimesh.transformations.rotation_matrix(yaw, [0, 1, 0])
        for nm, parent, t, s, geo in parts:
            uname = f"{nm}_{fid}"
            upar = f"{parent}_{fid}" if parent else "world"
            T = trimesh.transformations.translation_matrix(t) @ \
                np.diag(list(s) + [1.0])
            if parent is None:
                T = Tseat @ T
                S.graph.update(frame_to=uname, frame_from=upar, matrix=T)
            else:
                S.add_geometry(geo, node_name=uname,
                               geom_name=f"g_{uname}",
                               parent_node_name=upar, transform=T)
    return S, fan_ids, phases, angs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=160)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    S, fan_ids, phases, angs = build_crowd(a.count, a.seed)
    tmp = a.out + ".tmp.glb"
    S.export(tmp)
    js, bin_data = glb_anim.read_glb(tmp)
    node_index_of = {nd.get("name", ""): i for i, nd in enumerate(js["nodes"])}
    bake_crowd_animations(js, bin_data, fan_ids, node_index_of, phases, angs)
    glb_anim.write_glb(a.out, js, bin_data)
    os.remove(tmp)
    problems = []
    for ai in range(len(js["animations"])):
        problems += glb_anim.validate_animation(js, ai)
    print(f"wrote {a.out}: {len(fan_ids)} fans, "
          f"{len(js['nodes'])} nodes, {len(js['animations'])} clips" +
          (f" PROBLEMS: {problems[:4]}" if problems else " — structure valid"))


if __name__ == "__main__":
    main()
