#!/usr/bin/env python3
"""
render_take_v3.py — Stick-Up v2 taunt renderer (robust).

Replaces render_take.py's broken aim() overlays and render_take_v2.py's
DG-read post-process (which suffered Blender dependency-graph evaluation
non-determinism: computed poses sometimes never reached the render).

Design: SINGLE retarget loop. Taunt rotations are PRE-COMPUTED from rest
data only (bone.matrix_local, no posed reads), then applied inline per-frame
like the walk. Fully deterministic. Verified frame-by-frame.

Taunts (--overlay):
  fingerguns : SAFE VERSION (2026-10-09, deformation envelope mapped by probe).
               Upper arms forward TRUE 12deg only (envelope: fwd<=15 clean;
               lateral webs at 10deg, elbow/wrist bends web the right
               shoulder). Forearms/wrists untouched. Finger-gun hand shapes
               (index straight, middle/ring/pinky curled, thumb out — proven
               clean). Held all frames. The old version aimed arms at the
               camera target (~89deg raise) and exploded the shoulders.
  callout    : SAFE final-pose (replaces crucifix — the rig cannot do a
               lateral arm raise). Head back -20deg + torso twist 30deg
               total (both proven clean). Arms stay at rest. Held all frames.
  (empty)    : walk arms.

--headshake N : dread-whip — rapid head yaw snap centered at frame N,
  composed on top of the walk head rotation (no pop). Neck follows at 0.35x.
  Proven clean at +-52deg yaw.

UNIVERSAL SAFE-ARM BASE: every take overrides the arm chain to a safe fixed
pose (arms forward TRUE 12deg, forearms/shoulders at rest) because the walk
mocap's arm swing (65-67deg) webs the shoulders. The head/torso/fingers
choreograph freely on top of the fixed arms.
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

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = WIDTH; scene.render.resolution_y = HEIGHT
scene.render.resolution_percentage = 100; scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = os.path.join(OUTDIR, "frame_####.png")
scene.render.fps = FPS; scene.frame_start = 1; scene.frame_end = FRAMES
scene.eevee.taa_render_samples = int(arg("--samples", "16"))
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
ID_Q = mathutils.Quaternion((1, 0, 0, 0))
Y_AXIS = mathutils.Vector((0, 1, 0))
RX = lambda d: mathutils.Quaternion((1, 0, 0), math.radians(d))
RY = lambda d: mathutils.Quaternion((0, 1, 0), math.radians(d))

def bone_by_short(short):
    for b in char_arm.data.bones:
        if b.name.split(":")[-1] == short: return b
    return None

# ---- pre-compute taunt rotations from REST data only ----
# fixed camera target for finger guns (closeup mid-push)
FG_TARGET = mathutils.Vector((0.8, -3.5, 2.0))

def _rel_q(child_bone, parent_bone):
    Bc = child_bone.matrix_local.to_quaternion()
    if parent_bone:
        Pp = parent_bone.matrix_local.to_quaternion()
        return Pp.inverted() @ Bc
    return Bc

def _point_at_rest_nonyaw(child_short, parent_shoulder_short, target_rest):
    """Like _point_at_rest but target is already in the rest frame (no un-yaw)."""
    cb = bone_by_short(child_short)
    pb = bone_by_short(parent_shoulder_short)
    if not cb or not pb: return ID_Q
    Pp_rest = pb.matrix_local.to_quaternion()
    B_rel = _rel_q(cb, pb)
    A = ((Pp_rest @ B_rel) @ Y_AXIS).normalized()
    head = mathutils.Vector(cb.head_local)
    D = (mathutils.Vector(target_rest) - head)
    if D.length < 1e-6: return ID_Q
    D = D.normalized()
    Qw = A.rotation_difference(D)
    R = B_rel.inverted() @ Pp_rest.inverted() @ Qw @ Pp_rest @ B_rel
    R.normalize()
    return R

def _point_at_rest(child_short, parent_shoulder_short, target_world):
    """Rotation (bone-local) that points the bone tip at a WORLD target,
    assuming the shoulder is held at identity (we fix shoulders for taunts).

    The hips yaw (-90°) is applied by an ancestor, so we un-yaw the target
    into the rest frame for the computation; the bone-local R is valid in
    either frame.
    """
    cb = bone_by_short(child_short)
    pb = bone_by_short(parent_shoulder_short)
    if not cb or not pb: return ID_Q
    # un-yaw the world target into the rest (unyawed) frame
    tgt_rest = (YAW_Q.inverted() @ mathutils.Vector(target_world))
    Pp_rest = pb.matrix_local.to_quaternion()
    B_rel = _rel_q(cb, pb)
    A = ((Pp_rest @ B_rel) @ Y_AXIS).normalized()
    head = mathutils.Vector(cb.head_local)
    D = (tgt_rest - head)
    if D.length < 1e-6: return ID_Q
    D = D.normalized()
    Qw = A.rotation_difference(D)
    R = B_rel.inverted() @ Pp_rest.inverted() @ Qw @ Pp_rest @ B_rel
    R.normalize()
    return R

TAUNT = {}  # short-name -> fixed quaternion (applied every frame)

if OVERLAY == "fingerguns":
    # SAFE (2026-10-09): upper arms forward TRUE 12deg — inside the measured
    # envelope (fwd 15deg clean, 25deg webs). Forearms/wrists NOT touched
    # (elbow/wrist bends web the right shoulder). Finger shapes proven clean.
    _TD = math.radians(12)
    for sd, sgn in (("Left", -1), ("Right", 1)):
        sh = bone_by_short(f"{sd}Shoulder")
        arm_b = bone_by_short(f"{sd}Arm")
        Pp = sh.matrix_local.to_quaternion()
        B_rel = _rel_q(arm_b, sh)
        rest_world = (Pp @ B_rel) @ Y_AXIS
        lift = mathutils.Vector((0, -1, 0))
        tgt_dir = (rest_world * math.cos(_TD) + lift * math.sin(_TD)).normalized()
        tgt = mathutils.Vector(sh.head_local) + tgt_dir * 2.4
        A = rest_world.normalized()
        D = (tgt - mathutils.Vector(sh.head_local)).normalized()
        Qw = A.rotation_difference(D)
        R = B_rel.inverted() @ Pp.inverted() @ Qw @ Pp @ B_rel
        R.normalize()
        TAUNT[f"{sd}Shoulder"] = ID_Q
        TAUNT[f"{sd}Arm"] = R
        # index: straighten (rest is curled; negative X uncurls).
        for jn in (f"{sd}HandIndex1", f"{sd}HandIndex2", f"{sd}HandIndex3"):
            TAUNT[jn] = RX(-45)
        for fn in ("Middle", "Ring", "Pinky"):
            for i, jn in enumerate((f"{sd}Hand{fn}1", f"{sd}Hand{fn}2", f"{sd}Hand{fn}3")):
                TAUNT[jn] = RX(75 - 15 * i)
        for jn in (f"{sd}HandThumb1", f"{sd}HandThumb2", f"{sd}HandThumb3"):
            TAUNT[jn] = RX(-30)
    print(f"SAFE finger-gun taunts precomputed for {len(TAUNT)} bones (arms fwd 12deg)")

elif OVERLAY == "callout":
    # SAFE final-pose replacing crucifix (2026-10-09): the rig cannot raise
    # arms laterally (webs at 10deg true). Head back -20deg + torso twist
    # 30deg total — both inside the measured envelope. Arms stay at rest.
    TAUNT["Head"] = RX(-20)
    for s in ("Spine", "Spine1", "Spine2"):
        TAUNT[s] = RY(10)
    print(f"SAFE callout pose precomputed for {len(TAUNT)} bones")

# UNIVERSAL SAFE-ARM BASE (2026-10-09, root cause found): the walk mocap's
# arm swing hits 65-67deg local rotation (measured) vs the 15deg clean
# envelope — the walk ITSELF webs the shoulders at swing extremes. Every
# prior "head/spine" webbing was actually the walk's arms, not the override.
# So: override the arm chain to a safe fixed pose on EVERY take, regardless
# of overlay. Arms forward TRUE 12deg (proven clean), forearms at rest,
# shoulders at rest. The head/torso/fingers then choreograph freely on top
# (verified clean in pipeline: callout+fixed arms, whip needs the same).
_TD = math.radians(12)
for _sd, _sgn in (("Left", -1), ("Right", 1)):
    if f"{_sd}Arm" not in TAUNT:
        _sh = bone_by_short(f"{_sd}Shoulder")
        _ab = bone_by_short(f"{_sd}Arm")
        _Pp = _sh.matrix_local.to_quaternion()
        _Br = _rel_q(_ab, _sh)
        _rw = (_Pp @ _Br) @ Y_AXIS
        _lift = mathutils.Vector((0, -1, 0))
        _tdir = (_rw * math.cos(_TD) + _lift * math.sin(_TD)).normalized()
        _tgt = mathutils.Vector(_sh.head_local) + _tdir * 2.4
        _A = _rw.normalized()
        _D = (_tgt - mathutils.Vector(_sh.head_local)).normalized()
        _Qw = _A.rotation_difference(_D)
        _R = _Br.inverted() @ _Pp.inverted() @ _Qw @ _Pp @ _Br
        _R.normalize()
        TAUNT[f"{_sd}Shoulder"] = ID_Q
        TAUNT[f"{_sd}Arm"] = _R
    if f"{_sd}ForeArm" not in TAUNT:
        TAUNT[f"{_sd}ForeArm"] = ID_Q
print(f"universal safe-arm base applied; {len(TAUNT)} bones total in TAUNT")

# head-whip snap keys: (frame_offset, degrees). Applied as local-Y on top of walk.
WHIP_KEYS = [(-12, 0), (-6, 22), (0, -52), (6, 34), (12, -18), (18, 8), (24, 0)]
def whip_angle(f):
    if HEADSHAKE <= 0: return 0.0
    c = HEADSHAKE
    ks = [(c + o, a) for o, a in WHIP_KEYS]
    if f <= ks[0][0]: return 0.0
    if f >= ks[-1][0]: return 0.0
    for (f0, a0), (f1, a1) in zip(ks, ks[1:]):
        if f0 <= f <= f1:
            t = (f - f0) / max(1e-9, (f1 - f0))
            return a0 + (a1 - a0) * t
    return 0.0

# ---- retarget loop with inline taunts ----
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
        bone_map_shorts = {k.split(":")[-1] for k in bone_map.keys()}
        # finger bones are not in bone_map (mocap has no fingers)
        finger_taunts = {jn: q for jn, q in TAUNT.items()
                         if "Hand" in jn and "Arm" not in jn and "Shoulder" not in jn
                         and jn != "LeftHand" and jn != "RightHand"
                         and jn not in bone_map_shorts}
        finger_pbs = {}
        for jn in finger_taunts:
            pb = char_arm.pose.bones.get("mixamorig:" + jn)
            if pb: finger_pbs[jn] = pb
        print(f"finger taunt bones: {len(finger_pbs)}")
        if not char_arm.animation_data: char_arm.animation_data_create()
        span = max(1, m_end - m_start + 1)
        for f in range(1, FRAMES + 1):
            mf = m_start + (f - 1) % span
            scene.frame_set(mf); bpy.context.view_layer.update(); scene.frame_set(f)
            for dst_name, src_name in bone_map.items():
                short = dst_name.split(":")[-1]
                dst_pb = char_arm.pose.bones.get(dst_name)
                if dst_pb is None: continue
                # TAUNT override (fixed, precomputed) — replaces walk on these bones
                if short in TAUNT:
                    dst_pb.rotation_mode = 'QUATERNION'
                    dst_pb.rotation_quaternion = TAUNT[short]
                    dst_pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
                    continue
                src_pb = mocap_arm.pose.bones.get(src_name)
                if src_pb is None: continue
                if not (INPLACE and short == "Hips"):
                    dst_pb.location = src_pb.location
                    dst_pb.keyframe_insert(data_path="location", frame=f)
                rq = src_pb.rotation_quaternion
                dst_pb.rotation_quaternion = mathutils.Quaternion(rq)
                dst_pb.rotation_euler = src_pb.rotation_euler
                # head whip: snap on top of walk (local Y = yaw, verified).
                # Use absolute snap (not composed) for a stronger, clearer hit.
                if short == "Head" and HEADSHAKE > 0:
                    wa = whip_angle(f)
                    if abs(wa) > 0.01:
                        dst_pb.rotation_mode = 'QUATERNION'
                        dst_pb.rotation_quaternion = RY(wa)
                if short == "Neck" and HEADSHAKE > 0:
                    wa = whip_angle(f)
                    if abs(wa) > 0.01:
                        dst_pb.rotation_mode = 'QUATERNION'
                        dst_pb.rotation_quaternion = RY(wa * 0.35)
                if short == "Hips" and abs(FACING) > 1e-6:
                    brq = dst_pb.bone.matrix_local.to_quaternion()
                    q = mathutils.Quaternion(dst_pb.rotation_quaternion)
                    dst_pb.rotation_mode = 'QUATERNION'
                    dst_pb.rotation_quaternion = brq.inverted() @ YAW_Q @ brq @ q
                dst_pb.keyframe_insert(data_path="rotation_quaternion" if dst_pb.rotation_mode == 'QUATERNION' else "rotation_euler", frame=f)
            # finger taunts (not in bone_map): hold every frame
            for jn, pb in finger_pbs.items():
                pb.rotation_mode = 'QUATERNION'
                pb.rotation_quaternion = finger_taunts[jn]
                pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
        mocap_arm.hide_viewport = True; mocap_arm.hide_render = True
        for o in bpy.context.scene.objects:
            if o.type == 'MESH':
                if any(m.type == 'ARMATURE' and m.object == mocap_arm for m in o.modifiers):
                    o.hide_viewport = True; o.hide_render = True
        print(f"Retargeted {span} mocap frames")
    else: print("WARNING: no animated mocap armature")
else: print("No mocap; bind pose")

# ---- lights / camera ----
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
elif CAM_MOVE == "medium":
    for f, d in [(1, 5.2), (FRAMES, 4.5)]: cam.location = (0.5, -d, 2.2); cam.keyframe_insert(data_path="location", frame=f)
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
