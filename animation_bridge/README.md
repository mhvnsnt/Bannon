# Bannon Animation Source Bridge

This lane is intentionally independent from character skinning/rigging.

## Why this exists

The current browser failure says:

- BANNON.glb → no animation clips
- MAIME.glb → no animation clips

The character rigging lane can therefore work independently while this lane prepares the animation side.

Three.js requires the AnimationMixer to target the object whose animations are being driven, and SkeletonUtils.clone() preserves the relationship between cloned SkinnedMesh objects and their cloned bones. Three.js also provides SkeletonUtils.retargetClip() for transferring a source AnimationClip to a target skeleton.

## Runtime contract

```text
source clip
  ↓
source skeleton/name normalization
  ↓
canonical Bannon/Mixamo bone map
  ↓
retargetClip
  ↓
AnimationClip
  ↓
visible cloned scene
  ↓
AnimationMixer(visibleClone)
  ↓
AnimationAction.play()
  ↓
mixer.update(delta)
  ↓
measured target-bone motion
```

The rigging lane owns the target skeleton and skin weights.

This lane owns:

- source discovery
- provenance
- source-license gating
- clip normalization
- clip naming
- retarget mapping
- clip validation
- runtime action lookup

## Existing Bannon tooling

The repository already contains:

- `tools/mocap/ingest.cjs`
- `tools/mocap/bake_clips.cjs`
- `tools/mocap/map_combat_moves.cjs`
- `tools/mocap/move_sheet.py`
- `tools/mocap/video_to_clip.py`
- `tools/unirig/rename_bones.cjs`

Do not replace those with a second incompatible animation system.

## Legal/source rule

The bridge can consume open/permitted animation sources. The Schwarzerblitz upstream repository explicitly distinguishes its BSD-licensed engine source from character/stage/music assets that are not redistributable. Likewise, proprietary fighting-game animation data is not automatically reusable merely because it appears in a public recompiled/fan repository.

Therefore:

- open-source engine code → reusable subject to its license
- documented CC0/public-domain animation → reusable
- documented product-use animation license → reusable subject to terms
- unclear/proprietary animation bytes → reference-only

## Definition of done

A source lane is complete only when it produces real clips and a machine-readable receipt containing:

- source path
- source SHA
- clip name
- duration
- track count
- target bone count
- resolved track count
- unresolved track count
- target skeleton identifier
- retarget map version
- license/provenance status

No fabricated clip counts.
