#!/usr/bin/env python3
"""procedural_moves.py — deterministic, CPU-only wrestling animation generator.

Builds animation clips for the Bannon 58-bone Mixamo skeleton (mixamorig: names)
and injects them into any character GLB as glTF animations. Zero ML, zero GPU,
no network: pure keyframe math (numpy), so Real can run it on any machine.

Bone-local axes (all rest rotations are identity, so local == world at rest):
  character faces +X, up is +Y, character's right is -Z, left is +Z.
  rz + : arm hangs -Y -> swings forward (+X).  spine +Y -> leans back (-X).
  rz - : spine bends forward. knee bends (heel to butt).
  rx + : right arm abducts out to the side; left arm adducts across body.
  ry - : torso twists right-shoulder-forward (punch rotation).

Usage:
  python3 procedural_moves.py --list
  python3 procedural_moves.py --move JAB --on ../../out/STICKUP_repaired.glb --out proof/STICKUP_JAB.glb
  python3 procedural_moves.py --move SUPLEX --skeleton-only --out proof/SUPLEX_skel.glb
  python3 procedural_moves.py --all --on ../../out/STICKUP_repaired.glb --outdir proof/
"""
import argparse, json, math, os, struct, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common.quat import euler_to_quat, quat_mul, quat_normalize, EASES  # noqa: E402
from common import glb_anim  # noqa: E402

B = {
    "H": "mixamorig:Hips", "S": "mixamorig:Spine", "S1": "mixamorig:Spine1",
    "S2": "mixamorig:Spine2", "N": "mixamorig:Neck", "Hd": "mixamorig:Head",
    "RSh": "mixamorig:RightShoulder", "RA": "mixamorig:RightArm",
    "RFA": "mixamorig:RightForeArm", "RH": "mixamorig:RightHand",
    "LSh": "mixamorig:LeftShoulder", "LA": "mixamorig:LeftArm",
    "LFA": "mixamorig:LeftForeArm", "LH": "mixamorig:LeftHand",
    "RUL": "mixamorig:RightUpLeg", "RL": "mixamorig:RightLeg",
    "RF": "mixamorig:RightFoot", "RT": "mixamorig:RightToeBase",
    "LUL": "mixamorig:LeftUpLeg", "LL": "mixamorig:LeftLeg",
    "LF": "mixamorig:LeftFoot", "LT": "mixamorig:LeftToeBase",
}

def K(t, rx=0, ry=0, rz=0, ease="smooth"):
    return (t, (rx, ry, rz), ease)

# ---------------------------------------------------------------- moves ----
# Each move: dict with dur, loop, bones {alias: [keys]}, root [(t,dx,dy,dz,ease)]
MOVES = {}

def _mv(name, dur, bones, root=None, loop=False, desc=""):
    MOVES[name] = {"dur": dur, "loop": loop, "bones": bones,
                   "root": root or [], "desc": desc}

# ---- locomotion ----
_mv("IDLE", 2.4, {
    "S":  [K(0, 0, 0, -2), K(1.2, 0, 0, 2), K(2.4, 0, 0, -2)],
    "S1": [K(0, 0, 0, -2), K(1.2, 0, 0, 3), K(2.4, 0, 0, -2)],
    "RA": [K(0, 4, 0, 6), K(1.2, 6, 0, 9), K(2.4, 4, 0, 6)],
    "LA": [K(0, -4, 0, 6), K(1.2, -6, 0, 9), K(2.4, -4, 0, 6)],
    "N":  [K(0, 0, 8, 0), K(1.2, 0, -8, 0), K(2.4, 0, 8, 0)],
}, root=[(0, 0, 0.0, 0), (1.2, 0, 0.012, 0), (2.4, 0, 0.0, 0)],
    loop=True, desc="breathing idle, subtle sway")

_mv("WALK", 1.2, {
    "RUL": [K(0, 0, 0, 28), K(0.3, 0, 0, 0), K(0.6, 0, 0, -24), K(0.9, 0, 0, 0), K(1.2, 0, 0, 28)],
    "LUL": [K(0, 0, 0, -24), K(0.3, 0, 0, 0), K(0.6, 0, 0, 28), K(0.9, 0, 0, 0), K(1.2, 0, 0, -24)],
    "RL":  [K(0, 0, 0, -8), K(0.3, 0, 0, -45), K(0.6, 0, 0, -8), K(0.9, 0, 0, -30), K(1.2, 0, 0, -8)],
    "LL":  [K(0, 0, 0, -8), K(0.3, 0, 0, -30), K(0.6, 0, 0, -8), K(0.9, 0, 0, -45), K(1.2, 0, 0, -8)],
    "RA":  [K(0, 0, 0, -18), K(0.6, 0, 0, 18), K(1.2, 0, 0, -18)],
    "LA":  [K(0, 0, 0, 18), K(0.6, 0, 0, -18), K(1.2, 0, 0, 18)],
    "S":   [K(0, 0, 4, -4), K(0.6, 0, -4, -4), K(1.2, 0, 4, -4)],
}, root=[(0, 0, 0, 0), (0.3, 0, -0.015, 0), (0.6, 0, 0, 0), (0.9, 0, -0.015, 0), (1.2, 0, 0, 0)],
    loop=True, desc="in-place walk cycle")

_mv("RUN", 0.8, {
    "RUL": [K(0, 0, 0, 45), K(0.2, 0, 0, 0), K(0.4, 0, 0, -35), K(0.6, 0, 0, 10), K(0.8, 0, 0, 45)],
    "LUL": [K(0, 0, 0, -35), K(0.2, 0, 0, 10), K(0.4, 0, 0, 45), K(0.6, 0, 0, 0), K(0.8, 0, 0, -35)],
    "RL":  [K(0, 0, 0, -20), K(0.2, 0, 0, -90), K(0.4, 0, 0, -25), K(0.6, 0, 0, -60), K(0.8, 0, 0, -20)],
    "LL":  [K(0, 0, 0, -25), K(0.2, 0, 0, -60), K(0.4, 0, 0, -20), K(0.6, 0, 0, -90), K(0.8, 0, 0, -25)],
    "RA":  [K(0, 0, 0, -40), K(0.4, 0, 0, 35), K(0.8, 0, 0, -40)],
    "LA":  [K(0, 0, 0, 35), K(0.4, 0, 0, -40), K(0.8, 0, 0, 35)],
    "RFA": [K(0, 0, 0, 70), K(0.8, 0, 0, 70)],
    "LFA": [K(0, 0, 0, 70), K(0.8, 0, 0, 70)],
    "S":   [K(0, 0, 0, -14), K(0.8, 0, 0, -14)],
}, root=[(0, 0, 0.01, 0), (0.2, 0, 0.03, 0), (0.4, 0, 0.01, 0), (0.6, 0, 0.03, 0), (0.8, 0, 0.01, 0)],
    loop=True, desc="in-place run cycle, forward lean")

