export interface BodyConfigPayload {
  // Biomechanical Bone Length Scaling
  torsoHeight: number;      // Scales Y axis of central spine
  torsoWidth: number;       // Scales X/Z axes for heavyweight mass
  limbLengthUpper: number;  // uArm/thigh boundary limit
  limbLengthLower: number;  // fArm/shin boundary limit
  
  // Visual & Material Parameters
  skinBaseColor: number;    // Hex code for base diffuse reflection
  defaultRoughness: number; // Modulated in-game by fatigue (Roughness 0.85 -> 0.25)
  defaultMetalness: number; // Modulated in-game by fatigue (Metalness 0.10 -> 0.40)
  
  // Stage 4 Facial Architecture Selection
  faceMeshId: string;       // ID link for default structural head plate geometry
  facialMorphs: {
    jawWidth: number;       // Direct scale coefficient for the mandible joint
    headScale: number;      // Unified skull scaling ratio
  };
}

export interface AnimationClipTemplate {
  name: string;
  source: 'FBX' | 'INTERNAL' | 'STUDIO';
  duration: number;
  tracks: any[];
}
