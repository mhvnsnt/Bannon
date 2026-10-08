#!/usr/bin/env python3
"""
render_scene.py v2 — Blender headless 3D scene renderer for entrance videos.
Rebuilt to match EL TORO DE ORO reference quality.

Reference study: EL_TORO_STUDY.md

Key v2 fixes:
1. RETARGET: rotation-only copy (no root-motion flinging). Hips/root keeps
   bind-pose location; only rotations transfer. Respects each bone's active
   rotation_mode (no more quaternion+euler double-write).
2. LIGHTING: El Toro 3-point — warm key (front-left), RED rim (back-right,
   the signature), cool blue fill. Volumetric god-ray cones. Color-shifting
   spotlight pool on floor. Starfield background.
3. CAMERA: 7 cinematic framings, slightly-low default, 3/4 preferred.
   Never flat profile.

Usage (after --):
  blender -b -P render_scene.py -- \
    --glb /path/to/CHAR_rigged.glb \
    --mocap /path/to/clip.fbx \
    --camera push_in|orbit|low_angle|closeup_34|side_profile|wide|medium \
    --lightshift blue|red|gold \
    --frames 120 --fps 30 \
    --output /tmp/frames/scene1/ \
    --width 1920 --height 1080
"""
import bpy
import sys
import os
import math
import random

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
LIGHTSHIFT = arg("--lightshift", "blue")
FRAMES = int(arg("--frames", "120"))
FPS = int(arg("--fps", "30"))
OUTDIR = arg("--output", "/tmp/frames/")
WIDTH = int(arg("--width", "1920"))
HEIGHT = int(arg("--height", "1080"))

os.makedirs(OUTDIR, exist_ok=True)

# --- clean scene ---
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

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
# EEVEE volumetrics for god rays
scene.eevee.volumetric_tile_size = '4'
scene.eevee.volumetric_samples = 16

# --- world: near-black with starfield ---
world = scene.world
world.use_nodes = True
nodes = world.node_tree.nodes
links = world.node_tree.links
nodes.clear()
out = nodes.new('ShaderNodeOutputWorld')
bg = nodes.new('ShaderNodeBackground')
bg.inputs[0].default_value = (0.008, 0.008, 0.012, 1.0)
bg.inputs[1].default_value = 1.0
# starfield: white noise dots, very dim
tex = nodes.new('ShaderNodeTexWhiteNoise')
tex.inputs[1].default_value = 180.0  # scale: tiny dots
math_n = nodes.new('ShaderNodeMath')
math_n.operation = 'GREATER_THAN'
math_n.inputs[1].default_value = 0.997  # sparse
mix = nodes.new('ShaderNodeMixShader')
links.new(bg.outputs[0], mix.inputs[1])
links.new(math_n.outputs[0], mix.inputs[0])
estar = nodes.new('ShaderNodeEmission')
estar.inputs[0].default_value = (0.5, 0.5, 0.55, 1.0)
estar.inputs[1].default_value = 0.35
links.new(estar.outputs[0], mix.inputs[2])
links.new(tex.outputs[0], math_n.inputs[0])
links.new(mix.outputs[0], out.inputs[0])

# --- floor: large dark reflective plane ---
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "ArenaFloor"
fmat = bpy.data.materials.new("FloorMat")
fmat.use_nodes = True
fn = fmat.node_tree.nodes
fl = fmat.node_tree.links
fn.clear()
fout = fn.new('ShaderNodeOutputMaterial')
fbsdf = fn.new('ShaderNodeBsdfPrincipled')
fbsdf.inputs['Base Color'].default_value = (0.02, 0.02, 0.025, 1.0)
fbsdf.inputs['Metallic'].default_value = 0.35
fbsdf.inputs['Roughness'].default_value = 0.45
try:
    fbsdf.inputs['Specular IOR Level'].default_value = 0.6
except KeyError:
    pass
fl.new(fbsdf.outputs[0], fout.inputs[0])
floor.data.materials.append(fmat)

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
char_arm.location = (0, 0, 0)
# face camera: rotate so character faces -Y (toward camera at -Y)
char_arm.rotation_euler = (0, 0, 0)