_mv("TAUNT_CROWD", 2.0, {
    "RA": [K(0, 20, 0, 20), K(0.5, 55, 0, 120, "out"), K(1.5, 55, 0, 120), K(2.0, 20, 0, 20)],
    "LA": [K(0, -20, 0, 20), K(0.5, -55, 0, 120, "out"), K(1.5, -55, 0, 120), K(2.0, -20, 0, 20)],
    "S":  [K(0, 0, 0, 0), K(0.5, 0, 0, 14, "out"), K(1.5, 0, 0, 14), K(2.0, 0, 0, 0)],
    "N":  [K(0.5, 0, 0, 18), K(1.5, 0, 0, 18)],
    "S1": [K(0.5, 0, 0, 8), K(1.5, 0, 0, 8)],
}, desc="arms raised to the crowd, head back")

_mv("FLEX", 2.0, {
    "RA": [K(0, 30, 0, 30), K(0.6, 45, 0, 55, "out"), K(1.4, 45, 0, 55), K(2.0, 30, 0, 30)],
    "LA": [K(0, -30, 0, 30), K(0.6, -45, 0, 55, "out"), K(1.4, -45, 0, 55), K(2.0, -30, 0, 30)],
    "RFA": [K(0, 0, 0, 40), K(0.6, 0, 0, 110, "out"), K(1.4, 0, 0, 110), K(2.0, 0, 0, 40)],
    "LFA": [K(0, 0, 0, 40), K(0.6, 0, 0, 110, "out"), K(1.4, 0, 0, 110), K(2.0, 0, 0, 40)],
    "S":  [K(0.6, 0, 0, 6), K(1.4, 0, 0, 6)],
}, desc="double-bicep flex")

# ---- strikes ----
_mv("JAB", 0.5, {
    "RA": [K(0, 0, 0, 25), K(0.15, 0, 0, 88, "snap"), K(0.32, 0, 0, 88), K(0.5, 0, 0, 25)],
    "RFA": [K(0, 0, 0, 20), K(0.15, 0, 0, 5, "snap"), K(0.5, 0, 0, 20)],
    "S":  [K(0, 0, 0, -5), K(0.15, 0, -14, -12, "snap"), K(0.5, 0, 0, -5)],
    "LA": [K(0, -10, 0, 45), K(0.5, -10, 0, 45)],
    "LFA": [K(0, 0, 0, 80), K(0.5, 0, 0, 80)],
}, desc="right jab, fast snap")

_mv("CROSS", 0.6, {
    "LA": [K(0, 0, 0, 25), K(0.2, 0, 0, 88, "snap"), K(0.38, 0, 0, 88), K(0.6, 0, 0, 25)],
    "LFA": [K(0, 0, 0, 20), K(0.2, 0, 0, 5, "snap"), K(0.6, 0, 0, 20)],
    "S":  [K(0, 0, 0, -5), K(0.2, 0, 18, -14, "snap"), K(0.6, 0, 0, -5)],
    "RUL": [K(0.2, 0, 0, 15), K(0.6, 0, 0, 0)],
}, root=[(0, 0, 0, 0), (0.2, 0.08, -0.02, 0, "snap"), (0.6, 0, 0, 0)],
    desc="left cross with hip twist and step")

_mv("HOOK", 0.65, {
    "RA": [K(0, 40, 0, 70), K(0.22, -30, 0, 80, "snap"), K(0.45, -30, 0, 80), K(0.65, 40, 0, 70)],
    "RFA": [K(0, 0, 0, 90), K(0.65, 0, 0, 90)],
    "S":  [K(0, 0, -10, -8), K(0.22, 0, -38, -12, "snap"), K(0.65, 0, -10, -8)],
}, desc="right hook, arm swings across")

_mv("UPPERCUT", 0.7, {
    "RA": [K(0, 0, 0, 30), K(0.25, 0, 0, -10), K(0.42, 0, 0, 120, "snap"), K(0.7, 0, 0, 30)],
    "RFA": [K(0, 0, 0, 60), K(0.25, 0, 0, 100), K(0.42, 0, 0, 20, "snap"), K(0.7, 0, 0, 60)],
    "S":  [K(0, 0, 0, -5), K(0.25, 0, 0, -25), K(0.42, 0, -10, 10, "snap"), K(0.7, 0, 0, -5)],
}, root=[(0, 0, 0, 0), (0.25, 0, -0.08, 0), (0.42, 0.05, 0.02, 0, "snap"), (0.7, 0, 0, 0)],
    desc="right uppercut, dip then rip upward")

_mv("ELBOW", 0.5, {
    "RA": [K(0, 30, 0, 60), K(0.16, -25, 0, 70, "snap"), K(0.5, 30, 0, 60)],
    "RFA": [K(0, 0, 0, 120), K(0.5, 0, 0, 120)],
    "S":  [K(0, 0, -8, -8), K(0.16, 0, -30, -10, "snap"), K(0.5, 0, -8, -8)],
}, desc="spinning-ish elbow strike")

_mv("KNEE", 0.6, {
    "RUL": [K(0, 0, 0, 10), K(0.22, 0, 0, 95, "snap"), K(0.45, 0, 0, 95), K(0.6, 0, 0, 10)],
    "RL": [K(0, 0, 0, -10), K(0.22, 0, 0, -95, "snap"), K(0.6, 0, 0, -10)],
    "S":  [K(0, 0, 0, -5), K(0.22, 0, 0, -28, "snap"), K(0.6, 0, 0, -5)],
    "RA": [K(0, 20, 0, 60), K(0.22, 35, 0, 40, "snap"), K(0.6, 20, 0, 60)],
}, desc="muay-thai knee with clinch pull")

