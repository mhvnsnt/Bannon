#!/usr/bin/env python3
"""promo_gates.py — automated defect gates for promo-kit shots.

Extends the gate_check.cjs pattern (gate(name, ok, detail) -> PASS/FAIL lines,
exit 1 on any failure) with promo-specific gates computed from measured data,
not eyeballs:

  rig gates (from the QA chart after rig repair — 2026-10-07):
    rotation-error deg <= 3.0          XBot ref 0.0 PASS / BANNON_v1 5.1 FAIL / Cody tripo 7.0 FAIL
  character gates (per shot, from animation/scene telemetry or frame analysis):
    feet_above_ground_max_mm <= 15.0   (no floating — the v1 ending pose floated)
    facing_vs_movement_deg <= 15.0     (no crab-walking)
    skin_flap_area_px <= 200.0         (no pale shoulder flap / stretch spots)
    ribbon_geometry == false           (no exploded ribbons)
    exploded_geometry == false         (no blown-apart mesh)
    foot_slide_mm_per_frame <= 8.0     (walk locked to the beat, feet planted)
    rope_crossing_frames == 0          (no ring rope cutting across the body)
    broken_pose_frames == 0            (no bent/backwards/broken frames)
  capture gates (passed through from a gate_check.cjs-style report):
    pageErrorCount == 0, console errorCount == 0, deformation.spikes == 0

Input: one JSON file with shot measurements, or a directory of them:
  {"shot": "walk_out",
   "rig": {"rotation_error_eff_deg": 5.1},
   "feet_above_ground_max_mm": 40.2,
   "facing_vs_movement_deg": 3.0,
   "skin_flap_area_px": 1250.0,
   "ribbon_geometry": false,
   "exploded_geometry": false,
   "foot_slide_mm_per_frame": 12.4,
   "rope_crossing_frames": 1,
   "broken_pose_frames": 0,
   "capture": {"pageErrorCount": 0, "errorCount": 0, "deformation_spikes": 0}}

Usage:
  python3 promo_gates.py --metrics metrics.json [--metrics dir/] [--config gates_config.json]
  python3 promo_gates.py --self-test   # runs on the bundled v1/v2 sample metrics
  python3 promo_gates.py --measure MODEL.glb [--ref REF.glb] [--clip CLIP.glb]
      # measure the GLB directly with rig_measure.py (any path, no hardcoding),
      # then run the gates on the measured numbers. Default ref is the repo's
      # XBot. Shot-level gates (foot slide, rope crossing, ...) SKIP when only
      # rig measurements exist — those need per-shot telemetry.

The numbers above must come from measurement tooling. --measure makes this
script measure (via rig_measure.py) instead of trusting a hand-written JSON.
"""
import argparse
import json
import os
import sys

GATES = [
    # (key path, label, comparator, threshold, unit)
    ("rig.rotation_error_eff_deg", "rotation-error within deg threshold", "<=", 3.0, "deg"),
    ("feet_above_ground_max_mm", "feet planted (no floating)", "<=", 15.0, "mm"),
    ("facing_vs_movement_deg", "facing matches movement direction", "<=", 15.0, "deg"),
    ("skin_flap_area_px", "no skin flap / stretch spots", "<=", 200.0, "px"),
    ("ribbon_geometry", "no ribbon geometry", "==", False, ""),
    ("exploded_geometry", "no exploded geometry", "==", False, ""),
    ("foot_slide_mm_per_frame", "no foot slide during walk", "<=", 8.0, "mm/frame"),
    ("rope_crossing_frames", "no rope crossing the body", "==", 0, "frames"),
    ("broken_pose_frames", "no broken poses", "==", 0, "frames"),
    ("capture.pageErrorCount", "capture pageErrorCount == 0", "==", 0, ""),
    ("capture.errorCount", "capture console errorCount == 0", "==", 0, ""),
    ("capture.deformation_spikes", "capture deformation.spikes == 0", "==", 0, ""),
]

REQUIRED_KEYS = ["feet_above_ground_max_mm", "facing_vs_movement_deg",
                 "skin_flap_area_px", "ribbon_geometry",
                 "exploded_geometry", "foot_slide_mm_per_frame",
                 "rope_crossing_frames", "broken_pose_frames"]


