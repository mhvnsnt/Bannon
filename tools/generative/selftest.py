#!/usr/bin/env python3
"""selftest.py — one-command verification of the whole generative pipeline.

Runs every generator end-to-end on small/fast settings and reports PASS/FAIL.
No GPU, no network, no camera needed.

Usage: python3 selftest.py [--char ../../out/STICKUP_repaired.glb]
"""
import argparse, json, os, struct, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "motion"))
sys.path.insert(0, os.path.join(HERE, "retarget"))
sys.path.insert(0, os.path.join(HERE, "world"))
sys.path.insert(0, os.path.join(HERE, "mesh"))

RESULTS = []

def check(name, fn):
    try:
        detail = fn()
        RESULTS.append((name, True, detail))
        print(f"  PASS  {name} — {detail}")
    except Exception as e:
        RESULTS.append((name, False, f"{type(e).__name__}: {e}"))
        print(f"  FAIL  {name} — {type(e).__name__}: {e}")

def _glb_anims(path):
    with open(path, "rb") as f:
        assert f.read(4) == b"glTF"
        f.read(8)
        jl = struct.unpack("<I", f.read(4))[0]
        f.read(4)
        js = json.loads(f.read(jl))
    return js

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--char", default=os.path.join(HERE, "..", "..", "out", "STICKUP_repaired.glb"))
    a = ap.parse_args()
    tmp = tempfile.mkdtemp(prefix="bannon_gen_test_")
    print(f"selftest tmp: {tmp}")

    from common import glb_anim
    import procedural_moves
    import mediapipe_to_glb
    import bvh_retarget
    import arena_generator
    import crowd_generator
    import mesh_doctor

    print("== motion ==")
    def t_bake_all():
        n = 0
        for m in procedural_moves.MOVES:
            b = procedural_moves.bake_move(m)
            assert len(b) > 3, m
            n += 1
        return f"{n} moves baked"
    check("bake all 34 moves", t_bake_all)

    def t_inject():
        out = os.path.join(tmp, "t_suplex.glb")
        procedural_moves.export_move_onto_glb("SUPLEX", a.char, out)
        js = _glb_anims(out)
        probs = glb_anim.validate_animation(js, 0)
        assert not probs, probs
        assert js["animations"][0]["name"] == "MOVE_SUPLEX"
        return f"{len(js['animations'][0]['channels'])} channels, valid"
    check("inject SUPLEX into character GLB", t_inject)

    print("== retarget ==")
    def t_synth_mocap():
        import numpy as np
        from common.fk import Skeleton
        js0, sk = mediapipe_to_glb._load_skeleton(a.char)
        frames, fps = mediapipe_to_glb.synthetic_landmarks(10)
        per_frame, root, _ = mediapipe_to_glb.capture_to_tracks(sk, frames, fps)
        assert len(per_frame) == 10 and len(per_frame[0]) > 5
        out = os.path.join(tmp, "t_cap.glb")
        mediapipe_to_glb.write_capture_glb(a.char, out, "T", per_frame, root, fps)
        js = _glb_anims(out)
        assert not glb_anim.validate_animation(js, 0)
        return "10 frames, solve+GLB ok"
    check("synthetic mocap solve -> GLB", t_synth_mocap)

    def t_bvh():
        out = os.path.join(tmp, "t_bvh.glb")
        root, joints, data, ft = bvh_retarget.parse_bvh(bvh_retarget.SYNTH_BVH)
        assert len(data) == 3
        return f"parser ok ({len(joints)} joints)"
    check("BVH parser (synthetic)", t_bvh)

    print("== world ==")
    def t_arena():
        out = os.path.join(tmp, "t_arena.glb")
        S = arena_generator.build_arena("HOUSE")
        S.export(out)
        assert os.path.getsize(out) > 10000
        return f"{len(S.graph.nodes_geometry)} nodes"
    check("arena generator", t_arena)

    def t_crowd():
        out = os.path.join(tmp, "t_crowd.glb")
        S, fids, ph, an = crowd_generator.build_crowd(8, 7)
        assert len(fids) == 8
        return f"{len(fids)} fans placed"
    check("crowd generator (8 fans)", t_crowd)

    print("== mesh ==")
    def t_doctor():
        import trimesh
        scene = trimesh.load(a.char, force="scene")
        out_s, stats = mesh_doctor.doctor_scene(scene)
        assert stats["verts_after"] > 0
        return f"{stats['verts_after']} verts, {stats['holes_filled']} holes filled"
    check("mesh doctor", t_doctor)

    def t_lod_backend():
        name, _ = __import__("lod_chain", fromlist=["pick_backend"]).pick_backend()
        return f"backend: {name or 'NONE (install fast-simplification or open3d)'}"
    check("LOD backend present", t_lod_backend)

    n_pass = sum(1 for _, ok, _ in RESULTS if ok)
    print(f"\n{ n_pass}/{len(RESULTS)} checks passed")
    sys.exit(0 if n_pass == len(RESULTS) else 1)

if __name__ == "__main__":
    main()
