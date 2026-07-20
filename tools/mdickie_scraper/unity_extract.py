#!/usr/bin/env python3
"""unity_extract.py — pull meshes + textures out of MDickie's UNITY games (Hard Time III jail,
Infinite Lives / Super City city) and emit GLBs the BANNON engine can load.

The newer MDickie 3D games are Unity, not the libGDX .zf3d of Wrestling Revolution 3D — so the
.zf3d decoder doesn't apply. Their assets live in .unity3d bundles under assets/bin/Data/. UnityPy
reads those; each Mesh exports to OBJ, and we assemble a GLB (POSITION/NORMAL/UV0) here, optionally
baking the mesh's diffuse Texture2D. Owner has MDickie's permission; outputs are proprietary bases
(re-textured / renamed toward the Bannon universe), never shipped as MDickie's IP.

    python3 tools/mdickie_scraper/unity_extract.py <bundle.unity3d> <out_dir> [--names Building,Road,Fence] [--limit N]

--names   comma-separated case-insensitive substrings; only matching meshes are exported (default: all)
--limit   cap number of meshes exported
Writes <out_dir>/<MeshName>.glb  and a manifest.json cataloging everything seen.
"""
import sys, os, json, struct, argparse, re
import UnityPy


def parse_obj(txt):
    """UnityPy Mesh.export() → OBJ text. Return (positions, normals, uvs, faces) as flat lists."""
    V, VN, VT, F = [], [], [], []
    for line in txt.splitlines():
        if line.startswith('v '):   V.append(tuple(map(float, line.split()[1:4])))
        elif line.startswith('vn '): VN.append(tuple(map(float, line.split()[1:4])))
        elif line.startswith('vt '): VT.append(tuple(map(float, line.split()[1:3])))
        elif line.startswith('f '):
            idx = []
            for tok in line.split()[1:]:
                p = tok.split('/')
                vi = int(p[0]); ti = int(p[1]) if len(p) > 1 and p[1] else 0; ni = int(p[2]) if len(p) > 2 and p[2] else 0
                idx.append((vi, ti, ni))
            for k in range(1, len(idx) - 1):      # triangulate fan
                F.append((idx[0], idx[k], idx[k + 1]))
    return V, VN, VT, F


def build_glb(V, VN, VT, F, out_path):
    """De-index the OBJ (per-corner attributes) into a non-indexed triangle GLB."""
    pos, nrm, uv = [], [], []
    for tri in F:
        for (vi, ti, ni) in tri:
            p = V[vi - 1] if 0 < vi <= len(V) else (0, 0, 0)
            pos += [p[0], p[1], p[2]]
            n = VN[ni - 1] if VN and 0 < ni <= len(VN) else (0, 1, 0)
            nrm += [n[0], n[1], n[2]]
            t = VT[ti - 1] if VT and 0 < ti <= len(VT) else (0, 0)
            uv += [t[0], t[1]]
    if not pos:
        return 0
    import array
    posb = array.array('f', pos).tobytes(); nrmb = array.array('f', nrm).tobytes(); uvb = array.array('f', uv).tobytes()
    def pad(b): return b + b'\x00' * ((4 - len(b) % 4) % 4)
    blob = b''; views = []; accs = []
    for arr, comps, typ, mn, mx in [
        (posb, 3, 'VEC3', [min(pos[0::3]), min(pos[1::3]), min(pos[2::3])], [max(pos[0::3]), max(pos[1::3]), max(pos[2::3])]),
        (nrmb, 3, 'VEC3', None, None), (uvb, 2, 'VEC2', None, None)]:
        off = len(blob); blob = pad(blob + arr)
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(arr), 'target': 34962})
        a = {'bufferView': len(views) - 1, 'componentType': 5126, 'count': len(pos) // 3, 'type': typ}
        if mn: a['min'] = mn; a['max'] = mx
        accs.append(a)
    gltf = {'asset': {'version': '2.0', 'generator': 'bannon-unity_extract'}, 'scene': 0,
            'scenes': [{'nodes': [0]}], 'nodes': [{'name': os.path.basename(out_path)[:-4], 'mesh': 0}],
            'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2},
                        'material': 0, 'mode': 4}]}],
            'materials': [{'pbrMetallicRoughness': {'baseColorFactor': [0.8, 0.8, 0.8, 1], 'metallicFactor': 0, 'roughnessFactor': 0.9}, 'doubleSided': True}],
            'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
    js = json.dumps(gltf).encode(); js = js + b' ' * ((4 - len(js) % 4) % 4)
    with open(out_path, 'wb') as f:
        f.write(b'glTF'); f.write(struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(blob)))
        f.write(struct.pack('<I', len(js))); f.write(b'JSON'); f.write(js)
        f.write(struct.pack('<I', len(blob))); f.write(b'BIN\x00'); f.write(blob)
    return len(pos) // 9


