"""glb_anim.py — raw JSON+BIN surgery for glTF/GLB files.

Appends animations to an existing GLB without re-encoding meshes. Preserves the
original BIN chunk byte-for-byte (only appends). No heavy deps: stdlib only.

Rotation tracks are composed over each node's rest rotation
(animated = rest * key); a translation track on `compose_translation` is
composed over that node's rest translation (animated = rest + key).
"""
import json
import struct

import numpy as np


def read_glb(path):
    with open(path, "rb") as f:
        magic = f.read(4)
        assert magic == b"glTF", f"not a GLB: {path}"
        f.read(8)  # version + length
        json_len = struct.unpack("<I", f.read(4))[0]
        chunk_type = f.read(4)
        assert chunk_type == b"JSON"
        js = json.loads(f.read(json_len))
        rest = f.read()  # BIN chunk header + data (preserved verbatim)
    return js, bytearray(rest)


def write_glb(path, js, bin_data):
    json_bytes = json.dumps(js, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    total_len = 12 + 8 + len(json_bytes) + len(bin_data)
    with open(path, "wb") as f:
        f.write(b"glTF")
        f.write(struct.pack("<I", 2))
        f.write(struct.pack("<I", total_len))
        f.write(struct.pack("<I", len(json_bytes)))
        f.write(b"JSON")
        f.write(json_bytes)
        f.write(bin_data)


def _rest_tr(js, node_idx):
    _normalize_node_trs(js, node_idx)
    nd = js["nodes"][node_idx]
    t = np.array(nd.get("translation", [0, 0, 0]), dtype=float)
    r = np.array(nd.get("rotation", [0, 0, 0, 1]), dtype=float)
    n = np.linalg.norm(r)
    return t, (r / n if n > 1e-12 else np.array([0, 0, 0, 1]))


def _normalize_node_trs(js, node_idx):
    """glTF forbids `matrix` on animation-targeted nodes: decompose to TRS."""
    nd = js["nodes"][node_idx]
    if nd.get("matrix"):
        import sys, os
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from common.fk import decompose_matrix
        t, q, s = decompose_matrix(nd["matrix"])
        nd["translation"] = [float(v) for v in t]
        nd["rotation"] = [float(v) for v in q]
        nd["scale"] = [float(v) for v in s]
        del nd["matrix"]


def _quat_mul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return np.array([
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz])


def _append_floats(js, bin_data, floats):
    """Append float32 array to BIN; add bufferView+accessor; return accessor idx."""
    raw = np.asarray(floats, dtype=np.float32).tobytes()
    # strip existing BIN header (first 8 bytes) if this is the first append
    if not js.get("_bin_stripped"):
        assert bin_data[4:8] == b"BIN\x00", "expected BIN chunk"
        data_len = struct.unpack("<I", bin_data[0:4])[0]
        payload = bytes(bin_data[8:8 + data_len])
        bin_data[:] = bytearray(payload)
        js["_bin_stripped"] = True
    # pad bin to 4
    while len(bin_data) % 4:
        bin_data.append(0)
    offset = len(bin_data)
    bin_data.extend(raw)
    bv_idx = len(js.get("bufferViews", []))
    js.setdefault("bufferViews", []).append(
        {"buffer": 0, "byteOffset": offset, "byteLength": len(raw)})
    arr = np.asarray(floats, dtype=np.float32)
    flat = arr.reshape(-1)
    acc = {"bufferView": bv_idx, "componentType": 5126,
           "count": arr.shape[0],
           "type": {1: "SCALAR", 3: "VEC3", 4: "VEC4"}[arr.shape[1]],
           "min": [float(flat.min())], "max": [float(flat.max())]}
    if arr.shape[1] > 1:
        acc["min"] = [float(arr[:, i].min()) for i in range(arr.shape[1])]
        acc["max"] = [float(arr[:, i].max()) for i in range(arr.shape[1])]
    js.setdefault("accessors", []).append(acc)
    js["buffers"][0]["byteLength"] = len(bin_data)
    return len(js["accessors"]) - 1


def _finalize_bin(js, bin_data):
    if js.get("_bin_stripped"):
        header = struct.pack("<I", len(bin_data)) + b"BIN\x00"
        bin_data[:] = bytearray(header) + bin_data
        del js["_bin_stripped"]


def add_animation(js, bin_data, name, tracks, compose_translation=None):
    """tracks: [{node:int, path:'rotation'|'translation', times:[f], values:[tuple]}].
    Rotation values are bone-local key quats (composed over rest).
    Translation values are offsets (composed over rest if node==compose_translation)."""
    samplers, channels = [], []
    for tr in tracks:
        node, path = tr["node"], tr["path"]
        times = [float(t) for t in tr["times"]]
        vals = [tuple(float(v) for v in x) for x in tr["values"]]
        rest_t, rest_q = _rest_tr(js, node)
        if path == "rotation":
            vals = [tuple(_quat_mul(rest_q, np.asarray(v))) for v in vals]
            dim = 4
        elif path == "translation":
            if compose_translation is not None and node == compose_translation:
                vals = [tuple(np.asarray(v) + rest_t) for v in vals]
            dim = 3
        else:
            raise ValueError(f"bad path {path}")
        in_acc = _append_floats(js, bin_data, np.array(times, dtype=np.float32).reshape(-1, 1))
        out_acc = _append_floats(js, bin_data, np.array(vals, dtype=np.float32).reshape(-1, dim))
        samplers.append({"input": in_acc, "output": out_acc, "interpolation": "LINEAR"})
        channels.append({"sampler": len(samplers) - 1,
                         "target": {"node": node, "path": path}})
    js.setdefault("animations", []).append(
        {"name": name, "samplers": samplers, "channels": channels})
    _finalize_bin(js, bin_data)
    return len(js["animations"]) - 1


def validate_animation(js, anim_index=0):
    """Structural sanity check. Returns list of problems (empty = clean)."""
    problems = []
    anims = js.get("animations", [])
    if anim_index >= len(anims):
        return [f"no animation at index {anim_index}"]
    anim = anims[anim_index]
    nn = len(js["nodes"])
    for ci, ch in enumerate(anim["channels"]):
        tgt = ch["target"]
        if not (0 <= tgt["node"] < nn):
            problems.append(f"channel {ci}: node {tgt['node']} out of range")
        smp = anim["samplers"][ch["sampler"]]
        ia, oa = js["accessors"][smp["input"]], js["accessors"][smp["output"]]
        if ia["count"] != oa["count"]:
            problems.append(f"channel {ci}: input/output count mismatch")
        if ia["type"] != "SCALAR":
            problems.append(f"channel {ci}: input not SCALAR")
        want = {"rotation": "VEC4", "translation": "VEC3", "scale": "VEC3"}[tgt["path"]]
        if oa["type"] != want:
            problems.append(f"channel {ci}: output {oa['type']} != {want}")
    return problems
