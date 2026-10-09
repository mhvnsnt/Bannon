#!/usr/bin/env python3
"""
render_take.py — Blender headless take renderer for Stick-Up v2.
STICKUP_repaired.glb + Mixamo walk, dark arena + hero spot, directed camera.
Overlays (relaxed/fingerguns/armshold) baked into retarget loop per-frame.
"""
import bpy, sys, os, math, mathutils

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d=None):
    for i, a in enumerate(argv):
        if a == n and i + 1 < len(argv): return argv[i + 1]
    return d

GLB = arg("--glb"); MOCAP = arg("--mocap")
CAM_MOVE = arg("--camera", "push_in")
FACING = math.radians(float(arg("--facing", "0")))
FRAMES = int(arg("--frames", "120")); FPS = int(arg("--fps", "24"))
OUTDIR = arg("--output", "/tmp/frames/")
WIDTH = int(arg("--width", "960")); HEIGHT = int(arg("--height", "540"))
INPLACE = arg("--inplace", "") == "1"
OVERLAY = arg("--overlay", "")
HEADSHAKE = int(arg("--headshake", "0"))
os.makedirs(OUTDIR, exist_ok=True)

OVERLAY_BONES = set()
if OVERLAY in ("fingerguns", "relaxed", "armshold"):
    for _s in ("Left", "Right"):
        OVERLAY_BONES.add(f"{_s}Arm"); OVERLAY_BONES.add(f"{_s}ForeArm")
        if OVERLAY == "fingerguns":
            for _i in (1, 2, 3): OVERLAY_BONES.add(f"{_s}HandIndex{_i}")
    if OVERLAY == "armshold": OVERLAY_BONES.add("Head")

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = WIDTH; scene.render.resolution_y = HEIGHT
scene.render.resolution_percentage = 100; scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = os.path.join(OUTDIR, "frame_####.png")
scene.render.fps = FPS; scene.frame_start = 1; scene.frame_end = FRAMES
scene.eevee.taa_render_samples = 16
scene.eevee.use_gtao = False; scene.eevee.use_bloom = False; scene.eevee.use_ssr = False
world = scene.world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.008, 0.008, 0.012, 1.0); bg.inputs[1].default_value = 1.0

bpy.ops.import_scene.gltf(filepath=GLB)
char_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
print(f"Armature: {char_arm.name}, bones: {len(char_arm.data.bones)}")
char_arm.location = (0, 0, 0); char_arm.rotation_euler = (0, 0, 0)

J2M = {"J_Hips": "Hips", "J_Spine1": "Spine", "J_Spine2": "Spine1",
       "J_Chest": "Spine2", "J_Neck": "Neck", "J_Head": "Head"}
for _sd, _ms in (("L", "Left"), ("R", "Right")):
    J2M.update({f"J_Clavicle_{_sd}": f"{_ms}Shoulder", f"J_Shoulder_{_sd}": f"{_ms}Arm",
                f"J_Elbow_{_sd}": f"{_ms}ForeArm", f"J_Wrist_{_sd}": f"{_ms}Hand",
                f"J_Leg_{_sd}": f"{_ms}UpLeg", f"J_Knee_{_sd}": f"{_ms}Leg",
                f"J_Foot_{_sd}": f"{_ms}Foot", f"J_Toe_{_sd}": f"{_ms}ToeBase"})

YAW_Q = mathutils.Quaternion((0, 0, 1), FACING)
RX = lambda d: mathutils.Quaternion((1,0,0), math.radians(d))
RY = lambda d: mathutils.Quaternion((0,1,0), math.radians(d))
RZ = lambda d: mathutils.Quaternion((0,0,1), math.radians(d))

def aim(pb, q):
    rq = pb.bone.matrix_local.to_quaternion()
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = rq.inverted() @ q @ rq

def apply_overlay(pb, short):
    if OVERLAY == "relaxed":
        if short in ("LeftArm", "RightArm"): aim(pb, RY(-8))
        elif short in ("LeftForeArm", "RightForeArm"): aim(pb, RY(-12))
    elif OVERLAY == "fingerguns":
        sd = "Left" if short.startswith("Left") else "Right"
        if short == f"{sd}Arm": aim(pb, RY(-25))
        elif short == f"{sd}ForeArm": aim(pb, RY(-8))
        elif "HandIndex" in short: aim(pb, RX(0))
    elif OVERLAY == "armshold":
        if short == "RightArm": aim(pb, RX(-25))
        elif short == "LeftArm": aim(pb, RX(25))
        elif short == "Head": aim(pb, RX(-12))

