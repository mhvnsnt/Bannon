# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright 2022, RancidMilk <rancidmilkgames@gmail.com> *Uses code from the Blender Foundation*

#     This program is free software: you can redistribute it and/or modify
#     it under the terms of the GNU General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     This program is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU General Public License for more details.
#
#     You should have received a copy of the GNU General Public License
#     along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Tested in Blender 3.3.1 LTS

# Hint: if you're writing your scripts in an IDE instead of inside Blender you can get an easy auto-complete with:
# https://github.com/nutti/fake-bpy-module

import time
import bpy
import os
import math

# IMPORTANT!!! - Replace these top variables with your own!!!!!!!!!!!!!!!!!!!!
# If you'd like to skip retargeting or don't have Auto-Rig Pro, comment out all sections with: "----->"

# Path to folder with .bvh files. Will search sub-folders too.
# (Windows example: "C:\\Users\\Me\\MoCapAnims") or (os.path.join(os.sep, "Users", "Me", "MoCapAnims"))
root_directory_to_search = "<Path to folder with .bvh files>"
# Enter path to .blend library collection with rig/armature still in file.
# os.path.join(os.sep, Users, Me, Documents, BlenderAnimProject, model(lib).blend, Collection)"
# Notice in the example above, "Collection" is the name of the collection inside the .blend file.
# You don't need to set this if you're not re-targeting.
rig_target_source_path = "<path to your blend>.blend\\Collection"
# Enter the data type. I used collections, and recommend you do too.
data_type = "Collection"


# These are my suggested settings. You can change them if you want:
# Would you like to keep track of which animation conversion left off on and be able to resume from there?
use_spot = True
# Max animations to run before resetting blender. This is my lazy(But super effective) way of speeding up the process.
max_runs = 30


# Don't need to change these:
my_spot = ""
found_spot = False
finished_runs = False


if use_spot and os.path.exists("spot.txt"):
    my_spot_file = open("spot.txt", "r")
    my_spot = my_spot_file.read()
    my_spot_file.close()
    print("picking up from spot: " + my_spot)

elif os.path.exists(root_directory_to_search):
    found_spot = True
    print("No spot found. Starting conversions from beginning")

else:
    print("You need to enter a valid path to the folder with .bvh files.")
    bpy.ops.wm.quit_blender()
    exit(code=1)


def delete_lingering_data():
    for arm in bpy.data.armatures:
        bpy.data.armatures.remove(arm, do_unlink=True, do_id_user=True, do_ui_user=True)
    for act in bpy.data.actions:
        bpy.data.actions.remove(act, do_unlink=True, do_id_user=True, do_ui_user=True)
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat, do_unlink=True, do_id_user=True, do_ui_user=True)
    for m in bpy.data.meshes:
        bpy.data.meshes.remove(m, do_unlink=True, do_id_user=True, do_ui_user=True)

    skip = 0
    for coll in bpy.data.collections:
        if skip == 0:
            skip += 1
        else:
            bpy.data.collections.remove(coll, do_unlink=True, do_id_user=True, do_ui_user=True)
    for lib in bpy.data.libraries:
        bpy.data.libraries.remove(lib, do_unlink=True, do_id_user=True, do_ui_user=True)
    for cache in bpy.data.cache_files:
        bpy.data.cache_files.remove(cache, do_unlink=True, do_id_user=True, do_ui_user=True)


def convert_and_retarget(dir_to_search):
    global found_spot
    global max_runs
    global finished_runs
    if max_runs <= 0:
        bpy.ops.wm.quit_blender()
        return
    delete_lingering_data()
    for file in os.listdir(dir_to_search):
        a_dir = os.path.isdir(dir_to_search + "\\" + file)
        if a_dir:
            convert_and_retarget(dir_to_search + "\\" + file)

        if not found_spot:
            p = "\ "
            p = p.removesuffix(" ")
            if my_spot != dir_to_search + p + file:
                continue
            elif my_spot == dir_to_search + p + file:
                found_spot = True
                continue

        if file.endswith(".bvh"):

# -----> Auto-Rig Pro retargeting code. Comment out if you don't have Auto-Rig Pro or don't want to retarget.
            bpy.ops.wm.append(filepath=rig_target_source_path,
                              directory=rig_target_source_path,
                              filename=data_type)

            # Don't comment this out!
            bpy.ops.import_anim.bvh(filepath=dir_to_search + "\\" + file, filter_glob='*.bvh', target='ARMATURE',
                                    global_scale=1.0, frame_start=1, use_fps_scale=True, update_scene_fps=False,
                                    update_scene_duration=True, use_cyclic=False, rotate_mode='NATIVE',
                                    axis_forward='-Z', axis_up='Y')

