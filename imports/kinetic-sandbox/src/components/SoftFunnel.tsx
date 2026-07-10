import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePhysicsStore } from '../store/physicsStore';
import { triggerImpactAudio, initProceduralAudio } from '../utils/audio';

export function SoftFunnel({ cylinderRef }: { cylinderRef: React.RefObject<THREE.Group> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const stiffness = usePhysicsStore(s => s.stiffness);
  const damping = usePhysicsStore(s => s.damping);
  const funnelBaseRadius = usePhysicsStore(s => s.funnelBaseRadius);
  const cylinderRadius = usePhysicsStore(s => s.cylinderRadius);
  const wireframe = usePhysicsStore(s => s.wireframe);
  const plasticityLimit = usePhysicsStore(s => s.plasticityLimit);
  const volumePreservation = usePhysicsStore(s => s.volumePreservation);
  const surfaceGrip = usePhysicsStore(s => s.surfaceGrip);

  useEffect(() => {
    // Initialize audio on first mount (might require user interaction still, handled in parent or clicking)
    const handleInit = () => initProceduralAudio();
    window.addEventListener('pointerdown', handleInit, { once: true });
    return () => window.removeEventListener('pointerdown', handleInit);
  }, []);

  const geomData = useMemo(() => {
    // Generate base funnel shape
    const geometry = new THREE.CylinderGeometry(funnelBaseRadius * 2, funnelBaseRadius, 6, 32, 32, true);
    const geo = geometry.clone();
    (geo.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    geo.computeVertexNormals();

    const positions = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 1; // R
      colors[i + 1] = 0.13; // G
      colors[i + 2] = 0.33; // B
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (geo.attributes.color as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);

    const vertexCount = positions.length / 3;

    const vertices = [];
    for (let i = 0; i < vertexCount; i++) {
        vertices.push({
            current: new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]),
            original: new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]),
            velocity: new THREE.Vector3(0, 0, 0),
            isPinned: false
        });
    }

    for (let i = 0; i < vertexCount; i++) {
        if (vertices[i].original.y >= 2.9 || vertices[i].original.y <= -2.9) {
            vertices[i].isPinned = true;
        }
    }

    return { geometry: geo, vertices };
  }, [funnelBaseRadius]);

  useFrame((state, delta) => {
    if (!meshRef.current || !cylinderRef.current) return;

    // Fixed time step interpolation configuration
    // (Here we lock the logical physics integration to ~60Hz internally regardless of frame drops)
    const fixedDelta = 1 / 60;
    
    // Get colors for visual flushing (stress)
    const colorAttribute = meshRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const baseColor = new THREE.Color("#ff2255");
    const stressColor = new THREE.Color("#00ffcc"); // Neon cyan flush for stress
    const tearColor = new THREE.Color("#111111");

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const { cylinderRefs, hyperElasticity, structuralShield, tearingThreshold } = usePhysicsStore.getState();

    const cylHeight = 4.0;
    const cylRadius = cylinderRadius;
    const cylHalfHeight = cylHeight / 2 + 1.0;

    let volumeExpansionForce = 0;
    let collidingVerticesCount = 0;

    // First Pass: Calculate total volume displacement 
    for (let i = 0; i < geomData.vertices.length; i++) {
        const v = geomData.vertices[i];
        if (!v.isPinned) {
            for (const ref of cylinderRefs) {
                if (!ref) continue;
                const cylPos = ref.position;
                const dx = v.current.x - cylPos.x;
                const dy = v.current.y - cylPos.y;
                const dz = v.current.z - cylPos.z;
                if (dy > -cylHalfHeight && dy < cylHalfHeight) {
                    const distXZ = Math.sqrt(dx * dx + dz * dz);
                    const collisionMargin = 0.05;
                    const combinedRadius = cylRadius + collisionMargin;
                    if (distXZ < combinedRadius) {
                        collidingVerticesCount++;
                        break; // Only count vertex collision once
                    }
                }
            }
        }
    }

    // Determine how much 'volume' pressure exists inside the funnel
    if (collidingVerticesCount > 0) {
        // High density of vertices colliding causes outward pressure on all vertices to preserve volume limits
        volumeExpansionForce = (collidingVerticesCount * volumePreservation) * 0.001; 
    }

    // Second Pass: Apply Forces
    for (let i = 0; i < geomData.vertices.length; i++) {
        const v = geomData.vertices[i];

        if (!v.isPinned) {
            // Volume Preservation outward push
            if (volumeExpansionForce > 0) {
                const dxCurrent = v.current.x;
                const dzCurrent = v.current.z;
                const distCurrent = Math.sqrt(dxCurrent * dxCurrent + dzCurrent * dzCurrent) || 1;
                v.velocity.x += (dxCurrent / distCurrent) * volumeExpansionForce;
                v.velocity.z += (dzCurrent / distCurrent) * volumeExpansionForce;
            }

            // Spring Force & Plasticity
            const springStretch = new THREE.Vector3().subVectors(v.original, v.current);
            const stretchLength = springStretch.length();

             // The Elastic-Plastic Yield Function (Permanent Deformation)
             // If stretch exceeds the plasticity limit threshold, permanently mutate the resting length
             const plasticityThreshold = 1.0 + (plasticityLimit * 2);
             let isTorn = false;

             if (stretchLength > tearingThreshold) {
                 // Tearing Link breakage: delete constraints
                 v.isPinned = true; // Pin it loosely or let it float
                 isTorn = true;
                 v.velocity.y -= fixedDelta * 9.8; // Gravity overtakes torn bits
             } else if (stretchLength > plasticityThreshold) {
                 const yieldAmount = (stretchLength - plasticityThreshold) * 0.05; // Yielding rate
                 // Move original point towards current to permanently "stretch" the fabric
                 v.original.lerp(v.current, yieldAmount);
                 
                 // Recalculate spring after yielding
                 springStretch.subVectors(v.original, v.current);
             }

            // Visual Stress Flushing
            if (colorAttribute) {
                const tensionAlpha = Math.min(1.0, stretchLength / (tearingThreshold * 0.8));
                let finalColor = baseColor.clone().lerp(stressColor, tensionAlpha);
                if (isTorn) finalColor = tearColor;
                colorAttribute.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
            }

            // Modifier forces
            const activeStiffness = stiffness * (1.0 - hyperElasticity * 0.9) * structuralShield;
            const force = springStretch.multiplyScalar(activeStiffness);
            v.velocity.add(force);
            v.velocity.multiplyScalar(damping);
            v.current.add(v.velocity);

            // High-Fidelity Collision & Grip (Iterating all cylinders)
            for (const ref of cylinderRefs) {
                if (!ref) continue;
                const cylPos = ref.position;

                const dx = v.current.x - cylPos.x;
                const dy = v.current.y - cylPos.y;
                const dz = v.current.z - cylPos.z;

                // Zero-Clipping Buffer inside cylinder
                if (dy > -cylHalfHeight && dy < cylHalfHeight) {
                    const distXZ = Math.sqrt(dx * dx + dz * dz);
                    const collisionMargin = 0.05;
                    const combinedRadius = cylRadius + collisionMargin;

                    if (distXZ < combinedRadius && distXZ > 0.0001) {
                        const overlap = combinedRadius - distXZ;
                        
                        const nx = dx / distXZ;
                        const nz = dz / distXZ;

                        // Push vertex out completely (Continuous constraint resolve)
                        v.current.x += nx * overlap;
                        v.current.z += nz * overlap;
                        
                        // Trigger Audio Feedback if overlap is sharp (kinetic snap)
                        if (overlap > 0.01 && Math.random() < 0.05) {
                            triggerImpactAudio(overlap * surfaceGrip);
                        }
                        
                        // Surface Grip (Friction coupling)
                        // High grip forces velocity to match cylinder motion, low grip allows slip
                        const gripDamping = Math.max(0.01, 1 - surfaceGrip);
                        v.velocity.x *= gripDamping;
                        v.velocity.z *= gripDamping;
                        v.velocity.y *= gripDamping; 
                        
                        // Add micro-velocity outwards
                        v.velocity.x += nx * overlap * surfaceGrip * 0.2;
                        v.velocity.z += nz * overlap * surfaceGrip * 0.2;
                    }
                }
            }
        }

        positions[i * 3] = v.current.x;
        positions[i * 3 + 1] = v.current.y;
        positions[i * 3 + 2] = v.current.z;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geomData.geometry} castShadow receiveShadow>
      <meshPhysicalMaterial 
        vertexColors
        wireframe={wireframe} 
        side={THREE.DoubleSide} 
        roughness={0.2}
        metalness={0.1}
        transmission={0.6}
        thickness={2.0}
        envMapIntensity={1.5}
        clearcoat={0.3}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}
