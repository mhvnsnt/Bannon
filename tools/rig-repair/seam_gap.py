#!/usr/bin/env python3
"""seam_gap.py — measure how far apart severed mesh islands are.
For each island's boundary verts, find the min distance to any vert
in a DIFFERENT island. Histogram tells whether seams are tiny gaps
(weld with bigger epsilon) or large cuts (need bridging).
"""
import bpy, sys
from mathutils.kdtree import KDTree
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
IN = argv[0]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=IN)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
mesh = max(meshes, key=lambda o: len(o.data.vertices))

verts = np.empty(len(mesh.data.vertices) * 3, dtype=np.float32)
mesh.data.vertices.foreach_get('co', verts)
verts = verts.reshape(-1, 3)

# island assignment via edges
import collections
adj = collections.defaultdict(list)
for e in mesh.data.edges:
    adj[e.vertices[0]].append(e.vertices[1])
    adj[e.vertices[1]].append(e.vertices[0])
n = len(verts)
island = np.full(n, -1, dtype=np.int32)
cur = 0
for i in range(n):
    if island[i] != -1:
        continue
    stack = [i]
    island[i] = cur
    while stack:
        v = stack.pop()
        for w in adj[v]:
            if island[w] == -1:
                island[w] = cur
                stack.append(w)
    cur += 1
print("SEAM: islands=%d" % cur)

# boundary verts
bnd = np.zeros(n, dtype=bool)
for p in mesh.data.polygons:
    vids = p.vertices
    nv = len(vids)
    for k in range(nv):
        # edge vids[k]->vids[(k+1)%nv]; count edge usage
        pass
# edge -> face count
edge_faces = collections.defaultdict(int)
for p in mesh.data.polygons:
    vids = p.vertices
    nv = len(vids)
    for k in range(nv):
        e = (vids[k], vids[(k + 1) % nv])
        edge_faces[tuple(sorted(e))] += 1
for (a, b), c in edge_faces.items():
    if c < 2:
        bnd[a] = True
        bnd[b] = True
print("SEAM: boundary verts=%d of %d" % (int(bnd.sum()), n))

# KDTree per island of boundary verts
by_island = collections.defaultdict(list)
for i in np.where(bnd)[0]:
    by_island[int(island[i])].append(i)

kdtrees = {}
for isl, vids in by_island.items():
    kd = KDTree(len(vids))
    for v in vids:
        kd.insert(verts[v], v)
    kd.balance()
    kdtrees[isl] = kd

gaps = []
for isl, vids in by_island.items():
    others = [t for s, t in kdtrees.items() if s != isl]
    for v in vids:
        best = float('inf')
        for kd in others:
            co, idx, dist = kd.find(verts[v])
            if dist < best:
                best = dist
                if best == 0.0:
                    break
        gaps.append(best)
gaps = np.array(gaps)
print("SEAM: gap histogram (boundary vert -> nearest other-island boundary vert):")
bins = [0, 1e-6, 1e-4, 1e-3, 5e-3, 1e-2, 2e-2, 5e-2, 1e-1, float('inf')]
h, _ = np.histogram(gaps, bins=bins)
for i in range(len(h)):
    print("SEAM:   [%g, %g): %d" % (bins[i], bins[i + 1], h[i]))
print("SEAM: median gap=%g, max=%g, mean=%g" % (np.median(gaps), gaps.max(), gaps.mean()))
# model scale
print("SEAM: model height=%g" % (verts[:, 2].max() - verts[:, 2].min()))
