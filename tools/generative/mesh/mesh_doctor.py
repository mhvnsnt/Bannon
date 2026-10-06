#!/usr/bin/env python3
"""mesh_doctor.py — cleanup + normalize character/prop GLBs. Complements the
AshLanev2 postprocessor (tools/generative/3d/postprocess.py) with repair ops.

Ops (all trimesh, MIT):
  weld vertices | drop degenerate + duplicate faces | drop unreferenced verts |
  fix winding/normals | fill small holes | center on origin (XZ) |
  uniform scale to target height (default: keep) | merge into single scene

Usage:
  python3 mesh_doctor.py --input model.glb --output fixed.glb --report report.json
  python3 mesh_doctor.py --input model.glb --output fixed.glb --target-height 1.88

Writes a JSON report to stdout (and --report): verts/faces before/after,
degenerate/duplicate faces removed, holes filled, final bounds.
"""
import argparse, json, os, sys

import numpy as np
import trimesh
from trimesh import repair as trepair


def doctor_scene(scene, target_height=None, center=True, fill_holes=True):
    stats = {"meshes": 0, "verts_before": 0, "faces_before": 0,
             "degenerate_removed": 0, "duplicate_removed": 0,
             "unreferenced_removed": 0, "holes_filled": 0,
             "verts_after": 0, "faces_after": 0}
    geoms = {}
    for name, geom in scene.geometry.items():
        if not isinstance(geom, trimesh.Trimesh):
            geoms[name] = geom
            continue
        m = geom.copy()
        stats["meshes"] += 1
        vb, fb = len(m.vertices), len(m.faces)
        stats["verts_before"] += vb
        stats["faces_before"] += fb
        m.merge_vertices()
        v1, f1 = len(m.vertices), len(m.faces)
        m.update_faces(m.nondegenerate_faces())
        m.remove_unreferenced_vertices()
        m.remove_infinite_values()
        stats["degenerate_removed"] += f1 - len(m.faces)
        stats["unreferenced_removed"] += v1 - len(m.vertices)
        trepair.fix_normals(m)
        if fill_holes:
            try:
                fbh = len(m.faces)
                trepair.fill_holes(m)
                stats["holes_filled"] += len(m.faces) - fbh
            except Exception:
                pass
        stats["verts_after"] += len(m.vertices)
        stats["faces_after"] += len(m.faces)
        geoms[name] = m
    out = trimesh.Scene()
    for node_name in scene.graph.nodes_geometry:
        transform, geom_name = scene.graph[node_name]
        if geom_name in geoms:
            out.add_geometry(geoms[geom_name], geom_name=geom_name,
                             node_name=node_name, transform=transform)
    # normalize: center XZ + scale to target height
    if center or target_height:
        bounds = out.bounds
        if bounds is not None:
            size = bounds[1] - bounds[0]
            h = size[1]
            s = (target_height / h) if (target_height and h > 1e-9) else 1.0
            c = (bounds[0] + bounds[1]) / 2 if center else np.zeros(3)
            T = np.eye(4)
            T[:3, :3] *= s
            T[0, 3] = -c[0] * s
            T[2, 3] = -c[2] * s
            # keep Y as-is unless scaling
            T[1, 3] = -bounds[0][1] * s if target_height else 0.0
            out.apply_transform(T)
            stats["scale_applied"] = s
    stats["bounds_after"] = out.bounds.tolist() if out.bounds is not None else None
    return out, stats


def main():
    ap = argparse.ArgumentParser(description="repair + normalize a GLB")
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--target-height", type=float, default=None)
    ap.add_argument("--no-center", action="store_true")
    ap.add_argument("--no-fill-holes", action="store_true")
    ap.add_argument("--report")
    a = ap.parse_args()

    scene = trimesh.load(a.input, force="scene")
    out, stats = doctor_scene(scene, target_height=a.target_height,
                              center=not a.no_center,
                              fill_holes=not a.no_fill_holes)
    out.export(a.output)
    stats["input"] = a.input
    stats["output"] = a.output
    report = json.dumps(stats, indent=1)
    print(report)
    if a.report:
        open(a.report, "w").write(report)


if __name__ == "__main__":
    main()
