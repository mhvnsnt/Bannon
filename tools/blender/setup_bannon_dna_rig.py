#!/usr/bin/env python3
"""
BANNON base-GLB author — headless Blender (bpy) pipeline.

Builds a single smooth humanoid base mesh (metaballs -> mesh), bakes EVERY canonical DNA shape key
(exact names from docs/GLB_shapekey_spec.md, matching window.DNA_TO_MORPH) with REAL region deltas so
each morph actually deforms, adds a Mixamo-named armature with automatic weights, and exports a GLB
with morph targets + skins for the engine's applyShapeMorphs bridge to drive.

This proves + locks the full CAW/DNA -> GLB pipeline with a real asset. An artist/scan/forge later
replaces ONLY the geometry (keeping these shape-key names) to reach true AAA topology.

Run:  python3 tools/blender/setup_bannon_dna_rig.py   (bpy installed via pip; no UI)
"""
import bpy, bmesh, os, math, mathutils

OUT = os.environ.get("BANNON_GLB_OUT", os.path.join(os.getcwd(), "assets", "models", "wrestler_base.glb"))

# ---- canonical shape keys (must match window.DNA_TO_MORPH) ----
BODY_KEYS = ["Body_Muscular","Body_Gut","Body_Feminine","Chest_Size","Bust_Size","Arms_Size",
    "Forearms_Size","Shoulders_Size","Traps_Size","Waist_Size","Hips_Size","Glutes_Size",
    "Thighs_Size","Calves_Size","Neck_Size","Hands_Size","Feet_Size","Head_Size"]
FACE_KEYS = ["Jaw_Width","Jaw_Length","Skull_Width","Skull_Length","Cheek_Size","Chin_Projection",
    "Brow_Ridge","Brow_Width","Nose_Size","Nose_Length","Eye_Size","Eye_Spread","Eye_Height",
    "Mouth_Width","Mouth_Height","Lip_Fullness","Ear_Size","Ear_Height"]

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_body():
    mball = bpy.data.metaballs.new("BodyMB"); mball.resolution = 0.035; mball.render_resolution = 0.03
    mball.threshold = 0.6   # lower threshold => neighbouring fields fuse into ONE connected surface
    obj = bpy.data.objects.new("Wrestler_Base", mball); bpy.context.collection.objects.link(obj)
    def el(x,y,z, sx,sy,sz, stiff=2.0):
        # larger influence radius so adjacent elements overlap and MERGE (no floating blobs)
        e = mball.elements.new(); e.type='ELLIPSOID'; e.co=(x,y,z); e.size_x=sx; e.size_y=sy; e.size_z=sz; e.radius=2.4; e.stiffness=stiff
    # standing, Z up, facing +Y (torso/limbs); mirrored L/R on X
    el(0,0,1.78, .13,.13,.15)                    # head
    el(0,0,1.60, .07,.07,.07)                    # neck
    el(0,0,1.40, .21,.15,.16)                    # chest/upper torso
    el(0,0,1.18, .17,.13,.14)                    # abs
    el(0,0,0.98, .19,.14,.12)                    # pelvis
    for s in (-1,1):
        el(s*0.24,0,1.46, .10,.10,.10)           # shoulder
        el(s*0.30,0,1.24, .085,.085,.18)         # upper arm
        el(s*0.33,0,0.98, .07,.07,.17)           # forearm
        el(s*0.34,0,0.78, .075,.06,.075)         # hand
        el(s*0.11,0,0.72, .11,.11,.22)           # thigh
        el(s*0.12,0,0.38, .085,.085,.20)         # calf
        el(s*0.12,0.07,0.05, .08,.16,.05)        # foot
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.view_layer.objects.active; obj.name = "Wrestler_Base"
    # clean + smooth
    me = obj.data
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    return obj

def bbox(obj):
    xs=[v.co.x for v in obj.data.vertices]; ys=[v.co.y for v in obj.data.vertices]; zs=[v.co.z for v in obj.data.vertices]
    return (min(xs),max(xs),min(ys),max(ys),min(zs),max(zs))

def band(t, lo, hi, feather=0.06):
    # smooth 0..1 membership of normalized height t within [lo,hi]
    if t < lo-feather or t > hi+feather: return 0.0
    if t < lo: return (t-(lo-feather))/feather
    if t > hi: return ((hi+feather)-t)/feather
    return 1.0

