import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

export const useVolumetricBulge = (targetRadius: number, expansionVector: THREE.Vector3) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Custom uniforms for our shader
  const uniforms = useRef({
    uTime: { value: 0 },
    uGrabActive: { value: 0 }, // 0 = no, 1 = yes
    uGrabCenter: { value: new THREE.Vector3(0, 0, 0) },
    uRadius: { value: targetRadius },
    uExpansion: { value: expansionVector },
    // Thermodynamic exudation inputs
    uMetabolicHeat: { value: 37.0 },
    uSaturation: { value: 0.0 }
  });

  const onGrabStart = useCallback((intersectionPoint: THREE.Vector3) => {
    uniforms.current.uGrabActive.value = 1.0;
    uniforms.current.uGrabCenter.value.copy(intersectionPoint);
  }, []);

  const onGrabEnd = useCallback(() => {
    uniforms.current.uGrabActive.value = 0.0;
  }, []);

  useEffect(() => {
    uniforms.current.uRadius.value = targetRadius;
    uniforms.current.uExpansion.value.copy(expansionVector);
  }, [targetRadius, expansionVector]);

  // Hook to connect metabolic data into the shader
  const updateMetabolics = useCallback((heat: number, saturation: number) => {
     uniforms.current.uMetabolicHeat.value = heat;
     uniforms.current.uSaturation.value = saturation;
  }, []);

  const tick = useCallback((dt: number) => {
    uniforms.current.uTime.value += dt;
  }, []);

  return {
    materialRef,
    uniforms: uniforms.current,
    onGrabStart,
    onGrabEnd,
    updateMetabolics,
    tick
  };
};
