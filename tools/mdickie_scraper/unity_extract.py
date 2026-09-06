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


def _mat_trs(pos, quat, scl):
    x, y, z, w = quat; xx, yy, zz = x + x, y + y, z + z
    wx, wy, wz = w * xx, w * yy, w * zz; xxv, xy, xz = x * xx, x * yy, x * zz
    yyv, yz, zzv = y * yy, y * zz, z * zz
    r = [[1 - (yyv + zzv), xy - wz, xz + wy], [xy + wz, 1 - (xxv + zzv), yz - wx], [xz - wy, yz + wx, 1 - (xxv + yyv)]]
    sx, sy, sz = scl
    return [[r[0][0]*sx, r[0][1]*sy, r[0][2]*sz, pos[0]],
            [r[1][0]*sx, r[1][1]*sy, r[1][2]*sz, pos[1]],
            [r[2][0]*sx, r[2][1]*sy, r[2][2]*sz, pos[2]], [0, 0, 0, 1]]

def _mat_mul(a, b):
    return [[sum(a[i][k]*b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]

def _mat_apply(m, v):
    return [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2]+m[0][3],
            m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2]+m[1][3],
            m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]+m[2][3]]

def export_merged(env, out, target, limit):
    """--merge NAME: export a whole GameObject subtree (car = body + wheels + glass) baked into ONE GLB,
    each child mesh transformed into the root's local space. This is how vehicles come out whole."""
    import io, re as _re
    # index transforms + gameobjects
    def transform_of(go):
        for c in go.m_Component:
            cp = c.component if hasattr(c, 'component') else c
            try:
                cc = cp.read()
                if 'Transform' in cc.__class__.__name__ and 'Rect' not in cc.__class__.__name__:
                    return cc
            except Exception:
                pass
        return None
    roots = []
    for o in env.objects:
        if o.type.name != 'GameObject':
            continue
        try:
            go = o.read()
            if target.lower() in (go.m_Name or '').lower():
                t = transform_of(go)
                if t:
                    roots.append((go.m_Name, t))
        except Exception:
            pass
    manifest = {'merged': []}; n = 0
    for name, root_t in roots:
        prims = []  # (positions[], normals[], uvs[], png)
        def walk(t, parent_m):
            try:
                lp = t.m_LocalPosition; lr = t.m_LocalRotation; ls = t.m_LocalScale
                local = _mat_trs((lp.x, lp.y, lp.z), (lr.x, lr.y, lr.z, lr.w), (ls.x, ls.y, ls.z))
                world = _mat_mul(parent_m, local)
                go = t.m_GameObject.read()
                mf = mr = None
                for c in go.m_Component:
                    cp = c.component if hasattr(c, 'component') else c
                    try: cc = cp.read()
                    except Exception: continue
                    tn = cc.__class__.__name__
                    if 'MeshFilter' in tn: mf = cc
                    elif 'MeshRenderer' in tn: mr = cc
                if mf and getattr(mf, 'm_Mesh', None):
                    try:
                        mesh = mf.m_Mesh.read(); V, VN, VT, F = parse_obj(mesh.export())
                        png = None
                        if mr:
                            try:
                                mats = getattr(mr, 'm_Materials', [])
                                if mats:
                                    mat = mats[0].read()
                                    for k, v in mat.m_SavedProperties.m_TexEnvs:
                                        if v.m_Texture:
                                            tex = v.m_Texture.read(); img = tex.image
                                            if img:
                                                if max(img.size) > 512: img = img.resize((min(512, img.size[0]), min(512, img.size[1])))
                                                buf = io.BytesIO(); img.convert('RGB').save(buf, 'PNG'); png = buf.getvalue()
                                            break
                            except Exception: png = None
                        # bake world transform into positions
                        pos = []
                        for tri in F:
                            for (vi, ti, ni) in tri:
                                p = V[vi-1] if 0 < vi <= len(V) else (0, 0, 0)
                                wv = _mat_apply(world, [p[0], p[1], p[2]]); pos += wv
                                nn = VN[ni-1] if VN and 0 < ni <= len(VN) else (0, 1, 0)
                                # normal: rotate only (approx with world 3x3)
                                nx = world[0][0]*nn[0]+world[0][1]*nn[1]+world[0][2]*nn[2]
                                ny = world[1][0]*nn[0]+world[1][1]*nn[1]+world[1][2]*nn[2]
                                nz = world[2][0]*nn[0]+world[2][1]*nn[1]+world[2][2]*nn[2]
                                nl = (nx*nx+ny*ny+nz*nz) ** 0.5 or 1
                                t2 = VT[ti-1] if VT and 0 < ti <= len(VT) else (0, 0)
                                prims.append((wv, [nx/nl, ny/nl, nz/nl], [t2[0], t2[1]], png))
                    except Exception: pass
                for ch in (t.m_Children or []):
                    try: walk(ch.read(), world)
                    except Exception: pass
            except Exception: pass
        ident = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
        walk(root_t, ident)
        if not prims:
            continue
        # group by png, build one GLB per car with multiple primitives sharing textures
        safe = _re.sub(r'[^A-Za-z0-9_.-]', '_', name)
        by_tex = {}
        for (v, nrm, uv, png) in prims:
            key = id(png) if png else 0
            by_tex.setdefault(key, {'png': png, 'pos': [], 'nrm': [], 'uv': []})
            g = by_tex[key]; g['pos'] += v; g['nrm'] += nrm; g['uv'] += uv
        # write via the shared multi-prim writer
        write_multi_glb(list(by_tex.values()), os.path.join(out, safe + '.glb'))
        manifest['merged'].append({'name': name, 'file': safe + '.glb', 'prims': len(by_tex),
                                   'tris': sum(len(g['pos']) // 9 for g in by_tex.values())})
        n += 1
        if limit and n >= limit:
            break
    json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)
    print(f"merged {n} GameObject subtrees -> {out}")


def _collect_subtree(root_t, parse_obj_fn):
    """Walk a Transform subtree, bake child transforms into world space, group prims by texture."""
    import io
    groups = {}
    def walk(t, parent_m):
        try:
            lp = t.m_LocalPosition; lr = t.m_LocalRotation; ls = t.m_LocalScale
            local = _mat_trs((lp.x, lp.y, lp.z), (lr.x, lr.y, lr.z, lr.w), (ls.x, ls.y, ls.z))
            world = _mat_mul(parent_m, local)
            go = t.m_GameObject.read(); mf = mr = None
            for c in go.m_Component:
                cp = c.component if hasattr(c, 'component') else c
                try: cc = cp.read()
                except Exception: continue
                tn = cc.__class__.__name__
                if 'MeshFilter' in tn: mf = cc
                elif 'MeshRenderer' in tn: mr = cc
            if mf and getattr(mf, 'm_Mesh', None):
                try:
                    mesh = mf.m_Mesh.read(); V, VN, VT, F = parse_obj_fn(mesh.export())
                    png = None
                    if mr:
                        try:
                            mats = getattr(mr, 'm_Materials', [])
                            if mats:
                                mat = mats[0].read()
                                for k, v in mat.m_SavedProperties.m_TexEnvs:
                                    if v.m_Texture:
                                        tex = v.m_Texture.read(); img = tex.image
                                        if img:
                                            if max(img.size) > 512: img = img.resize((min(512, img.size[0]), min(512, img.size[1])))
                                            buf = io.BytesIO(); img.convert('RGB').save(buf, 'PNG'); png = buf.getvalue()
                                        break
                        except Exception: png = None
                    key = id(png) if png else 0
                    g = groups.setdefault(key, {'png': png, 'pos': [], 'nrm': [], 'uv': []})
                    for tri in F:
                        for (vi, ti, ni) in tri:
                            p = V[vi-1] if 0 < vi <= len(V) else (0, 0, 0); wv = _mat_apply(world, [p[0], p[1], p[2]]); g['pos'] += wv
                            nn = VN[ni-1] if VN and 0 < ni <= len(VN) else (0, 1, 0)
                            nx = world[0][0]*nn[0]+world[0][1]*nn[1]+world[0][2]*nn[2]; ny = world[1][0]*nn[0]+world[1][1]*nn[1]+world[1][2]*nn[2]; nz = world[2][0]*nn[0]+world[2][1]*nn[1]+world[2][2]*nn[2]
                            nl = (nx*nx+ny*ny+nz*nz) ** 0.5 or 1; g['nrm'] += [nx/nl, ny/nl, nz/nl]
                            t2 = VT[ti-1] if VT and 0 < ti <= len(VT) else (0, 0); g['uv'] += [t2[0], t2[1]]
                except Exception: pass
            for ch in (t.m_Children or []):
                try: walk(ch.read(), world)
                except Exception: pass
        except Exception: pass
    ident = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    walk(root_t, ident)
    return list(groups.values())


def export_all_roots(env, out, min_tris, limit):
    """Export EVERY top-level (parent-less) GameObject subtree as its own GLB — all locations at once."""
    import re as _re
    def transform_of(go):
        for c in go.m_Component:
            cp = c.component if hasattr(c, 'component') else c
            try:
                cc = cp.read()
                if 'Transform' in cc.__class__.__name__ and 'Rect' not in cc.__class__.__name__: return cc
            except Exception: pass
        return None
    roots = []
    for o in env.objects:
        if o.type.name != 'GameObject': continue
        try:
            go = o.read(); t = transform_of(go)
            if not t: continue
            father = getattr(t, 'm_Father', None)
            has_parent = False
            try: has_parent = bool(father) and getattr(father, 'path_id', 0) != 0
            except Exception: has_parent = False
            if not has_parent: roots.append((go.m_Name or 'root', t))
        except Exception: pass
    manifest = {'roots': []}; n = 0; seen = {}
    for name, rt in roots:
        try: groups = _collect_subtree(rt, parse_obj)
        except Exception: continue
        tris = sum(len(g['pos']) // 9 for g in groups)
        if tris < min_tris: continue
        safe = _re.sub(r'[^A-Za-z0-9_.-]', '_', name)[:48] or 'root'; seen[safe] = seen.get(safe, 0) + 1
        fn = safe if seen[safe] == 1 else f'{safe}_{seen[safe]}'
        try:
            write_multi_glb(groups, os.path.join(out, fn + '.glb'))
            manifest['roots'].append({'name': name, 'file': fn + '.glb', 'tris': tris}); n += 1
        except Exception: pass
        if limit and n >= limit: break
    manifest['count'] = n
    json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)
    print(f"exported {n} root subtrees (>= {min_tris} tris) -> {out}")


def write_multi_glb(groups, out_path):
    """groups: [{png, pos[], nrm[], uv[]}] -> one GLB, a primitive per group, each with its texture."""
    import array, struct as _st, json as _json
    blob = b''; views = []; accs = []; images = []; textures = []; materials = []; prims = []
    def pad(b): return b + b'\x00' * ((4 - len(b) % 4) % 4)
    for g in groups:
        pos, nrm, uv = g['pos'], g['nrm'], g['uv']
        if not pos: continue
        mn = [min(pos[0::3]), min(pos[1::3]), min(pos[2::3])]; mx = [max(pos[0::3]), max(pos[1::3]), max(pos[2::3])]
        base = len(accs)
        for arr_f, comps, typ, lo, hi in [(pos, 3, 'VEC3', mn, mx), (nrm, 3, 'VEC3', None, None), (uv, 2, 'VEC2', None, None)]:
            arr = array.array('f', arr_f).tobytes(); off = len(blob); blob = pad(blob + arr)
            views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(arr), 'target': 34962})
            acc = {'bufferView': len(views)-1, 'componentType': 5126, 'count': len(pos)//3, 'type': typ}
            if lo: acc['min'] = lo; acc['max'] = hi
            accs.append(acc)
        mat = {'pbrMetallicRoughness': {'metallicFactor': 0.1, 'roughnessFactor': 0.7}, 'doubleSided': True}
        if g['png']:
            off = len(blob); blob = pad(blob + g['png']); views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(g['png'])})
            images.append({'bufferView': len(views)-1, 'mimeType': 'image/png'})
            textures.append({'source': len(images)-1, 'sampler': 0})
            mat['pbrMetallicRoughness']['baseColorTexture'] = {'index': len(textures)-1}
        else:
            mat['pbrMetallicRoughness']['baseColorFactor'] = [0.6, 0.6, 0.62, 1]
        materials.append(mat)
        prims.append({'attributes': {'POSITION': base, 'NORMAL': base+1, 'TEXCOORD_0': base+2}, 'material': len(materials)-1, 'mode': 4})
    gltf = {'asset': {'version': '2.0', 'generator': 'bannon-unity_extract'}, 'scene': 0, 'scenes': [{'nodes': [0]}],
            'nodes': [{'name': os.path.basename(out_path)[:-4], 'mesh': 0}], 'meshes': [{'primitives': prims}],
            'materials': materials, 'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
    if textures: gltf['images'] = images; gltf['textures'] = textures; gltf['samplers'] = [{'wrapS': 10497, 'wrapT': 10497}]
    js = _json.dumps(gltf).encode(); js = js + b' ' * ((4 - len(js) % 4) % 4)
    with open(out_path, 'wb') as f:
        f.write(b'glTF'); f.write(_st.pack('<II', 2, 12 + 8 + len(js) + 8 + len(blob)))
        f.write(_st.pack('<I', len(js))); f.write(b'JSON'); f.write(js)
        f.write(_st.pack('<I', len(blob))); f.write(b'BIN\x00'); f.write(blob)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('bundle'); ap.add_argument('out')
    ap.add_argument('--names', default=''); ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--go', action='store_true', help='textured GameObject export (mesh + baked main texture)')
    ap.add_argument('--merge', default='', help='export a GameObject subtree (car body+wheels) baked into one GLB')
    ap.add_argument('--roots', action='store_true', help='export EVERY top-level (parent-less) GameObject subtree — pulls all locations/environments at once')
    ap.add_argument('--min-tris', type=int, default=200, help='skip root subtrees below this triangle count (--roots)')
    a = ap.parse_args()
    if a.roots:
        os.makedirs(a.out, exist_ok=True)
        export_all_roots(UnityPy.load(a.bundle), a.out, a.min_tris, a.limit)
        return
    if a.merge:
        os.makedirs(a.out, exist_ok=True)
        export_merged(UnityPy.load(a.bundle), a.out, a.merge, a.limit)
        return
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
