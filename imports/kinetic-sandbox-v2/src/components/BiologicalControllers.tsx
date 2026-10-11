import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePhysicsStore } from '../store/physicsStore';
import { useHypothalamicStore } from '../store/hypothalamicController';

/**
 * HypothalamicController
 * Tracks simulated hormonal cycles and coordinates resolution phase resets
 */
export function HypothalamicController() {
    const triggerMuscularReset = useHypothalamicStore(s => s.triggerMuscularReset);
    const triggerOcularReset = useHypothalamicStore(s => s.triggerOcularReset);

    useEffect(() => {
        const handleMuscularReset = () => {
            // Smoothly release myotonia
            usePhysicsStore.setState({ hypothalamicClock: 0.1 }); 
        };
        const handleOcularReset = () => {
            // Clear tears & constrict pupils
            usePhysicsStore.setState({ tearProduction: 0.0, pupilDilation: 0.2 });
        };

        window.addEventListener('biological_muscular_reset', handleMuscularReset);
        window.addEventListener('biological_ocular_reset', handleOcularReset);
        
        return () => {
            window.removeEventListener('biological_muscular_reset', handleMuscularReset);
            window.removeEventListener('biological_ocular_reset', handleOcularReset);
        };
    }, []);

    useFrame((_, delta) => {
        const state = usePhysicsStore.getState();
        const hypState = useHypothalamicStore.getState();
        
        // We handle the primary hypothalamic clock in physicsStore.ts advanceSimulation,
        // but here we can manage multi-system resolution phases over time.

        // Hormonal cycle naturally drifts
        hypState.setHormonalCyclePhase(hypState.hormonalCyclePhase + delta * 0.0001);

        // Climax Trigger
        if (state.hypothalamicClock > 0.99 && !hypState.resolutionPhaseActive) {
            hypState.setResolutionPhaseActive(true);
        }

        if (hypState.resolutionPhaseActive) {
            // Resolution Phase (Refractory period)
            if (state.hypothalamicClock < 0.2) {
                hypState.setResolutionPhaseActive(false); // Reset complete
            } else {
                // Decay arousal quickly post-climax
                usePhysicsStore.setState({ hypothalamicClock: Math.max(0, state.hypothalamicClock - delta * 0.1) });
            }

            // At peak resolution decay, fire resets
            if (state.hypothalamicClock > 0.4 && state.hypothalamicClock < 0.5) {
                triggerMuscularReset();
                triggerOcularReset();
            }
        }
    });
    return null;
}

/**
 * SkinThermalController
 * Modulates skin gloss, cyanosis, goosebumps, and spawns procedural drip particles.
 */
import { AutonomicFACSEngine, PhysiologicalState } from '../services/AutonomicFACSController';