# --- retarget mocap: ROTATION ONLY (v2 fix) ---
# The v1 bug: copying root location 1:1 caused flinging/sliding when the
# mocap rig differed in scale or the root traveled. v2 copies rotations
# only; the character stays planted at origin. Feet stay planted.
if MOCAP and os.path.exists(MOCAP):
    bpy.ops.import_scene.fbx(filepath=MOCAP)
    mocap_arm = None
    cands = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o != char_arm]
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
        bone_map = {}
        char_by_short = {}
        for b in char_arm.data.bones:
            short = b.name.split(":")[-1]
            char_by_short[short] = b.name
        mocap_bones = {b.name for b in mocap_arm.data.bones}
        mocap_by_short = {}
        for b in mocap_arm.data.bones:
            mocap_by_short.setdefault(b.name.split(":")[-1], b.name)
        for jname, mshort in J2M.items():
            if jname in mocap_bones and mshort in char_by_short:
                bone_map[char_by_short[mshort]] = jname
        # Direct short-name fallback: both sides may use the same convention
        # (e.g. mixamorig:Hips on char and mixamorig:Hips on mocap) — then no
        # J_* translation is needed. Only fills bones J2M didn't already map.
        for mshort, char_bone in char_by_short.items():
            if char_bone not in bone_map and mshort in mocap_by_short:
                bone_map[char_bone] = mocap_by_short[mshort]
        print(f"Mapped {len(bone_map)}/{len(char_arm.data.bones)} bones")
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
        if not char_arm.animation_data:
            char_arm.animation_data_create()
        # identify root (Hips) — rotation only, NO location copy
        root_names = {char_by_short.get("Hips")}
        for f in range(1, FRAMES + 1):
            mf = m_start + (f - 1) % max(1, (m_end - m_start + 1))
            scene.frame_set(mf)
            bpy.context.view_layer.update()
            scene.frame_set(f)
            for dst_name, src_name in bone_map.items():
                src_pb = mocap_arm.pose.bones.get(src_name)
                dst_pb = char_arm.pose.bones.get(dst_name)
                if src_pb is None or dst_pb is None:
                    continue
                # ROTATION ONLY — respect the bone's active rotation mode
                if dst_pb.rotation_mode == 'QUATERNION':
                    dst_pb.rotation_quaternion = src_pb.rotation_quaternion
                    dst_pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
                elif dst_pb.rotation_mode == 'AXIS_ANGLE':
                    dst_pb.rotation_axis_angle = src_pb.rotation_axis_angle
                    dst_pb.keyframe_insert(data_path="rotation_axis_angle", frame=f)
                else:
                    dst_pb.rotation_euler = src_pb.rotation_euler
                    dst_pb.keyframe_insert(data_path="rotation_euler", frame=f)
                # location: NEVER copy (kills flinging). Root stays at origin.
        mocap_arm.hide_viewport = True
        mocap_arm.hide_render = True
        for child in mocap_arm.children_recursive:
            child.hide_viewport = True
            child.hide_render = True
        for o in bpy.context.scene.objects:
            if o.type == 'MESH' and not o.parent and o != char_arm and o != floor:
                mods = [m for m in o.modifiers if m.type == 'ARMATURE']
                if any(m.object == mocap_arm for m in mods):
                    o.hide_viewport = True
                    o.hide_render = True
        print(f"Retargeted {m_end - m_start + 1} mocap frames (rotation-only, root planted)")
    else:
        print("WARNING: mocap FBX had no armature; using bind pose")
else:
    print("No mocap given; character holds bind pose, camera provides motion")

# --- LIGHTING v2: El Toro 3-point ---
# Key: warm white spot, front-left high
# Rim: RED spot, back-right (the signature)
# Fill: cool BLUE area, front-right low
# Spot pool: colored spotlight straight down, color shifts per LIGHTSHIFT
def add_light(name, ltype, energy, loc, color=(1.0, 1.0, 1.0)):
    bpy.ops.object.light_add(type=ltype, location=loc)
    l = bpy.context.active_object
    l.name = name
    l.data.energy = energy
    l.data.color = color
    return l

key = add_light("Key", 'SPOT', 1200, (5, -7, 7), (1.0, 0.92, 0.80))
key.data.spot_size = math.radians(55)

rim = add_light("Rim", 'SPOT', 1500, (-4, 7, 5), (1.0, 0.08, 0.05))  # RED signature
rim.data.spot_size = math.radians(50)

fill = add_light("Fill", 'AREA', 250, (6, -2, 3), (0.35, 0.55, 1.0))  # cool blue
fill.data.size = 4.0