# -----> Auto-Rig Pro retargeting code. Comment out if you don't have Auto-Rig Pro or don't want to retarget.
            bpy.context.scene.source_rig = file.removesuffix(".bvh")
            bpy.ops.arp.auto_scale()
            bpy.ops.arp.retarget(frame_start=1, frame_end=int(bpy.context.scene.frame_end), freeze_source='NO',
                                 freeze_target='NO', show_freeze_warn=False, fake_user_action=False,
                                 too_long_bones_names=False, force_source_freeze='NO')
            bpy.ops.object.delete(use_global=True, confirm=True)

            # You can uncomment this section to try to convert to glTF. I had problems with leftover data...
            # that made the files slowly get bigger with each conversion.
            # The problem is massively reduced now with the seperated run script, and the files really don't grow too fast.
            # If you're familiar with blender scripting, you can probably figure out how to fix this pretty fast.

            # bpy.ops.export_scene.gltf(filepath=dir_to_search + "\\" + file.removesuffix(".bvh"), check_existing=True,
            #                           export_format='GLB', ui_tab='GENERAL', export_copyright='',
            #                           export_image_format='AUTO', export_texture_dir='', export_keep_originals=False,
            #                           export_texcoords=True, export_normals=True,
            #                           export_draco_mesh_compression_enable=False, export_draco_mesh_compression_level=6,
            #                           export_draco_position_quantization=14, export_draco_normal_quantization=10,
            #                           export_draco_texcoord_quantization=12, export_draco_color_quantization=10,
            #                           export_draco_generic_quantization=12, export_tangents=False,
            #                           export_materials='EXPORT', export_original_specular=False, export_colors=True,
            #                           use_mesh_edges=False, use_mesh_vertices=False, export_cameras=False,
            #                           use_selection=False, use_visible=False, use_renderable=False,
            #                           use_active_collection=False, use_active_scene=False, export_extras=False,
            #                           export_yup=True, export_apply=False, export_animations=True,
            #                           export_frame_range=True, export_frame_step=1, export_force_sampling=True,
            #                           export_nla_strips=True, export_nla_strips_merged_animation_name='Animation',
            #                           export_def_bones=False, export_optimize_animation_size=False,
            #                           export_anim_single_armature=True, export_current_frame=False, export_skins=True,
            #                           export_all_influences=False, export_morph=True, export_morph_normal=True,
            #                           export_morph_tangent=False, export_lights=False, will_save_settings=False,
            #                           filter_glob='*.glb;*.gltf')

            bpy.ops.export_scene.fbx(filepath=dir_to_search + "\\" + file.removesuffix(".bvh") + ".fbx",
                                     check_existing=True, filter_glob='*.fbx', use_selection=False, use_visible=False,
                                     use_active_collection=False, global_scale=1.0, apply_unit_scale=True,
                                     apply_scale_options='FBX_SCALE_NONE', use_space_transform=True,  # FBX_SCALE_NONE
                                     bake_space_transform=False,
                                     object_types={'ARMATURE', 'CAMERA', 'EMPTY', 'LIGHT', 'MESH', 'OTHER'},
                                     use_mesh_modifiers=True, use_mesh_modifiers_render=True, mesh_smooth_type='OFF',
                                     use_subsurf=False, use_mesh_edges=False, use_tspace=False, use_triangles=False,
                                     use_custom_props=False, add_leaf_bones=False, primary_bone_axis='Y',
                                     secondary_bone_axis='X', use_armature_deform_only=False, armature_nodetype='NULL',
                                     bake_anim=True, bake_anim_use_all_bones=True, bake_anim_use_nla_strips=True,
                                     bake_anim_use_all_actions=True, bake_anim_force_startend_keying=False,
                                     bake_anim_step=1.0, bake_anim_simplify_factor=1.0, path_mode='AUTO',
                                     embed_textures=False, batch_mode='OFF', use_batch_own_dir=True, use_metadata=True,
                                     axis_forward='-Z', axis_up='Y')

            bpy.ops.object.select_all(action='SELECT')
            bpy.ops.object.delete(use_global=True, confirm=True)
            delete_lingering_data()
            bpy.ops.arp.clean_scene()
            # save spot
            open("spot.txt", "w").write(dir_to_search + "\\" + file)
            max_runs -= 1
            if max_runs <= 0:
                finished_runs = True
                bpy.ops.wm.quit_blender()
                return


convert_and_retarget(root_directory_to_search)
# if we made it this far and haven't finished the runs, we've run out of files to convert.
if not finished_runs:
    # Remove the spot file since we're more likely to restart from the beginning or a different directory than to continue
    os.remove("spot.txt")
    # This might seem like something you can just comment out, but the external script uses this to know when to stop.
    # If you did comment it out, nothing would catch fire, but you'd iterate through all folders and files...
    # beneath root_directory_to_search until max_runs is reached.
    print("Yo, I finished converting")

bpy.ops.wm.quit_blender()