_mv("FRONT_KICK", 0.7, {
    "RUL": [K(0, 0, 0, 5), K(0.2, 0, 0, 40), K(0.35, 0, 0, 92, "snap"), K(0.55, 0, 0, 92), K(0.7, 0, 0, 5)],
    "RL": [K(0, 0, 0, -8), K(0.2, 0, 0, -70), K(0.35, 0, 0, -8, "snap"), K(0.7, 0, 0, -8)],
    "S":  [K(0, 0, 0, -4), K(0.35, 0, 0, 16, "snap"), K(0.7, 0, 0, -4)],
    "RA": [K(0, 10, 0, 20), K(0.35, -15, 0, -10, "snap"), K(0.7, 10, 0, 20)],
    "LA": [K(0, -10, 0, 20), K(0.35, 15, 0, -10, "snap"), K(0.7, -10, 0, 20)],
}, desc="front push kick")

_mv("ROUNDHOUSE_KICK", 0.85, {
    "RUL": [K(0, 0, 0, 10), K(0.3, 25, 0, 55), K(0.48, 45, 0, 80, "snap"), K(0.85, 0, 0, 10)],
    "RL": [K(0, 0, 0, -10), K(0.3, 0, 0, -80), K(0.48, 0, 0, -12, "snap"), K(0.85, 0, 0, -10)],
    "S":  [K(0, 0, 20, -5), K(0.48, 0, -25, 12, "snap"), K(0.85, 0, 20, -5)],
    "LA": [K(0, -30, 0, 30), K(0.48, -60, 0, -20, "snap"), K(0.85, -30, 0, 30)],
}, desc="roundhouse kick with pivot")

_mv("STOMP", 0.6, {
    "RUL": [K(0, 0, 0, 8), K(0.25, 0, 0, 70), K(0.4, 0, 0, 70), K(0.5, 0, 0, 5, "snap"), K(0.6, 0, 0, 8)],
    "RL": [K(0, 0, 0, -8), K(0.25, 0, 0, -60), K(0.5, 0, 0, -5, "snap"), K(0.6, 0, 0, -8)],
    "S":  [K(0.25, 0, 0, -12), K(0.5, 0, 0, -20, "snap"), K(0.6, 0, 0, -5)],
}, desc="stomp down on grounded opponent")

_mv("CLOTHESLINE", 0.75, {
    "RA": [K(0, 20, 0, 30), K(0.3, 75, 0, 85, "out"), K(0.5, 75, 0, 85), K(0.75, 20, 0, 30)],
    "S":  [K(0, 0, 0, -5), K(0.3, 0, -25, -10), K(0.5, 0, 25, -10, "snap"), K(0.75, 0, 0, -5)],
    "RUL": [K(0.3, 0, 0, 20), K(0.75, 0, 0, 0)],
}, root=[(0, 0, 0, 0), (0.3, 0.15, 0, 0), (0.5, 0.3, 0, 0, "snap"), (0.75, 0, 0, 0)],
    desc="running clothesline with lariat arm")

_mv("DROPKICK", 1.0, {
    "RUL": [K(0, 0, 0, 15), K(0.2, 0, 0, 60), K(0.35, 0, 0, 80, "snap"), K(0.7, 0, 0, 80), K(1.0, 0, 0, 15)],
    "LUL": [K(0, 0, 0, 15), K(0.2, 0, 0, 60), K(0.35, 0, 0, 80, "snap"), K(0.7, 0, 0, 80), K(1.0, 0, 0, 15)],
    "RL": [K(0, 0, 0, -40), K(0.2, 0, 0, -90), K(0.35, 0, 0, -10, "snap"), K(1.0, 0, 0, -40)],
    "LL": [K(0, 0, 0, -40), K(0.2, 0, 0, -90), K(0.35, 0, 0, -10, "snap"), K(1.0, 0, 0, -40)],
    "S":  [K(0, 0, 0, -5), K(0.2, 0, 0, -30), K(0.35, 0, 0, 18, "snap"), K(1.0, 0, 0, -5)],
    "RA": [K(0.35, 30, 0, -20), K(0.7, 30, 0, -20)],
    "LA": [K(0.35, -30, 0, -20), K(0.7, -30, 0, -20)],
}, root=[(0, 0, 0, 0), (0.2, 0, -0.1, 0), (0.35, 0.25, 0.22, 0, "snap"),
        (0.7, 0.35, 0.22, 0), (1.0, 0, 0, 0)],
    desc="dropkick: jump, both feet forward")

_mv("SPEAR", 0.9, {
    "S":  [K(0, 0, 0, -8), K(0.25, 0, 0, -38), K(0.45, 0, -8, -18, "snap"), K(0.9, 0, 0, -8)],
    "RSh": [K(0.25, 30, 0, 0), K(0.45, 55, 0, 0, "snap"), K(0.9, 0, 0, 0)],
    "RA": [K(0, 10, 0, 40), K(0.25, 25, 0, 55), K(0.45, 40, 0, 70, "snap"), K(0.9, 10, 0, 40)],
    "LA": [K(0, -10, 0, 40), K(0.25, -25, 0, 55), K(0.45, -40, 0, 70, "snap"), K(0.9, -10, 0, 40)],
    "RUL": [K(0.25, 0, 0, 45), K(0.45, 0, 0, 55, "snap"), K(0.9, 0, 0, 0)],
    "LUL": [K(0.25, 0, 0, 30), K(0.9, 0, 0, 0)],
    "RL": [K(0.25, 0, 0, -70), K(0.9, 0, 0, -10)],
}, root=[(0, 0, 0, 0), (0.25, 0, -0.12, 0), (0.45, 0.55, -0.05, 0, "snap"), (0.9, 0, 0, 0)],
    desc="spear: shoulder-charge tackle drive")

_mv("BIG_BOOT", 0.8, {
    "RUL": [K(0, 0, 0, 8), K(0.3, 0, 0, 105, "snap"), K(0.55, 0, 0, 105), K(0.8, 0, 0, 8)],
    "RL": [K(0, 0, 0, -8), K(0.3, 0, 0, -15, "snap"), K(0.8, 0, 0, -8)],
    "S":  [K(0, 0, 0, -5), K(0.3, 0, 0, 20, "snap"), K(0.8, 0, 0, -5)],
}, desc="big boot to a cornered opponent")

