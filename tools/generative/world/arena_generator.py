#!/usr/bin/env python3
"""arena_generator.py — procedural wrestling arena -> GLB.

Builds a full venue: ring (canvas, apron, posts, ropes with sag, turnbuckles,
steps), barricade, entrance ramp, titantron + side screens, light rig with
spotlights, and 4 tiered crowd stands. Company palettes from ring_variants.py.

Pure trimesh (MIT). No AI, no downloads, runs on CPU in seconds.

Usage:
  python3 arena_generator.py --company HOUSE --out proof/arena_house.glb
  python3 arena_generator.py --company COMPANY_01 --out proof/arena_c1.glb --schematic proof/arena.svg

Layout (meters, ring center at origin, entrance faces +Z):
  canvas 6.1x6.1 at y=1.0 | posts at corners (+-3.05) | barricade rect ~+-7
  ramp z=+4.5..+13 | titantron z=+14.5 | stands inner radius 10, 5 tiers
"""
import argparse, math, os, sys

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ring_variants import get as get_palette  # noqa: E402

# shared with crowd_generator
STAND_INNER_R = 10.0
STAND_TIERS = 5
STAND_TIER_DEPTH = 1.6
STAND_TIER_H = 0.85


def _hex(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]


def _mat(rgb_hex, rough=0.85, metal=0.0, emissive=None):
    m = PBRMaterial(name=f"mat_{rgb_hex}", baseColorFactor=_hex(rgb_hex) + [1.0],
                    roughnessFactor=rough, metallicFactor=metal)
    if emissive:
        m.emissiveFactor = _hex(emissive)
    return m


def _box(scene, name, extents, pos, mat, rot_z=0.0, rot_y=0.0):
    T = trimesh.transformations.translation_matrix(pos)
    if rot_y:
        T = T @ trimesh.transformations.rotation_matrix(rot_y, [0, 1, 0])
    if rot_z:
        T = T @ trimesh.transformations.rotation_matrix(rot_z, [0, 0, 1])
    mesh = trimesh.creation.box(extents=extents, transform=T)
    mesh.visual.material = mat
    scene.add_geometry(mesh, node_name=name)


def _cyl(scene, name, r, h, pos, mat):
    T = trimesh.transformations.translation_matrix(pos)
    mesh = trimesh.creation.cylinder(radius=r, height=h, transform=T)
    mesh.visual.material = mat
    scene.add_geometry(mesh, node_name=name)


def _tube(scene, name, points, radius, mat, segs=6):
    """Tube along a point path (for ropes with sag)."""
    parts = []
    for a, b in zip(points[:-1], points[1:]):
        a, b = np.asarray(a, float), np.asarray(b, float)
        d = b - a
        L = float(np.linalg.norm(d))
        if L < 1e-9:
            continue
        cyl = trimesh.creation.cylinder(radius=radius, height=L, sections=segs)
        # orient +Y along d
        z = d / L
        up = np.array([0.0, 1.0, 0.0])
        axis = np.cross(up, z)
        n = float(np.linalg.norm(axis))
        if n < 1e-9:
            R = np.eye(4) if z[1] > 0 else trimesh.transformations.rotation_matrix(math.pi, [1, 0, 0])
        else:
            ang = math.acos(float(np.clip(np.dot(up, z), -1, 1)))
            R = trimesh.transformations.rotation_matrix(ang, axis / n)
        mid = (a + b) / 2
        T = trimesh.transformations.translation_matrix(mid) @ R
        cyl.apply_transform(T)
        parts.append(cyl)
        cap = trimesh.creation.icosphere(subdivisions=1, radius=radius,
                                        transform=trimesh.transformations.translation_matrix(b))
        parts.append(cap)
    if not parts:
        return
    mesh = trimesh.util.concatenate(parts)
    mesh.visual.material = mat
    scene.add_geometry(mesh, node_name=name)


