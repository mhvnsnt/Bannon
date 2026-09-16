import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export type ClipValidation = {
  name: string;
  duration: number;
  trackCount: number;
  resolvedTrackCount: number;
  unresolvedTrackCount: number;
  unresolvedTracks: string[];
  targetBones: number;
};

function boneNames(root: THREE.Object3D): Set<string> {
  const names = new Set<string>();
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) names.add(o.name);
  });
  return names;
}

/**
 * Retarget one source AnimationClip onto the target skeleton.
 * This deliberately returns a new clip; the source clip is never mutated.
 */
export function retargetBannonClip(
  target: THREE.Object3D,
  source: THREE.Object3D | THREE.Skeleton,
  clip: THREE.AnimationClip,
  names: Record<string, string>,
): THREE.AnimationClip {
  const result = SkeletonUtils.retargetClip(target, source, clip, {
    names,
    preserveBoneMatrix: true,
    preserveBonePositions: true,
  });

  result.name = clip.name;
  return result;
}

/**
 * Resolve track paths against the target BEFORE the state machine is allowed
 * to claim that an animation is usable.
 */
export function validateBannonClip(
  target: THREE.Object3D,
  clip: THREE.AnimationClip,
): ClipValidation {
  const bones = boneNames(target);
  const unresolved: string[] = [];

  for (const track of clip.tracks) {
    const node = track.name.split('.')[0].replace(/^bones\[/, '').replace(/\]$/, '');
    if (!bones.has(node)) unresolved.push(track.name);
  }

  return {
    name: clip.name,
    duration: clip.duration,
    trackCount: clip.tracks.length,
    resolvedTrackCount: clip.tracks.length - unresolved.length,
    unresolvedTrackCount: unresolved.length,
    unresolvedTracks: unresolved,
    targetBones: bones.size,
  };
}

/**
 * Build a mixer/action bank for the VISIBLE cloned fighter.
 * Root motion stays on the outer actor; skeletal animation stays on this clone.
 */
export function createBannonAnimationBank(
  visibleClone: THREE.Object3D,
  clips: THREE.AnimationClip[],
) {
  const mixer = new THREE.AnimationMixer(visibleClone);
  const actions = new Map<string, THREE.AnimationAction>();

  for (const clip of clips) {
    const validation = validateBannonClip(visibleClone, clip);
    if (validation.trackCount === 0 || validation.unresolvedTrackCount > 0) {
      continue;
    }
    actions.set(clip.name, mixer.clipAction(clip, visibleClone));
  }

  return {
    mixer,
    actions,
    play(name: string) {
      const action = actions.get(name);
      if (!action) return false;
      action.reset().play();
      return true;
    },
    update(delta: number) {
      mixer.update(delta);
    },
    validate() {
      return clips.map((clip) => validateBannonClip(visibleClone, clip));
    },
  };
}
