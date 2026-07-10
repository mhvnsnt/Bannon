"""
bannon_blender_rig.py — the "better than Tripo3D" step.

Takes a raw single-mesh .glb (from Hunyuan3D / any image-to-3D) and turns it into a
BANNON rig-native .glb: cleaned topology + the mesh SPLIT into the engine's 15 named
nodes (pelvis, chest, head, shL/shR, elL/elR, haL/haR, hipL/hipR, knL/knR, ftL/ftR),
so loadFighterModel's exact-name-match attach picks it up directly — no manual rigging.

Run headless (works with your repo's Blender setup / godmode/daemon/daemon_blender.py):
    blender --background --python bannon_blender_rig.py -- input.glb output.glb [--decimate 0.5]

Tripo3D hands you one undivided mesh; this hands you 15 fight-ready named parts.
"""
import bpy, sys, math

# ---- 15 anatomical seed points in NORMALISED body space (x=left+, y=up 0..1, z=depth) ----
SEEDS = {
    'pelvis': (0.00, 0.50, 0.00), 'chest': (0.00, 0.72, 0.00), 'head': (0.00, 0.92, 0.00),
    'shL': (0.17, 0.78, 0.00), 'shR': (-0.17, 0.78, 0.00),
    'elL': (0.30, 0.62, 0.00), 'elR': (-0.30, 0.62, 0.00),
    'haL': (0.37, 0.46, 0.00), 'haR': (-0.37, 0.46, 0.00),
    'hipL': (0.10, 0.48, 0.00), 'hipR': (-0.10, 0.48, 0.00),
    'knL': (0.12, 0.26, 0.00), 'knR': (-0.12, 0.26, 0.00),
    'ftL': (0.12, 0.03, 0.00), 'ftR': (-0.12, 0.03, 0.00),
}

def argval(flag, default=None):
    a = sys.argv
    return a[a.index(flag) + 1] if flag in a else default

def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    inp, outp = argv[0], argv[1]
    decim = float(argval('--decimate', 0) or 0)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=inp)

    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    if not meshes:
        print("[rig] no mesh in", inp); sys.exit(1)

    # join everything into one object
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = "RAW"

    # clean: merge doubles + recalc normals
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0005)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    # optional decimate for game-ready poly budget
    if decim and 0 < decim < 1:
        m = obj.modifiers.new("dec", 'DECIMATE'); m.ratio = decim
        bpy.ops.object.modifier_apply(modifier=m.name)

    # bounds (world) for normalisation
    bb = [obj.matrix_world @ v.co for v in obj.data.vertices]
    xs = [p.x for p in bb]; ys = [p.y for p in bb]; zs = [p.z for p in bb]
    # glTF is Y-up after import in Blender it's Z-up; handle both by using the tallest axis as "up"
    spanx, spany, spanz = max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs)
    up = 'z' if spanz >= spany else 'y'
    def norm(p):
        nx = (p.x - min(xs)) / (spanx or 1) - 0.5
        if up == 'z':
            ny = (p.z - min(zs)) / (spanz or 1); nz = (p.y - min(ys)) / (spany or 1) - 0.5
        else:
            ny = (p.y - min(ys)) / (spany or 1); nz = (p.z - min(zs)) / (spanz or 1) - 0.5
        return (nx, ny, nz)

    # one material slot per node -> assign each face to nearest seed -> separate by material
    keys = list(SEEDS.keys())
    for k in keys:
        mat = bpy.data.materials.new(k)
        obj.data.materials.append(mat)
    matidx = {k: i for i, k in enumerate(keys)}

    mesh = obj.data
    for poly in mesh.polygons:
        c = obj.matrix_world @ poly.center
        n = norm(c)
        best, bd = 'pelvis', 1e9
        for k, s in SEEDS.items():
            d = (n[0]-s[0])**2 + (n[1]-s[1])**2 + (n[2]-s[2])**2
            if d < bd:
                bd = d; best = k
        poly.material_index = matidx[best]

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='MATERIAL')
    bpy.ops.object.mode_set(mode='OBJECT')

    # rename each separated object to its node key (exact-name-match target)
    for o in list(bpy.data.objects):
        if o.type != 'MESH':
            continue
        mi = o.data.polygons[0].material_index if o.data.polygons else 0
        slot = o.data.materials[mi].name if o.data.materials else 'pelvis'
        node = slot.split('.')[0]
        if node in SEEDS:
            o.name = node

    if '--skin' in sys.argv:
        skin(xs, ys, zs, up)

    bpy.ops.export_scene.gltf(filepath=outp, export_format='GLB')
    print("[rig] wrote", outp, "with 15 named nodes" + (" + skinned armature" if '--skin' in sys.argv else ""))


def skin(xs, ys, zs, up):
    """Rejoin the named parts, build a 15-bone armature at the seed points, bind with automatic weights."""
    minx, maxx = min(xs), max(xs); miny, maxy = min(ys), max(ys); minz, maxz = min(zs), max(zs)
    def world(s):  # normalised seed -> world coords (respecting which axis is up)
        wx = minx + (s[0] + 0.5) * ((maxx-minx) or 1)
        if up == 'z':
            wz = minz + s[1] * ((maxz-minz) or 1); wy = miny + (s[2] + 0.5) * ((maxy-miny) or 1)
        else:
            wy = miny + s[1] * ((maxy-miny) or 1); wz = minz + (s[2] + 0.5) * ((maxz-minz) or 1)
        return (wx, wy, wz)

    parts = [o for o in bpy.data.objects if o.type == 'MESH' and o.name in SEEDS]
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts: o.select_set(True)
    if parts:
        bpy.context.view_layer.objects.active = parts[0]
        if len(parts) > 1: bpy.ops.object.join()
    body = bpy.context.view_layer.objects.active

    arm_data = bpy.data.armatures.new('BANNON_RIG'); arm = bpy.data.objects.new('BANNON_RIG', arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
    # parent chain so weights flow anatomically
    chain = {'pelvis': None, 'chest': 'pelvis', 'head': 'chest',
             'shL': 'chest', 'elL': 'shL', 'haL': 'elL', 'shR': 'chest', 'elR': 'shR', 'haR': 'elR',
             'hipL': 'pelvis', 'knL': 'hipL', 'ftL': 'knL', 'hipR': 'pelvis', 'knR': 'hipR', 'ftR': 'knR'}
    bones = {}
    for k, s in SEEDS.items():
        b = arm_data.edit_bones.new(k); b.head = world(s)
        parent = chain[k]; b.tail = world(SEEDS[parent]) if parent else (b.head[0], b.head[1], b.head[2] + 0.05)
        bones[k] = b
    for k, parent in chain.items():
        if parent: bones[k].parent = bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')

    # bind mesh to armature with automatic weights
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    try:
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    except Exception as e:
        print('[rig] auto-weight fallback:', e); bpy.ops.object.parent_set(type='ARMATURE')

if __name__ == "__main__":
    main()
