# Build Your Own Tripo3D — Full Blueprint (verified July 2026)

## 1. How Tripo3D (and every serious open competitor) actually works
Three stages, learned end-to-end. Same shape whether it's Tripo3D, TRELLIS, or Hunyuan3D:
1. **Multi-view diffusion** — from your one input image, a diffusion model hallucinates 4–8 other consistent angles.
2. **3D reconstruction** — those views get lifted into an actual 3D representation. (TRELLIS' "SLAT" or Hunyuan3D).
3. **Mesh extraction + texture baking** — the implicit 3D field gets converted to an actual triangle mesh (marching-cubes/FlexiCubes family), UV-unwrapped, and the learned appearance gets baked into a diffuse or full PBR texture map.

## 2. Current state of the art, checked today
- **TRELLIS-2** (Microsoft Research) — currently the best free, open-source option on raw quality.
- **Hunyuan3D-2.1** (Tencent) — fully open weights + training code, adds real PBR texture output.

## 3. The hardware wall
| Model | Official VRAM need | Fits a free 16GB T4? |
|---|---|---|
| TRELLIS-2 | ≥24GB, verified on A100/H100 | ❌ No |
| TRELLIS (v1) | ≥16GB official; some users report 12GB with manual patches | ⚠️ Marginal, fiddly, frequent OOM reports |
| Hunyuan3D-2.1, full PBR pipeline | ~29GB (10GB shape + 21GB texture) | ❌ No |
| **Hunyuan3D-2.0-mini via the "GP" low-VRAM fork** | **3GB shape / 6GB texture** | **✅ Yes, comfortably** |

## 4. Path A — zero setup, works from your phone right now
1. Open Tencent's official **Hunyuan3D Studio** site, or search `TRELLIS` on huggingface.co/spaces.
2. Upload a clean, front-facing reference image on a plain background.
3. Wait for the shared public queue.
4. Download the `.glb`.

## 5. Path B — your own unlimited instance (the actual "no token limit" answer)
- **Kaggle Notebooks** — 30 GPU-hours/week *guaranteed*, T4 or P100 (16GB VRAM), ~9–12hr sessions.
- **Google Colab free tier** — T4 (16GB VRAM), dynamic ~15–30 GPU-hours/week, up to 12hr sessions.

### Setup — paste into a notebook cell
```bash
!git clone https://github.com/deepbeepmeep/Hunyuan3D-2GP.git
%cd Hunyuan3D-2GP
!pip install -r requirements.txt
!pip install -e .
%cd hy3dgen/texgen/custom_rasterizer
!python setup.py install
%cd ../../differentiable_renderer
!python setup.py install
%cd /content/Hunyuan3D-2GP
```

### Generate a character mesh (shape only, fastest path)
```python
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline

pipeline = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
    'tencent/Hunyuan3D-2mini',
    subfolder='hunyuan3d-dit-v2-mini',
)
mesh = pipeline(image='your_character_ref.png')[0]
mesh.export('output.glb')
```

## 6. Closing the loop back into your existing pipeline
1. Run it through the chunking script (GORO_RIG seed-point formula).
2. Verify attachment against the real GORO_RIG math (not an approximation of it).
3. Scale to 1.88m.
4. Register it as a new entry in `ATTIRE_LIBRARY` for the relevant character.

---

# Your Own Tripo3D — Full Pipeline (verified July 2026)
### Characters, objects, and environments — wired into Railway + Supabase/Firebase

## The architecture
```
[Colab/Kaggle notebook, free GPU]
   → runs the matching model below
   → pushes .glb to Supabase/Firebase Storage
        → [Railway app reads it]
             → GORO_RIG chunking script
             → ATTIRE_LIBRARY registration
```

## Push the result straight to Supabase or Firebase

Supabase:
```python
from supabase import create_client

url = "https://YOUR_PROJECT.supabase.co"
key = "YOUR_SERVICE_ROLE_KEY"
supabase = create_client(url, key)

with open("output.glb", "rb") as f:
    supabase.storage.from_("assets").upload("characters/maime_v5.glb", f)
```

Firebase:
```python
import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {'storageBucket': 'your-project.appspot.com'})
bucket = storage.bucket()
blob = bucket.blob('characters/maime_v5.glb')
blob.upload_from_filename('output.glb')
```

Your Railway app then just fetches the public URL from Supabase/Firebase and feeds it into the existing GORO_RIG chunking pipeline.
