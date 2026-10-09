"""Probe STICKUP_v3.glb shoulder deformation at raise angles.
Renders left arm at 15/30/45/60/90 deg forward AND lateral.
--use-cs 1 : add Corrective Smooth modifier after Armature (tuned for shoulders)
Poses are armature-space rotations (character faces +X in REST, camera at -Y).
  Forward raise (toward +X): Rotation(-angle, 4, 'Y')
  Lateral raise, LEFT arm (toward -Y): Rotation(-angle, 4, 'X')
"""
import bpy, sys, math, os
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d=None):
    for i, a in enumerate(argv):
        if a == n and i + 1 < len(argv): return argv[i + 1]
    return d

GLB = arg("--glb", "/home/hatch/workspace/bannon-video-pipe/repo/assets/models/STICKUP_v3.glb")
OUTDIR = arg("--output", "/tmp/probe_out/")
USE_CS = arg("--use-cs", "0") == "1"
WIDTH, HEIGHT = 960, 540
os.makedirs(OUTDIR, exist_ok=True)

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = WIDTH; scene.render.resolution_y = HEIGHT
scene.render.resolution_percentage = 100; scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.fps = 24; scene.frame_start = 1; scene.frame_end = 1
scene.eevee.taa_render_samples = 8
scene.eevee.use_gtao = False; scene.eevee.use_bloom = False; scene.eevee.use_ssr = False
world = scene.world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.008, 0.008, 0.012, 1.0); bg.inputs[1].default_value = 1.0

bpy.ops.import_scene.gltf(filepath=GLB)
arm_obj = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
arm_obj.location = (0, 0, 0); arm_obj.rotation_euler = (0, 0, 0)
mesh = max((o for o in bpy.context.scene.objects if o.type == 'MESH'),
           key=lambda o: len(o.data.vertices))

def bone(short):
    for b in arm_obj.data.bones:
        if b.name.split(":")[-1] == short: return b
    return None

# --- Corrective Smooth setup (after Armature) ---
if USE_CS:
    # build shoulder vertex group (verts within 0.25 of either shoulder joint)
    vg = mesh.vertex_groups.new(name="shoulder_fix")
    mw = mesh.matrix_world
    joints = []
    for SIDE in ("Left", "Right"):
        ab = bone(f"{SIDE}Arm")
        joints.append(arm_obj.matrix_world @ ab.head_local)
    for v in mesh.data.vertices:
        wp = mw @ v.co
        if min((wp - jp).length for jp in joints) < 0.25:
            vg.add([v.index], 1.0, 'REPLACE')
    # ensure Armature modifier is first, then add CS after it
    arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None)
    cs = mesh.modifiers.new(name="CorrectiveSmooth", type='CORRECTIVE_SMOOTH')
    if arm_mod:
        # move CS right after armature
        while mesh.modifiers.find(cs.name) > mesh.modifiers.find(arm_mod.name) + 1:
            bpy.context.view_layer.objects.active = mesh
            bpy.ops.object.modifier_move_up(modifier=cs.name)
    cs.factor = float(arg("--cs-factor", "1.0"))
    cs.iterations = int(arg("--cs-iter", "8"))
    cs.vertex_group = "shoulder_fix"
    cs.use_pin_boundary = True
    cs.smooth_type = 'LENGTH_WEIGHTED'
    print(f"CorrectiveSmooth: factor={cs.factor} iter={cs.iterations} vg=shoulder_fix pin=True type=LENGTH_WEIGHTED")

# --- camera + light: close-up on LEFT shoulder joint ---
# joint at approx (-0.026, -0.195, 0.503); character faces +X in REST
bpy.ops.object.empty_add(location=(-0.03, -0.15, 0.45))
focus = bpy.context.active_object
bpy.ops.object.camera_add(location=(-0.9, -1.1, 0.62))
cam = bpy.context.active_object
trk = cam.constraints.new('TRACK_TO'); trk.target = focus
trk.track_axis = 'TRACK_NEGATIVE_Z'; trk.up_axis = 'UP_Y'
scene.camera = cam
cam.data.lens = 50
bpy.ops.object.light_add(type='SPOT', location=(-0.5, -1.5, 1.5))
spot = bpy.context.active_object
spot.data.energy = 600; spot.data.spot_size = math.radians(60)
trk2 = spot.constraints.new('TRACK_TO'); trk2.target = focus
bpy.ops.object.light_add(type='SUN', location=(0, 0, 5))
bpy.context.active_object.data.energy = 0.4
# fill from the front so the shoulder isn't pitch black
bpy.ops.object.light_add(type='AREA', location=(-1.2, -0.6, 0.5))
fill = bpy.context.active_object
fill.data.energy = 150; fill.data.size = 1.0
trk3 = fill.constraints.new('TRACK_TO'); trk3.target = focus

def set_arm_pose(angle_deg, direction):
    """Pose LEFT arm. direction: 'fwd' or 'lat'."""
    pb = arm_obj.pose.bones.get("mixamorig:LeftArm")
    if not pb:
        # fallback: find by suffix
        for p in arm_obj.pose.bones:
            if p.name.split(":")[-1] == "LeftArm":
                pb = p; break
    rest = pb.bone.matrix_local.copy()
    if direction == 'fwd':
        R = Matrix.Rotation(math.radians(-angle_deg), 4, 'Y')
    else:
        R = Matrix.Rotation(math.radians(-angle_deg), 4, 'X')
    pb.matrix = R @ rest
    # update deps so CS + render see it
    bpy.context.view_layer.update()

def reset_pose():
    for pb in arm_obj.pose.bones:
        pb.matrix_basis.identity()
    bpy.context.view_layer.update()

# rest reference
reset_pose()
scene.render.filepath = os.path.join(OUTDIR, "rest.png")
bpy.ops.render.render(write_still=True)
print("rendered rest.png")

for direction in ("fwd", "lat"):
    for angle in (15, 30, 45, 60, 90):
        reset_pose()
        set_arm_pose(angle, direction)
        fn = f"{direction}_{angle}.png"
        scene.render.filepath = os.path.join(OUTDIR, fn)
        bpy.ops.render.render(write_still=True)
        print(f"rendered {fn}")
print("DONE")
