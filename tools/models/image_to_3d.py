#!/usr/bin/env python3
"""image_to_3d.py — OUR OWN MODEL GENERATOR. No Tripo credits, no API key, no queue.

    python3 tools/models/image_to_3d.py ref.png --name KAGE
    python3 tools/models/image_to_3d.py ref.png --out /tmp/x.glb --resolution 256

OWNER: "We would have more models if u had got a good tripo 3d alternative working."

The alternative is TripoSR, and the joke is that it IS Tripo — Stability AI built it WITH Tripo AI
and released the weights MIT (stabilityai/TripoSR, 167k downloads). Single image in, textured mesh
out, and the paper's own claim is that it runs without a GPU. This container has no GPU, so that
claim is the whole reason it is the right pick over TRELLIS / Hunyuan3D / InstantMesh, which are
better models and all need CUDA.

FOUR THINGS HAD TO BE WORKED AROUND, all measured, none guessed:

1. `torchmcubes` is a compiled CUDA extension with no wheel for a GPU-less box. Shimmed with
   PyMCubes (same algorithm, prebuilt). THE SHIM MUST FLIP THE AXES — torchmcubes returns verts as
   (x,y,z), PyMCubes as (z,y,x), and passing them through unflipped gives a mesh that looks
   completely plausible and is MIRRORED. See scratch torchmcubes.py; that flip is its whole point.

2. `rembg` (background removal) drags in a torchvision built against a different torch and dies on
   import with "operator torchvision::nms does not exist" — and TripoSR's own run.py imports rembg
   at module scope, so the entire script was unusable for a reason that has nothing to do with the
   model. This runner imports TSR directly and never touches rembg. Background removal is done here
   with a flood fill from the border, which is what you want for a reference photo on a plain
   backdrop anyway and costs nothing.

3. TripoSR emits a mesh with NO SKELETON. That is fine, because this repo already solved rigging:
   tools/model_diag/transfer_weights.cjs copies a proven 58-joint rig onto an unrigged body by
   spatial correspondence, and it is what fixed the Heavyweight (p95 0.3131 FAIL -> 0.0284 PASS).
   So the pipeline is  image -> TripoSR -> transfer_weights -> skinqa -> decimate -> wired.

4. It is SLOW on CPU and that is expected. Time it, do not babysit it. --resolution trades mesh
   detail against minutes; 256 is the default and 320 is noticeably finer.
"""
import argparse, os, sys, time
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
# the TripoSR checkout — cloned by tools/models/setup_image_to_3d.sh
TSR_DIR = os.environ.get('TRIPOSR_DIR') or os.path.join(ROOT, '.cache', 'triposr')