def get_path(m, path):
    cur = m
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None, False
        cur = cur[part]
    return cur, True


def check(comp, val, thr):
    if comp == "<=":
        return val <= thr
    if comp == "==":
        return val == thr
    raise ValueError("unknown comparator " + comp)


def evaluate(metrics, thresholds):
    """Returns (results, fails) where results is a list of dicts."""
    results, fails = [], []
    shot = metrics.get("shot", "?")
    for key, label, comp, default_thr, unit in GATES:
        thr = thresholds.get(key, default_thr)
        val, found = get_path(metrics, key)
        if not found or val is None:
            results.append({"shot": shot, "gate": label, "status": "SKIP",
                            "detail": "metric missing"})
            continue
        ok = check(comp, val, thr)
        detail = f"{val}{unit} {comp} {thr}{unit}"
        results.append({"shot": shot, "gate": label, "status": "PASS" if ok else "FAIL",
                        "detail": detail})
        if not ok:
            fails.append((shot, label, detail))
    return results, fails


def load_metrics(args):
    items = []
    if args.self_test:
        base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "examples")
        for name in sorted(os.listdir(base)):
            if name.startswith("metrics_") and name.endswith(".json"):
                items.append(json.load(open(os.path.join(base, name))))
        return items
    paths = []
    if args.metrics:
        if os.path.isdir(args.metrics):
            paths = [os.path.join(args.metrics, n) for n in sorted(os.listdir(args.metrics))
                     if n.endswith(".json")]
        else:
            paths = [args.metrics]
    for p in paths:
        items.append(json.load(open(p)))
    return items


def main():
    ap = argparse.ArgumentParser(description="promo-kit automated defect gates")
    ap.add_argument("--metrics", help="metrics JSON file or directory of them")
    ap.add_argument("--config", help="JSON file overriding gate thresholds "
                    '{"rig.rotation_error_eff_deg": 3.0, ...}')
    ap.add_argument("--self-test", action="store_true",
                    help="run bundled sample metrics (v1 FAIL demo)")
    ap.add_argument("--measure", metavar="MODEL.glb",
                    help="GLB model file: measure it with rig_measure.py, then gate")
    ap.add_argument("--ref", help="reference GLB for rotation eff-deg "
                    "(default: repo assets/models/xbot.glb)")
    ap.add_argument("--clip", help="animation GLB driving clip eff-deg")
    args = ap.parse_args()

    thresholds = json.load(open(args.config)) if args.config else {}
    items = load_metrics(args)
    if args.measure:
        here = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, here)
        import rig_measure
        default_ref = os.path.normpath(os.path.join(
            here, "..", "..", "assets", "models", "xbot.glb"))
        ref = args.ref or (default_ref if os.path.exists(default_ref) else None)
        if ref is None:
            print("no --ref given and no repo XBot found", file=sys.stderr)
            sys.exit(2)
        m = rig_measure.measure(args.measure, ref, args.clip)
        g = m.get("gates", {})
        items.append({
            "shot": m.get("shot", os.path.basename(args.measure)),
            "rig": g.get("rig", {}),
            "feet_above_ground_max_mm": g.get("feet_above_ground_max_mm"),
            "_measured_from": os.path.abspath(args.measure),
            "_ref": os.path.abspath(ref),
        })
    if not items:
        print("no metrics loaded", file=sys.stderr)
        sys.exit(2)

    total_fails = []
    for m in items:
        shot = m.get("shot", "?")
        missing = [k for k in REQUIRED_KEYS if k not in m]
        if missing:
            print(f"WARN | shot '{shot}' missing metrics: {', '.join(missing)} "
                  "(those gates SKIP)", file=sys.stderr)
        results, fails = evaluate(m, thresholds)
        for r in results:
            print(f"{r['status']} | [{shot}] {r['gate']}"
                  + (f" — {r['detail']}" if r.get("detail") else ""))
        total_fails.extend(fails)

    print("\nRESULT: " + ("FAIL (%d gate%s)" % (len(total_fails),
          "s" if len(total_fails) != 1 else "") if total_fails else "ALL GATES PASS"))
    sys.exit(1 if total_fails else 0)


if __name__ == "__main__":
    main()
