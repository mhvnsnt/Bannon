import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { usePhysicsStore } from '../store/physicsStore';

// Environment & Atmosphere Simulator
// Handles respiratory condensation mist (breath fog in cold environments), ambient thermodynamics, and lighting mood

export function AtmosphericController() {
    const mistParticlesRef = useRef<THREE.InstancedMesh>(null);
    const particleCount = 200;
    
    // Create an invisible dummy object for matrix math
    const dummy = React.useMemo(() => new THREE.Object3D(), []);
    
    // Store particle data: lifespan, velocity, scale
    const particleData = React.useMemo(() => {
        const data = [];
        for (let i = 0; i < particleCount; i++) {
            data.push({
                life: -1, // inactive
                vel: new THREE.Vector3(),
                pos: new THREE.Vector3(),
                scale: 0
            });
        }
        return data;
    }, []);

    useFrame(({ clock }, delta) => {
        const time = clock.elapsedTime;
        const state = usePhysicsStore.getState();
        const ambientTemp = 15.0; // Abstract ambient room temp
        const internalTemp = state.metabolicHeat; // Usually 37+
        
        // Exhalation Phase Detection (Simplistic breathing cycle from IdleAnimationOrchestrator base)
        const breatheCycle = Math.sin(time * 2.0); // -1 to 1  (>0 is inhale, <0 is exhale)
        const isExhaling = breatheCycle < -0.5;
        const thermalDelta = internalTemp - ambientTemp;
        
        // If environmental temp is significantly lower than body temp, breath condenses
        const condensesMist = thermalDelta > 15.0; 

        if (mistParticlesRef.current) {
            let activeSpawns = 0;
            
            // Spawn mist particles during exhale if temperature difference permits
            if (isExhaling && condensesMist && Math.random() > 0.8) {
                // Find inactive particle
                for (let i = 0; i < particleCount; i++) {
                    const p = particleData[i];
                    if (p.life <= 0) {
                        p.life = 1.0;
                        // Spawn at mouth offset (approximate bounds from head)
                        p.pos.set((Math.random() - 0.5) * 0.05, 1.5 + (Math.random() - 0.5) * 0.1, 0.2 + (Math.random() * 0.1));
                        // Exhale velocity vector (forward and slightly down)
                        p.vel.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.2) * 0.5, 0.5 + Math.random() * 0.5).multiplyScalar(1.0 + state.currentStrain);
                        p.scale = 0.05;
                        activeSpawns++;
                        if (activeSpawns > 2) break; // Limit spawn rate
                    }
                }
            }

            // Update existing particles
            for (let i = 0; i < particleCount; i++) {
                const p = particleData[i];
                if (p.life > 0) {
                    p.life -= delta * 0.5; // lifespan
                    p.pos.addScaledVector(p.vel, delta);
                    p.vel.y += delta * 0.2; // Thermal updraft (hot air rises)
                    p.scale += delta * 0.2; // Expand as it dissipates
                    
                    dummy.position.copy(p.pos);
                    dummy.scale.setScalar(p.scale);
                    dummy.updateMatrix();
                    mistParticlesRef.current.setMatrixAt(i, dummy.matrix);
                    
                    // Fade out alpha (using color R channel hack for alpha in standard shader without custom vertex)
                    // (Real implementation would use a custom shader or sprite, but instance color works if alpha is supported)
                    mistParticlesRef.current.setColorAt(i, new THREE.Color().setScalar(p.life));
                } else {
                    // Hide dead particles
                    dummy.scale.setScalar(0);
                    dummy.updateMatrix();
                    mistParticlesRef.current.setMatrixAt(i, dummy.matrix);
                }
            }
            
            mistParticlesRef.current.instanceMatrix.needsUpdate = true;
            if (mistParticlesRef.current.instanceColor) {
               mistParticlesRef.current.instanceColor.needsUpdate = true;
            }
        }
    });

    return (
        <group>
            <instancedMesh ref={mistParticlesRef} args={[undefined, undefined, particleCount]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
            </instancedMesh>
        </group>
    );
}
