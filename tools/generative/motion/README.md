# motion/ — procedural wrestling animation

34 deterministic moves, zero ML, zero GPU. Each move is a compact keyframe table
(`procedural_moves.py`, `MOVES` dict) baked at 30fps with per-segment easing and
exported as a glTF animation onto the 58-bone Mixamo skeleton.

Bone-local axis cheat-sheet (rest rotations are identity, so local == world):
character faces +X, up +Y, character's right −Z.
- `rz +` : arm swings forward / spine leans back / shin kicks forward
- `rz −` : spine bends forward / knee bends (heel to butt)
- `rx +` : right arm abducts sideways (left arm: adducts — mirror it)
- `ry −` : torso twists right-shoulder-forward (punch rotation)

Workflow: author/edit a move → `preview.py` renders a 5-frame stick-figure strip
→ **look at the PNG** → fix → then inject into a character GLB. Never ship a
move you haven't seen.

`glb_anim` (in `../common`) appends the animation to the GLB's BIN chunk without
re-encoding meshes — skin, materials, and node names survive untouched.