# overhead spot pool — color shifts per scene (El Toro: blue -> red -> gold)
pool_colors = {
    "blue": (0.25, 0.45, 1.0),
    "red": (1.0, 0.15, 0.10),
    "gold": (1.0, 0.75, 0.35),
    "white": (1.0, 0.95, 0.88),
}
pool = add_light("SpotPool", 'SPOT', 2000, (0, 0, 12),
                pool_colors.get(LIGHTSHIFT, pool_colors["blue"]))
pool.data.spot_size = math.radians(38)
pool.data.spot_blend = 0.6

for l in [o for o in bpy.context.scene.objects if o.type == 'LIGHT']:
    c = l.constraints.new('TRACK_TO')
    c.target = char_arm
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'

# --- volumetric god-ray cones (fake volumetrics, cheap + reliable) ---
def god_ray(x, tilt_deg=8):
    bpy.ops.mesh.primitive_cone_add(radius1=0.4, radius2=2.2, depth=14,
                                    location=(x, 0, 7))
    cone = bpy.context.active_object
    cone.name = f"GodRay_{x}"
    cone.rotation_euler = (math.radians(tilt_deg), 0, 0)
    mat = bpy.data.materials.new(f"GodRayMat_{x}")
    mat.use_nodes = True
    mn = mat.node_tree.nodes
    ml = mat.node_tree.links
    mn.clear()
    mout = mn.new('ShaderNodeOutputMaterial')
    transp = mn.new('ShaderNodeBsdfTransparent')
    emis = mn.new('ShaderNodeEmission')
    emis.inputs[0].default_value = (1.0, 0.82, 0.55, 1.0)  # warm gold
    emis.inputs[1].default_value = 0.55
    mixs = mn.new('ShaderNodeMixShader')
    mixs.inputs[0].default_value = 0.88  # mostly transparent
    fres = mn.new('ShaderNodeFresnel')
    ml.new(fres.outputs[0], mixs.inputs[0])
    ml.new(transp.outputs[0], mixs.inputs[1])
    ml.new(emis.outputs[0], mixs.inputs[2])
    ml.new(mixs.outputs[0], mout.inputs[0])
    mat.blend_method = 'BLEND'
    cone.data.materials.append(mat)
    return cone

for gx in (-4.5, -1.5, 1.5, 4.5):
    god_ray(gx, tilt_deg=random.uniform(5, 12))

# --- CAMERA v2: 7 cinematic framings ---
# Character faces +Y (toward camera at -Y... actually faces camera).
# Default: slightly LOW angle, 3/4 view preferred. Never flat profile.
bpy.ops.object.camera_add(location=(2.5, -7, 1.6))
cam = bpy.context.active_object
cam.name = "ShotCam"
scene.camera = cam
cam.data.lens = 50
trk = cam.constraints.new('TRACK_TO')
trk.target = char_arm
trk.track_axis = 'TRACK_NEGATIVE_Z'
trk.up_axis = 'UP_Y'

cam.animation_data_create()
F = FRAMES
# each framing: (start_xyz, end_xyz) — 3/4 angles, low default
framings = {
    "push_in":    ((3.0, -9.0, 1.8), (2.0, -5.0, 1.5)),
    "orbit":      ((6.5, -4.5, 1.8), (-6.5, -4.5, 2.2)),
    "low_angle":  ((2.0, -7.5, 0.7), (1.2, -4.5, 1.1)),
    "closeup_34": ((2.2, -4.2, 2.0), (1.6, -3.0, 1.9)),
    "side_profile": ((7.5, -1.5, 1.7), (7.0, 1.0, 1.7)),
    "wide":       ((4.5, -13.0, 2.5), (3.5, -11.0, 2.2)),
    "medium":     ((2.8, -6.5, 1.7), (2.2, -5.5, 1.6)),
}
start, end = framings.get(CAM_MOVE, framings["push_in"])
for f, pos in [(1, start), (F, end)]:
    cam.location = pos
    cam.keyframe_insert(data_path="location", frame=f)
if cam.animation_data and cam.animation_data.action:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'

print(f"Rendering {FRAMES} frames to {OUTDIR} ({WIDTH}x{HEIGHT}) "
      f"[camera={CAM_MOVE}, light={LIGHTSHIFT}]")
bpy.ops.render.render(animation=True)
print("DONE")