# ---- grapples (solo performance) ----
_mv("TIEUP", 1.6, {
    "RA": [K(0, 15, 0, 70), K(0.8, 18, 0, 78), K(1.6, 15, 0, 70)],
    "LA": [K(0, -15, 0, 70), K(0.8, -18, 0, 78), K(1.6, -15, 0, 70)],
    "RFA": [K(0, 0, 0, 35), K(1.6, 0, 0, 35)],
    "LFA": [K(0, 0, 0, 35), K(1.6, 0, 0, 35)],
    "S":  [K(0, 0, 0, -12), K(0.8, 0, 0, -16), K(1.6, 0, 0, -12)],
    "N":  [K(0, 0, 0, -8), K(1.6, 0, 0, -8)],
}, root=[(0, 0, 0, 0), (0.8, 0, -0.02, 0), (1.6, 0, 0, 0)],
    loop=True, desc="collar-and-elbow tie-up, grinding loop")

_mv("IRISH_WHIP", 1.0, {
    "RA": [K(0, 60, 0, 50), K(0.35, 80, 0, 60), K(0.6, -40, 0, 70, "snap"), K(1.0, 20, 0, 30)],
    "S":  [K(0, 0, 30, -10), K(0.35, 0, 40, -12), K(0.6, 0, -35, -14, "snap"), K(1.0, 0, 0, -5)],
    "RUL": [K(0.6, 0, 0, 25, "snap"), K(1.0, 0, 0, 0)],
}, root=[(0, 0, 0, 0), (0.35, -0.1, 0, 0), (0.6, 0.25, 0, 0, "snap"), (1.0, 0, 0, 0)],
    desc="irish whip: grab, spin, hurl")

_mv("BODYSLAM", 1.9, {
    "S":  [K(0, 0, 0, -5), K(0.4, 0, 0, -55), K(0.9, 0, 0, 8, "out"), K(1.15, 0, 0, 8),
           K(1.45, 0, 0, -70, "snap"), K(1.9, 0, 0, -5)],
    "RA": [K(0, 10, 0, 20), K(0.4, 20, 0, 60), K(0.9, 15, 0, 160, "out"), K(1.15, 15, 0, 160),
           K(1.45, 10, 0, 25, "snap"), K(1.9, 10, 0, 20)],
    "LA": [K(0, -10, 0, 20), K(0.4, -20, 0, 60), K(0.9, -15, 0, 160, "out"), K(1.15, -15, 0, 160),
           K(1.45, -10, 0, 25, "snap"), K(1.9, -10, 0, 20)],
    "RUL": [K(0.4, 0, 0, 55), K(0.9, 0, 0, 5, "out"), K(1.45, 0, 0, 40, "snap"), K(1.9, 0, 0, 0)],
    "LUL": [K(0.4, 0, 0, 55), K(0.9, 0, 0, 5, "out"), K(1.45, 0, 0, 40, "snap"), K(1.9, 0, 0, 0)],
    "RL": [K(0.4, 0, 0, -95), K(0.9, 0, 0, -8, "out"), K(1.9, 0, 0, -8)],
    "LL": [K(0.4, 0, 0, -95), K(0.9, 0, 0, -8, "out"), K(1.9, 0, 0, -8)],
}, root=[(0, 0, 0, 0), (0.4, 0, -0.16, 0), (0.9, 0, 0.02, 0, "out"),
        (1.45, 0, -0.1, 0, "snap"), (1.9, 0, 0, 0)],
    desc="bodyslam: squat, press overhead, slam")

_mv("SUPLEX", 2.1, {
    "S":  [K(0, 0, 0, -5), K(0.45, 0, 0, -50), K(1.0, 0, 0, 55, "out"), K(1.4, 0, 0, 55),
           K(1.75, 0, 0, -10, "snap"), K(2.1, 0, 0, -5)],
    "S1": [K(1.0, 0, 0, 20, "out"), K(1.4, 0, 0, 20), K(2.1, 0, 0, 0)],
    "N":  [K(1.0, 0, 0, 25, "out"), K(1.4, 0, 0, 25), K(2.1, 0, 0, 0)],
    "RA": [K(0, 10, 0, 20), K(0.45, 15, 0, 70), K(1.0, 20, 0, 140, "out"), K(1.4, 20, 0, 140),
           K(2.1, 10, 0, 20)],
    "LA": [K(0, -10, 0, 20), K(0.45, -15, 0, 70), K(1.0, -20, 0, 140, "out"), K(1.4, -20, 0, 140),
           K(2.1, -10, 0, 20)],
    "RUL": [K(0.45, 0, 0, 50), K(1.0, 0, 0, 5, "out"), K(2.1, 0, 0, 0)],
    "LUL": [K(0.45, 0, 0, 50), K(1.0, 0, 0, 5, "out"), K(2.1, 0, 0, 0)],
    "RL": [K(0.45, 0, 0, -90), K(1.0, 0, 0, -8, "out"), K(2.1, 0, 0, -8)],
    "LL": [K(0.45, 0, 0, -90), K(1.0, 0, 0, -8, "out"), K(2.1, 0, 0, -8)],
}, root=[(0, 0, 0, 0), (0.45, 0, -0.15, 0), (1.0, -0.1, 0.05, 0, "out"),
        (1.4, -0.1, 0.05, 0), (1.75, 0, -0.05, 0, "snap"), (2.1, 0, 0, 0)],
    desc="vertical suplex with bridge")

_mv("DDT", 1.5, {
    "S":  [K(0, 0, 0, -8), K(0.35, 0, 0, -35), K(0.6, 0, 0, -55), K(0.8, 0, 0, -60, "snap"),
           K(1.1, 0, 0, -45), K(1.5, 0, 0, -8)],
    "N":  [K(0.35, 0, 0, -20), K(0.8, 0, 0, -35, "snap"), K(1.5, 0, 0, 0)],
    "RA": [K(0, 15, 0, 55), K(0.35, 20, 0, 75), K(0.8, 25, 0, 85, "snap"), K(1.5, 15, 0, 55)],
    "LA": [K(0, -15, 0, 55), K(0.8, -25, 0, 85, "snap"), K(1.5, -15, 0, 55)],
    "RUL": [K(0.6, 0, 0, 40), K(0.8, 0, 0, 55, "snap"), K(1.5, 0, 0, 0)],
    "LUL": [K(0.6, 0, 0, 40), K(0.8, 0, 0, 55, "snap"), K(1.5, 0, 0, 0)],
    "RL": [K(0.6, 0, 0, -75), K(0.8, 0, 0, -95, "snap"), K(1.5, 0, 0, -8)],
    "LL": [K(0.6, 0, 0, -75), K(0.8, 0, 0, -95, "snap"), K(1.5, 0, 0, -8)],
}, root=[(0, 0, 0, 0), (0.6, 0, -0.1, 0), (0.8, 0, -0.3, 0, "snap"), (1.1, 0, -0.22, 0), (1.5, 0, 0, 0)],
    desc="DDT: front facelock tuck and drop")