def build_arena(company="HOUSE"):
    pal = get_palette(company)
    S = trimesh.Scene()
    dark = _mat("#15171c", rough=0.95)
    concrete = _mat("#23262c", rough=0.95)
    metal = _mat("#6a7078", rough=0.4, metal=0.8)
    m_canvas = _mat(pal["canvas"], rough=0.9)
    m_apron = _mat(pal["apron"], rough=0.85)
    m_rope = _mat(pal["ropes"], rough=0.6)
    m_buckle = _mat(pal["turnbuckle"], rough=0.7)
    m_post = _mat(pal["post"], rough=0.5, metal=0.4)
    m_tron = _mat("#05070a", rough=0.4, emissive=pal["tron"])
    m_trim = _mat(pal["trim"], rough=0.6)

    # floor
    _box(S, "Floor", (44, 0.1, 44), (0, -0.05, 0), dark)
    # ring platform + canvas
    _box(S, "RingPlatform", (7.4, 1.0, 7.4), (0, 0.5, 0), concrete)
    _box(S, "RingCanvas", (6.2, 0.07, 6.2), (0, 1.035, 0), m_canvas)
    # apron skirts
    for nm, pos, ext in (("Apron_N", (0, 0.5, 3.68), (6.4, 0.95, 0.08)),
                         ("Apron_S", (0, 0.5, -3.68), (6.4, 0.95, 0.08)),
                         ("Apron_E", (3.68, 0.5, 0), (0.08, 0.95, 6.4)),
                         ("Apron_W", (-3.68, 0.5, 0), (0.08, 0.95, 6.4))):
        _box(S, nm, ext, pos, m_apron)
    # posts + turnbuckles
    corners = [(3.05, 3.05), (3.05, -3.05), (-3.05, 3.05), (-3.05, -3.05)]
    cnames = ["NE", "SE", "NW", "SW"]
    for (cx, cz), cn in zip(corners, cnames):
        _cyl(S, f"Post_{cn}", 0.07, 1.7, (cx, 1.85, cz), m_post)
        for ri, rh in enumerate((1.45, 1.85, 2.25)):
            _box(S, f"Turnbuckle_{cn}_{ri}", (0.28, 0.28, 0.28), (cx, rh, cz), m_buckle)
    # ropes with sag
    for side, (x0, z0, x1, z1) in (("N", (-3.05, 3.05, 3.05, 3.05)),
                                    ("S", (-3.05, -3.05, 3.05, -3.05)),
                                    ("E", (3.05, -3.05, 3.05, 3.05)),
                                    ("W", (-3.05, -3.05, -3.05, 3.05))):
        for ri, rh in enumerate((1.45, 1.85, 2.25)):
            pts = []
            for k in range(9):
                u = k / 8
                x = x0 + (x1 - x0) * u
                z = z0 + (z1 - z0) * u
                sag = 0.09 * math.sin(math.pi * u)
                pts.append((x, rh - sag, z))
            _tube(S, f"Rope_{side}_{ri}", pts, 0.035, m_rope)
    # ring steps (south)
    _box(S, "RingSteps_1", (1.2, 0.35, 0.9), (1.8, 0.175, 4.6), metal)
    _box(S, "RingSteps_2", (1.2, 0.7, 0.9), (1.8, 0.35, 5.3), metal)
    # barricade ring (rounded rect)
    for i in range(14):
        ang = i / 14 * 2 * math.pi
        bx, bz = 8.2 * math.cos(ang), 8.2 * math.sin(ang)
        if abs(bx) < 4.5 and bz > 0:  # gap for ramp
            continue
        _box(S, f"Barricade_{i:02d}", (2.4, 1.1, 0.18), (bx, 0.55, bz), metal,
             rot_y=-ang + math.pi / 2)
        _box(S, f"BarricadePad_{i:02d}", (2.4, 0.5, 0.22), (bx, 0.75, bz), dark,
             rot_y=-ang + math.pi / 2)
    # entrance ramp (+Z)
    ramp_T = trimesh.transformations.translation_matrix((0, 0.35, 8.6)) @ \
        trimesh.transformations.rotation_matrix(-0.06, [1, 0, 0])
    ramp = trimesh.creation.box(extents=(3.2, 0.25, 9.5), transform=ramp_T)
    ramp.visual.material = dark
    S.add_geometry(ramp, node_name="Ramp")
    _box(S, "RampTrim_L", (0.12, 0.3, 9.5), (-1.66, 0.5, 8.6), m_trim, rot_z=0)
    _box(S, "RampTrim_R", (0.12, 0.3, 9.5), (1.66, 0.5, 8.6), m_trim)
    # titantron + truss
    _box(S, "Titantron", (7.5, 4.2, 0.5), (0, 5.2, 14.8), m_tron)
    _box(S, "TronFrame", (8.0, 4.7, 0.3), (0, 5.2, 15.0), metal)
    for sx in (-3.6, 3.6):
        _cyl(S, f"TronPost_{sx}", 0.12, 7.5, (sx, 3.75, 15.0), metal)
    # side screens
    for snm, sx in (("Screen_W", -9.5), ("Screen_E", 9.5)):
        _cyl(S, f"{snm}_pole", 0.1, 4.5, (sx, 2.25, 12.0), metal)
        _box(S, snm, (3.4, 2.2, 0.3), (sx, 5.2, 12.0), m_tron, rot_y=math.pi / 6 * (-1 if sx < 0 else 1))
    # light rig: 4 towers + spots
    for (lx, lz), ln in [((12, 12), "NE"), ((12, -12), "SE"), ((-12, 12), "NW"), ((-12, -12), "SW")]:
        _cyl(S, f"LightTower_{ln}", 0.18, 10.0, (lx, 5.0, lz), metal)
        _box(S, f"LightBar_{ln}", (2.2, 0.25, 0.25), (lx, 10.0, lz), metal,
             rot_y=math.atan2(-lx, -lz))
        for k in range(3):
            cone = trimesh.creation.cone(radius=0.55, height=1.4,
                                         transform=trimesh.transformations.translation_matrix(
                                             (lx - 0.7 + 0.7 * k, 9.2, lz)))
            cone.visual.material = _mat("#ffffff", emissive="#fff8e0", rough=0.4)
            S.add_geometry(cone, node_name=f"Spot_{ln}_{k}")
    # crowd stands: 4 sides x tiers
    for side, rot in (("N", 0), ("S", math.pi), ("E", math.pi / 2), ("W", -math.pi / 2)):
        for t in range(STAND_TIERS):
            r = STAND_INNER_R + t * STAND_TIER_DEPTH
            y = 0.4 + t * STAND_TIER_H
            w = 2 * (r + STAND_TIER_DEPTH) * 0.62
            T = trimesh.transformations.translation_matrix((0, y, r + STAND_TIER_DEPTH / 2)) @ \
                trimesh.transformations.rotation_matrix(rot, [0, 1, 0])
            tier = trimesh.creation.box(extents=(w, STAND_TIER_H, STAND_TIER_DEPTH), transform=T)
            tier.visual.material = concrete
            S.add_geometry(tier, node_name=f"Stand_{side}_T{t}")
    return S


