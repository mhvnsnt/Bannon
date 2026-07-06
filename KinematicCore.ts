import { BodyConfigPayload } from './types.js';

export class KinematicCore {
  private _bodyConfig?: BodyConfigPayload;

  constructor() {
    console.log("[Node 5] Kinematic Core Initialized with payload scaling & Active Ragdoll capabilities");
  }

  /**
   * Applies biomechanical scaling directly based on BodyConfigPayload.
   */
  public applyBiomechanicalScaling(segments: any, payload: BodyConfigPayload) {
    this._bodyConfig = payload;
    if (!segments) return;

    // 1. Spine Scaling
    if (segments.torso) {
      segments.torso.scale.set(payload.torsoWidth, payload.torsoHeight, payload.torsoWidth);
    }
    if (segments.abdomen) {
      segments.abdomen.scale.set(payload.torsoWidth, payload.torsoHeight, payload.torsoWidth);
    }

    // 2. Limbs upper/lower scaling
    const upperList = ['uArmL', 'uArmR', 'thighL', 'thighR', 'deltL', 'deltR', 'bicepL', 'bicepR', 'quadL', 'quadR'];
    const lowerList = ['fArmL', 'fArmR', 'shinL', 'shinR', 'fmassL', 'fmassR', 'calfL', 'calfR'];

    upperList.forEach(u => {
      if (segments[u]) segments[u].scale.y = payload.limbLengthUpper;
    });

    lowerList.forEach(l => {
      if (segments[l]) segments[l].scale.y = payload.limbLengthLower;
    });

    // 3. Facial Architecture & Skull
    if (segments.head) {
      segments.head.scale.setScalar(payload.facialMorphs.headScale);
    }
    if (segments.proceduralJaw) {
      segments.proceduralJaw.scale.set(payload.facialMorphs.jawWidth, 1.0, payload.facialMorphs.jawWidth);
    }
  }

  /**
   * Calculates joint torque coefficients dynamically using Proportional Derivative algorithms.
   * Blends local physical balance curves with animated Ghost Rig target targets.
   */
  public getJointTorque(
    currentRot: { x: number; y: number; z: number },
    targetRot: { x: number; y: number; z: number },
    velocity: { x: number; y: number; z: number },
    stamina: number = 100
  ) {
    // Motor stiffness (kp) scales dynamically down with fatigue
    const kp = 280 * Math.max(0.15, stamina / 100);
    const kd = 24;

    const torqueX = kp * (targetRot.x - currentRot.x) - kd * velocity.x;
    const torqueY = kp * (targetRot.y - currentRot.y) - kd * velocity.y;
    const torqueZ = kp * (targetRot.z - currentRot.z) - kd * velocity.z;

    return { x: torqueX, y: torqueY, z: torqueZ };
  }
}