_mv("POWERBOMB", 2.3, {
    "S":  [K(0, 0, 0, -5), K(0.5, 0, 0, -60), K(1.1, 0, 0, 5, "out"), K(1.5, 0, 0, 5),
           K(1.8, 0, 0, -35, "snap"), K(2.3, 0, 0, -5)],
    "RA": [K(0, 10, 0, 20), K(0.5, 20, 0, 80), K(1.1, 25, 0, 130, "out"), K(1.5, 25, 0, 130),
           K(1.8, 15, 0, 40, "snap"), K(2.3, 10, 0, 20)],
    "LA": [K(0, -10, 0, 20), K(0.5, -20, 0, 80), K(1.1, -25, 0, 130, "out"), K(1.5, -25, 0, 130),
           K(1.8, -15, 0, 40, "snap"), K(2.3, -10, 0, 20)],
    "RUL": [K(0.5, 0, 0, 60), K(1.1, 0, 0, 5, "out"), K(1.8, 0, 0, 75, "snap"), K(2.3, 0, 0, 0)],
    "LUL": [K(0.5, 0, 0, 60), K(1.1, 0, 0, 5, "out"), K(1.8, 0, 0, 75, "snap"), K(2.3, 0, 0, 0)],
    "RL": [K(0.5, 0, 0, -105), K(1.1, 0, 0, -8, "out"), K(1.8, 0, 0, -120, "snap"), K(2.3, 0, 0, -8)],
    "LL": [K(0.5, 0, 0, -105), K(1.1, 0, 0, -8, "out"), K(1.8, 0, 0, -120, "snap"), K(2.3, 0, 0, -8)],
}, root=[(0, 0, 0, 0), (0.5, 0, -0.18, 0), (1.1, 0, 0, 0, "out"),
        (1.8, 0, -0.3, 0, "snap"), (2.3, 0, 0, 0)],
    desc="powerbomb: hoist to shoulders, sit-out slam")

_mv("CHOKESLAM", 1.9, {
    "RA": [K(0, 10, 0, 20), K(0.5, 10, 0, 150, "out"), K(0.9, 10, 0, 165), K(1.2, 10, 0, 40, "snap"),
           K(1.9, 10, 0, 20)],
    "S":  [K(0, 0, 0, -5), K(0.5, 0, 0, 10, "out"), K(0.9, 0, 0, 12), K(1.2, 0, 0, -55, "snap"),
           K(1.9, 0, 0, -5)],
    "RUL": [K(1.2, 0, 0, 45, "snap"), K(1.9, 0, 0, 0)],
    "LUL": [K(1.2, 0, 0, 45, "snap"), K(1.9, 0, 0, 0)],
    "RL": [K(1.2, 0, 0, -80, "snap"), K(1.9, 0, 0, -8)],
    "LL": [K(1.2, 0, 0, -80, "snap"), K(1.9, 0, 0, -8)],
    "LA": [K(0.5, -30, 0, 40, "out"), K(1.9, -10, 0, 20)],
}, root=[(0, 0, 0, 0), (0.5, 0, 0.02, 0, "out"), (1.2, 0, -0.12, 0, "snap"), (1.9, 0, 0, 0)],
    desc="chokeslam: one-hand throat lift and drive")

_mv("PILEDRIVER", 2.1, {
    "S":  [K(0, 0, 0, -5), K(0.5, 0, 0, -70), K(1.0, 0, 0, -20, "out"), K(1.3, 0, 0, -25),
           K(1.55, 0, 0, -75, "snap"), K(2.1, 0, 0, -5)],
    "RA": [K(0.5, 15, 0, 60), K(1.0, 20, 0, 110, "out"), K(1.55, 15, 0, 50, "snap"), K(2.1, 10, 0, 20)],
    "LA": [K(0.5, -15, 0, 60), K(1.0, -20, 0, 110, "out"), K(1.55, -15, 0, 50, "snap"), K(2.1, -10, 0, 20)],
    "RUL": [K(0.5, 0, 0, 55), K(1.0, 0, 0, 10, "out"), K(1.55, 0, 0, 80, "snap"), K(2.1, 0, 0, 0)],
    "LUL": [K(0.5, 0, 0, 55), K(1.0, 0, 0, 10, "out"), K(1.55, 0, 0, 80, "snap"), K(2.1, 0, 0, 0)],
    "RL": [K(0.5, 0, 0, -100), K(1.0, 0, 0, -15, "out"), K(1.55, 0, 0, -125, "snap"), K(2.1, 0, 0, -8)],
    "LL": [K(0.5, 0, 0, -100), K(1.0, 0, 0, -15, "out"), K(1.55, 0, 0, -125, "snap"), K(2.1, 0, 0, -8)],
    "N":  [K(1.0, 0, 0, -15), K(2.1, 0, 0, 0)],
}, root=[(0, 0, 0, 0), (0.5, 0, -0.16, 0), (1.0, 0, -0.02, 0, "out"),
        (1.55, 0, -0.32, 0, "snap"), (2.1, 0, 0, 0)],
    desc="piledriver: hoist inverted, sit-out drop")

_mv("GERMAN_SUPLEX", 2.0, {
    "S":  [K(0, 0, 0, -5), K(0.4, 0, 0, -45), K(0.9, 0, 0, 65, "out"), K(1.3, 0, 0, 65),
           K(1.6, 0, 0, 0, "snap"), K(2.0, 0, 0, -5)],
    "RA": [K(0.4, 25, 0, -20), K(0.9, 30, 0, -30, "out"), K(2.0, 10, 0, 20)],
    "LA": [K(0.4, -25, 0, -20), K(0.9, -30, 0, -30, "out"), K(2.0, -10, 0, 20)],
    "N":  [K(0.9, 0, 0, 30, "out"), K(1.3, 0, 0, 30), K(2.0, 0, 0, 0)],
    "RUL": [K(0.4, 0, 0, 45), K(0.9, 0, 0, 10, "out"), K(2.0, 0, 0, 0)],
    "LUL": [K(0.4, 0, 0, 45), K(0.9, 0, 0, 10, "out"), K(2.0, 0, 0, 0)],
    "RL": [K(0.4, 0, 0, -80), K(0.9, 0, 0, -10, "out"), K(2.0, 0, 0, -8)],
    "LL": [K(0.4, 0, 0, -80), K(0.9, 0, 0, -10, "out"), K(2.0, 0, 0, -8)],
}, root=[(0, 0, 0, 0), (0.4, 0, -0.14, 0), (0.9, -0.15, 0.02, 0, "out"),
        (1.6, -0.1, -0.08, 0, "snap"), (2.0, 0, 0, 0)],
    desc="german suplex: waistlock bridge")

