# Open / CC0 mocap drop folder

Drop **.bvh** files here and they are loadable by the game with no other step:
`loadClipFor('<basename>')` finds them, `extractClipFromGLTF` bakes them into a STUDIO clip, and
`tools/mocap/index_open_mocap.cjs` registers them so the auto-mappers can bind them to moves.

## Why BVH
It is the format essentially every free motion-capture library ships in. The game previously loaded
**only FBX**, so none of that material was usable no matter how much was downloaded. BVHLoader is now
vendored (`assets/vendor/BVHLoader.js`), so a CC0 pack works the moment it lands here.

## Bone names
CMU-style BVH skeletons (`Hips`, `Spine`, `LeftArm`, `LeftForeArm`, `LeftLeg`, `LeftFoot` …) already
match `MOCAP_BONE_MAP` — the map strips a `mixamorig` prefix that simply isn't there and matches on
the rest. **Elbows and knees included**, since `LeftForeArm` -> elbow and `LeftLeg` -> knee were
fixed in the same pass that made mocap drive combat at all.

## Licensing — read before adding anything
This is a **commercial** game. Only add material whose licence permits that:

| Source | Licence | Safe to ship |
|---|---|---|
| CMU Graphics Lab Motion Capture Database | "free for all uses" | yes |
| Truebones free packs (CC0 sets only) | CC0 | yes |
| Mixamo | free with an Adobe account, royalty-free in a product | yes |
| AMASS / SFU / most academic sets | research-only | **no** |
| Ubisoft LAFAN1 | non-commercial research | **no** |

Record the source and licence of every pack in `LICENSES.md` beside the files. A clip with no
recorded licence should be treated as unusable, because later nobody will remember where it came from.
