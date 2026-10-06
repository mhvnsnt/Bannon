#!/usr/bin/env python3
"""lod_chain.py — build LOD0/1/2 GLBs from a source model.

Decimation backends (tried in order, first available wins):
  1. open3d (MIT) quadric decimation — best quality
  2. fast-simplification (pip install fast-simplification) via trimesh
If neither is installed the script exits with install instructions rather
than producing a bad LOD. Never silently ships a broken decimation.

Usage:
  python3 lod_chain.py --input char.glb --outdir lod_out/ [--ratios 1.0,0.5,0.25]
"""
import argparse, os, shutil, sys

import numpy as np
import trimesh


def _decimate_open3d(mesh, target_faces):
    import open3d as o3d
    om = o3d.geometry.TriangleMesh(
        o3d.utility.Vector3dVector(np.asarray(mesh.vertices)),
        o3d.utility.Vector3iVector(np.asarray(mesh.faces)))
    om = om.simplify_quadric_decimation(max(int(target_faces), 4))
    om.remove_duplicated_vertices()
    om.remove_degenerate_triangles()
    om.remove_unreferenced_vertices()
    v = np.asarray(om.vertices)
    f = np.asarray(om.triangles)
    out = trimesh.Trimesh(vertices=v, faces=f, process=True)
    out.visual = mesh.visual
    return out


def _decimate_fast_simplification(mesh, target_faces):
    # note: trimesh's wrapper RETURNS the simplified mesh (does not modify in place)
    # and drops visuals, so reattach them.
    out = mesh.copy().simplify_quadric_decimation(face_count=int(target_faces))
    try:
        out.visual = mesh.visual
    except Exception:
        pass
    return out


def pick_backend():
    try:
        import open3d  # noqa: F401
        return "open3d", _decimate_open3d
    except ImportError:
        pass
    try:
        import fast_simplification  # noqa: F401
        return "fast-simplification", _decimate_fast_simplification
    except ImportError:
        pass
    return None, None


def build_lods(input_path, outdir, ratios=(1.0, 0.5, 0.25)):
    name, backend = pick_backend()
    if name is None:
        sys.exit("no decimation backend: pip install open3d  (MIT, recommended)\n"
                 "  or: pip install fast-simplification")
    print(f"LOD backend: {name}")
    os.makedirs(outdir, exist_ok=True)
    scene = trimesh.load(input_path, force="scene")
    base = os.path.splitext(os.path.basename(input_path))[0]
    results = []
    for i, r in enumerate(ratios):
        out = trimesh.Scene()
        total_in, total_out = 0, 0
        for node_name in scene.graph.nodes_geometry:
            transform, geom_name = scene.graph[node_name]
            geom = scene.geometry[geom_name]
            if not isinstance(geom, trimesh.Trimesh):
                out.add_geometry(geom, geom_name=node_name, transform=transform)
                continue
            total_in += len(geom.faces)
            g = geom if r >= 1.0 else backend(geom, len(geom.faces) * r)
            total_out += len(g.faces)
            out.add_geometry(g, geom_name=node_name, transform=transform)
        p = os.path.join(outdir, f"{base}_LOD{i}.glb")
        out.export(p)
        results.append({"lod": i, "ratio": r, "faces_in": total_in,
                        "faces_out": total_out, "path": p})
        print(f"LOD{i}: {total_in} -> {total_out} faces -> {p}")
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--ratios", default="1.0,0.5,0.25")
    a = ap.parse_args()
    ratios = [float(x) for x in a.ratios.split(",")]
    build_lods(a.input, a.outdir, ratios)


if __name__ == "__main__":
    main()
