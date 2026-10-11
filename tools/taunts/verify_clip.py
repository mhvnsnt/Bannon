#!/usr/bin/env blender -b -P
"""
verify_clip.py — deformation metric on a taunt clip's peak pose.

Loads an animated clip GLB, compares the rest pose (frame 1) vs the peak
taunt pose (frame 43, mid-hold) using the G4 max_stretch metric (3.0x limit,
0.30m shoulder region). Prints PASS/FAIL per shoulder.

Usage:
  blender -b -P verify_clip.py -- --input clips/crucifix_hardy.glb
"""
import sys, os
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d=None):
    for i, a in enumerate(argv):
        if a == n and i + 1 < len(argv): return argv[i + 1]
    return d

IN = arg("--input")
PEAK_FRAME = int(arg("--frame", "43"))

import bpy
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=IN)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
arms = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
mesh = max(meshes, key=lambda o: len(o.data.vertices))
arm = arms[0]
sc = bpy.context.scene

def tri_list():
    tris = []
    for p in mesh.data.polygons:
        vs = p.vertices
        for i in range(1, len(vs) - 1):
            tris.append((vs[0], vs[i], vs[i+1]))
    return tris

def deformed_cos():
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    return [v.co.copy() for v in ev.data.vertices]

def max_stretch(rest_cos, posed_cos, tris, region_center, region_r=0.30):
    worst, w_edge, w_cent = 1.0, 0.0, None
    for a, b, c in tris:
        ra, rb, rc = rest_cos[a], rest_cos[b], rest_cos[c]
        cx = (ra.x+rb.x+rc.x)/3; cy = (ra.y+rb.y+rc.y)/3; cz = (ra.z+rb.z+rc.z)/3
        if ((cx-region_center.x)**2 + (cy-region_center.y)**2 + (cz-region_center.z)**2) ** 0.5 > region_r:
            continue
        re_ = max((ra-rb).length, (rb-rc).length, (rc-ra).length)
        if re_ < 1e-3: continue
        pa, pb, pc = posed_cos[a], posed_cos[b], posed_cos[c]
        pe = max((pa-pb).length, (pb-pc).length, (pc-pa).length)
        r = pe / re_
        if r > worst:
            worst, w_edge = r, re_
            w_cent = (round(cx,3), round(cy,3), round(cz,3))
    return worst, w_edge, w_cent

def shoulder_center(short):
    for pb in arm.pose.bones:
        if pb.name.split(":")[-1] == short:
            return arm.matrix_world @ pb.bone.head_local
    return None

tris = tri_list()
sc.frame_set(1); bpy.context.view_layer.update()
rest_cos = deformed_cos()
sc.frame_set(PEAK_FRAME); bpy.context.view_layer.update()
posed_cos = deformed_cos()

print(f"{os.path.basename(IN)} peak frame {PEAK_FRAME}:")
all_pass = True
for short in ("LeftArm", "RightArm"):
    scn = shoulder_center(short)
    w, edge, cent = max_stretch(rest_cos, posed_cos, tris, scn)
    status = "PASS" if w < 3.0 else "FAIL"
    if w >= 3.0: all_pass = False
    print(f"  {short}: max_stretch={w:.2f}x [{status}] (edge={edge*1000:.1f}mm at {cent})")
print("DEFORM_METRIC:", "PASS" if all_pass else "FAIL - needs repaired rig")