def build_glb_tex(V, VN, VT, F, out_path, png_bytes):
    """Same de-index as build_glb, but bake a base-color texture (PNG bytes) into the GLB."""
    pos, nrm, uv = [], [], []
    for tri in F:
        for (vi, ti, ni) in tri:
            p = V[vi - 1] if 0 < vi <= len(V) else (0, 0, 0); pos += [p[0], p[1], p[2]]
            n = VN[ni - 1] if VN and 0 < ni <= len(VN) else (0, 1, 0); nrm += [n[0], n[1], n[2]]
            t = VT[ti - 1] if VT and 0 < ti <= len(VT) else (0, 0); uv += [t[0], t[1]]
    if not pos:
        return 0
    import array, struct as _st
    def pad(b): return b + b'\x00' * ((4 - len(b) % 4) % 4)
    blob = b''; views = []; accs = []
    for arr_f, comps, typ, mn, mx in [
        (pos, 3, 'VEC3', [min(pos[0::3]), min(pos[1::3]), min(pos[2::3])], [max(pos[0::3]), max(pos[1::3]), max(pos[2::3])]),
        (nrm, 3, 'VEC3', None, None), (uv, 2, 'VEC2', None, None)]:
        arr = array.array('f', arr_f).tobytes(); off = len(blob); blob = pad(blob + arr)
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(arr), 'target': 34962})
        acc = {'bufferView': len(views) - 1, 'componentType': 5126, 'count': len(pos) // 3, 'type': typ}
        if mn: acc['min'] = mn; acc['max'] = mx
        accs.append(acc)
    imgView = None
    if png_bytes:
        off = len(blob); blob = pad(blob + png_bytes)
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(png_bytes)}); imgView = len(views) - 1
    mat = {'pbrMetallicRoughness': {'metallicFactor': 0, 'roughnessFactor': 0.9}, 'doubleSided': True}
    gltf = {'asset': {'version': '2.0', 'generator': 'bannon-unity_extract'}, 'scene': 0, 'scenes': [{'nodes': [0]}],
            'nodes': [{'name': os.path.basename(out_path)[:-4], 'mesh': 0}],
            'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}, 'material': 0, 'mode': 4}]}],
            'materials': [mat], 'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
    if imgView is not None:
        gltf['images'] = [{'bufferView': imgView, 'mimeType': 'image/png'}]
        gltf['samplers'] = [{'wrapS': 10497, 'wrapT': 10497}]
        gltf['textures'] = [{'source': 0, 'sampler': 0}]
        mat['pbrMetallicRoughness']['baseColorTexture'] = {'index': 0}
    else:
        mat['pbrMetallicRoughness']['baseColorFactor'] = [0.8, 0.8, 0.8, 1]
    js = json.dumps(gltf).encode(); js = js + b' ' * ((4 - len(js) % 4) % 4)
    with open(out_path, 'wb') as f:
        f.write(b'glTF'); f.write(_st.pack('<II', 2, 12 + 8 + len(js) + 8 + len(blob)))
        f.write(_st.pack('<I', len(js))); f.write(b'JSON'); f.write(js)
        f.write(_st.pack('<I', len(blob))); f.write(b'BIN\x00'); f.write(blob)
    return len(pos) // 9


def export_gameobjects(env, out, filt, limit):
    """Textured export: walk GameObjects with MeshFilter+MeshRenderer, bake each mesh's main texture."""
    import io
    manifest = {'exported': [], 'skipped': 0}; n = 0; seen = {}
    for o in env.objects:
        if o.type.name != 'GameObject':
            continue
        try:
            go = o.read(); nm = go.m_Name or 'go'
        except Exception:
            continue
        low = nm.lower()
        if filt and not any(k in low for k in filt):
            continue
        mf = mr = None
        try:
            for c in go.m_Component:
                cp = c.component if hasattr(c, 'component') else c
                try: cc = cp.read()
                except Exception: continue
                tn = cc.__class__.__name__
                if 'MeshFilter' in tn: mf = cc
                elif 'MeshRenderer' in tn: mr = cc
        except Exception:
            continue
        if not (mf and mr and getattr(mf, 'm_Mesh', None)):
            continue
        try:
            mesh = mf.m_Mesh.read()
        except Exception:
            manifest['skipped'] += 1; continue
        png = None
        try:
            mats = getattr(mr, 'm_Materials', [])
            if mats:
                mat = mats[0].read(); tex = None
                envs = mat.m_SavedProperties.m_TexEnvs
                for k, v in envs:
                    if k in ('_MainTex', '_BaseMap', '_BaseColorMap') and v.m_Texture:
                        try: tex = v.m_Texture.read(); break
                        except Exception: pass
                if tex is None:
                    for k, v in envs:
                        if v.m_Texture:
                            try: tex = v.m_Texture.read(); break
                            except Exception: pass
                if tex is not None:
                    img = tex.image
                    if img is not None:
                        if max(img.size) > 512:
                            img = img.resize((min(512, img.size[0]), min(512, img.size[1])))
                        buf = io.BytesIO(); img.convert('RGB').save(buf, 'PNG'); png = buf.getvalue()
        except Exception:
            png = None
        safe = re.sub(r'[^A-Za-z0-9_.-]', '_', nm); seen[safe] = seen.get(safe, 0) + 1
        fn = safe if seen[safe] == 1 else f'{safe}_{seen[safe]}'
        try:
            V, VN, VT, F = parse_obj(mesh.export())
            tris = build_glb_tex(V, VN, VT, F, os.path.join(out, fn + '.glb'), png)
            if tris:
                manifest['exported'].append({'go': nm, 'file': fn + '.glb', 'tris': tris, 'textured': png is not None})
                n += 1
        except Exception:
            manifest['skipped'] += 1
        if limit and n >= limit:
            break
    return manifest, n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('bundle'); ap.add_argument('out')
    ap.add_argument('--names', default=''); ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--go', action='store_true', help='textured GameObject export (mesh + baked main texture)')
    a = ap.parse_args()
    if a.go:
        os.makedirs(a.out, exist_ok=True)
        env = UnityPy.load(a.bundle)
        filt = [s.strip().lower() for s in a.names.split(',') if s.strip()]
        manifest, n = export_gameobjects(env, a.out, filt, a.limit)
        manifest['bundle'] = os.path.basename(a.bundle)
        json.dump(manifest, open(os.path.join(a.out, 'manifest.json'), 'w'), indent=1)
        print(f"exported {n} textured GameObjects -> {a.out} (skipped {manifest['skipped']})")
        return
    os.makedirs(a.out, exist_ok=True)
    filt = [s.strip().lower() for s in a.names.split(',') if s.strip()]
    env = UnityPy.load(a.bundle)
    manifest = {'bundle': os.path.basename(a.bundle), 'exported': [], 'skipped': 0}
    n = 0; seen = {}
    for o in env.objects:
        if o.type.name != 'Mesh':
            continue
        try:
            d = o.read(); nm = getattr(d, 'm_Name', '') or 'mesh'
        except Exception:
            continue
        low = nm.lower()
        if filt and not any(k in low for k in filt):
            manifest['skipped'] += 1; continue
        safe = re.sub(r'[^A-Za-z0-9_.-]', '_', nm)
        seen[safe] = seen.get(safe, 0) + 1
        fn = safe if seen[safe] == 1 else f'{safe}_{seen[safe]}'
        try:
            V, VN, VT, F = parse_obj(d.export())
            tris = build_glb(V, VN, VT, F, os.path.join(a.out, fn + '.glb'))
            if tris:
                manifest['exported'].append({'name': nm, 'file': fn + '.glb', 'tris': tris})
                n += 1
        except Exception as e:
            manifest['skipped'] += 1
        if a.limit and n >= a.limit:
            break
    with open(os.path.join(a.out, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1)
    print(f"exported {n} meshes -> {a.out} (skipped {manifest['skipped']})")


if __name__ == '__main__':
    main()