export function SkinThermalController() {
    const particlesRef = useRef<THREE.InstancedMesh>(null);
    const particleCount = 100;
    
    // Setup dummy objects for computing instance matrices
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const drops = useMemo(() => {
        return new Array(particleCount).fill(0).map(() => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                1.0 + Math.random() * 1.5,
                (Math.random() - 0.5) * 1.5
            ),
            velocity: new THREE.Vector3(0, 0, 0),
            active: false,
            life: 0
        }));
    }, []);

    useFrame((state, delta) => {
        const pStore = usePhysicsStore.getState();
        const mesh = (window as Record<string, any>).debugMesh as THREE.SkinnedMesh;
        const mat = (window as Record<string, any>).debugMaterial as THREE.MeshPhysicalMaterial;

        if (mesh && mat) {
            // Modulate Skin Gloss based on vascular heatmap (hypothalamic arousal + trauma)
            const heatMap = Math.min(1.0, pStore.hypothalamicClock + (pStore.tissueTrauma * 0.5));
            const targetRoughness = 0.4 - (heatMap * 0.3); // Gets glossier as it gets hotter
            
            mat.roughness = THREE.MathUtils.lerp(mat.roughness, targetRoughness, delta);
            
            if (mat.userData.shader && mat.userData.shader.uniforms.hydrationLevel) {
                // If the ambient temperature is higher, hydration cooks off faster
                const currentHydration = mat.userData.shader.uniforms.hydrationLevel.value;
                mat.userData.shader.uniforms.hydrationLevel.value = currentHydration;
            }

            // Procedural Drip Spawn based on perspiration
            if (pStore.perspirationLevel > 0.4 && particlesRef.current) {
                // Spawn new drops occasionally
                if (Math.random() < pStore.perspirationLevel * delta * 10) {
                    const inactive = drops.find(d => !d.active);
                    if (inactive) {
                        inactive.active = true;
                        inactive.life = 1.0;
                        // Start drop on the mesh (rough approximation)
                        inactive.position.set(
                            (Math.random() - 0.5) * 1.0,
                            1.5 + Math.random() * 0.5,
                            (Math.random() - 0.5) * 1.0
                        );
                        inactive.velocity.set(0, -0.1, 0); // drips down
                    }
                }

                let activeCount = 0;
                drops.forEach((drop, i) => {
                    if (drop.active) {
                        drop.position.y += drop.velocity.y * delta;
                        drop.life -= delta * 0.5;
                        
                        // Fake collision / stickiness to skin by slowing it down
                        drop.velocity.y -= 0.5 * delta; // Gravity
                        
                        if (drop.position.y < 0 || drop.life <= 0) {
                            drop.active = false;
                            dummy.position.set(0, -1000, 0); // hide
                        } else {
                            dummy.position.copy(drop.position);
                            // Scale down as it dies
                            const s = Math.max(0, drop.life * 0.05);
                            dummy.scale.set(s, s, s);
                        }
                        
                        dummy.updateMatrix();
                        particlesRef.current!.setMatrixAt(i, dummy.matrix);
                        activeCount++;
                    }
                });

                if (activeCount > 0) {
                    particlesRef.current.instanceMatrix.needsUpdate = true;
                }
            }
        }
    });

    return (
        <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]} position={[0,0,0]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshPhysicalMaterial transparent opacity={0.6} color="#ffffff" transmission={1.0} ior={1.33} roughness={0} />
        </instancedMesh>
    );
}

/**
 * MyotoniaOrchestrator
 * Procedurally stiffens the skeleton and triggers respiratory heave patterns.
 */
export function MyotoniaOrchestrator() {
    useFrame((state, delta) => {
        const mesh = (window as Record<string, any>).debugMesh as THREE.SkinnedMesh;
        if (!mesh || !mesh.skeleton) return;

        const pStore = usePhysicsStore.getState();
        const time = state.clock.elapsedTime;
        
        // Real-time arousal and climax neural data
        const myotoniaLevel = pStore.hypothalamicClock; // Climax/Arousal scalar
        const trauma = pStore.tissueTrauma;

        for (const bone of mesh.skeleton.bones) {
            // Respiratory Heave Patterns
            if (bone.name.includes("Bone_FACS_ChestHeave") || bone.name.includes("spine") || bone.name.includes("chest")) {
                const baseFreq = 1.0;
                const breathFreq = baseFreq + (myotoniaLevel * 5.0) + (trauma * 3.0);
                const amplitude = 0.01 + (myotoniaLevel * 0.04);
                const cycle = Math.sin(time * breathFreq);
                
                // Overlay on top of existing scale
                bone.scale.x = THREE.MathUtils.lerp(bone.scale.x, 1.0 + cycle * (amplitude * 0.2), delta * 5);
                bone.scale.y = THREE.MathUtils.lerp(bone.scale.y, 1.0 + cycle * amplitude, delta * 5);
                bone.scale.z = THREE.MathUtils.lerp(bone.scale.z, 1.0 + cycle * (amplitude * 0.4), delta * 5);
            }
            
            // Stiffen the skeleton (Myotonia)
            if (myotoniaLevel > 0.8) {
                // High myotonia -> rigidity and slight shivering
                if (bone.name.includes("arm") || bone.name.includes("leg") || bone.name.includes("hand")) {
                    const shiverFreq = 30.0;
                    const shiverAmp = 0.005 * (myotoniaLevel - 0.8);
                    bone.rotation.z += Math.sin(time * shiverFreq) * shiverAmp;
                }
            }
        }
    });
    return null;
}

/**
 * MammaryLattice
 * Cooper ligament tensile matrices and multi-layered adipose weight painting simulation.
 */
