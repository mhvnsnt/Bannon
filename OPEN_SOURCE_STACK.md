# BANNON — Open-Source Creation Stack (Tripo3D + WWE2K-suite parity, free)

Researched + wired. Everything below is free and runs on your own GPU (Colab/Kaggle) or daemon (Ollama).

## AI-assist brain (prompt expansion, creation intelligence, God Mode OS)
- **Qwen abliterated (GGUF)** via Ollama. Picks: `DavidAU/Qwen3-8B-Hivemind-Instruct-Heretic-Abliterated-Uncensored-NEO-Imatrix-GGUF` (8B, modest VRAM) or `Youssofal/Qwen3.6-27B-Abliterated-Heretic-Uncensored-GGUF` (27B, if you have headroom).
- Wire: daemon route `POST /api/ai/expand {prompt} -> {text}` hitting Ollama. Forge "AI-ASSIST" button calls it (set `window.AI_ASSIST_URL`).

## 3D — characters, clothing, masks, accessories, hair
- **Hunyuan3D-2GP** (`deepbeepmeep/Hunyuan3D-2GP`), mini shape model on a free T4. Text OR image input.
- **Blender pass** (`bannon_blender_rig.py`): clean -> split into the 15 named rig nodes -> `--skin` builds a 15-bone armature + automatic weights (real skinned rig). Beats Tripo's flat mesh.

## 2D — textures, tattoos, face-paints, logos, banners, titantrons, aprons, arena, character logos
- **FLUX.1-schnell** (Apache-2.0) or **SDXL** for text->image; **ControlNet** for guided (logos on gear, tattoos on UV).
- Notebook cell [8]; wire behind daemon `POST /api/gen/image` -> Forge 2D tab (`window.IMAGE_GEN_URL`).

## Video — cutscenes, entrances, titantron motion, movies (next)
- **Wan2.x** / **LTX-Video** (open). Heavier VRAM; batch tool. Roadmap, not yet wired.

## Enhancement
- **Real-ESRGAN** x4 texture upscale (notebook cell [7]) — the lever Tripo/Meshy cap. **GFPGAN** for face detail (optional).

## Morphs / body detail (past WWE2K creator)
- Face + body morphs: procedural slider morph on the rig (`_cj`/tube radii + joint offsets) + GLB blendshapes.
- Body hair / eyes / teeth: small mesh parts + shader layers; tattoos/paints as decal textures on the UV (from the 2D pipeline).

## Contract (already in the engine/daemon — no rewrite)
`generateCharacterModel(prompt,{image,images,category,characterId})` -> daemon `self` provider (`OWN_GEN_URL`) -> `gen_selfhosted_server.mjs` -> Supabase `gen_jobs` -> notebook fills it -> `loadFighterModel`. Forge = viewer + library + text/image gen + local import (single/batch).
