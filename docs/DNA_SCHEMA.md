# BANNON DNA — the CAW payload schema (engine-agnostic character recipe)

A character is **never** saved as a 3D file. It is a small JSON **recipe** that
reshapes a base mesh at spawn. `window.BANNON_DNA` implements it against the
procedural body today; the SAME schema drives a rigged base GLB tomorrow and the
UE5/Unity port after that. This file is the contract — do not rename keys.

## Schema (v1)
```jsonc
{
  "v": 1,                 // schema version (bump + migrate on breaking change)
  "name": "BANNON",
  "base": "male",         // which BASE MESH the recipe reshapes ("male" | "female")
  "shape": { ... },       // full flat morph state (procedural body reads this directly)
  "morphs": { ... },      // MASS + FACE sliders  -> GLB: mesh.morphTargetInfluences[i]
  "boneScale": { ... },   // LENGTH/PROPORTION     -> GLB: skeleton.bones[i].scale
  "spec": {               // palette + attire + identity
    "build": 1.0,
    "name": "BANNON", "style": "allrounder", "attireStyle": "TRUNKS", "hairStyle": "DREADS",
    "skin": 12345, "hair": 0, "trunk": 0, "accent": 0, "band": 0, "boot": 0, "eye": 0,
    "ink": {...}, "scar": {...}
  }
}
```
`shape` is the source of truth for the procedural body. `morphs`/`boneScale` are the
same values pre-split for the rigged path: `BONE_KEYS = [height, armLen, legLen,
torsoLen]` → `bone.scale`; everything else (chest, shoulders, waist, muscularity,
faceJawW, faceCheek, bust, lats, neckW …) → `morphTargetInfluences`.

## API (`window.BANNON_DNA`)
- `capture(f)` → recipe object (value-only deep clone; no live refs).
- `apply(f, dna)` → reshape a live fighter from a recipe.
- `export(f)` / `import(f, json)` → JSON string round-trip (share/paste).
- `save(name, f)` / `load(name, f)` / `list()` / `remove(name)` → localStorage library.

## The port mapping (procedural today → GLB → native)
| DNA field       | Procedural body (now)        | Base GLB in three.js         | UE5 / Unity                       |
|-----------------|------------------------------|------------------------------|-----------------------------------|
| `morphs`        | recompute tube relief/girth  | `morphTargetInfluences[i]=w` | MorphTarget / BlendShape weight   |
| `boneScale`     | REST joint scaling           | `skeleton.bones[i].scale`    | bone local scale + collider recalc|
| `spec.*colors`  | vertex-colour repaint        | OffscreenCanvas → CanvasTexture | RenderTarget / dynamic material |
| `spec.attire`   | painted regions              | cloth mesh toggle + tint     | modular attire mesh + material    |

Because SAVE is a recipe (≈0.5 KB), a whole roster of custom fighters costs almost
nothing and loads instantly — the engine spawns the base mesh and injects the DNA
before the bell. Verified: a captured DNA (height 1.15 / chest 1.4 / jaw 1.3 / skin
0xaa6644) exports to a 499-byte JSON and round-trips onto a different fighter exactly.