export function MammaryLattice() {
    useFrame((state, delta) => {
        const mesh = (window as Record<string, any>).debugMesh as THREE.SkinnedMesh;
        if (!mesh || !mesh.skeleton) return;

        const pStore = usePhysicsStore.getState();
        const time = state.clock.elapsedTime;
        
        for (const bone of mesh.skeleton.bones) {
            // Multi-layered adipose & Cooper ligament stretch
            if (bone.name.includes("Bone_Breast_L_Root") || bone.name.includes("Bone_Breast_R_Root")) {
                const heavy = pStore.lactationVolume * 2.0;
                
                // Tensile matrix sagging
                bone.scale.set(
                    1.0 + heavy * 0.1, 
                    1.0 + heavy * 0.1, 
                    1.0 + heavy * 0.2
                );
                
                // Base droop from gravity and weight
                const targetY = (bone.userData.restPosition?.y || 0) - (heavy * 0.02);
                bone.position.y = THREE.MathUtils.lerp(bone.position.y, targetY, delta * 2);
                
                // Erectility based on arousal (hypothalamic clock) and thermal variables (cold)
                const erectility = Math.min(1.0, pStore.hypothalamicClock * 1.5);
                bone.position.z = THREE.MathUtils.lerp(bone.position.z, (bone.userData.restPosition?.z || 0) + (erectility * 0.01), delta * 5);
            }

            if (bone.name.includes("Bone_Nipple_") || bone.name.includes("Bone_Areola_")) {
                const engorge = Math.min(1.0, pStore.hypothalamicClock * 2.0 + pStore.lactationVolume);
                // Areolar extrusion
                bone.scale.set(
                    1.0 + engorge * 0.3, 
                    1.0 + engorge * 0.3, 
                    1.0 + engorge * 1.5
                );
            }
        }
    });
    return null;
}

/**
 * Autonomic FACS Controller
 * Replaces FacialExpressionManager. Translates physiological variables
 * into precise Action Unit (AU) orchestrations, including neuromuscular tremors,
 * pupillary dilation, chaotic blink rates, and asymmetrical grimaces.
 */
export function AutonomicFACSController() {
    useFrame((state, delta) => {
        const mesh = (window as Record<string, any>).debugMesh as THREE.SkinnedMesh;
        if (!mesh) return;

        const pStore = usePhysicsStore.getState();
        const time = state.clock.elapsedTime;
        
        if (!mesh.userData.facsFatigue) mesh.userData.facsFatigue = 0;
        if (!mesh.userData.saccadeVector) mesh.userData.saccadeVector = { x: 0, y: 0 };

        const physState: PhysiologicalState = {
            systemSaturation: pStore.systemSaturation,
            currentStrain: pStore.currentStrain,
            metabolicHeat: pStore.metabolicHeat,
            tissueTrauma: pStore.tissueTrauma,
            calculatedFriction: pStore.calculatedFriction,
            hypothalamicClock: pStore.hypothalamicClock,
            entityHeartRate: pStore.entityHeartRate,
            time,
            delta,
            fatigueState: mesh.userData.facsFatigue,
            lastSaccadeVector: mesh.userData.saccadeVector
        };

        const facsOut = AutonomicFACSEngine.calculateFACS(physState);
        
        // Save state carry-overs
        mesh.userData.facsFatigue = facsOut.newFatigueState;
        mesh.userData.saccadeVector = facsOut.saccadeVector;

        // Apply Morph Targets
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            const m = mesh.morphTargetDictionary;
            const inf = mesh.morphTargetInfluences;

            for (const [auName, targetWeight] of Object.entries(facsOut.blendshapes)) {
                const idx = m[auName];
                if (idx !== undefined) {
                    // Smoothly apply the target generated by the engine
                    inf[idx] = THREE.MathUtils.lerp(inf[idx], targetWeight, delta * 15);
                }
            }
        }

        // Bone-based FACS (Pupillary Dilation / Bruxism)
        if (mesh.skeleton && mesh.skeleton.bones) {
            for (const bone of mesh.skeleton.bones) {
                const bName = bone.name.toLowerCase();
                
                // Mydriasis (Pupillary Dilation)
                if (bName.includes("pupil") || bName.includes("iris")) {
                    const targetDilation = facsOut.pupilDilation;
                    bone.scale.set(
                        THREE.MathUtils.lerp(bone.scale.x, targetDilation, delta * 2),
                        THREE.MathUtils.lerp(bone.scale.y, targetDilation, delta * 2),
                        THREE.MathUtils.lerp(bone.scale.z, targetDilation, delta * 2)
                    );
                }

                if (bName.includes("bone_facs_jaw")) {
                     bone.position.y = THREE.MathUtils.lerp(bone.position.y, facsOut.jawOffset, delta * 8);
                     bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, facsOut.jawRotationZ, delta * 8);
                }
            }
        }
    });

    return null;
}

