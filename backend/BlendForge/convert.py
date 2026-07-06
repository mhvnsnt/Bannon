import bpy
import sys
import os

def smart_uv_unwrap():
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.uv.smart_project()
            bpy.ops.object.mode_set(mode='OBJECT')

def bake_materials():
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.device = 'CPU'
    bpy.context.scene.cycles.bake_type = 'DIFFUSE'
    bpy.context.scene.render.bake.use_pass_direct = False
    bpy.context.scene.render.bake.use_pass_indirect = False
    
    # Very basic procedural bake script snippet
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH' and obj.active_material:
            mat = obj.active_material
            mat.use_nodes = True
            nodes = mat.node_tree.nodes
            
            # Add an image texture node for baking
            img = bpy.data.images.new(name="BakeTexture", width=2048, height=2048)
            tex_node = nodes.new(type='ShaderNodeTexImage')
            tex_node.image = img
            nodes.active = tex_node
            
            # Select object and bake
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            bpy.ops.object.bake(type='DIFFUSE', save_mode='EXTERNAL')

            # Re-link logic to Principled BSDF goes here...

def clean_scene():
    for obj in bpy.data.objects:
        if obj.type in ['CAMERA', 'LIGHT']:
            bpy.data.objects.remove(obj, do_unlink=True)

def export_glb(output_path):
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_yup=True
    )

if __name__ == "__main__":
    # blender -b input.blend --python convert.py -- output.glb
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if not argv:
        print("Usage: blender -b input.blend --python convert.py -- output.glb")
        sys.exit(1)
        
    output_glb = argv[0]
    
    clean_scene()
    # smart_uv_unwrap()
    # bake_materials()
    export_glb(output_glb)
    print(f"Exported to {output_glb}")
