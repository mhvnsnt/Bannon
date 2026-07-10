# BANNON free model generator — run in Colab or Kaggle (free T4 GPU).
# Generates the non-canon roster from noncanon_character_prompts.json, rigs each
# into the 15 named nodes via bannon_blender_rig.py, uploads to Supabase, and marks
# the matching gen_jobs row succeeded — so the in-game 'self' provider picks it up.
# Cells are marked with `# %%` (paste into Colab cells, or run top-to-bottom).

# %% [1] install Hunyuan3D-2GP (the "GPU Poor" fork — fits a free T4)
# !git clone https://github.com/deepbeepmeep/Hunyuan3D-2GP
# %cd Hunyuan3D-2GP
# !pip install -q -r requirements.txt
# !pip install -q ./hy3dgen/texgen/custom_rasterizer ./hy3dgen/texgen/differentiable_renderer
# !pip install -q supabase requests
# !apt-get -qq install -y blender   # for the rig pass (or point BLENDER at your own build)

# %% [2] config — fill these in
import os, json, subprocess, tempfile, uuid, requests
SUPABASE_URL  = os.environ.get("SUPABASE_URL",  "https://YOURPROJECT.supabase.co")
SUPABASE_KEY  = os.environ.get("SUPABASE_KEY",  "SERVICE_ROLE_KEY")   # service_role (notebook-side only)
BUCKET        = "assets"
BLENDER       = os.environ.get("BLENDER", "blender")
RIG_SCRIPT    = os.environ.get("RIG_SCRIPT", "bannon_blender_rig.py")   # from your repo
PROMPTS_FILE  = os.environ.get("PROMPTS_FILE", "noncanon_character_prompts.json")
DECIMATE      = "0.6"   # 0 = keep full density; 0<x<1 = game-ready reduction

# %% [3] load the mini shape model (the one that fits a free T4)
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
from hy3dgen.texgen import Hunyuan3DPaintPipeline
shape = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained('tencent/Hunyuan3D-2mini')
paint = Hunyuan3DPaintPipeline.from_pretrained('tencent/Hunyuan3D-2mini')

# %% [4] helpers
from supabase import create_client
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_glb(local_path, key):
    dest = f"characters/{key.lower()}.glb"
    with open(local_path, "rb") as f:
        sb.storage.from_(BUCKET).upload(dest, f.read(), {"content-type": "model/gltf-binary", "upsert": "true"})
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{dest}"

def rig_pass(raw_glb, out_glb):
    subprocess.run([BLENDER, "--background", "--python", RIG_SCRIPT, "--",
                    raw_glb, out_glb, "--decimate", DECIMATE], check=True)

def generate(prompt, suffix):
    full = f"{prompt}, {suffix}"
    mesh = shape(prompt=full)[0]        # text-to-shape (image= also supported)
    mesh = paint(mesh, prompt=full)     # bake texture
    raw = tempfile.mktemp(suffix="_raw.glb"); mesh.export(raw)
    rigged = tempfile.mktemp(suffix="_rig.glb"); rig_pass(raw, rigged)
    return rigged

# %% [5] batch-run the non-canon roster
spec = json.load(open(PROMPTS_FILE))
suffix = spec["style_suffix"]
results = {}
for ch in spec["characters"]:
    key = ch["key"]
    print(f"=== generating {key} ===")
    try:
        rigged = generate(ch["prompt"], suffix)
        url = upload_glb(rigged, key)
        # mark any queued gen_jobs for this character succeeded (in-game 'self' provider path)
        try:
            sb.table("gen_jobs").update({"status": "succeeded", "progress": 100, "glb_url": url}) \
              .eq("character_key", key).eq("status", "queued").execute()
        except Exception as e:
            print("  (no gen_jobs row to update — fine for manual runs)", e)
        results[key] = url
        print("  ->", url)
    except Exception as e:
        print("  FAILED", key, e)

# %% [6] print the in-engine bindings — paste into the Bannon console, or they auto-load via ATTIRE/CHAR_MODEL
print("\n// --- paste in the Bannon browser console to bind (default attire = generated GLB) ---")
for key, url in results.items():
    print(f"assignCharModel('{key}', '{url}', '{key} (gen)');")
print("\n// 3js versions stay available as the alternate attire in the ATTIRE panel.")

# %% [7] OPTIONAL — Real-ESRGAN x4 texture upscale (Tripo/Meshy cap output size; you don't have to)
# !pip install -q realesrgan basicsr
# from realesrgan import RealESRGANer
# from basicsr.archs.rrdbnet_arch import RRDBNet
# import numpy as np, PIL.Image as Image
# _rr = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
# _up = RealESRGANer(scale=4, model_path='https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth', model=_rr, half=True)
# def upscale_atlas(png_path):
#     img = np.array(Image.open(png_path).convert('RGB'))
#     out, _ = _up.enhance(img, outscale=4)
#     Image.fromarray(out).save(png_path)
#     return png_path
# # call upscale_atlas() on the baked texture PNG before the mesh re-exports in generate().

# %% [8] 2D ASSET GEN — FLUX.1-schnell (Apache-2.0) for textures / tattoos / face-paints / logos / banners / titantrons / arena
# from diffusers import FluxPipeline; import torch
# flux = FluxPipeline.from_pretrained('black-forest-labs/FLUX.1-schnell', torch_dtype=torch.bfloat16).to('cuda')
# def gen_2d(prompt, w=1024, h=1024, steps=4):
#     img = flux(prompt, width=w, height=h, num_inference_steps=steps, guidance_scale=0.0).images[0]
#     return img   # PIL -> upload to Supabase assets/textures|logos|banners/...
# # wire this behind the daemon's /api/gen/image route so the Forge 2D tab (IMAGE_GEN_URL) calls it.

# %% [9] IMAGE->3D for wearables — clothing / masks / accessories / hair come from the SAME shape pipeline,
# just pass an item image instead of a character prompt:  shape(image=item_png)  then the Blender pass.