def add_shape_keys(obj):
    me = obj.data
    if not me.shape_keys: obj.shape_key_add(name="Basis", from_mix=False)
    xmin,xmax,ymin,ymax,zmin,zmax = bbox(obj); H = (zmax-zmin) or 1.0
    base = [v.co.copy() for v in me.vertices]
    def make(name, fn):
        kb = obj.shape_key_add(name=name, from_mix=False); kb.value = 0.0
        for i,co in enumerate(base):
            kb.data[i].co = fn(co.copy(), (co.z-zmin)/H)
        return kb
    # radial scale about the body centre-line for a height band
    def radial(co,t,lo,hi,f,cx=0.0):
        w=band(t,lo,hi)
        if w<=0: return co
        co.x = cx+(co.x-cx)*(1+f*w); co.y = co.y*(1+f*w); return co
    # ---- body ----
    make("Body_Muscular", lambda co,t: radial(co,t,0.30,0.80,0.14))
    def gut(co,t):
        w=band(t,0.48,0.66)
        if w>0 and co.y>0: co.y+=0.12*w
        return radial(co,t,0.48,0.66,0.10)
    make("Body_Gut", gut)
    def fem(co,t):
        co=radial(co,t,0.45,0.55,0.10)      # wider hips
        co=radial(co,t,0.58,0.66,-0.10)     # smaller waist
        return co
    make("Body_Feminine", fem)
    make("Chest_Size", lambda co,t: radial(co,t,0.66,0.78,0.16))
    make("Bust_Size", lambda co,t: (setattr(co,'y',co.y+0.10*band(t,0.66,0.76)) if co.y>0 else None) or co)
    make("Arms_Size", lambda co,t: radial(co,t,0.55,0.80,0.18,cx=0.30*(1 if co.x>0 else -1)) if abs(co.x)>0.18 else co)
    make("Forearms_Size", lambda co,t: radial(co,t,0.45,0.58,0.18,cx=0.33*(1 if co.x>0 else -1)) if abs(co.x)>0.2 else co)
    make("Shoulders_Size", lambda co,t: radial(co,t,0.74,0.82,0.16))
    make("Traps_Size", lambda co,t: (setattr(co,'z',co.z+0.05*band(t,0.78,0.86)) or co))
    make("Waist_Size", lambda co,t: radial(co,t,0.56,0.66,0.16))
    make("Hips_Size", lambda co,t: radial(co,t,0.45,0.55,0.16))
    make("Glutes_Size", lambda co,t: (setattr(co,'y',co.y-0.12*band(t,0.46,0.56)) if co.y<0 else None) or co)
    make("Thighs_Size", lambda co,t: radial(co,t,0.28,0.44,0.18))
    make("Calves_Size", lambda co,t: radial(co,t,0.12,0.26,0.18))
    make("Neck_Size", lambda co,t: radial(co,t,0.82,0.88,0.20))
    make("Hands_Size", lambda co,t: radial(co,t,0.38,0.46,0.20,cx=0.34*(1 if co.x>0 else -1)) if abs(co.x)>0.22 else co)
    make("Feet_Size", lambda co,t: radial(co,t,0.0,0.08,0.20))
    make("Head_Size", lambda co,t: radial(co,t,0.88,1.0,0.14))
    # ---- face (head band ~0.88..1.0) : coarse but real deltas so the sliders visibly move ----
    def headband(t): return band(t,0.86,1.0)
    make("Jaw_Width", lambda co,t: (setattr(co,'x',co.x*(1+0.22*band(t,0.87,0.93))) or co))
    make("Jaw_Length", lambda co,t: (setattr(co,'z',co.z-0.05*band(t,0.87,0.92)) or co))
    make("Skull_Width", lambda co,t: (setattr(co,'x',co.x*(1+0.16*band(t,0.93,1.0))) or co))
    make("Skull_Length", lambda co,t: (setattr(co,'y',co.y*(1+0.16*band(t,0.93,1.0))) or co))
    make("Cheek_Size", lambda co,t: (setattr(co,'x',co.x*(1+0.14*band(t,0.90,0.95))) or co))
    make("Chin_Projection", lambda co,t: (setattr(co,'y',co.y+0.06*band(t,0.87,0.91)) if co.y>0 else None) or co)
    make("Brow_Ridge", lambda co,t: (setattr(co,'y',co.y+0.05*band(t,0.94,0.98)) if co.y>0 else None) or co)
    make("Brow_Width", lambda co,t: (setattr(co,'x',co.x*(1+0.12*band(t,0.94,0.98))) or co))
    make("Nose_Size", lambda co,t: (setattr(co,'y',co.y+0.05*band(t,0.92,0.96)) if co.y>0.05 else None) or co)
    make("Nose_Length", lambda co,t: (setattr(co,'z',co.z-0.03*band(t,0.92,0.96)) if co.y>0.05 else None) or co)
    make("Eye_Size", lambda co,t: (setattr(co,'x',co.x*(1+0.08*band(t,0.93,0.97))) or co))
    make("Eye_Spread", lambda co,t: (setattr(co,'x',co.x*(1+0.10*band(t,0.93,0.97))) or co))
    make("Eye_Height", lambda co,t: (setattr(co,'z',co.z+0.03*band(t,0.93,0.97)) or co))
    make("Mouth_Width", lambda co,t: (setattr(co,'x',co.x*(1+0.14*band(t,0.88,0.92))) or co))
    make("Mouth_Height", lambda co,t: (setattr(co,'z',co.z+0.02*band(t,0.88,0.92)) or co))
    make("Lip_Fullness", lambda co,t: (setattr(co,'y',co.y+0.03*band(t,0.88,0.92)) if co.y>0.05 else None) or co)
    make("Ear_Size", lambda co,t: (setattr(co,'x',co.x*(1+0.16*band(t,0.90,0.96))) if abs(co.x)>0.09 else None) or co)
    make("Ear_Height", lambda co,t: (setattr(co,'z',co.z+0.03*band(t,0.90,0.96)) if abs(co.x)>0.09 else None) or co)