_mv("HURRICANRANA", 1.7, {
    "H":  [K(0, 0, 0, 0), K(0.35, 0, 0, 0), K(1.15, 0, 0, -360, "out"), K(1.7, 0, 0, -360)],
    "RUL": [K(0, 0, 0, 10), K(0.35, 0, 0, 85), K(1.15, 0, 0, 60, "out"), K(1.7, 0, 0, 10)],
    "LUL": [K(0, 0, 0, 10), K(0.35, 0, 0, 85), K(1.15, 0, 0, 60, "out"), K(1.7, 0, 0, 10)],
    "RL": [K(0.35, 0, 0, -100), K(1.15, 0, 0, -90, "out"), K(1.7, 0, 0, -8)],
    "LL": [K(0.35, 0, 0, -100), K(1.15, 0, 0, -90, "out"), K(1.7, 0, 0, -8)],
    "S":  [K(0.35, 0, 0, -30), K(1.15, 0, 0, -45, "out"), K(1.7, 0, 0, -5)],
    "RA": [K(0.35, 40, 0, 100), K(1.15, 40, 0, 90, "out"), K(1.7, 10, 0, 20)],
    "LA": [K(0.35, -40, 0, 100), K(1.15, -40, 0, 90, "out"), K(1.7, -10, 0, 20)],
}, root=[(0, 0, 0, 0), (0.35, 0, -0.12, 0), (0.55, 0.1, 0.28, 0, "out"),
        (1.15, 0.1, 0.1, 0, "out"), (1.7, 0, 0, 0)],
    desc="hurricanrana: springboard front flip (tucked)")

_mv("ARMDRAG", 1.2, {
    "RA": [K(0, 30, 0, 60), K(0.4, 55, 0, 80), K(0.65, -50, 0, 60, "snap"), K(1.2, 10, 0, 20)],
    "S":  [K(0, 0, 10, -10), K(0.4, 0, 25, -15), K(0.65, 0, -40, -20, "snap"), K(1.2, 0, 0, -5)],
    "RUL": [K(0.65, 0, 0, 30, "snap"), K(1.2, 0, 0, 0)],
}, root=[(0, 0, 0, 0), (0.4, -0.1, -0.05, 0), (0.65, 0.2, 0, 0, "snap"), (1.2, 0, 0, 0)],
    desc="armdrag: pull arm, twist and throw")

_mv("HIP_TOSS", 1.5, {
    "S":  [K(0, 0, 0, -8), K(0.4, 0, 0, -30), K(0.7, 0, 20, 25, "snap"), K(1.0, 0, 20, 25),
           K(1.5, 0, 0, -5)],
    "RA": [K(0.4, 20, 0, 70), K(0.7, 60, 0, 90, "snap"), K(1.5, 10, 0, 20)],
    "LA": [K(0.4, -20, 0, 70), K(0.7, -10, 0, 80, "snap"), K(1.5, -10, 0, 20)],
    "RUL": [K(0.4, 0, 0, 40), K(0.7, 0, 0, 60, "snap"), K(1.5, 0, 0, 0)],
    "LUL": [K(0.4, 0, 0, 40), K(1.5, 0, 0, 0)],
    "RL": [K(0.4, 0, 0, -75), K(1.5, 0, 0, -8)],
    "LL": [K(0.4, 0, 0, -75), K(1.5, 0, 0, -8)],
}, root=[(0, 0, 0, 0), (0.4, 0, -0.1, 0), (0.7, -0.15, 0.05, 0, "snap"), (1.5, 0, 0, 0)],
    desc="hip toss: bump hip, throw over")

_mv("BACKDROP", 1.6, {
    "S":  [K(0, 0, 0, -5), K(0.4, 0, 0, -45), K(0.8, 0, 0, 70, "snap"), K(1.1, 0, 0, 70),
           K(1.6, 0, 0, -5)],
    "N":  [K(0.8, 0, 0, 30, "snap"), K(1.6, 0, 0, 0)],
    "RA": [K(0.4, 15, 0, 60), K(0.8, 25, 0, 120, "snap"), K(1.6, 10, 0, 20)],
    "LA": [K(0.4, -15, 0, 60), K(0.8, -25, 0, 120, "snap"), K(1.6, -10, 0, 20)],
    "RUL": [K(0.4, 0, 0, 50), K(0.8, 0, 0, 15, "snap"), K(1.6, 0, 0, 0)],
    "LUL": [K(0.4, 0, 0, 50), K(0.8, 0, 0, 15, "snap"), K(1.6, 0, 0, 0)],
    "RL": [K(0.4, 0, 0, -90), K(1.6, 0, 0, -8)],
    "LL": [K(0.4, 0, 0, -90), K(1.6, 0, 0, -8)],
}, root=[(0, 0, 0, 0), (0.4, 0, -0.14, 0), (0.8, -0.2, -0.05, 0, "snap"),
        (1.1, -0.2, -0.05, 0), (1.6, 0, 0, 0)],
    desc="backdrop: deep arch, throw overhead backward")

# ---- knockdown / pin / getup ----
_mv("KNOCKDOWN", 1.1, {
    "S":  [K(0, 0, 0, -5), K(0.35, 0, 0, 45, "in"), K(0.6, 0, 0, 70, "snap"), K(1.1, 0, 0, 70)],
    "S1": [K(0.6, 0, 0, 15, "snap"), K(1.1, 0, 0, 15)],
    "N":  [K(0.6, 0, 0, 25, "snap"), K(1.1, 0, 0, 25)],
    "RA": [K(0.35, 55, 0, 30, "in"), K(0.6, 70, 0, 40, "snap"), K(1.1, 70, 0, 40)],
    "LA": [K(0.35, -55, 0, 30, "in"), K(0.6, -70, 0, 40, "snap"), K(1.1, -70, 0, 40)],
    "RUL": [K(0.6, 0, 0, 20, "snap"), K(1.1, 0, 0, 20)],
    "LUL": [K(0.6, 0, 0, 20, "snap"), K(1.1, 0, 0, 20)],
    "RL": [K(0.6, 0, 0, -25, "snap"), K(1.1, 0, 0, -25)],
    "LL": [K(0.6, 0, 0, -25, "snap"), K(1.1, 0, 0, -25)],
}, root=[(0, 0, 0, 0), (0.35, 0, -0.1, 0, "in"), (0.6, -0.15, -0.32, 0, "snap"), (1.1, -0.15, -0.32, 0)],
    desc="knocked flat onto the back")

