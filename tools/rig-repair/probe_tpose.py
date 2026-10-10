#!/usr/bin/env python3
"""probe_tpose.py — visual probe renders for a T-posed character rebuild.

Renders each arm at 15/30/45/60/90 deg forward + lateral using the SAME
joint-centric pose convention as the G4 gate in verify_character.py
(arm bone frame rotates about the shoulder JOINT; lateral = rest dir toward
+Z, forward = toward +X). Also renders the rest T-pose.

Usage:
  env -u PYTHONPATH blender -b --python probe_tpose.py -- \
      --glb /path/to/STICKUP_v3.glb --output /tmp/probe_v3/
"""
import bpy, sys, math, os
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d=None):
    for i, a in enumerate(argv):
        if a == n and i + 1 < len(argv): return argv[i + 1]
    return d

GLB = arg("--glb"); OUTDIR = arg("--output", "/tmp/probe_out/")
os.makedirs(OUTDIR, exist_ok=True)
WIDTH, HEIGHT = 960, 540

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = WIDTH; scene.render.resolution_y = HEIGHT
scene.render.resolution_percentage = 100; scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.fps = 24; scene.frame_start = 1; scene.frame_end = 1
scene.eevee.taa_render_samples = 8
world = scene.world
if world is None:
    world = bpy.data.worlds.new("World"); scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.008, 0.008, 0.012, 1.0); bg.inputs[1].default_value = 1.0

bpy.ops.import_scene.gltf(filepath=GLB)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
arm.location = (0, 0, 0); arm.rotation_euler = (0, 0, 0)
mesh = max((o for o in bpy.context.scene.objects if o.type == 'MESH'),
           key=lambda o: len(o.data.vertices))

# lights + camera
bpy.ops.object.light_add(type='SUN', location=(2, -2, 4))
sun = bpy.context.active_object; sun.data.energy = 3.0
bpy.ops.object.light_add(type='SUN', location=(-3, 3, 2))
fill = bpy.context.active_object; fill.data.energy = 1.0
bpy.ops.object.camera_add()
cam = bpy.context.active_object
scene.camera = cam
cam.data.lens = 50

def aim(cam_obj, pos, target):
    cam_obj.location = pos
    d = Vector(target) - Vector(pos)
    q = d.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = q.to_euler()

def bone(short):
    for pb in arm.pose.bones:
        if pb.name.split(":")[-1] == short: return pb
    return None

def reset_pose():
    for pb in arm.pose.bones: pb.matrix_basis.identity()
    bpy.context.view_layer.update()

def set_arm(short, angle_deg, direction):
    pb = bone(short)
    rest = pb.bone.matrix_local.copy()
    Jw = arm.matrix_world @ pb.bone.head_local
    uw = (arm.matrix_world.to_3x3() @ (pb.bone.tail_local - pb.bone.head_local)).normalized()
    tgt = Vector((0, 0, 1)) if direction == 'lat' else Vector((1, 0, 0))
    axis = uw.cross(tgt)
    if axis.length < 1e-6: axis = Vector((0, 1, 0))
    axis.normalize()
    Rw = Matrix.Rotation(math.radians(angle_deg), 4, axis)
    if (Rw @ uw).dot(tgt) < uw.dot(tgt):
        Rw = Matrix.Rotation(math.radians(-angle_deg), 4, axis)
    A = arm.matrix_world
    R = A.inverted() @ Rw @ A
    J = pb.bone.head_local
    T1 = Matrix.Translation(J); T2 = Matrix.Translation(-J)
    pb.matrix = T1 @ R @ T2 @ rest
    bpy.context.view_layer.update()

def render(name, campos):
    aim(cam, campos, (0, 0, 1.0))
    scene.render.filepath = os.path.join(OUTDIR, name + ".png")
    bpy.ops.render.render(write_still=True)
    print("PROBE-RENDER:", name)

# rest T-pose: front + side
reset_pose()
render("rest_front", (3.2, 0, 1.2))
render("rest_side", (0, -3.2, 1.2))

for short in ("LeftArm", "RightArm"):
    for direction, campos in (("lat", (3.2, 0, 1.2)), ("fwd", (0, -3.2, 1.2))):
        for angle in (15, 30, 45, 60, 90):
            reset_pose(); set_arm(short, angle, direction)
            render(f"{short}_{direction}_{angle}", campos)
reset_pose()
print("PROBE RENDERS COMPLETE:", OUTDIR)
