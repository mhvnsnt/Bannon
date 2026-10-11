# Objective model-bind check (stop eyeballing renders)

There is NO known-good skinned model in the repo — every skinned GLB is broken through the ENGINE
RETARGET, not the model. This tool does NOT assume any render is "clean". It uses the procedural
FIGHT RIG (the physics skeleton the retarget is supposed to follow) as an internal-consistency
yardstick: it binds a GLB on a fighter, drops to idle, and MEASURES whether each driven GLB bone
actually lands where the physics joint it's mapped to is. If a GLB's LeftHand bone doesn't track the
rig's left-hand joint, the bind is wrong — independent of anyone's visual judgment.

`node tools/model_diag/objcheck.cjs` (needs the pwtest harness) prints:
- PROCEDURAL RIG (reference): haL/haR/ftL/ftR/chest/head world positions.
- GLB DRIVEN BONES: LeftHand/RightHand/LeftFoot/RightFoot/Head + mesh Y range + low-vert %.

A CORRECT bind must match the procedural rig: both hands FORWARD of the chest (guard), LeftHand at
+Z / RightHand at -Z, feet on the ground at ±Z. 2026-07-18 measurement of BANNON_rigged showed the
RETARGET ARM-AIM BUG: RightHand driven BEHIND the body (x=-2.29 vs chest -2.16) while LeftHand thrust
forward (x=-1.71), Z collapsed to center — i.e. reversed/asymmetric guard. Feet geometry present
(mesh reaches y~0, foot bones at correct ±Z) but the foot MESH isn't deforming with the bones.
FIX TARGET: the arm branch of `_aimLocal`/the retarget (BANNON_v150.html ~14508-14556), validated by
re-running this test until GLB bones match the procedural reference — NOT by screenshot.
