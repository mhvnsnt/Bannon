# BANNON base-GLB shape-key contract (author to this exactly)

This is the naming contract the authored high-poly base mesh (Blender/Maya, or a forge-generated +
shape-keyed mesh) MUST follow. When a GLB with these blendshape names loads, the engine's
`applyShapeMorphs` does an **exact, deterministic** match from the CAW/DNA `f.shape` → the mesh's
`morphTargetInfluences` (see `window.DNA_TO_MORPH` in the engine). No guessing, no per-mesh rewiring.

## Base mesh requirements
- One optimized **SkinnedMesh** (male base; a female base is a second GLB), ~40–80k tris, universal UV.
- Humanoid rig, Mixamo-style bone names (binds to the fight rig via BONE_MAP).
- **Anatomical edge loops** at shoulders/elbows/knees/knuckles so it deforms in grapple/crumple states.
- Each slider below = one **shape key (blendshape)** named EXACTLY as in the "Morph name" column.
- Draco compress + KTX2 textures for size.

## Value semantics (how the engine drives them)
- **Physique keys** (`Body_Muscular`, `Body_Gut`, `Body_Feminine`): the slider is 0..1 and drives the
  influence **directly** (0 = base, 1 = full). Sculpt the shape key as the *full* state.
- **Size keys** (`*_Size`, face keys): the CAW slider is 0.4..2.3 with **1.0 = neutral**. The engine
  sends influence `= clamp(slider − 1, 0, 1)`, i.e. the shape key is the **enlarged/max** state; the
  neutral (slider ≤ 1) look is the base mesh itself. (For "smaller than base", author a paired
  `*_Small` key later — v2 of this contract.)

## The keys (must exist; extras are fine)
| CAW/DNA key | Morph name (author this) |
|---|---|
| muscularity | `Body_Muscular` |
| bodyFat | `Body_Gut` |
| fem | `Body_Feminine` |
| chest | `Chest_Size` |
| bust | `Bust_Size` |
| arms | `Arms_Size` |
| forearms | `Forearms_Size` |
| shoulders | `Shoulders_Size` |
| traps | `Traps_Size` |
| waist | `Waist_Size` |
| hips | `Hips_Size` |
| glutes | `Glutes_Size` |
| thighs | `Thighs_Size` |
| calves | `Calves_Size` |
| neck | `Neck_Size` |
| hands | `Hands_Size` |
| feet | `Feet_Size` |
| head | `Head_Size` |
| faceJawW | `Jaw_Width` |
| faceJawL | `Jaw_Length` |
| faceSkullW | `Skull_Width` |
| faceSkullL | `Skull_Length` |
| faceCheek | `Cheek_Size` |
| faceChin | `Chin_Projection` |
| faceBrow | `Brow_Ridge` |
| faceBrowW | `Brow_Width` |
| faceNose | `Nose_Size` |
| faceNoseL | `Nose_Length` |
| faceEye | `Eye_Size` |
| faceEyeSpread | `Eye_Spread` |
| faceEyeH | `Eye_Height` |
| faceMouthW | `Mouth_Width` |
| faceMouthH | `Mouth_Height` |
| faceLips | `Lip_Fullness` |
| faceEars | `Ear_Size` |
| faceEarH | `Ear_Height` |

## NOT shape keys
- **Proportion / length** (`height`, `armLen`, `legLen`, `torsoLen`): driven by **bone scale**
  (`applyShapeMorphs` scales the spine/arm/leg bones), not blendshapes.
- **Micro-detail** (veins, iris dilation, sweat, pore intensity): driven by **shader uniforms** on the
  skin/eye material, not blendshapes. Expose a custom material with `userData.shader.uniforms`
  (e.g. `uVeinIntensity`) — the engine can push `veinProminence` etc. into it.

## Handshake (already wired)
1. GLTFLoader unpacks the base mesh → `_bindFighterGltf` records `morphMap`/`morphNames`.
2. `applyShapeMorphs(f)` (called on bind + on every CAW/DNA edit via `applyFighterSpec`) maps
   `f.shape` → `userData.shapeMorphs` via `DNA_TO_MORPH`.
3. The per-frame morph apply folds `shapeMorphs` into `morphTargetInfluences` — GPU-blended in-shader.

Deliver the base GLB conforming to this and every existing CAW slider + saved DNA recipe drives it
with zero code changes.