_mv("GETUP", 1.7, {
    "S":  [K(0, 0, 0, 55), K(0.6, 0, 0, 10), K(1.1, 0, 0, -25), K(1.7, 0, 0, -5)],
    "RA": [K(0, 40, 0, 60), K(0.6, 25, 0, 70), K(1.1, 15, 0, 40), K(1.7, 10, 0, 20)],
    "LA": [K(0, -40, 0, 60), K(0.6, -25, 0, 70), K(1.1, -15, 0, 40), K(1.7, -10, 0, 20)],
    "RUL": [K(0, 0, 0, 75), K(0.6, 0, 0, 85), K(1.1, 0, 0, 45), K(1.7, 0, 0, 0)],
    "LUL": [K(0, 0, 0, 75), K(0.6, 0, 0, 85), K(1.1, 0, 0, 45), K(1.7, 0, 0, 0)],
    "RL": [K(0, 0, 0, -110), K(0.6, 0, 0, -120), K(1.1, 0, 0, -80), K(1.7, 0, 0, -8)],
    "LL": [K(0, 0, 0, -110), K(0.6, 0, 0, -120), K(1.1, 0, 0, -80), K(1.7, 0, 0, -8)],
    "N":  [K(0, 0, 0, 20), K(1.7, 0, 0, 0)],
}, root=[(0, -0.1, -0.3, 0), (0.6, -0.05, -0.28, 0), (1.1, 0, -0.12, 0), (1.7, 0, 0, 0)],
    desc="getup: from knees to standing")

_mv("PINFALL", 2.1, {
    "RUL": [K(0, 0, 0, 5), K(0.5, 0, 0, 80), K(1.7, 0, 0, 80), K(2.1, 0, 0, 5)],
    "LUL": [K(0, 0, 0, 5), K(0.5, 0, 0, 80), K(1.7, 0, 0, 80), K(2.1, 0, 0, 5)],
    "RL": [K(0, 0, 0, -8), K(0.5, 0, 0, -115), K(1.7, 0, 0, -115), K(2.1, 0, 0, -8)],
    "LL": [K(0, 0, 0, -8), K(0.5, 0, 0, -115), K(1.7, 0, 0, -115), K(2.1, 0, 0, -8)],
    "S":  [K(0, 0, 0, -5), K(0.5, 0, 0, -15), K(0.9, 0, 0, -55, "out"), K(1.5, 0, 0, -58),
           K(2.1, 0, 0, -5)],
    "RA": [K(0.5, 10, 0, 30), K(0.9, 45, 0, 95, "out"), K(1.5, 45, 0, 95), K(2.1, 10, 0, 20)],
    "LA": [K(0.5, -10, 0, 30), K(0.9, -20, 0, 40, "out"), K(2.1, -10, 0, 20)],
    "N":  [K(0.9, 0, 0, -20, "out"), K(2.1, 0, 0, 0)],
}, root=[(0, 0, 0, 0), (0.5, 0, -0.3, 0), (0.9, 0.1, -0.32, 0, "out"),
        (1.5, 0.1, -0.3, 0), (2.1, 0, 0, 0)],
    desc="pinfall: drop to knees, hook the leg, press")

# ------------------------------------------------------------------ baking --
FPS = 30

def _sample_keys(keys, dur):
    """keys: [(t,(rx,ry,rz),ease)] -> list of euler per frame (baked with easing)."""
    keys = sorted(keys, key=lambda k: k[0])
    n = int(round(dur * FPS)) + 1
    out = []
    for f in range(n):
        t = f / FPS
        if t <= keys[0][0]:
            out.append(keys[0][1]); continue
        if t >= keys[-1][0]:
            out.append(keys[-1][1]); continue
        for a, b in zip(keys, keys[1:]):
            if a[0] <= t <= b[0]:
                span = (b[0] - a[0]) or 1e-9
                u = EASES.get(b[2], EASES["smooth"])((t - a[0]) / span)
                ea, eb = a[1], b[1]
                out.append(tuple(ea[i] + (eb[i] - ea[i]) * u for i in range(3)))
                break
    return out

def bake_move(name):
    """Bake a move -> {node_alias: [quat per frame], '_root': [(dx,dy,dz) per frame], dur}."""
    mv = MOVES[name]
    dur = mv["dur"]
    baked = {"dur": dur, "loop": mv["loop"], "desc": mv["desc"]}
    for alias, keys in mv["bones"].items():
        frames = _sample_keys(keys, dur)
        baked[alias] = [euler_to_quat(*e) for e in frames]
    if mv["root"]:
        # root keys are (t, dx, dy, dz[, ease])
        rkeys = sorted([(k[0], (k[1], k[2], k[3]), k[4] if len(k) > 4 else "smooth")
                        for k in mv["root"]], key=lambda k: k[0])
        n = int(round(dur * FPS)) + 1
        seq = []
        for f in range(n):
            t = f / FPS
            if t <= rkeys[0][0]: seq.append(rkeys[0][1]); continue
            if t >= rkeys[-1][0]: seq.append(rkeys[-1][1]); continue
            for a, b in zip(rkeys, rkeys[1:]):
                if a[0] <= t <= b[0]:
                    span = (b[0] - a[0]) or 1e-9
                    u = EASES.get(b[2], EASES["smooth"])((t - a[0]) / span)
                    seq.append(tuple(a[1][i] + (b[1][i] - a[1][i]) * u for i in range(3)))
                    break
        baked["_root"] = seq
    return baked

