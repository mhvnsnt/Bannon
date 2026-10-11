#!/usr/bin/env python3
"""import_convergence.py — fail-closed importer for convergence assets (imports #1, #2).

Copies KayKit crowd characters + arena props from an AshLane checkout into this repo,
strips crowd GLB animations down to the crowd set (Idle/Cheer/Unarmed_Idle), writes
provenance manifests. Refuses to run if the CC0 license notice is missing.

  python3 tools/import/import_convergence.py --src ~/workspace/game-sweep/AshLane/public/models/kaykit
  python3 tools/import/import_convergence.py --src <dir> --dry-run
"""
import argparse, json, os, shutil, struct, sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CROWD_FILES = ["Knight.glb", "Rogue.glb", "Rogue_Hooded.glb", "Barbarian.glb", "Mage.glb",
               "Skeleton_Warrior.glb", "Skeleton_Rogue.glb", "Skeleton_Minion.glb", "Skeleton_Mage.glb"]
KEEP_ANIMS = {"Idle", "Cheer", "Unarmed_Idle"}
NOTICE_NAME = "NOTICE.txt"


def fail(msg):
    print(f"REFUSED: {msg}", file=sys.stderr)
    sys.exit(2)


def read_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    magic, ver, _ln = struct.unpack("<III", data[:12])
    if magic != 0x46546C67:
        fail(f"{path}: not a GLB")
    off = 12
    js, bin_ = None, b""
    while off < len(data):
        clen, ctype = struct.unpack("<II", data[off:off + 8])
        cdata = data[off + 8:off + 8 + clen]
        if ctype == 0x4E4F534A:
            js = json.loads(cdata.decode("utf-8"))
        elif ctype == 0x004E4942:
            bin_ = cdata
        off += 8 + clen
    if js is None:
        fail(f"{path}: no JSON chunk")
    return js, bin_


def write_glb(path, js, bin_):
    js_bytes = json.dumps(js, separators=(",", ":")).encode("utf-8")
    js_pad = (-len(js_bytes)) % 4
    js_bytes += b" " * js_pad
    bin_pad = (-len(bin_)) % 4
    bin_ += b"\x00" * bin_pad
    total = 12 + 8 + len(js_bytes) + 8 + len(bin_)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js_bytes), 0x4E4F534A))
        f.write(js_bytes)
        f.write(struct.pack("<II", len(bin_), 0x004E4942))
        f.write(bin_)


