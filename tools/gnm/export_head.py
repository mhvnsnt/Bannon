#!/usr/bin/env python3
"""Export Google GNM Head (Apache 2.0, github.com/google/GNM) to a morph-target GLB for BANNON.

The npz IS the model — no GNM package needed: template mesh (17,821 verts / 35,324 tris,
skin+eyes+teeth+tongue), 253 identity PCA deltas, 383 expression deltas, per-corner UVs.
This bakes ONE base head GLB with the top-variance components as glTF morph targets:

  - identity head_000..head_{N-1}  -> CAW face sliders (three.js allows negative influences,
    so one target per component covers the +/- axis; deltas stored at 2-sigma).
  - expression lower_face / eye regions / tongue leaders -> FACS-class expression targets.

Output: assets/models/face/gnm_head.glb  (+ prints target names). Scan-grade head geometry —
the authored-face layer the DNA-CAW plan was missing (CLAUDE.md MODEL GAP #2).

  python3 tools/gnm/export_head.py <path/to/gnm_head.npz> [out.glb]
"""
import json, struct, sys, os
import numpy as np

N_ID = 20            # identity components exported as morph targets
SIGMA = 2.0          # slider full-scale = 2 sigma of the PCA axis
EXPR_PICK = (["lower_face_region_%03d" % i for i in range(10)] +
             ["left_eye_region_%03d" % i for i in range(3)] +
             ["right_eye_region_%03d" % i for i in range(3)] +
             ["tongue_%03d" % i for i in range(2)])

def weld_uvs(n_verts, tris, tri_uvs):
    """Per-corner UVs -> per-vertex (first corner wins; seams acceptable for the CAW base)."""
    uv = np.zeros((n_verts, 2), np.float32); seen = np.zeros(n_verts, bool)
    flat_v = tris.reshape(-1); flat_uv = tri_uvs.reshape(-1, 2)
    for i in range(flat_v.shape[0]):
        v = flat_v[i]
        if not seen[v]: uv[v] = flat_uv[i]; seen[v] = True
    uv[:, 1] = 1.0 - uv[:, 1]                    # glTF UV origin is top-left
    return uv

def vertex_normals(verts, tris):
    n = np.zeros_like(verts)
    a, b, c = verts[tris[:, 0]], verts[tris[:, 1]], verts[tris[:, 2]]
    fn = np.cross(b - a, c - a)
    for k in range(3): np.add.at(n, tris[:, k], fn)
    ln = np.linalg.norm(n, axis=1, keepdims=True); ln[ln == 0] = 1
    return (n / ln).astype(np.float32)

def main():
    npz = sys.argv[1] if len(sys.argv) > 1 else "scratchpad/gnm/gnm/shape/data/versions/v3_0/gnm_head.npz"
    out = sys.argv[2] if len(sys.argv) > 2 else "assets/models/face/gnm_head.glb"
    d = np.load(npz)
    verts = d["template_vertex_positions"].astype(np.float32)
    tris  = d["triangles"].astype(np.uint32)
    uvs   = weld_uvs(verts.shape[0], tris, d["triangle_uvs"])
    norms = vertex_normals(verts, tris)

    id_names  = [str(x) for x in d["identity_names"]]
    ex_names  = [str(x) for x in d["expression_names"]]
    id_basis  = d["vertex_identity_basis"]      # (253, V, 3)
    ex_basis  = d["expression_basis"]           # (383, V, 3)

    targets, tnames = [], []
    for i in range(min(N_ID, len(id_names))):
        targets.append((id_basis[i] * SIGMA).astype(np.float32)); tnames.append("id_" + id_names[i])
    for nm in EXPR_PICK:
        if nm in ex_names:
            targets.append(ex_basis[ex_names.index(nm)].astype(np.float32)); tnames.append("ex_" + nm)

    # ---- raw GLB write (positions/normals/uvs/indices + POSITION morph targets) ----
    bin_parts, views, accessors = [], [], []
    def push(arr, target=None, comp=5126, type_="VEC3", minmax=False):
        b = arr.tobytes(); off = sum(len(p) for p in bin_parts)
        pad = (4 - off % 4) % 4
        if pad: bin_parts.append(b"\x00" * pad); off += pad
        bin_parts.append(b)
        views.append({"buffer": 0, "byteOffset": off, "byteLength": len(b), **({"target": target} if target else {})})
        acc = {"bufferView": len(views) - 1, "componentType": comp,
               "count": arr.shape[0] if arr.ndim > 1 else arr.shape[0],
               "type": type_}
        if minmax and arr.ndim == 2:
            acc["min"] = arr.min(0).tolist(); acc["max"] = arr.max(0).tolist()
        accessors.append(acc); return len(accessors) - 1

    a_pos = push(verts, 34962, minmax=True)
    a_nrm = push(norms, 34962)
    a_uv  = push(uvs, 34962, type_="VEC2")
    a_idx = push(tris.reshape(-1), 34963, comp=5125, type_="SCALAR")
    prim_targets = []
    for t in targets:
        prim_targets.append({"POSITION": push(t, 34962, minmax=True)})

    gltf = {
        "asset": {"version": "2.0", "generator": "bannon gnm export (GNM: Apache-2.0, google/GNM)"},
        "scene": 0, "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "GNM_HEAD"}],
        "meshes": [{"name": "gnm_head", "primitives": [{
            "attributes": {"POSITION": a_pos, "NORMAL": a_nrm, "TEXCOORD_0": a_uv},
            "indices": a_idx, "material": 0, "targets": prim_targets}],
            "weights": [0.0] * len(targets),
            "extras": {"targetNames": tnames}}],
        "materials": [{"name": "gnm_skin", "pbrMetallicRoughness":
                       {"baseColorFactor": [0.83, 0.62, 0.50, 1.0], "roughnessFactor": 0.62, "metallicFactor": 0.0}}],
        "bufferViews": views, "accessors": accessors,
    }
    bin_blob = b"".join(bin_parts); bin_blob += b"\x00" * ((4 - len(bin_blob) % 4) % 4)
    gltf["buffers"] = [{"byteLength": len(bin_blob)}]
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    glb = (b"glTF" + struct.pack("<II", 2, 12 + 8 + len(js) + 8 + len(bin_blob)) +
           struct.pack("<II", len(js), 0x4E4F534A) + js +
           struct.pack("<II", len(bin_blob), 0x004E4942) + bin_blob)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "wb").write(glb)
    print("wrote %s  %.1f MB  verts=%d tris=%d targets=%d" %
          (out, len(glb) / 1e6, verts.shape[0], tris.shape[0], len(targets)))
    print("targets:", ", ".join(tnames))

if __name__ == "__main__":
    main()