# ------------------------------------------------------------------ export --
def _skeleton_only_glb():
    """Build a minimal GLB containing just the 58-bone skeleton (for previews)."""
    import numpy as np
    nodes = []
    # chain definitions: (name, parent_name, offset)
    chain = [
        ("mixamorig:Hips", None, (0, 0.95, 0)),
        ("mixamorig:Spine", "mixamorig:Hips", (0, 0.10, 0)),
        ("mixamorig:Spine1", "mixamorig:Spine", (0, 0.10, 0)),
        ("mixamorig:Spine2", "mixamorig:Spine1", (0, 0.12, 0)),
        ("mixamorig:Neck", "mixamorig:Spine2", (0, 0.13, 0)),
        ("mixamorig:Head", "mixamorig:Neck", (0, 0.10, 0)),
        ("mixamorig:RightShoulder", "mixamorig:Spine2", (0, 0.10, -0.07)),
        ("mixamorig:RightArm", "mixamorig:RightShoulder", (0, -0.06, -0.13)),
        ("mixamorig:RightForeArm", "mixamorig:RightArm", (0, -0.20, -0.13)),
        ("mixamorig:RightHand", "mixamorig:RightForeArm", (0, -0.20, 0)),
        ("mixamorig:LeftShoulder", "mixamorig:Spine2", (0, 0.10, 0.07)),
        ("mixamorig:LeftArm", "mixamorig:LeftShoulder", (0, -0.06, 0.13)),
        ("mixamorig:LeftForeArm", "mixamorig:LeftArm", (0, -0.20, 0.13)),
        ("mixamorig:LeftHand", "mixamorig:LeftForeArm", (0, -0.20, 0)),
        ("mixamorig:RightUpLeg", "mixamorig:Hips", (0, -0.05, -0.11)),
        ("mixamorig:RightLeg", "mixamorig:RightUpLeg", (0, -0.47, 0)),
        ("mixamorig:RightFoot", "mixamorig:RightLeg", (0, -0.49, 0)),
        ("mixamorig:RightToeBase", "mixamorig:RightFoot", (0.14, -0.06, 0)),
        ("mixamorig:LeftUpLeg", "mixamorig:Hips", (0, -0.05, 0.11)),
        ("mixamorig:LeftLeg", "mixamorig:LeftUpLeg", (0, -0.47, 0)),
        ("mixamorig:LeftFoot", "mixamorig:LeftLeg", (0, -0.49, 0)),
        ("mixamorig:LeftToeBase", "mixamorig:LeftFoot", (0.14, -0.06, 0)),
    ]
    idx = {}
    for i, (nm, parent, off) in enumerate(chain):
        idx[nm] = i
        nodes.append({"name": nm, "translation": list(off), "children": []})
    for i, (nm, parent, off) in enumerate(chain):
        if parent: nodes[idx[parent]]["children"].append(i)
    js = {"asset": {"version": "2.0", "generator": "bannon-procedural-moves"},
          "scene": 0, "scenes": [{"nodes": [0]}],
          "nodes": nodes, "buffers": [], "bufferViews": [], "accessors": []}
    return js, bytearray()

def inject_animation(js, bin_data, anim_name, baked, node_index_of):
    """Append one baked move as a glTF animation. node_index_of: bone full name -> node idx."""
    tracks = []
    n_frames = None
    for alias, quats in baked.items():
        if alias.startswith("_") or alias in ("dur", "loop", "desc"):
            continue
        full = B[alias]
        if full not in node_index_of:
            continue
        node = node_index_of[full]
        n = len(quats)
        n_frames = n
        times = [i / FPS for i in range(n)]
        vals = [tuple(float(v) for v in q) for q in quats]
        tracks.append({"node": node, "path": "rotation", "times": times, "values": vals})
    if "_root" in baked:
        full = B["H"]
        if full in node_index_of:
            seq = baked["_root"]
            n_frames = len(seq)
            tracks.append({"node": node_index_of[full], "path": "translation",
                           "times": [i / FPS for i in range(len(seq))],
                           "values": [tuple(float(v) for v in p) for p in seq]})
    # NOTE: translation track overrides bind translation; compose with rest offset.
    glb_anim.add_animation(js, bin_data, anim_name, tracks, compose_translation=node_index_of.get(B["H"]))
    return js

def _node_index_of(js):
    return {nd.get("name", ""): i for i, nd in enumerate(js["nodes"])}

def export_move_onto_glb(move_name, src_glb, dst_glb):
    js, bin_data = glb_anim.read_glb(src_glb)
    baked = bake_move(move_name)
    # compose animated rotations over rest pose
    inject_animation(js, bin_data, f"MOVE_{move_name}", baked, _node_index_of(js))
    glb_anim.write_glb(dst_glb, js, bin_data)
    return dst_glb

def export_move_skeleton_only(move_name, dst_glb):
    js, bin_data = _skeleton_only_glb()
    baked = bake_move(move_name)
    inject_animation(js, bin_data, f"MOVE_{move_name}", baked, _node_index_of(js))
    glb_anim.write_glb(dst_glb, js, bin_data)
    return dst_glb

def write_catalog(path):
    cat = {k: {"dur": v["dur"], "loop": v["loop"], "desc": v["desc"],
               "bones": sorted(v["bones"].keys())} for k, v in MOVES.items()}
    with open(path, "w") as f:
        json.dump(cat, f, indent=1)
    return path

# ------------------------------------------------------------------ CLI ----
def main():
    ap = argparse.ArgumentParser(description="Bannon procedural wrestling-move generator")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--move")
    ap.add_argument("--on", help="character GLB to inject the animation into")
    ap.add_argument("--out")
    ap.add_argument("--outdir")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--skeleton-only", action="store_true")
    ap.add_argument("--catalog", action="store_true")
    a = ap.parse_args()

    if a.list:
        for k in sorted(MOVES):
            v = MOVES[k]
            print(f"{k:16s} {v['dur']:4.1f}s {'loop' if v['loop'] else 'once'}  {v['desc']}")
        print(f"\n{len(MOVES)} moves")
        return
    if a.catalog:
        p = a.out or os.path.join(os.path.dirname(os.path.abspath(__file__)), "motion_catalog.json")
        write_catalog(p); print("wrote", p); return
    if a.all:
        assert a.on and a.outdir, "--all needs --on and --outdir"
        os.makedirs(a.outdir, exist_ok=True)
        for k in sorted(MOVES):
            export_move_onto_glb(k, a.on, os.path.join(a.outdir, f"CHAR_{k}.glb"))
            print("wrote", k)
        return
    assert a.move and a.out, "--move and --out required"
    if a.skeleton_only:
        export_move_skeleton_only(a.move, a.out)
    else:
        assert a.on, "--on required (or --skeleton-only)"
        export_move_onto_glb(a.move, a.on, a.out)
    print("wrote", a.out, "move", a.move)

if __name__ == "__main__":
    main()