export function IdleAnimationOrchestrator() {
    useFrame((state, delta) => {
        const mesh = (window as Record<string, any>).debugMesh as THREE.SkinnedMesh;
        if (!mesh || !mesh.skeleton || !mesh.skeleton.bones) return;

        const pStore = usePhysicsStore.getState();
        const time = state.clock.elapsedTime;
        
        // Base respiration based on autonomic system saturation
        const chestVol = pStore.chestVolume;
        const heat = pStore.metabolicHeat;
        const strain = pStore.currentStrain;
        const pulse = pStore.entityHeartRate;

        // Metabolic Respiration IK
        const respFreq = 1.0 + (heat > 37 ? (heat - 37) * 2.0 : 0) + (strain * 3.0);
        const respAmp = 0.05 + (strain * 0.1); 
        const breatheCycle = Math.sin(time * respFreq);
        
        // Cardiac Micro Pulses (Rhythmic twitching based purely on blood pressure and HR)
        const pulseFreq = (pulse / 60.0) * Math.PI * 2.0;
        const pulseWave = Math.pow(Math.sin(time * pulseFreq), 8.0); // Sharp spike
        const microTwitch = pulseWave * 0.005 * pStore.entityBloodPressure;

        // Center of Mass (CoM) Equilibrium shift (Pendulum logic for idle stance)
        const weightShift = Math.sin(time * 0.3) * 0.02; 
        const postureSlouch = strain * 0.15; // Exhaustion Center of Gravity (Head drops forward)
        const trauma = pStore.tissueTrauma;

        for (const bone of mesh.skeleton.bones) {
            const bName = bone.name.toLowerCase();
            
            // Postural Guarding & Asymmetric Limping
            if (trauma > 0.3) {
                // Determine a side to favor based on mesh ID or random seeded once
                if (!mesh.userData.guardBias) mesh.userData.guardBias = Math.random() > 0.5 ? 1 : -1;
                const bias = mesh.userData.guardBias;
                
                // Favor the undamaged side, guard the damaged
                if (bName.includes('arm_l') || bName.includes('shoulder_l')) {
                    bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, bias === 1 ? -0.2 * trauma : 0.05 * trauma, delta * 2);
                    bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, 0.1 * trauma, delta * 2); // curl inward
                }
                if (bName.includes('arm_r') || bName.includes('shoulder_r')) {
                    bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, bias === -1 ? 0.2 * trauma : -0.05 * trauma, delta * 2);
                    bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, 0.1 * trauma, delta * 2); // curl inward
                }
            }

            // Spinal / Chest Breathing expansion (Thoracic cavity)
            if (bName.includes('spine') || bName.includes('chest') || bName.includes('shoulder') || bName.includes('ribs')) {
                const targetScale = 1.0 + (breatheCycle * respAmp); 
                bone.scale.set(
                    THREE.MathUtils.lerp(bone.scale.x, targetScale, delta * 3), 
                    THREE.MathUtils.lerp(bone.scale.y, targetScale, delta * 3), 
                    THREE.MathUtils.lerp(bone.scale.z, targetScale, delta * 3)
                );
                
                if (bName.includes('spine')) {
                    // Exhaustion collapse
                    bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, (breatheCycle * respAmp * 0.5) + postureSlouch, delta * 2);
                }
                
                // Inject Cardiac Micro Pulse into ribcage and spine
                bone.position.y += microTwitch;
            }
            
            // Pelvic weight shift (Idle Sway)
            if (bName.includes('pelvis') || bName.includes('hips') || bName.includes('root')) {
                 bone.position.x = THREE.MathUtils.lerp(bone.position.x, weightShift, delta * 2);
                 bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, weightShift * 0.5, delta * 2);
                 bone.position.y -= (postureSlouch * 0.5); // Lower Center of Mass under strain
            }
            
            // Subtle neck/head micro-movements
            if (bName.includes('neck') || bName.includes('head')) {
                 const twitchX = (Math.random() > 0.95) ? (Math.random() - 0.5) * 0.05 : 0;
                 const twitchY = (Math.random() > 0.95) ? (Math.random() - 0.5) * 0.05 : 0;
                 const headBob = breatheCycle * respAmp * 0.5;
                 
                 // Head drops forward from exhaustion
                 bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, headBob + twitchX + postureSlouch, delta * 5);
                 bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, twitchY, delta * 5);

                 // Pulse travels up the neck
                 bone.position.y += microTwitch * 0.5;
            }
        }
    });

    return null;
}
