#!/usr/bin/env python3
"""
render_scene.py — Blender headless 3D scene renderer for entrance videos.
Loads a rigged character GLB, optionally retargets a mocap FBX clip,
sets up cinematic camera + lighting, renders PNG sequence with EEVEE.

Usage (after --):
  blender -b -P render_scene.py -- \
    --glb /path/to/CHAR_rigged.glb \
    --mocap /path/to/clip.fbx \
    --camera push_in|orbit|static|low_angle \
    --frames 120 \
    --fps 30 \
    --output /tmp/frames/scene1/ \
    --width 1920 --height 1080

Free/open-source: Blender 4.x (GPL).
No procedural bone-wiggling: animation comes from real mocap FBX retargeted
onto the character rig by bone name. If no mocap is given, the character
holds its bind pose and the CAMERA provides the motion.
"""
import bpy
import sys
import os
import math

# --- arg parsing (after --) ---
argv = sys.argv
argv = argv[argv.index("--") + 1:] if "--" in argv else []

def arg(name, default=None):
    for i, a in enumerate(argv):
        if a == name and i + 1 < len(argv):
            return argv[i + 1]
    return default

GLB = arg("--glb")
MOCAP = arg("--mocap")
CAM_MOVE = arg("--camera", "push_in")
FRAMES = int(arg("--frames", "120"))
FPS = int(arg("--fps", "30"))
OUTDIR = arg("--output", "/tmp/frames/")
WIDTH = int(arg("--width", "1920"))
HEIGHT = int(arg("--height", "1080"))

os.makedirs(OUTDIR, exist_ok=True)

# --- clean scene ---
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# --- render settings: EEVEE fast ---
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = WIDTH
scene.render.resolution_y = HEIGHT
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = os.path.join(OUTDIR, "frame_####.png")
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end = FRAMES
# dark arena backdrop
world = scene.world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.02, 0.02, 0.03, 1.0)
bg.inputs[1].default_value = 1.0

# --- import character ---
bpy.ops.import_scene.gltf(filepath=GLB)
char_arm = None
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE':
        char_arm = obj
        break
if not char_arm:
    raise RuntimeError("No armature found in " + GLB)
print(f"Character armature: {char_arm.name}, bones: {len(char_arm.data.bones)}")

# center character at origin, face camera (-Y direction)
char_arm.location = (0, 0, 0)
char_arm.rotation_euler = (0, 0, math.radians(-90))