def cutout(img, tol=28):
    """Flood-fill the background from the border and write it into the alpha channel.

    rembg would do this better on a busy photo, but rembg cannot be imported here (see 2 above) and
    a reference render or a photo on a plain backdrop does not need a neural matte. Sampling the
    four corners rather than assuming white means a black or green backdrop works too.
    """
    im = img.convert('RGB')
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    corners = np.array([a[0, 0], a[0, w-1], a[h-1, 0], a[h-1, w-1]], dtype=np.int16)
    bg = np.median(corners, axis=0)
    close = (np.abs(a - bg).sum(axis=2) < tol)

    # only background CONNECTED TO THE BORDER is removed — a white shirt in the middle of the frame
    # is not background, and a plain colour test would erase it.
    keep = np.zeros((h, w), bool)
    stack = [(0, x) for x in range(w)] + [(h-1, x) for x in range(w)] + \
            [(y, 0) for y in range(h)] + [(y, w-1) for y in range(h)]
    seen = np.zeros((h, w), bool)
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x] or not close[y, x]:
            continue
        seen[y, x] = True
        keep[y, x] = True
        stack.extend(((y+1, x), (y-1, x), (y, x+1), (y, x-1)))

    alpha = np.where(keep, 0, 255).astype(np.uint8)
    out = np.dstack([np.asarray(im), alpha])
    return Image.fromarray(out, 'RGBA'), float((alpha == 0).mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('--out')
    ap.add_argument('--name', help='bank as assets/models/incoming/<NAME>.glb')
    ap.add_argument('--resolution', type=int, default=256, help='marching-cubes grid; 320 is finer and slower')
    ap.add_argument('--threshold', type=float, default=25.0)
    ap.add_argument('--no-cutout', action='store_true', help='image already has a clean alpha channel')
    ap.add_argument('--no-orient-check', action='store_true', help='skip the upright sanity note')
    a = ap.parse_args()

    if not os.path.isdir(TSR_DIR):
        sys.exit('TripoSR is not installed. Run: bash tools/models/setup_image_to_3d.sh')
    sys.path.insert(0, TSR_DIR)

    out = a.out or (os.path.join(ROOT, 'assets', 'models', 'incoming', (a.name or 'GENERATED') + '.glb')
                    if a.name else '/tmp/generated.glb')
    os.makedirs(os.path.dirname(out), exist_ok=True)

    # STUB rembg BEFORE importing anything from tsr — tsr.utils imports it at module scope, and
    # rembg drags in a torchvision built against a different torch that dies on
    # "operator torchvision::nms does not exist". Nothing here calls it: the cutout above replaces
    # it. Same trick this repo already uses for CLIP's torchvision import under MoMask.
    import types
    if 'rembg' not in sys.modules:
        stub = types.ModuleType('rembg')
        stub.remove = lambda *a, **k: (_ for _ in ()).throw(
            RuntimeError('rembg is stubbed here — pass --no-cutout with an RGBA image, or let the '
                         'built-in border flood fill do it'))
        stub.new_session = lambda *a, **k: None
        sys.modules['rembg'] = stub

    from tsr.system import TSR
    from tsr.utils import resize_foreground

    img = Image.open(a.image)
    if a.no_cutout:
        img = img.convert('RGBA')
        cut = None
    else:
        img, cut = cutout(img)
        print('  background removed: %.0f%% of the frame' % (100 * cut))
        if cut < 0.02:
            print('  WARNING: almost nothing was removed. If the subject is not on a plain backdrop,'
                  '\n           cut it out first — TripoSR reconstructs whatever fills the frame.')
    img = resize_foreground(img, 0.85)
    arr = np.array(img).astype(np.float32) / 255.0
    arr = arr[:, :, :3] * arr[:, :, 3:4] + 0.5 * (1 - arr[:, :, 3:4])    # composite on grey
    img = Image.fromarray((arr * 255.0).astype(np.uint8))

    t0 = time.time()
    print('  loading TripoSR (1.6 GB, CPU)…')
    model = TSR.from_pretrained('stabilityai/TripoSR', config_name='config.yaml', weight_name='model.ckpt')
    model.renderer.set_chunk_size(8192)
    model.to('cpu')
    print('  loaded in %.0fs — reconstructing…' % (time.time() - t0))

    t1 = time.time()
    with __import__('torch').no_grad():
        codes = model([img], device='cpu')
    meshes = model.extract_mesh(codes, True, resolution=a.resolution, threshold=a.threshold)
    m = meshes[0]

    # ── ORIENT IT. TripoSR's mesh comes out Z-UP; glTF and this engine are Y-UP. ────────────────
    # CAUGHT BY RENDERING IT, not by reading a spec: the first chair reconstructed perfectly and
    # its bounding box was x 0.58, y 0.56, z 1.01 — the height was on Z, so it was lying on its
    # back. A wrestler would arrive face-down, the engine's fit-to-1.78m would size him by his
    # DEPTH, and every downstream tool would inherit it. Numbers alone would never have said so:
    # vertex count, face count and file size were all perfect.
    import trimesh as _tm
    m.apply_transform(_tm.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
    ext = m.bounds[1] - m.bounds[0]
    if not a.no_orient_check and ext[1] < max(ext[0], ext[2]) * 0.9:
        print('  NOTE: after the Z-up->Y-up rotation the tallest axis is still not Y '
              '(%.2f x %.2f x %.2f). That is fine for a wide prop; for a standing figure it means '
              'the input was not a straight-on shot.' % tuple(ext))
    m.export(out)
    print('  %s' % out)
    print('  %d vertices, %d faces, %.1f MB, %.0fs' %
          (len(m.vertices), len(m.faces), os.path.getsize(out) / 1048576, time.time() - t1))
    print('\n  NEXT — it has no skeleton yet, and this repo already solves that:')
    print('    node tools/model_diag/transfer_weights.cjs assets/models/VIPER.glb ' + out)
    print('    node tools/model_diag/skinqa.cjs <result>.glb          # promote on the number')
    print('    node tools/assets/decimate_rigs.cjs <result>.glb --gate')


if __name__ == '__main__':
    main()