def strip_animations(js, bin_, keep):
    """Keep only named animations; rebuild buffer with only referenced bufferViews."""
    anims = js.get("animations", [])
    kept = [a for a in anims if a.get("name") in keep]
    removed = [a.get("name", "?") for a in anims if a.get("name") not in keep]

    # accessors used by everything EXCEPT removed animations
    used_acc = set()
    for m in js.get("meshes", []):
        for p in m.get("primitives", []):
            for attr in p.get("attributes", {}).values():
                used_acc.add(attr)
            if "indices" in p:
                used_acc.add(p["indices"])
            for t in p.get("targets", []):
                for attr in t.values():
                    used_acc.add(attr)
    for s in js.get("skins", []):
        if "inverseBindMatrices" in s:
            used_acc.add(s["inverseBindMatrices"])
    for a in kept:
        for smp in a.get("samplers", []):
            used_acc.add(smp["input"])
            used_acc.add(smp["output"])
    # sparse accessors may pull extra views; keep it simple — KayKit has none
    used_bv = set()
    accessors = js.get("accessors", [])
    for i in used_acc:
        if i < len(accessors) and "bufferView" in accessors[i]:
            used_bv.add(accessors[i]["bufferView"])
    for img in js.get("images", []):
        if "bufferView" in img:
            used_bv.add(img["bufferView"])

    old_bvs = js.get("bufferViews", [])
    remap = {old: new for new, old in enumerate(sorted(used_bv))}
    new_bin = bytearray()
    new_bvs = []
    for old in sorted(used_bv):
        bv = old_bvs[old]
        src_off = bv.get("byteOffset", 0)
        src_len = bv["byteLength"]
        chunk = bin_[src_off:src_off + src_len]
        # 4-byte align
        pad = (-len(new_bin)) % 4
        new_bin += b"\x00" * pad
        new_bv = dict(bv)
        new_bv["byteOffset"] = len(new_bin)
        new_bvs.append(new_bv)
        new_bin += chunk
    for i in used_acc:
        if i < len(accessors) and "bufferView" in accessors[i]:
            accessors[i]["bufferView"] = remap[accessors[i]["bufferView"]]
    for img in js.get("images", []):
        if "bufferView" in img:
            img["bufferView"] = remap[img["bufferView"]]
    js["bufferViews"] = new_bvs
    js["animations"] = kept
    if js.get("buffers"):
        js["buffers"][0]["byteLength"] = len(new_bin)
    return bytes(new_bin), removed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="AshLane public/models/kaykit dir (read-only)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    src = os.path.abspath(args.src)
    notice = os.path.join(src, NOTICE_NAME)
    if not os.path.isfile(notice):
        fail(f"license notice missing: {notice}")
    with open(notice) as f:
        text = f.read()
    if "CC0" not in text:
        fail(f"license notice at {notice} does not declare CC0")
    print(f"license gate PASS: CC0 declared in {notice}")

    crowd_dir = os.path.join(REPO, "assets", "models", "crowd")
    props_dir = os.path.join(REPO, "assets", "models", "arena_props")
    jobs = []
    for name in CROWD_FILES:
        p = os.path.join(src, name)
        if not os.path.isfile(p):
            fail(f"missing crowd GLB: {p}")
        jobs.append(("crowd", p, os.path.join(crowd_dir, name)))
    props_src = os.path.join(src, "props")
    prop_names = sorted(f for f in os.listdir(props_src) if f.endswith(".glb"))
    if not prop_names:
        fail(f"no prop GLBs in {props_src}")
    for name in prop_names:
        jobs.append(("prop", os.path.join(props_src, name), os.path.join(props_dir, name)))

    print(f"{len(jobs)} files queued ({len(CROWD_FILES)} crowd, {len(prop_names)} props)")
    if args.dry_run:
        print("dry-run: nothing written")
        return

    os.makedirs(crowd_dir, exist_ok=True)
    os.makedirs(props_dir, exist_ok=True)
    shutil.copy2(notice, os.path.join(crowd_dir, "KAYKIT_LICENSE.txt"))
    shutil.copy2(notice, os.path.join(props_dir, "KAYKIT_LICENSE.txt"))

    crowd_manifest, props_manifest = [], []
    for kind, sp, dp in jobs:
        if kind == "crowd":
            js, bin_ = read_glb(sp)
            n_anim_before = len(js.get("animations", []))
            bin2, removed = strip_animations(js, bin_, KEEP_ANIMS)
            write_glb(dp, js, bin2)
            before, after = os.path.getsize(sp), os.path.getsize(dp)
            crowd_manifest.append({"file": os.path.basename(dp), "bytes": after,
                                   "animations_kept": sorted(KEEP_ANIMS),
                                   "animations_removed": len(removed)})
            print(f"  crowd {os.path.basename(dp)}: {n_anim_before} anims -> {len(KEEP_ANIMS)}, "
                  f"{before//1024}KB -> {after//1024}KB")
        else:
            shutil.copy2(sp, dp)
            props_manifest.append({"file": os.path.basename(dp), "bytes": os.path.getsize(dp)})
    with open(os.path.join(crowd_dir, "crowd_manifest.json"), "w") as f:
        json.dump({"license": "CC0 1.0 Universal", "source": "KayKit via AshLane",
                   "files": crowd_manifest}, f, indent=1)
    with open(os.path.join(props_dir, "props_manifest.json"), "w") as f:
        json.dump({"license": "CC0 1.0 Universal", "source": "KayKit Dungeon Remastered via AshLane",
                   "files": props_manifest}, f, indent=1)
    print(f"wrote {crowd_dir} ({len(crowd_manifest)} files) and {props_dir} ({len(props_manifest)} files)")


if __name__ == "__main__":
    main()