# --- retarget mocap if given ---
if MOCAP and os.path.exists(MOCAP):
    bpy.ops.import_scene.fbx(filepath=MOCAP)
    mocap_arm = None
    cands = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o != char_arm]
    # prefer the armature with J_ bones (the animated Reallusion rig)
    for o in cands:
        if any(b.name.startswith("J_") for b in o.data.bones):
            mocap_arm = o
            break
    if not mocap_arm:
        for o in cands:
            if o.animation_data:
                mocap_arm = o
                break
    if not mocap_arm and cands:
        mocap_arm = cands[-1]
    if mocap_arm:
        print(f"Mocap armature: {mocap_arm.name}")
        # J_ (Reallusion/CC) -> Mixamo bone map
        J2M = {
            "J_Hips": "Hips", "J_Spine1": "Spine", "J_Spine2": "Spine1",
            "J_Chest": "Spine2", "J_Neck": "Neck", "J_Head": "Head",
        }
        for side, mside in (("L", "Left"), ("R", "Right")):
            J2M.update({
                f"J_Clavicle_{side}": f"{mside}Shoulder",
                f"J_Shoulder_{side}": f"{mside}Arm",
                f"J_Elbow_{side}": f"{mside}ForeArm",
                f"J_Wrist_{side}": f"{mside}Hand",
                f"J_Leg_{side}": f"{mside}UpLeg",
                f"J_Knee_{side}": f"{mside}Leg",
                f"J_Foot_{side}": f"{mside}Foot",
                f"J_Toe_{side}": f"{mside}ToeBase",
            })
            for finger, mfin in (("Thumb", "Thumb"), ("Index", "Index"),
                                 ("Middle", "Middle"), ("Ring", "Ring"), ("Pinky", "Pinky")):
                for i in (1, 2, 3):
                    J2M[f"J_{finger}F{i}_{side}"] = f"{mside}Hand{mfin}{i}"
        # build bone map: char bone name -> mocap bone name
        bone_map = {}
        # char bones may have mixamorig: prefix
        char_by_short = {}
        for b in char_arm.data.bones:
            short = b.name.split(":")[-1]
            char_by_short[short] = b.name
        mocap_bones = {b.name for b in mocap_arm.data.bones}
        for jname, mshort in J2M.items():
            if jname in mocap_bones and mshort in char_by_short:
                bone_map[char_by_short[mshort]] = jname
        print(f"Mapped {len(bone_map)}/{len(char_arm.data.bones)} bones")
        # bake: for each frame, copy pose from mocap to character
        scene.frame_start = 1
        # find mocap frame range
        if mocap_arm.animation_data and mocap_arm.animation_data.action:
            act = mocap_arm.animation_data.action
            fcurves = act.fcurves
            if fcurves:
                fr = [kp.co[0] for fc in fcurves for kp in fc.keyframe_points]
                m_start, m_end = int(min(fr)), int(max(fr))
            else:
                m_start, m_end = 1, FRAMES
        else:
            m_start, m_end = 1, FRAMES
        # ensure character has animation data
        if not char_arm.animation_data:
            char_arm.animation_data_create()
        # copy pose per frame (location/rotation in local space)
        for f in range(1, FRAMES + 1):
            mf = m_start + (f - 1) % max(1, (m_end - m_start + 1))
            scene.frame_set(mf)
            # force update
            bpy.context.view_layer.update()
            scene.frame_set(f)
            for dst_name, src_name in bone_map.items():
                src_pb = mocap_arm.pose.bones.get(src_name)
                dst_pb = char_arm.pose.bones.get(dst_name)
                if src_pb is None or dst_pb is None:
                    continue
                # copy local transform
                dst_pb.location = src_pb.location
                dst_pb.rotation_quaternion = src_pb.rotation_quaternion
                dst_pb.rotation_euler = src_pb.rotation_euler
                dst_pb.scale = src_pb.scale
                dst_pb.keyframe_insert(data_path="location", frame=f)
                if dst_pb.rotation_mode == 'QUATERNION':
                    dst_pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
                else:
                    dst_pb.keyframe_insert(data_path="rotation_euler", frame=f)
                dst_pb.keyframe_insert(data_path="scale", frame=f)
        # hide mocap armature + all its meshes
        mocap_arm.hide_viewport = True
        mocap_arm.hide_render = True
        for child in mocap_arm.children_recursive:
            child.hide_viewport = True
            child.hide_render = True
        # also hide any other non-character meshes (mocap mannequin)
        for o in bpy.context.scene.objects:
            if o.type == 'MESH' and not o.parent and o != char_arm:
                # check if it's skinned to mocap armature
                mods = [m for m in o.modifiers if m.type == 'ARMATURE']
                if any(m.object == mocap_arm for m in mods):
                    o.hide_viewport = True
                    o.hide_render = True
        print(f"Retargeted {m_end - m_start + 1} mocap frames onto character")
    else:
        print("WARNING: mocap FBX had no armature with animation; using bind pose")
else:
    print("No mocap given; character holds bind pose, camera provides motion")

# --- lighting: 3-point arena ---
def add_light(name, ltype, energy, loc):
    bpy.ops.object.light_add(type=ltype, location=loc)
    l = bpy.context.active_object
    l.name = name
    l.data.energy = energy
    return l

add_light("Key", 'SPOT', 800, (4, -6, 6))
add_light("Fill", 'AREA', 300, (-5, -3, 4))
add_light("Rim", 'SPOT', 600, (0, 6, 5))
# aim lights at character
for l in [o for o in bpy.context.scene.objects if o.type == 'LIGHT']:
    c = l.constraints.new('TRACK_TO')
    c.target = char_arm
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'

# --- camera with automated move ---
bpy.ops.object.camera_add(location=(0, -7, 2.2))
cam = bpy.context.active_object
cam.name = "ShotCam"
scene.camera = cam
cam.data.lens = 50
# track character chest height
trk = cam.constraints.new('TRACK_TO')
trk.target = char_arm
trk.track_axis = 'TRACK_NEGATIVE_Z'
trk.up_axis = 'UP_Y'

# keyframe camera move
cam.animation_data_create()
if CAM_MOVE == "push_in":
    # dolly from 9m to 5m
    for f, dist in [(1, 9.0), (FRAMES, 5.0)]:
        cam.location = (0, -dist, 2.2)
        cam.keyframe_insert(data_path="location", frame=f)
elif CAM_MOVE == "orbit":
    for f in [1, FRAMES]:
        ang = math.radians(300 * (f - 1) / max(1, FRAMES - 1))
        cam.location = (7 * math.sin(ang), -7 * math.cos(ang), 2.0)
        cam.keyframe_insert(data_path="location", frame=f)
elif CAM_MOVE == "low_angle":
    for f, (y, z) in [(1, (-8, 0.8)), (FRAMES, (-5, 1.2))]:
        cam.location = (1.5, y, z)
        cam.keyframe_insert(data_path="location", frame=f)
else:  # static
    cam.location = (0, -7, 2.2)
    cam.keyframe_insert(data_path="location", frame=1)

# smooth interpolation
if cam.animation_data and cam.animation_data.action:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'

print(f"Rendering {FRAMES} frames to {OUTDIR} ({WIDTH}x{HEIGHT})")
bpy.ops.render.render(animation=True)
print("DONE")
