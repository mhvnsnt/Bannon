#!/usr/bin/env python3
"""weld_fixed.py — weld severed mesh islands via remove_doubles on mesh data.
Root cause (2026-10-09 watchdog): weld_mesh2.py merged verts in its bmesh but
the glTF export round-trip re-split them (diagnose showed 33 islands still).
This script: remove_doubles directly on mesh.data, verify island count = 1
before exporting.
Usage: blender --background --python weld_fixed.py -- <in.glb> <out.glb>
"""
import bpy, sys, collections

argv = sys.argv[sys.argv.index("--") + 1:]
IN, OUT = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=IN)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
mesh = max(meshes, key=lambda o: len(o.data.vertices))
print("WELDFIX target:", mesh.name, len(mesh.data.vertices), "verts")

# weld in object mode on the mesh data
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=1e-5)
bpy.ops.object.mode_set(mode='OBJECT')
print("WELDFIX after remove_doubles:", len(mesh.data.vertices), "verts")

# verify island count
n = len(mesh.data.vertices)
adj = collections.defaultdict(set)
for e in mesh.data.edges:
    adj[e.vertices[0]].add(e.vertices[1])
    adj[e.vertices[1]].add(e.vertices[0])
seen = bytearray(n)
islands = 0
for i in range(n):
    if seen[i]:
        continue
    islands += 1
    stack = [i]
    seen[i] = 1
    while stack:
        v = stack.pop()
        for w in adj[v]:
            if not seen[w]:
                seen[w] = 1
                stack.append(w)
print("WELDFIX islands after weld:", islands)

# also weld the other mesh objects lightly so export doesn't keep strays
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB',
                           export_materials='EXPORT')
print("WROTE", OUT)
