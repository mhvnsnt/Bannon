import sys
import os

try:
    import bpy
except ImportError:
    print("This script must be executed headlessly inside Blender: blender --background --python convert.py")
    sys.exit(1)

def convert_blend_to_glb(blend_path, glb_path):
    print(f"[BlendForge Blender Core] Opening blend file: {blend_path}")
    
    # 1. Load the provided .blend file
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    # 2. Remove non-mesh data (cameras, lights)
    objects_to_delete = []
    for obj in bpy.data.objects:
        if obj.type in ('CAMERA', 'LIGHT'):
            objects_to_delete.append(obj)
            
    for obj in objects_to_delete:
        bpy.data.objects.remove(obj, do_unlink=True)
    print(f"[BlendForge Blender Core] Removed {len(objects_to_delete)} non-mesh elements (lights/cameras).")

    # 3. Apply 'Smart UV Project' and optimize all meshes
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            # Select object and set as active context
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            
            # Enter edit mode to execute UV project
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
            bpy.ops.object.mode_set(mode='OBJECT')
            
            # Inject a decimate modifier to optimize mesh density for high-FPS browser rendering
            decimate_mod = obj.modifiers.new(name="AssetForgeDecimation", type='DECIMATE')
            decimate_mod.ratio = 0.5  # Decimate vertices by 50%
            bpy.ops.object.modifier_apply(modifier="AssetForgeDecimation")
            
            print(f"[BlendForge Blender Core] UV unwrapped and decimated mesh: {obj.name}")

    # 4. Export the clean hierarchy as an optimized GLB
    print(f"[BlendForge Blender Core] Exporting optimized glTF GLB binary: {glb_path}")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_apply=True,
        export_animations=True,
        export_skins=True,
        export_morph=True
    )
    print("[BlendForge Blender Core] Pipeline conversion run successful.")

if __name__ == "__main__":
    # Expects args format: blender --background --python convert.py -- input.blend output.glb
    args = sys.argv
    try:
        # Locate double-dash splitter '--'
        idx = args.index("--")
        input_blend = args[idx + 1]
        output_glb = args[idx + 2]
    except (ValueError, IndexError):
        print("[BlendForge Blender Core] Error: Arguments parsing failed.")
        print("Usage: blender -b -P convert.py -- <input.blend> <output.glb>")
        sys.exit(1)
        
    convert_blend_to_glb(input_blend, output_glb)