if MOCAP and os.path.exists(MOCAP):
    bpy.ops.import_scene.fbx(filepath=MOCAP)
    mocap_arm = None
    for o in bpy.context.scene.objects:
        if o.type == 'ARMATURE' and o != char_arm and o.animation_data:
            mocap_arm = o; break
    if mocap_arm:
        char_by_short = {}
        for b in char_arm.data.bones: char_by_short.setdefault(b.name.split(":")[-1], b.name)
        mocap_by_short = {}
        for b in mocap_arm.data.bones: mocap_by_short.setdefault(b.name.split(":")[-1], b.name)
        for jn, ms in J2M.items():
            if jn in mocap_by_short and ms not in mocap_by_short:
                mocap_by_short[ms] = mocap_by_short[jn]
        bone_map = {cn: mocap_by_short[s] for s, cn in char_by_short.items() if s in mocap_by_short}
        print(f"Mapped {len(bone_map)}/{len(char_arm.data.bones)} bones")
        act = mocap_arm.animation_data.action
        fc = act.fcurves if act else []
        if fc:
            fr = [kp.co[0] for f in fc for kp in f.keyframe_points]
            m_start, m_end = int(min(fr)), int(max(fr))
        else: m_start, m_end = 1, FRAMES
        if not char_arm.animation_data: char_arm.animation_data_create()
        span = max(1, m_end - m_start + 1)
        for f in range(1, FRAMES + 1):
            mf = m_start + (f - 1) % span
            scene.frame_set(mf); bpy.context.view_layer.update(); scene.frame_set(f)
            for dst_name, src_name in bone_map.items():
                short = dst_name.split(":")[-1]
                dst_pb = char_arm.pose.bones.get(dst_name)
                if dst_pb is None: continue
                if short in OVERLAY_BONES:
                    apply_overlay(dst_pb, short)
                    dst_pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
                    continue
                src_pb = mocap_arm.pose.bones.get(src_name)
                if src_pb is None: continue
                if not (INPLACE and short == "Hips"):
                    dst_pb.location = src_pb.location
                    dst_pb.keyframe_insert(data_path="location", frame=f)
                dst_pb.rotation_quaternion = src_pb.rotation_quaternion
                dst_pb.rotation_euler = src_pb.rotation_euler
                if short == "Hips" and abs(FACING) > 1e-6:
                    rq = dst_pb.bone.matrix_local.to_quaternion()
                    q = mathutils.Quaternion(dst_pb.rotation_quaternion) if dst_pb.rotation_mode == 'QUATERNION' else dst_pb.rotation_euler.to_quaternion()
                    dst_pb.rotation_mode = 'QUATERNION'
                    dst_pb.rotation_quaternion = rq.inverted() @ YAW_Q @ rq @ q
                dst_pb.keyframe_insert(data_path="rotation_quaternion" if dst_pb.rotation_mode == 'QUATERNION' else "rotation_euler", frame=f)
        mocap_arm.hide_viewport = True; mocap_arm.hide_render = True
        for o in bpy.context.scene.objects:
            if o.type == 'MESH':
                if any(m.type == 'ARMATURE' and m.object == mocap_arm for m in o.modifiers):
                    o.hide_viewport = True; o.hide_render = True
        print(f"Retargeted {span} mocap frames")
    else: print("WARNING: no animated mocap armature")
else: print("No mocap; bind pose")

if HEADSHAKE > 0:
    hb = next((b for b in char_arm.pose.bones if b.name.split(":")[-1] == "Head"), None)
    if hb:
        for ff, ang in [(max(1, HEADSHAKE-6), 0), (HEADSHAKE, -38), (min(FRAMES, HEADSHAKE+12), 0)]:
            scene.frame_set(ff); aim(hb, RZ(ang))
            hb.keyframe_insert(data_path="rotation_quaternion", frame=ff)
        print(f"Dread whip at {HEADSHAKE}")

def add_light(nm, ty, en, loc):
    bpy.ops.object.light_add(type=ty, location=loc)
    l = bpy.context.active_object; l.name = nm; l.data.energy = en; return l
hero = add_light("HeroSpot", 'SPOT', 1200, (3.5, -6, 6.5)); hero.data.spot_size = math.radians(38)
rim = add_light("Rim", 'SPOT', 350, (-2, 5, 4.5))
for l in (hero, rim):
    c = l.constraints.new('TRACK_TO'); c.target = char_arm
    c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'

bpy.ops.object.camera_add(location=(0, -7, 2.2))
cam = bpy.context.active_object; cam.name = "ShotCam"; scene.camera = cam; cam.data.lens = 50
trk = cam.constraints.new('TRACK_TO'); trk.target = char_arm
trk.track_axis = 'TRACK_NEGATIVE_Z'; trk.up_axis = 'UP_Y'
cam.animation_data_create()
if CAM_MOVE == "push_in":
    for f, d in [(1, 9.0), (FRAMES, 5.0)]: cam.location = (0, -d, 2.2); cam.keyframe_insert(data_path="location", frame=f)
elif CAM_MOVE == "closeup":
    for f, d in [(1, 4.2), (FRAMES, 3.0)]: cam.location = (0.8, -d, 2.0); cam.keyframe_insert(data_path="location", frame=f)
elif CAM_MOVE == "low_angle":
    for f, (y, z) in [(1, (-8, 0.8)), (FRAMES, (-5, 1.2))]: cam.location = (1.5, y, z); cam.keyframe_insert(data_path="location", frame=f)
elif CAM_MOVE == "wide":
    cam.location = (0, -11, 3.2); cam.keyframe_insert(data_path="location", frame=1)
elif CAM_MOVE == "orbit":
    for f in [1, FRAMES]:
        a = math.radians(300 * (f - 1) / max(1, FRAMES - 1))
        cam.location = (7 * math.sin(a), -7 * math.cos(a), 2.0); cam.keyframe_insert(data_path="location", frame=f)
else:
    cam.location = (0, -7, 2.2); cam.keyframe_insert(data_path="location", frame=1)
if cam.animation_data and cam.animation_data.action:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'

print(f"Rendering {FRAMES} frames to {OUTDIR}")
bpy.ops.render.render(animation=True)
print("DONE")