def add_armature(obj):
    try:
        amt = bpy.data.armatures.new("BannonRig"); rig = bpy.data.objects.new("Armature", amt)
        bpy.context.collection.objects.link(rig); bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='EDIT')
        def bone(name, head, tail, parent=None):
            b = amt.edit_bones.new(name); b.head=head; b.tail=tail
            if parent: b.parent=parent
            return b
        hips=bone("Hips",(0,0,0.98),(0,0,1.12))
        spine=bone("Spine",(0,0,1.12),(0,0,1.35),hips)
        chest=bone("Spine2",(0,0,1.35),(0,0,1.55),spine)
        neck=bone("Neck",(0,0,1.55),(0,0,1.66),chest)
        bone("Head",(0,0,1.66),(0,0,1.92),neck)
        for s,tag in ((1,"Left"),(-1,"Right")):
            sh=bone(tag+"Shoulder",(0,0,1.5),(s*0.22,0,1.46),chest)
            ua=bone(tag+"Arm",(s*0.22,0,1.46),(s*0.30,0,1.24),sh)
            fa=bone(tag+"ForeArm",(s*0.30,0,1.24),(s*0.34,0,0.9),ua)
            bone(tag+"Hand",(s*0.34,0,0.9),(s*0.35,0,0.74),fa)
            ul=bone(tag+"UpLeg",(s*0.11,0,0.95),(s*0.11,0,0.5),hips)
            ll=bone(tag+"Leg",(s*0.11,0,0.5),(s*0.12,0,0.12),ul)
            bone(tag+"Foot",(s*0.12,0,0.12),(s*0.12,0.18,0.04),ll)
        bpy.ops.object.mode_set(mode='OBJECT')
        obj.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
        
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
        
        # --- ANATOMICAL WEIGHT CLAMPS ---
        print("Enforcing Anatomical Weight Clamps...")
        vg_idx = {vg.name: vg.index for vg in obj.vertex_groups}
        for v in obj.data.vertices:
            # Prevent pelvis vertices from carrying leg-bone weights (Z > 0.95 is roughly pelvis)
            if v.co.z > 0.95:
                for leg_bone in ["LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg"]:
                    if leg_bone in vg_idx:
                        try: obj.vertex_groups[vg_idx[leg_bone]].remove([v.index])
                        except: pass
            
            # Weak-influence pruning (< 0.05) & sharp falloff
            groups = []
            for g in v.groups:
                if g.weight > 0.05:
                    groups.append((g.group, g.weight))
                else:
                    obj.vertex_groups[g.group].remove([v.index])
                    
            # Normalize
            total = sum(w for _, w in groups)
            if total > 0:
                for g_idx, w in groups:
                    obj.vertex_groups[g_idx].add([v.index], w / total, 'REPLACE')
                    
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
        bpy.ops.object.vertex_group_smooth(group_select_mode='ALL', factor=0.5, repeat=3)
        bpy.ops.object.mode_set(mode='OBJECT')
        bpy.context.view_layer.objects.active = rig
        # --------------------------------

        return True
    except Exception as e:
        print("armature/skinning skipped:", e); return False

def main():
    reset_scene()
    obj = build_body()
    add_shape_keys(obj)
    rigged = add_armature(obj)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    for o in bpy.context.scene.objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True,
        export_morph=True, export_skins=rigged, export_materials='EXPORT', use_selection=True)
    nverts = len(obj.data.vertices); nkeys = len(obj.data.shape_keys.key_blocks)-1 if obj.data.shape_keys else 0
    # connectivity report: how many separate shells? 1 = a single connected body (good)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    seen=set(); shells=0
    for v in bm.verts:
        if v.index in seen: continue
        shells+=1; stack=[v]
        while stack:
            x=stack.pop()
            if x.index in seen: continue
            seen.add(x.index)
            for e in x.link_edges: stack.append(e.other_vert(x))
    bm.free()
    print("SUCCESS: %s  verts=%d shapekeys=%d rigged=%s shells=%d" % (OUT, nverts, nkeys, rigged, shells))

if __name__ == "__main__":
    main()