def schematic_svg(out_path, company="HOUSE"):
    """Top-down labeled schematic of the arena (visual proof / planning aid)."""
    pal = get_palette(company)
    parts = [
        ("Ring canvas 6.1m", 0, 0, 6.2, 6.2, pal["canvas"]),
        ("Apron", 0, 0, 7.4, 7.4, pal["apron"]),
        ("Barricade", 0, 0, 16.4, 16.4, "#3a3f47"),
        ("Ramp", 0, 8.6, 3.2, 9.5, "#23262c"),
        ("Titantron", 0, 14.8, 7.5, 0.5, pal["tron"]),
        ("Stand N", 0, 11.6, 15.5, 8.0, "#23262c"),
        ("Stand S", 0, -11.6, 15.5, 8.0, "#23262c"),
        ("Stand E", 11.6, 0, 8.0, 15.5, "#23262c"),
        ("Stand W", -11.6, 0, 8.0, 15.5, "#23262c"),
    ]
    sc = 14
    cx = cy = 260
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" '
           f'viewBox="0 0 520 520"><rect width="520" height="520" fill="#0b0d10"/>']
    for label, x, z, w, d, col in parts:
        rx, ry = cx + x * sc - w * sc / 2, cy + z * sc - d * sc / 2
        svg.append(f'<rect x="{rx:.1f}" y="{ry:.1f}" width="{w * sc:.1f}" height="{d * sc:.1f}" '
                   f'fill="{col}" fill-opacity="0.85" stroke="#888" stroke-width="1"/>')
        svg.append(f'<text x="{cx + x * sc:.1f}" y="{cy + z * sc:.1f}" fill="#fff" font-size="11" '
                   f'text-anchor="middle" font-family="sans-serif">{label}</text>')
    svg.append(f'<text x="16" y="24" fill="#fff" font-size="14" font-family="sans-serif">'
               f'Bannon Arena — {company} (top view, meters)</text>')
    svg.append("</svg>")
    open(out_path, "w").write("\n".join(svg))
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--company", default="HOUSE")
    ap.add_argument("--out", required=True)
    ap.add_argument("--schematic")
    a = ap.parse_args()
    S = build_arena(a.company)
    S.export(a.out)
    n = len(S.graph.nodes_geometry)
    print(f"wrote {a.out}: {n} nodes, bounds {np.round(S.bounds, 2).tolist()}")
    if a.schematic:
        schematic_svg(a.schematic, a.company)
        print("wrote", a.schematic)


if __name__ == "__main__":
    main()
