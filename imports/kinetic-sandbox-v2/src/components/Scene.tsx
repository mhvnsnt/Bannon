import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, useFBX, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { ErrorBoundary } from 'react-error-boundary';
import { usePhysicsStore } from '../store/physicsStore';
import { applyProceduralSkinShader } from '../utils/fleshShader';
import { applyEmotionJSON } from '../utils/emotionParser';
import { AudioFormantAnalyzer } from '../utils/audioAnalyzer';
import { proceduralAudio } from '../utils/proceduralAudio';
import { neuroRouter } from '../utils/neurologicalRouter';
import { AutoBoneMapper } from '../utils/AutoBoneMapper';
import { HypothalamicController, SkinThermalController, MyotoniaOrchestrator, MammaryLattice, AutonomicFACSController, IdleAnimationOrchestrator } from './BiologicalControllers';
import { AtmosphericController } from './AtmosphericController';

import { DeformableEnvironment } from './DeformableEnvironment';
import { SoftFunnel } from './SoftFunnel';
import { HardCylinder } from './HardCylinder';

function GlobalContextSetter() {
  const scene = useThree(state => state.scene);
  const audioDrivenFace = usePhysicsStore(s => s.audioDrivenFace);

  useEffect(() => {
    (window as any).threeJsScene = scene;
  }, [scene]);

  useEffect(() => {
     if (audioDrivenFace) {
         if (!(window as any).audioAnalyzer) {
             (window as any).audioAnalyzer = new AudioFormantAnalyzer();
         }
         if (!(window as any).audioAnalyzer.isActive) {
             (window as any).audioAnalyzer.initialize();
         }
     } else {
         if ((window as any).audioAnalyzer && (window as any).audioAnalyzer.isActive) {
             (window as any).audioAnalyzer.destroy();
         }
     }
  }, [audioDrivenFace]);

  return null;
}

import { updateGlobalFormant } from '../utils/audio';
import { useAutonomicSystem } from '../hooks/useAutonomicSystem';
import { useVolumetricBulge } from '../hooks/useVolumetricBulge';
import { TelemetryUI } from './TelemetryUI';

function AutonomicSystem() {
    useAutonomicSystem();
    return null;
}

function CustomModelPlayerInner({ scene, animations, groupRef, isCylinder = false, id }: { scene: THREE.Object3D, animations: THREE.AnimationClip[], groupRef?: React.RefObject<THREE.Group>, isCylinder?: boolean, id?: string }) {
  const registerBones = usePhysicsStore(s => s.registerBones);
  const unregisterBones = usePhysicsStore(s => s.unregisterBones);
  const jiggleBones = usePhysicsStore(s => s.jiggleBones);
  const globalJig = usePhysicsStore(s => s.jiggleAmplitude);
  const isPlaying = usePhysicsStore(s => s.isPlaying);
  const willpower = usePhysicsStore(s => s.willpower);
  const registerCylinderRef = usePhysicsStore(s => s.registerCylinderRef);
  const unregisterCylinderRef = usePhysicsStore(s => s.unregisterCylinderRef);
  const funnelsData = usePhysicsStore(s => s.funnelsData);
  const cylindersData = usePhysicsStore(s => s.cylindersData);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const internalRef = useRef<THREE.Group>(null);
  const actualRef = (groupRef && groupRef.hasOwnProperty('current') && typeof groupRef !== 'function') ? groupRef : internalRef;
  
  const inst = isCylinder ? cylindersData.find(c => c.id === id) : funnelsData.find(f => f.id === id);
  const rigidity = inst?.rigidity ?? 1.0;
  const jiggleAmplitude = inst?.jiggleAmplitude ?? globalJig;
  
  if (!isCylinder) {
      useVolumetricBulge(actualRef);
  }
  
  // CLONE SCENE FOR MULTIPLE INSTANCES (SWARM COMPATIBILITY)
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Helper to dynamically inject missing pelvic floor bones for procedural physics
  const injectPelvicFloorHierarchy = (root: THREE.Object3D) => {
      let pelvisBone: THREE.Bone | null = null;
      root.traverse((child) => {
          if ((child as THREE.Bone).isBone && !pelvisBone) {
              const n = child.name.toLowerCase();
              if (n.includes('pelvis') || n.includes('hip') || n.includes('spine') || n.includes('root')) {
                  pelvisBone = child as THREE.Bone;
              }
          }
      });
      if (!pelvisBone) {
          root.traverse((child) => {
              if ((child as THREE.Bone).isBone && !pelvisBone) pelvisBone = child as THREE.Bone;
          });
      }
      if (pelvisBone) {
          // Uterus & Cervix
          const uBase = new THREE.Bone(); uBase.name = "Bone_Uterus_Base"; uBase.position.set(0, 0.1, -0.05);
          pelvisBone.add(uBase);
          
          const cervicalOs = new THREE.Bone(); cervicalOs.name = "Bone_Cervical_Os"; cervicalOs.position.set(0, -0.02, 0.0);
          uBase.add(cervicalOs);
          
          // Deep Fornices (Reservoirs) around the Cervix
          const antFornix = new THREE.Bone(); antFornix.name = "Bone_Anterior_Fornix"; antFornix.position.set(0.0, 0.0, 0.02);
          cervicalOs.add(antFornix);
          const postFornix = new THREE.Bone(); postFornix.name = "Bone_Posterior_Fornix"; postFornix.position.set(0.0, 0.01, -0.02);
          cervicalOs.add(postFornix);
          
          // Vaginal Canal Hierarchy
          let pVag = cervicalOs;
          for (let i=1; i<=5; i++) {
              const vb = new THREE.Bone(); vb.name = `Bone_Vaginal_Canal_0${i}`; vb.position.set(0, -0.05, 0.02);
              pVag.add(vb); pVag = vb;
              
              // Bind Urethral Sponge (G-Spot) to upper anterior canal (usually node 1 or 2)
              if (i === 2) {
                  const gSpot = new THREE.Bone(); gSpot.name = "Bone_Urethral_Sponge"; gSpot.position.set(0, 0, 0.03);
                  vb.add(gSpot);
              }
          }
          
          // External / Vulvar Structures
          const clitoris = new THREE.Bone(); clitoris.name = "Bone_Clitoral_Complex"; clitoris.position.set(0, -0.05, 0.08);
          (pelvisBone as THREE.Bone).add(clitoris); // type cast for ts
          const cruraL = new THREE.Bone(); cruraL.name = "Bone_Crura_L"; cruraL.position.set(0.02, 0.02, -0.02);
          const cruraR = new THREE.Bone(); cruraR.name = "Bone_Crura_R"; cruraR.position.set(-0.02, 0.02, -0.02);
          clitoris.add(cruraL); clitoris.add(cruraR);
          
          const vBulbL = new THREE.Bone(); vBulbL.name = "Bone_Vestibular_Bulb_L"; vBulbL.position.set(0.02, -0.03, -0.01);
          const vBulbR = new THREE.Bone(); vBulbR.name = "Bone_Vestibular_Bulb_R"; vBulbR.position.set(-0.02, -0.03, -0.01);
          (pelvisBone as THREE.Bone).add(vBulbL); (pelvisBone as THREE.Bone).add(vBulbR);
          
          // Anorectal Tract
          const aFlex = new THREE.Bone(); aFlex.name = "Bone_Anorectal_Flexure"; aFlex.position.set(0, -0.08, -0.08);
          pelvisBone.add(aFlex);
          
          const sInt = new THREE.Bone(); sInt.name = "Bone_Anal_Sphincter_Internal"; sInt.position.set(0, -0.05, -0.05);
          aFlex.add(sInt);
          
          const sExt = new THREE.Bone(); sExt.name = "Bone_Anal_Sphincter_External"; sExt.position.set(0, -0.02, -0.02);
          sInt.add(sExt);
      }

      // Thoracic & Mammary Injection
      let chestBone: THREE.Bone | null = null;
      let headBone: THREE.Bone | null = null;
      root.traverse((child) => {
          if ((child as THREE.Bone).isBone) {
              const n = child.name.toLowerCase();
              if (n.includes('chest') || n.includes('spine2') || n.includes('torso') || n.includes('breast')) {
                  if (!chestBone) chestBone = child as THREE.Bone;
              }
              if (n.includes('head') || n.includes('neck') || n.includes('face')) {
                  if (!headBone) headBone = child as THREE.Bone;
              }
          }
      });

      if (chestBone) {
          const lBreastRoot = new THREE.Bone(); lBreastRoot.name = "Bone_Breast_L_Root"; lBreastRoot.position.set(0.1, 0, 0.1);
          const rBreastRoot = new THREE.Bone(); rBreastRoot.name = "Bone_Breast_R_Root"; rBreastRoot.position.set(-0.1, 0, 0.1);
          chestBone.add(lBreastRoot); chestBone.add(rBreastRoot);
          
          const lFat = new THREE.Bone(); lFat.name = "Bone_Breast_L_Fat"; lFat.position.set(0, -0.05, 0.05);
          const lGland = new THREE.Bone(); lGland.name = "Bone_Breast_L_Glandular"; lGland.position.set(0, -0.02, 0.08);
          const lNipple = new THREE.Bone(); lNipple.name = "Bone_Nipple_L"; lNipple.position.set(0, 0, 0.1);
          lBreastRoot.add(lFat); lBreastRoot.add(lGland); lGland.add(lNipple);

          const rFat = new THREE.Bone(); rFat.name = "Bone_Breast_R_Fat"; rFat.position.set(0, -0.05, 0.05);
          const rGland = new THREE.Bone(); rGland.name = "Bone_Breast_R_Glandular"; rGland.position.set(0, -0.02, 0.08);
          const rNipple = new THREE.Bone(); rNipple.name = "Bone_Nipple_R"; rNipple.position.set(0, 0, 0.1);
          rBreastRoot.add(rFat); rBreastRoot.add(rGland); rGland.add(rNipple);
      }

      if (headBone) {
          // FACS Neural Bridge Bones
          const facsZygomatic = new THREE.Bone(); facsZygomatic.name = "Bone_FACS_Zygomatic"; facsZygomatic.position.set(0, 0, 0.1);
          const facsCorrugator = new THREE.Bone(); facsCorrugator.name = "Bone_FACS_Corrugator"; facsCorrugator.position.set(0, 0.05, 0.11);
          const facsJaw = new THREE.Bone(); facsJaw.name = "Bone_FACS_Jaw"; facsJaw.position.set(0, -0.05, 0.05);
          const facsChestHeave = new THREE.Bone(); facsChestHeave.name = "Bone_FACS_ChestHeave"; facsChestHeave.position.set(0, -0.2, 0.1);
          const headTongue = new THREE.Bone(); headTongue.name = "Bone_Tongue"; headTongue.position.set(0, -0.06, 0.08);

          headBone.add(facsZygomatic); headBone.add(facsCorrugator); headBone.add(facsJaw); headBone.add(facsChestHeave); headBone.add(headTongue);
      }
  };

  useEffect(() => {
     if (isCylinder && actualRef.current) {
         registerCylinderRef(actualRef.current);
     }
     return () => {
         if (isCylinder && actualRef.current) {
             unregisterCylinderRef(actualRef.current);
         }
     };
  }, [clonedScene, isCylinder, actualRef, registerCylinderRef, unregisterCylinderRef]);

  useEffect(() => {
    if (!clonedScene) return;
    
    // Inject the custom pelvic floor hierarchy before processing bones!
    injectPelvicFloorHierarchy(clonedScene);
    
    const bones: THREE.Bone[] = [];
    const meshes: THREE.Mesh[] = [];
    const autoJiggles = new Set<string>();
    const jiggleKeywords = ['face', 'jaw', 'eye', 'mouth', 'lip', 'cheek', 'breast', 'belly', 'glute', 'hair', 'tail', 'ear', 'wing', 'jiggle', 'soft', 'fat', 'flesh', 'muscle', 'pelvis', 'spine'];
    
    clonedScene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        const bone = child as THREE.Bone;
        bones.push(bone);
        if (jiggleKeywords.some(kw => bone.name.toLowerCase().includes(kw))) {
           autoJiggles.add(bone.uuid);
        }
      }
      
      // Cinematic Instanced Shadows Support
      if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          meshes.push(mesh);
          
          if ((mesh as THREE.SkinnedMesh).isSkinnedMesh && (mesh as THREE.SkinnedMesh).skeleton) {
              // Apply Model-Agnostic Physics Limits
              AutoBoneMapper.mapSkeleton((mesh as THREE.SkinnedMesh).skeleton);
          }
          
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
              depthPacking: THREE.RGBADepthPacking,
              alphaTest: 0.5
          });
          
          if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach(mat => {
                  if ((mat as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
                      applyProceduralSkinShader(mat as THREE.MeshPhysicalMaterial, {});
                  }
              });
          }
      }
    });

    // Make the first mesh and its material accessible globally to link the neural core buttons easily
    if (meshes.length > 0) {
        (window as any).debugMesh = meshes[0];
        (window as any).debugMaterial = Array.isArray(meshes[0].material) ? meshes[0].material[0] : meshes[0].material;
        (window as any).applyEmotionJSON = applyEmotionJSON;
    }

    registerBones(bones);
    usePhysicsStore.getState().setMeshes(meshes);
    
    // Auto-enable jiggle for detected soft body parts
    if (autoJiggles.size > 0) {
        const currentJiggles = usePhysicsStore.getState().jiggleBones;
        const newJiggles = new Set(currentJiggles);
        autoJiggles.forEach(uuid => newJiggles.add(uuid));
        usePhysicsStore.setState({ jiggleBones: newJiggles });
    }

    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(clonedScene);
      // Wait, we need to clone animations if they mutate or we can use the same
      const action = mixerRef.current.clipAction(animations[0]);
      action.play();
    }

    // Save Rest Poses
    clonedScene.traverse((child) => {
       const bone = child as THREE.Bone;
       if (bone.isBone) {
           bone.userData.restPosition = bone.position.clone();
           bone.userData.restRotation = bone.rotation.clone();
           bone.userData.restScale = bone.scale.clone();
       }
    });

    return () => {
      unregisterBones(bones);
      mixerRef.current?.stopAllAction();
    };
  }, [clonedScene, animations, registerBones, unregisterBones]);
  
  useFrame((state, delta) => {
    // Update global shader uniforms and Cellular Dehydration Simulation
    if ((window as any).debugMesh && (window as any).debugMaterial && (window as any).debugMaterial.userData.shader) {
        const mesh = (window as any).debugMesh;
        const shader = (window as any).debugMaterial.userData.shader;
        if (shader.uniforms.time) {
            shader.uniforms.time.value = state.clock.elapsedTime;
        }

        const s = usePhysicsStore.getState();
        
        const totalVolume = s.fluidVaginalTransudate + s.fluidCervicalMucus + s.fluidBartholinMucus + s.fluidSkeneEjaculate + s.fluidMenstrual + s.fluidSmegma + s.fluidAnalMucus + s.fluidPerianalSebum + s.fluidAnalBile + s.fluidPurulentDischarge + s.fluidInterstitial;
        const avgViscosity = totalVolume > 0 ? (
            (s.fluidVaginalTransudate * 0.1) +
            (s.fluidCervicalMucus * 0.4) +
            (s.fluidBartholinMucus * 0.8) +
            (s.fluidSkeneEjaculate * 0.05) +
            (s.fluidMenstrual * 0.6) +
            (s.fluidSmegma * 0.9) +
            (s.fluidAnalMucus * 0.9) +
            (s.fluidPerianalSebum * 0.5) +
            (s.fluidAnalBile * 0.2) +
            (s.fluidPurulentDischarge * 0.8) +
            (s.fluidInterstitial * 0.2)
        ) / totalVolume : 0.5;

        // Base hydration is influenced by the raw water-like fluids + perspiration
        const hydration = Math.min(1.0, (s.fluidVaginalTransudate + s.fluidSkeneEjaculate + s.fluidInterstitial + s.perspirationLevel));
        
        // Gloss is driven by all fluids over the skin, but reduced by thick viscosity (smegma, thick mucus)
        const surfaceWetness = Math.min(1.0, totalVolume + s.perspirationLevel);
        const surfaceGloss = surfaceWetness * (1.0 - (avgViscosity * 0.5));

        if (shader.uniforms.hydrationLevel) {
            shader.uniforms.hydrationLevel.value = hydration;
        }

        if (shader.uniforms.tissueTrauma) {
            shader.uniforms.tissueTrauma.value = s.tissueTrauma;
        }
        
        if (shader.uniforms.thermalVision) {
            shader.uniforms.thermalVision.value = s.thermalVision ? 1.0 : 0.0;
        }
        
        if (shader.uniforms.perspirationLevel) {
            shader.uniforms.perspirationLevel.value = Math.min(1.0, s.perspirationLevel + (s.fluidPerianalSebum * 0.5)); // Sebum adds to local specular sweat reflection
        }
        
        // Wet skin clearcoat adjustment based on exact complete bodily fluid volume
        if ((window as any).debugMaterial.isMeshPhysicalMaterial) {
            (window as any).debugMaterial.clearcoatRoughness = Math.max(0.01, 1.0 - surfaceGloss);
            (window as any).debugMaterial.clearcoat = 0.2 + (surfaceWetness * 0.8);
            
            // Adjust transmission / SSS base based on deep heavy fluids (Menstrual/Bile/Purulent block scattering)
            const denseFluids = Math.min(1.0, s.fluidMenstrual + s.fluidSmegma + Math.max(0, s.fluidPurulentDischarge));
            (window as any).debugMaterial.transmission = Math.max(0.0, 0.4 - (denseFluids * 0.4));
        }

        if (shader.uniforms.bulgeCenters) {
            const cylinders = usePhysicsStore.getState().cylindersData;
            const bulgeArray = shader.uniforms.bulgeCenters.value;
            for(let i=0; i<3; i++) {
                if (cylinders[i]) {
                    const pos = cylinders[i].position;
                    bulgeArray[i].set(pos[0], pos[1], pos[2], 0.6); 
                } else {
                    bulgeArray[i].set(0,0,0,0);
                }
            }
        }

        if (shader.uniforms.physicsTime) {
            const statePhysics = usePhysicsStore.getState();
            shader.uniforms.physicsTime.value = statePhysics.physicsTick / 120.0;
            
            const ripplePositionsArray = shader.uniforms.ripplePositions.value;
            const rippleTimesArray = shader.uniforms.rippleTimes.value;
            const impacts = statePhysics.rippleImpacts;
            for(let i=0; i<5; i++) {
                if (impacts[i]) {
                    const r = impacts[i];
                    ripplePositionsArray[i].set(r.position[0], r.position[1], r.position[2], Math.min(1.0, r.intensity));
                    rippleTimesArray[i] = r.time / 120.0;
                } else {
                    ripplePositionsArray[i].set(0,0,0,0);
                    rippleTimesArray[i] = 0;
                }
            }
            
            if (shader.uniforms.smearPositions) {
                const smearPositionsArray = shader.uniforms.smearPositions.value;
                const smearImpacts = statePhysics.smearImpacts;
                for(let i=0; i<10; i++) {
                    if (smearImpacts && smearImpacts[i]) {
                        const s = smearImpacts[i];
                        smearPositionsArray[i].set(s.position[0], s.position[1], s.position[2], s.intensity);
                    } else {
                        smearPositionsArray[i].set(0,0,0,0);
                    }
                }
            }
        }

        // Apply Audio Formants
        if (usePhysicsStore.getState().audioDrivenFace && (window as any).audioAnalyzer && (window as any).audioAnalyzer.isActive) {
            const formants = (window as any).audioAnalyzer.getFormants();
            if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
                const jawIdx = mesh.morphTargetDictionary['jawOpen'];
                if (jawIdx !== undefined) {
                    // lerp for smoothness
                    mesh.morphTargetInfluences[jawIdx] += (formants.jawOpen - mesh.morphTargetInfluences[jawIdx]) * delta * 15.0;
                }
                const smileL = mesh.morphTargetDictionary['mouthSmileLeft'];
                const smileR = mesh.morphTargetDictionary['mouthSmileRight'];
                if (smileL !== undefined) mesh.morphTargetInfluences[smileL] += (formants.mouthSmile - mesh.morphTargetInfluences[smileL]) * delta * 15.0;
                if (smileR !== undefined) mesh.morphTargetInfluences[smileR] += (formants.mouthSmile - mesh.morphTargetInfluences[smileR]) * delta * 15.0;
                
                // Aggression triggers face flush
                shader.uniforms.skinFlushIntensity.value += (formants.amplitude - shader.uniforms.skinFlushIntensity.value) * delta * 5.0;
            }
        }
        
        // Face Reacts to Cylinders proximally
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            let maxProx = 0;
            const cylinders = usePhysicsStore.getState().cylindersData;
            const headPos = new THREE.Vector3();
            // A heuristic head pos - ideally we'd find the Head bone, but we can assume roughly Y=1.5 for the face
            mesh.getWorldPosition(headPos);
            headPos.y += 1.5; 
            
            for(let i=0; i<cylinders.length; i++) {
                if (cylinders[i]) {
                    const cpos = new THREE.Vector3().fromArray(cylinders[i].position);
                    const dist = cpos.distanceTo(headPos);
                    if (dist < 2.0) {
                        const prox = 1.0 - (dist / 2.0); // 0 to 1
                        if (prox > maxProx) maxProx = prox;
                    }
                }
            }
            
            if (maxProx > 0) {
                const jawIdx = mesh.morphTargetDictionary['jawOpen'];
                const eyeRoll = mesh.morphTargetDictionary['eyeLookUpLeft'];
                const eyeRollR = mesh.morphTargetDictionary['eyeLookUpRight'];
                const browInnerUp = mesh.morphTargetDictionary['browInnerUp'];
                
                if (jawIdx !== undefined) {
                    mesh.morphTargetInfluences[jawIdx] = Math.max(mesh.morphTargetInfluences[jawIdx], maxProx * 0.9);
                }
                if (eyeRoll !== undefined) mesh.morphTargetInfluences[eyeRoll] = Math.max(mesh.morphTargetInfluences[eyeRoll], maxProx * 0.7);
                if (eyeRollR !== undefined) mesh.morphTargetInfluences[eyeRollR] = Math.max(mesh.morphTargetInfluences[eyeRollR], maxProx * 0.7);
                if (browInnerUp !== undefined) mesh.morphTargetInfluences[browInnerUp] = Math.max(mesh.morphTargetInfluences[browInnerUp], maxProx * 0.8);
                
                shader.uniforms.skinFlushIntensity.value = Math.max(shader.uniforms.skinFlushIntensity.value, maxProx);
            }
        }

        // Autonomic and FACS animations are handled by BiologicalControllers in the render tree

        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
             const time = state.clock.elapsedTime;
             
             // --- Temperature & Oxygen (Cyanosis & Goosebumps) ---
             const temp = usePhysicsStore.getState().entityTemperature;
             const ox = usePhysicsStore.getState().entityOxygen;
             
             if (shader.uniforms.goosebumps) {
                 // Temp < 37.0 or high Adrenaline (currentStrain) triggers goosebumps
                 const chill = Math.max(0, 37.0 - temp);
                 const strain = usePhysicsStore.getState().currentStrain;
                 const adrenalineSpike = strain > 0.7 ? (strain - 0.7) * 3.33 : 0;
                 shader.uniforms.goosebumps.value = Math.min(1.0, (chill * 0.2) + adrenalineSpike);
             }
             if (shader.uniforms.cyanosis) {
                 // Low oxygen or very low temp (< 35.0) triggers cyanosis
                 const hypoxia = Math.max(0, 1.0 - ox);
                 const hypothermia = Math.max(0, 35.0 - temp);
                 shader.uniforms.cyanosis.value = Math.min(1.0, hypoxia * 1.5 + hypothermia * 0.1);
             }
             if (shader.uniforms.bloodPressure) {
                 shader.uniforms.bloodPressure.value = usePhysicsStore.getState().entityBloodPressure;
             }
             if (shader.uniforms.bpm) {
                 shader.uniforms.bpm.value = usePhysicsStore.getState().entityHeartRate;
             }
             if (shader.uniforms.thermalVision) {
                 shader.uniforms.thermalVision.value = usePhysicsStore.getState().thermalVision ? 1.0 : 0.0;
             }
             if (shader.uniforms.perspirationLevel) {
                 shader.uniforms.perspirationLevel.value = usePhysicsStore.getState().perspirationLevel;
             }
             if (shader.uniforms.forceFieldPos) {
                 const statePhysics = usePhysicsStore.getState();
                 if (statePhysics.enableForceField) {
                     const p = statePhysics.pointerWorldPosition;
                     shader.uniforms.forceFieldPos.value.set(p[0], p[1], p[2]);
                     shader.uniforms.forceFieldIntensity.value = statePhysics.forceFieldIntensity;
                 } else {
                     shader.uniforms.forceFieldIntensity.value = 0.0;
                 }
             }

             // --- Idle Animations (Blinking & Saccades) ---
             // We only blink if the eyeBlink morph is available.
             const blinkL = mesh.morphTargetDictionary['eyeBlinkLeft'];
             const blinkR = mesh.morphTargetDictionary['eyeBlinkRight'];
             if (blinkL !== undefined && blinkR !== undefined) {
                 const blinkTrack = time % 4.0;
                 let blinkAmt = 0.0;
                 if (blinkTrack > 3.8) {
                     blinkAmt = Math.sin((blinkTrack - 3.8) * Math.PI / 0.2); // Smooth blink pulse
                 }
                 
                 // If the audio or cylinder isn't overriding blink (usually they don't explicitly), apply it organically
                 mesh.morphTargetInfluences[blinkL] = Math.max(mesh.morphTargetInfluences[blinkL], blinkAmt);
                 mesh.morphTargetInfluences[blinkR] = Math.max(mesh.morphTargetInfluences[blinkR], blinkAmt);
                 
                 // Ocular Desiccation & Limbus Blur logic
                 const currentBlink = mesh.morphTargetInfluences[blinkL];
                 if (currentBlink < 0.1) {
                     // Increase pallor simulating dying veins (desaturation)
                     if (shader.uniforms.pallorIntensity) {
                         shader.uniforms.pallorIntensity.value = Math.min(1.0, shader.uniforms.pallorIntensity.value + (delta * 0.02));
                     }
                 }
             }

             // Saccades (twiching eyes looking around randomly)
             const lookL = mesh.morphTargetDictionary['eyeLookOutLeft'];
             const lookR = mesh.morphTargetDictionary['eyeLookOutRight'];
             if (lookL !== undefined && lookR !== undefined) {
                 const saccadePhase = Math.floor(time * 1.5);
                 const eyeLx = (Math.sin(saccadePhase * 13.1) * 0.5 + 0.5) * 0.3;
                 const eyeRx = (Math.cos(saccadePhase * 17.2) * 0.5 + 0.5) * 0.3;
                 mesh.morphTargetInfluences[lookL] = Math.max(mesh.morphTargetInfluences[lookL], eyeLx);
                 mesh.morphTargetInfluences[lookR] = Math.max(mesh.morphTargetInfluences[lookR], eyeRx);
             }


             // --- Jaw Acoustic Resonance ---
             const jawIdx = mesh.morphTargetDictionary['jawOpen'];
             if (jawIdx !== undefined) {
                 const currentJaw = mesh.morphTargetInfluences[jawIdx];
                 updateGlobalFormant(currentJaw);

                 // Dehydration/Evaporation Engine
                 // If jaw is held open > 0.5, slowly increase roughness
                 if (currentJaw > 0.5) {
                     shader.uniforms.glossRoughness.value = Math.min(1.0, shader.uniforms.glossRoughness.value + (delta * 0.05));
                 } else {
                     shader.uniforms.glossRoughness.value = Math.max(0.1, shader.uniforms.glossRoughness.value - (delta * 0.1));
                 }
             }
        }
    }

    // Hidden meshes toggle
    const hiddenMeshes = usePhysicsStore.getState().hiddenMeshes;
    if (clonedScene) {
        if (isCylinder && actualRef.current) {
            const isDragged = actualRef.current.userData.dragTimeout > performance.now();
            if (!actualRef.current.userData.velocity) actualRef.current.userData.velocity = new THREE.Vector3();
            const vel = actualRef.current.userData.velocity as THREE.Vector3;
            
            if (!isDragged) {
                vel.y -= 9.81 * delta;
                actualRef.current.position.addScaledVector(vel, delta);
                
                const floorLimit = -1.0 + 1.0; // Assume bounding sphere of 1
                if (actualRef.current.position.y < floorLimit) {
                    actualRef.current.position.y = floorLimit;
                    vel.y *= -0.4;
                    vel.x *= 0.8;
                    vel.z *= 0.8;
                }
            } else {
                vel.set(0,0,0);
            }
        }

        let maxVelo = 0;
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.visible = !hiddenMeshes.has(child.uuid);
            }
            if ((child as THREE.Bone).isBone) {
                const b = child as THREE.Bone;
                if (b.userData.lastWorldPos) {
                   const wp = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
                   const v = wp.distanceTo(b.userData.lastWorldPos);
                   if (v > maxVelo) maxVelo = v;
                   b.userData.lastWorldPos.copy(wp);
                } else {
                   b.userData.lastWorldPos = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
                }
            }
        });
    }

    // 1. Restore pre-offset state before mixer
    if (clonedScene) {
        clonedScene.traverse((child) => {
            const bone = child as THREE.Bone;
            if (bone.isBone && bone.userData.preOffsetPosition) {
                bone.position.copy(bone.userData.preOffsetPosition);
                bone.rotation.copy(bone.userData.preOffsetRotation);
                bone.scale.copy(bone.userData.preOffsetScale);
            }
        });
    }

    // 2. Base animation mixer update
    if (isPlaying && mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // 3. Save new pre-offset state and apply offsets
    if (clonedScene) {
      const boneTransforms = usePhysicsStore.getState().boneTransforms;
      clonedScene.traverse((child) => {
        const bone = child as THREE.Bone;
        if (bone.isBone) {
          // Save state BEFORE we manually modify it
          if (!bone.userData.preOffsetPosition) {
              bone.userData.preOffsetPosition = bone.position.clone();
              bone.userData.preOffsetRotation = bone.rotation.clone();
              bone.userData.preOffsetScale = bone.scale.clone();
          } else {
              bone.userData.preOffsetPosition.copy(bone.position);
              bone.userData.preOffsetRotation.copy(bone.rotation);
              bone.userData.preOffsetScale.copy(bone.scale);
          }

          // Apply User Defined Transforms First (they override or act as base)
          const bt = boneTransforms[bone.uuid];
          if (bt) {
              // Apply as offsets to rotation and scale
              bone.rotation.x += bt.rotation[0];
              bone.rotation.y += bt.rotation[1];
              bone.rotation.z += bt.rotation[2];
              bone.position.x += bt.position[0];
              bone.position.y += bt.position[1];
              bone.position.z += bt.position[2];
              bone.scale.set(bone.scale.x * bt.scale[0], bone.scale.y * bt.scale[1], bone.scale.z * bt.scale[2]);
          }

          const currentFriction = usePhysicsStore.getState().calculatedFriction;
          const isPelvicBone = bone.name.includes("Bone_Vaginal_Canal") || bone.name.includes("Bone_Anorectal_Flexure") || bone.name.includes("Bone_Anal_Sphincter");

          // C: Dynamic Soft Body Collision with Cylinders (Insertion/Stretch)
          const cylinderRadius = usePhysicsStore.getState().cylinderRadius;
          const cylinderRefs = usePhysicsStore.getState().cylinderRefs;
          if (cylinderRefs && cylinderRefs.length > 0) {
              const boneWorldPos = new THREE.Vector3();
              bone.getWorldPosition(boneWorldPos);
              
              for (const cyl of cylinderRefs) {
                  if (!cyl) continue;
                  
                  // Skip self-collision
                  let isSelf = false;
                  let node = bone.parent;
                  while(node) {
                      if (node === cyl) { isSelf = true; break; }
                      node = node.parent;
                  }
                  if (isSelf) continue;
                  
                  // Compute cylinder velocity implicitly
                  if (!cyl.userData.lastWorldPos) {
                      cyl.userData.lastWorldPos = new THREE.Vector3();
                      cyl.getWorldPosition(cyl.userData.lastWorldPos);
                      cyl.userData.velocity = new THREE.Vector3();
                  } else {
                      const currentPos = new THREE.Vector3();
                      cyl.getWorldPosition(currentPos);
                      cyl.userData.velocity.copy(currentPos).sub(cyl.userData.lastWorldPos).multiplyScalar(1 / delta);
                      cyl.userData.lastWorldPos.copy(currentPos);
                  }
                  
                  const cylWorldPos = cyl.userData.lastWorldPos;
                  const cylVelo = cyl.userData.velocity as THREE.Vector3;
                  
                  // Cylinders are ~4 units tall.
                  const dy = boneWorldPos.y - cylWorldPos.y;
                  if (dy > -2.5 && dy < 2.5) {
                      const dx = boneWorldPos.x - cylWorldPos.x;
                      const dz = boneWorldPos.z - cylWorldPos.z;
                      const distXZ = Math.sqrt(dx*dx + dz*dz) + 0.0001; // prevent div zero
                      
                      const pushThreshold = cylinderRadius + 0.5; // Padding for the mesh around the bone
                      if (distXZ < pushThreshold) {
                          const overlap = pushThreshold - distXZ;
                          
                          // Convert world overlap back to local space offset
                          const nx = dx / distXZ;
                          const nz = dz / distXZ;
                          
                          const elasticity = usePhysicsStore.getState().hyperElasticity; // how stretchy
                          const cylinderSoftness = usePhysicsStore.getState().cylinderSoftness;
                          
                          // If cylinder is soft, it yields instead of pushing the funnel fully
                          const yieldFactor = 1.0 - (cylinderSoftness * 0.8);
                          const stretchMult = Math.min(1.0, overlap * elasticity * yieldFactor) / Math.max(0.01, rigidity);
                          
                          // Calculate global push
                          const globalPushX = boneWorldPos.x + (nx * stretchMult);
                          const globalPushZ = boneWorldPos.z + (nz * stretchMult);
                          const newWorldPos = new THREE.Vector3(globalPushX, boneWorldPos.y, globalPushZ);
                          
                          // Convert to local bone space
                          if (bone.parent) {
                              const parentInverse = new THREE.Matrix4().copy(bone.parent.matrixWorld).invert();
                              const newLocalPos = newWorldPos.applyMatrix4(parentInverse);
                              bone.position.copy(newLocalPos);
                          } else {
                              bone.position.copy(newWorldPos);
                          }
                          
                          // Pelvic Floor Special IK & Trauma Simulation
                          if (isPelvicBone) {
                              // High friction = stick-slip behavior (jerky, pain response)
                              if (currentFriction > 0.8) {
                                  // Splinting reflex: muscles tighten, adding noise and resisting expansion
                                  bone.scale.setLength(Math.max(0.5, bone.scale.length() * 0.9)); // Contract
                                  bone.rotation.z += (Math.random() - 0.5) * currentFriction * 0.1;
                              } else {
                                  // Smooth expansion
                                  const targetScale = 1.0 + (overlap * cylinderRadius * 0.5);
                                  bone.scale.setScalar(Math.min(2.5, targetScale));
                              }
                          }
                          
                          // Transfer Kinetic Energy (Friction / Slap)
                          const surfaceGrip = usePhysicsStore.getState().surfaceGrip;
                          const cvSqr = cylVelo.lengthSq();
                          
                          if (cvSqr > 0.01) {
                              const veloMag = Math.sqrt(cvSqr);
                              // Trigger procedural sound
                              proceduralAudio.playFriction(veloMag * surfaceGrip * overlap, usePhysicsStore.getState().fluidVaginalTransudate);
                              
                              // Smear Mechanics (transfer fluids dynamically across the mesh)
                              if (Math.random() < veloMag * 0.1) {
                                  usePhysicsStore.getState().addSmearImpact([cylWorldPos.x, cylWorldPos.y, cylWorldPos.z], usePhysicsStore.getState().fluidVaginalTransudate);
                              }
                          }

                          if (jiggleBones.has(bone.uuid) && cvSqr > 0.1) {
                              let localImpulse = cylVelo.clone().multiplyScalar(surfaceGrip * 0.05 * overlap);
                              if (bone.parent) {
                                  const pInv = new THREE.Matrix4().copy(bone.parent.matrixWorld).invert();
                                  localImpulse = localImpulse.transformDirection(pInv);
                              }
                              if (!bone.userData.slapVelocity) bone.userData.slapVelocity = new THREE.Vector3();
                              (bone.userData.slapVelocity as THREE.Vector3).add(localImpulse);
                              
                              // Bone impact audio synthesis
                              const mass = bone.scale.lengthSq() * 0.5; // Abstract mass scalar
                              const energy = 0.5 * mass * cvSqr;
                              if (energy > 2.0 && overlap > 0.5) {
                                  proceduralAudio.playImpact(Math.sqrt(cvSqr), mass, true);
                              }
                              
                              if (!bone.userData.rotVelocity) bone.userData.rotVelocity = new THREE.Vector3();
                              const torque = new THREE.Vector3(
                                  (Math.random() - 0.5) * overlap,
                                  (Math.random() - 0.5) * overlap,
                                  (Math.random() - 0.5) * overlap
                              ).multiplyScalar(surfaceGrip * 0.2);
                              
                              // Calculate torsional shear stress: tau = G * gamma
                              // Ensures skin wrings and wraps procedurally when rotated
                              const shearModulusG = 1200; // soft tissue
                              const shearStrainGamma = cvSqr * overlap * Math.PI; 
                              const tau = shearModulusG * shearStrainGamma;
                              
                              // Apply twisting writhing force
                              torque.add(cylVelo.clone().cross(new THREE.Vector3(0,1,0)).multiplyScalar(tau * 0.00005));
                              
                              (bone.userData.rotVelocity as THREE.Vector3).add(torque);
                          }
                          
                          // Trigger tactile feedback/audio if high collision
                          if (overlap > 0.5 && Math.random() < 0.05) {
                              // We can simulate slap/impact jitter directly onto rotation too
                              bone.rotation.x += (Math.random() - 0.5) * overlap * 0.1;
                          }
                      }
                  }
              }
          }

          // A: Advanced Jiggle / Shiver for assigned jiggle bones
          if (jiggleBones.has(bone.uuid)) {
            const time = state.clock.elapsedTime;
            // Shiver frequency increases as willpower decreases (entity is terrified/yielding)
            const shiverFreq = 15.0 + (1.0 - willpower) * 20.0;
            // Amplitude tied to UI slider, mixed with a chaotic perlin-like trig function
            const ampX = jiggleAmplitude * 0.1 * Math.sin(time * shiverFreq);
            const ampZ = jiggleAmplitude * 0.1 * Math.cos(time * shiverFreq * 1.3);

            // Add rotational jiggle
            bone.rotation.x += ampX * delta;
            bone.rotation.z += ampZ * delta;
            
            // Dynamic Slap Physics - Velocity Verlet Integration
            if (!bone.userData.slapOffset) bone.userData.slapOffset = new THREE.Vector3();
            if (!bone.userData.slapVelocity) bone.userData.slapVelocity = new THREE.Vector3();
            if (!bone.userData.rotOffset) bone.userData.rotOffset = new THREE.Vector3();
            if (!bone.userData.rotVelocity) bone.userData.rotVelocity = new THREE.Vector3();
            
            const so = bone.userData.slapOffset as THREE.Vector3;
            const sv = bone.userData.slapVelocity as THREE.Vector3;
            const ro = bone.userData.rotOffset as THREE.Vector3;
            const rv = bone.userData.rotVelocity as THREE.Vector3;
            
            // Evaluate Physiological Constraints provided by AutoBoneMapper, fallback to generic soft tissue
            const weight = bone.userData.mass || 1.0;
            const baseStiffness = bone.userData.stiffness || 150.0;
            const friction = bone.userData.damping || 8.0;
            const plasticityLimit = bone.userData.plasticityLimit || usePhysicsStore.getState().plasticityLimit;
            const elasticityFactor = bone.userData.hyperElasticity || usePhysicsStore.getState().hyperElasticity;
            const poissonRatio = bone.userData.poissonRatio || 0.35;
            
            // True Volumetric Squash and Stretch (Poisson's Ratio for Soft Tissue)
            // If the tissue is stretched significantly in the primary axis of deformation, it MUST compress orthogonally
            const stretchMag = so.length();
            if (stretchMag > 0.01) {
                 const stretchAxis = so.clone().normalize();
                 // Create an orthogonal contraction vector
                 const orthoSquash = new THREE.Vector3(1,1,1).sub(stretchAxis).multiplyScalar(stretchMag * poissonRatio * 2.0);
                 bone.scale.set(1.0 - orthoSquash.x, 1.0 - orthoSquash.y, 1.0 - orthoSquash.z);
            } else {
                 bone.scale.set(1,1,1);
            }
            
            // Aerodynamic Wind Drag & Environmental Flow applied directly to loose soft tissue
            const windSpeed = Math.sin(time * 0.5) * 5.0 + Math.cos(time * 1.5) * 2.0;
            const windVec = new THREE.Vector3(1, 0, 0.5).normalize().multiplyScalar(windSpeed);
            // Apply drag (F_drag = 0.5 * rho * v^2 * Cd * A) approximation
            const dragForce = windVec.clone().multiplyScalar(0.01 * (1.0 / weight));
            sv.add(dragForce.multiplyScalar(delta));

            // Non-Linear Spring Dynamics: Soft tissue resistance increases exponentially the further it stretches.
            // Stiffness multiplies as the tissue approaches its limits
            const nonLinearStiffness = baseStiffness * (1.0 + Math.pow(stretchMag * 2.0, 3.0));
            
            // Translation Spring force (Hooke's Law with damping and non-linear restoring force)
            const forceX = -nonLinearStiffness * so.x - friction * sv.x;
            const forceY = -nonLinearStiffness * so.y - friction * sv.y;
            const forceZ = -nonLinearStiffness * so.z - friction * sv.z;
            
            // Rotational Spring force (Angular Hooke's Law)
            const rotStiffness = nonLinearStiffness * 0.5;
            const rotFriction = friction * 0.5;
            const tqX = -rotStiffness * ro.x - rotFriction * rv.x;
            const tqY = -rotStiffness * ro.y - rotFriction * rv.y;
            const tqZ = -rotStiffness * ro.z - rotFriction * rv.z;
            
            // Leapfrog / Verlet integration step
            sv.x += forceX * delta;
            sv.y += forceY * delta;
            sv.z += forceZ * delta;
            
            rv.x += tqX * delta;
            rv.y += tqY * delta;
            rv.z += tqZ * delta;
            
            so.x += sv.x * delta;
            so.y += sv.y * delta;
            so.z += sv.z * delta;
            
            ro.x += rv.x * delta;
            ro.y += rv.y * delta;
            ro.z += rv.z * delta;
            
            // Cross-bone repulsion, Hysteresis & Yield (Viscoelasticity)
            const currentStrain = usePhysicsStore.getState().currentStrain;
            
            if (!bone.userData.plasticYield) bone.userData.plasticYield = new THREE.Vector3();
            const py = bone.userData.plasticYield as THREE.Vector3;
            
            const maxStretch = 0.5 * (1.0 + elasticityFactor);
            const currentStretchMag = so.length();
            
            if (currentStretchMag > maxStretch) {
                  so.setLength(maxStretch); // Hard cap on tissue tearing/stretching
                  
                  // Viscoelastic Yield (Creep): Tissue suffers plastic deformation when over-stretched
                  if (currentStretchMag > plasticityLimit) {
                      const overload = currentStretchMag - plasticityLimit;
                      // Push plastic yield towards the current stretch direction
                      py.lerp(so, delta * overload * 5.0); 
                      // Increase overall biological strain
                      usePhysicsStore.setState({ currentStrain: Math.min(1.0, currentStrain + overload * delta * 0.1) });
                  }
                  
                  // Convert excess stretch into shear/rotation (squash & stretch volume preservation)
                  ro.x += (Math.random() - 0.5) * 0.1;
            }
            
            // Hysteresis Recovery: Biological tissue slowly creeps back to resting position over time
            const creepRate = 0.05 * (1.0 - currentStrain * 0.8); // Recovers slower under high strain
            py.lerp(new THREE.Vector3(0,0,0), delta * creepRate);

            // The visible offset adds the permanent plastic yield to the instantaneous spring offset
            const visibleOffset = new THREE.Vector3().addVectors(so, py);

            // Apply calculated rotational and translational offsets
            bone.position.add(visibleOffset);
            bone.rotation.x += ro.x;
            bone.rotation.y += ro.y;
            bone.rotation.z += ro.z;
          }
          
          // B: Heavy Procedural Breathing on core/root nodes (heuristic: name contains 'spine' or 'root')
          if (bone.name.toLowerCase().includes('spine') || bone.name.toLowerCase().includes('chest')) {
             const breathSpeed = 2.0; // Breathe faster when willpower is low
             const breathScale = 1.0 + Math.sin(state.clock.elapsedTime * breathSpeed) * 0.05 * (1.5 - willpower);
             bone.scale.set(breathScale, breathScale, breathScale);
          }
        }
      });
    }
  });

  return (
    <group ref={actualRef} userData={{ isCylinder }}>
      <primitive object={clonedScene} />
      {!isCylinder && (
        <>
            <HypothalamicController />
            <SkinThermalController />
            <MyotoniaOrchestrator />
            <MammaryLattice />
            <AutonomicFACSController />
            <IdleAnimationOrchestrator />
        </>
      )}
    </group>
  );
}

function CustomGLTFPlayer({ url, groupRef, isCylinder, id }: { url: string, groupRef?: React.RefObject<THREE.Group>, isCylinder?: boolean, id?: string }) {
  const { scene, animations } = useGLTF(url, true, true, (loader) => {
      // Override the internal console.error specifically for this loader instance to suppress noise if textures fail
      // but only the "Couldn't load texture" ones
      const origError = console.error;
      loader.manager.onError = (url) => {
          console.warn('Failed to load texture:', url);
      };
  });
  return <CustomModelPlayerInner scene={scene} animations={animations} groupRef={groupRef} isCylinder={isCylinder} id={id} />;
}

function CustomFBXPlayer({ url, groupRef, isCylinder, id }: { url: string, groupRef?: React.RefObject<THREE.Group>, isCylinder?: boolean, id?: string }) {
  const fbx = useFBX(url);
  return <CustomModelPlayerInner scene={fbx} animations={fbx.animations} groupRef={groupRef} isCylinder={isCylinder} id={id} />;
}

function CustomModelPlayer({ url, groupRef, isCylinder = false, isFbx = false, id }: { url: string, groupRef?: React.RefObject<THREE.Group>, isCylinder?: boolean, isFbx?: boolean, id?: string }) {
  if (isFbx) {
    return <CustomFBXPlayer url={url} groupRef={groupRef} isCylinder={isCylinder} id={id} />;
  }
  return <CustomGLTFPlayer url={url} groupRef={groupRef} isCylinder={isCylinder} id={id} />;
}

function ProceduralCylinderWithTexture({ c }: { c: any }) {
    const activeTextureUrl = usePhysicsStore(state => state.activeTextureUrl);
    // Use Suspense boundary if texture is loading, otherwise render directly
    return (
        <React.Suspense fallback={
            <mesh position={[0,0,0]}>
                <cylinderGeometry args={[c.radius ?? 1.5, c.radius ?? 1.5, c.length ?? 5, 32, Math.floor((c.length ?? 5) * 4)]} />
                <meshPhysicalMaterial color="#ff003c" roughness={0.1} transmission={0.8} thickness={2.0} transparent={true} opacity={0.9} />
            </mesh>
        }>
            <ProceduralCylinderInner c={c} url={activeTextureUrl} />
        </React.Suspense>
    );
}

function ProceduralCylinderInner({ c, url }: { c: any, url: string | null }) {
    const texture = url ? useLoader(THREE.TextureLoader, url) : null;
    const ref = useRef<THREE.Mesh>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.userData.isCylinder = true;
            ref.current.userData.cylinderId = c.id;
            usePhysicsStore.getState().registerCylinderRef(ref.current as any);
            return () => usePhysicsStore.getState().unregisterCylinderRef(ref.current as any);
        }
    }, [c.id]);
    
    useFrame((state, delta) => {
        if (ref.current) {
            const isDragged = ref.current.userData.dragTimeout > performance.now();
            if (!ref.current.userData.velocity) ref.current.userData.velocity = new THREE.Vector3();
            const vel = ref.current.userData.velocity as THREE.Vector3;
            if (!isDragged) {
                vel.y -= 9.81 * delta; // Gravity
                
                ref.current.position.addScaledVector(vel, delta);
                
                const halfLength = (c.length ?? 5) / 2.0;
                const floorLimit = -1.0 + halfLength;
                if (ref.current.position.y < floorLimit) {
                    ref.current.position.y = floorLimit;
                    vel.y *= -0.4;
                    vel.x *= 0.8;
                    vel.z *= 0.8;
                }
            } else {
                vel.set(0,0,0);
            }
        }
    });

    return (
        <mesh position={[0,0,0]} ref={ref}>
             <cylinderGeometry args={[c.radius ?? 1.5, c.radius ?? 1.5, c.length ?? 5, 32, Math.floor((c.length ?? 5) * 4)]} />
             <meshPhysicalMaterial 
                color={texture ? "#ffffff" : "#ff003c"} 
                map={texture}
                roughness={0.1} 
                transmission={texture ? 0 : 0.8} 
                thickness={2.0} 
                transparent={true} 
                opacity={0.9} 
             />
        </mesh>
    );
}

function Lighting() {
    const environmentMode = usePhysicsStore(state => state.environmentMode);
    const lightingIntensity = usePhysicsStore(state => state.lightingIntensity);
    
    // Background based on environment
    const bgMap = {
        'cyberpunk': '#0a0a0c',
        'mono': '#ffffff',
        'laboratory': '#eef2f5'
    };
    
    return (
        <>
            <color attach="background" args={[bgMap[environmentMode]]} />
            <ambientLight intensity={environmentMode === 'laboratory' ? 1.5 * lightingIntensity : (environmentMode === 'mono' ? 2.5 * lightingIntensity : 0.6 * lightingIntensity)} />
            
            {environmentMode === 'cyberpunk' && (
                <>
                    <directionalLight position={[5, 10, 5]} intensity={1.5 * lightingIntensity} />
                    <spotLight position={[-10, 10, -5]} intensity={2 * lightingIntensity} color="#00ffcc" />
                    <spotLight position={[10, 5, 5]} intensity={2 * lightingIntensity} color="#ff00aa" />
                    <Environment preset="studio" />
                </>
            )}
            
            {environmentMode === 'mono' && (
                <>
                    <directionalLight position={[0, 10, 0]} intensity={lightingIntensity * 1.5} color="#ffffff" />
                    <Environment preset="city" />
                </>
            )}
            
            {environmentMode === 'laboratory' && (
                <>
                    <pointLight position={[0, 5, 0]} intensity={3 * lightingIntensity} color="#ffffff" />
                    <pointLight position={[5, 5, 5]} intensity={2 * lightingIntensity} color="#e0f7fa" />
                    <pointLight position={[-5, 5, -5]} intensity={2 * lightingIntensity} color="#e0f7fa" />
                    <Environment preset="apartment" />
                </>
            )}
        </>
    );
}

export default function Scene() {
  const isDragging = usePhysicsStore(s => s.isDragging);
  const cameraLocked = usePhysicsStore(s => s.cameraLocked);
  
  return (
    <div className="w-full h-full cursor-crosshair">
      <Canvas
        camera={{ position: [0, 3, 10], fov: 40 }}
        dpr={[1, 1.5]}
      >
        <Lighting />
        
        <GlobalContextSetter />

        <PhysicsWorkspace />

        <Stats />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 - 0.01}
          minDistance={1}
          maxDistance={30}
          enabled={!isDragging && !cameraLocked} // Disable camera rotation while dragging or locked
        />
      </Canvas>
    </div>
  );
}

function PhysicsWorkspace() {
  const funnelsData = usePhysicsStore(s => s.funnelsData);
  const cylindersData = usePhysicsStore(s => s.cylindersData);
  const customModelUrl = usePhysicsStore(s => s.customModelUrl);
  const activeFunnelUrl = usePhysicsStore(s => s.activeFunnelUrl);
  const activeCylinderUrl = usePhysicsStore(s => s.activeCylinderUrl);
  const activeFunnelModel = usePhysicsStore(s => s.activeFunnelModel);
  const activeCylinderModel = usePhysicsStore(s => s.activeCylinderModel);
  const audioDrivenFace = usePhysicsStore(s => s.audioDrivenFace);
  const fluidMode = usePhysicsStore(s => s.fluidMode);
  const { gl, camera, scene } = useThree();

  useEffect(() => {
    if (audioDrivenFace) {
        if (!(window as any).audioAnalyzer) {
            const analyzer = new AudioFormantAnalyzer();
            analyzer.initialize();
            (window as any).audioAnalyzer = analyzer;
        }
    } else {
        if ((window as any).audioAnalyzer) {
            (window as any).audioAnalyzer.destroy();
            (window as any).audioAnalyzer = null;
        }
    }
  }, [audioDrivenFace]);

  useEffect(() => {
    const canvas = gl.domElement;
    const activeTouches = new Map();
    const raycaster = new THREE.Raycaster();
    const touchVector = new THREE.Vector2();

    const handleTouchStart = (event: PointerEvent) => {
        // Init audio context securely upon first interaction click
        proceduralAudio.init();

        // Pointer events are fired per touch/mouse down pointer
        const touch = event;
        
        touchVector.x = (touch.clientX / window.innerWidth) * 2 - 1;
            touchVector.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(touchVector, camera);
            
            const hits = raycaster.intersectObjects(scene.children, true);
            
            const storeState = usePhysicsStore.getState();
            
            if (hits.length > 0) {
                const hitObj = hits[0].object;
                
                // Traverse up the tree to find if it belongs to a cylinder
                let isCylinderHit = false;
                let rootObj: THREE.Object3D | null = hitObj;
                while (rootObj && rootObj.parent) {
                    if (rootObj.userData && rootObj.userData.isCylinder) {
                        isCylinderHit = true;
                        break;
                    }
                    rootObj = rootObj.parent;
                }
                
                if (isCylinderHit && rootObj && storeState.enableCylinderControl) {
                    const grabbedCylinder = rootObj as THREE.Group;
                    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(dragPlane.normal), hits[0].point);
                    
                    activeTouches.set(touch.pointerId, { 
                        type: 'drag',
                        mesh: grabbedCylinder, 
                        plane: dragPlane 
                    });
                } else if ((hitObj as THREE.Mesh).isMesh && storeState.enableVertexPaintMode) {
                    activeTouches.set(touch.pointerId, {
                        type: 'paint',
                        mesh: hitObj as THREE.Mesh,
                        face: hits[0].face,
                        hitPoint: hits[0].point.clone(),
                        lastScreen: new THREE.Vector2(touch.clientX, touch.clientY)
                    });
                } else if ((hitObj as THREE.Mesh).isMesh && storeState.enableFleshInteraction) {
                    // Kinetic touch for soft body / bone slaps
                    activeTouches.set(touch.pointerId, {
                        type: 'kinetic',
                        hitPoint: hits[0].point.clone(),
                        lastScreen: new THREE.Vector2(touch.clientX, touch.clientY),
                        lastTime: performance.now(),
                        velocity: new THREE.Vector2()
                    });
                }
            } else {
                // Background void hit – route to OrbitControls by not recording the touch
            }
        
        // Track if actively interacting with scene elements
        usePhysicsStore.setState({ isDragging: Array.from(activeTouches.values()).some(t => t.type === 'drag' || t.type === 'kinetic' || t.type === 'paint') });
    };

    const handleTouchMove = (event: PointerEvent) => {
        const touch = event;
        const storeState = usePhysicsStore.getState();
        
        if (storeState.enableForceField) {
            touchVector.x = (touch.clientX / window.innerWidth) * 2 - 1;
            touchVector.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(touchVector, camera);
            const hits = raycaster.intersectObjects(scene.children, true);
            if (hits.length > 0) {
                storeState.setPointerWorldPosition([hits[0].point.x, hits[0].point.y, hits[0].point.z]);
            }
        }

        const activeGrab = activeTouches.get(touch.pointerId);
            
            if (activeGrab) {
                // Update current pointer pos for multi-touch check
                activeGrab.currentScreen = new THREE.Vector2(touch.clientX, touch.clientY);
                
                // MULTI-TOUCH VR SQUEEZE/STRETCH DETECTION
                if (activeTouches.size === 2) {
                    const pointers = Array.from(activeTouches.values());
                    if (pointers[0].currentScreen && pointers[1].currentScreen && pointers[0].lastScreen && pointers[1].lastScreen) {
                        const currentDist = pointers[0].currentScreen.distanceTo(pointers[1].currentScreen);
                        const lastDist = pointers[0].lastScreen.distanceTo(pointers[1].lastScreen);
                        const distDelta = currentDist - lastDist;
                        
                        // If spread -> Stretch, if pinch -> Squeeze
                        if (Math.abs(distDelta) > 1.0) {
                            const bones = usePhysicsStore.getState().bones;
                            const centerPoint = pointers[0].hitPoint ? pointers[0].hitPoint.clone().lerp(pointers[1].hitPoint || pointers[0].hitPoint, 0.5) : new THREE.Vector3();
                            
                            bones.forEach(b => {
                                const bPos = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
                                const dist = bPos.distanceTo(centerPoint);
                                if (dist < 15.0) { // Effect radius
                                    const force = distDelta * 0.005; 
                                    if (distDelta > 0) {
                                        // Stretch
                                        b.scale.x = Math.min(2.5, b.scale.x + force);
                                        b.scale.z = Math.min(2.5, b.scale.z + force);
                                    } else {
                                        // Squeeze volumetrically
                                        b.scale.x = Math.max(0.2, b.scale.x + force);
                                        b.scale.z = Math.max(0.2, b.scale.z + force);
                                        b.scale.y = Math.min(2.5, b.scale.y - force * 1.5); // Bulge outwards when squeezed
                                    }
                                }
                            });
                        }
                    }
                }

                if (activeGrab.type === 'drag') {
                    touchVector.x = (touch.clientX / window.innerWidth) * 2 - 1;
                    touchVector.y = -(touch.clientY / window.innerHeight) * 2 + 1;
                    
                    raycaster.setFromCamera(touchVector, camera);
                    const intersectionPoint = new THREE.Vector3();
                    raycaster.ray.intersectPlane(activeGrab.plane, intersectionPoint);
                    
                    // Set drag flag for physics
                    activeGrab.mesh.userData.dragTimeout = performance.now() + 200;

                    // Prevent cylinder from passing through funnel meshes
                    const startPos = activeGrab.mesh.position.clone();
                    const moveDir = intersectionPoint.clone().sub(startPos);
                    const dist = moveDir.length();
                    
                    if (dist > 0.001) {
                        const moveRay = new THREE.Raycaster(startPos, moveDir.normalize(), 0, dist + usePhysicsStore.getState().cylinderRadius);
                        const hits = moveRay.intersectObjects(scene.children, true);
                        
                        // Filter out hits that belong to the cylinder itself
                        const validHits = hits.filter(h => {
                            let rObj: THREE.Object3D | null = h.object;
                            while (rObj) {
                                if (rObj === activeGrab.mesh) return false;
                                rObj = rObj.parent;
                            }
                            return true;
                        });
                        
                        if (validHits.length > 0) {
                            // Stop moving to not pass through. Back up by cylinderRadius.
                            const hitDist = Math.max(0, validHits[0].distance - usePhysicsStore.getState().cylinderRadius);
                            intersectionPoint.copy(startPos).add(moveDir.multiplyScalar(hitDist));
                        }
                    }
                    
                    activeGrab.mesh.position.copy(intersectionPoint);
                } else if (activeGrab.type === 'paint') {
                    const dx = touch.clientX - activeGrab.lastScreen.x;
                    const dy = touch.clientY - activeGrab.lastScreen.y;
                    
                    const screenScale = 0.01;
                    const pullVector = new THREE.Vector3(dx * screenScale, -dy * screenScale, 0);
                    
                    const paintIntensity = storeState.vertexPaintIntensity;
                    pullVector.multiplyScalar(paintIntensity);
                    
                    if (activeGrab.face && activeGrab.mesh.geometry) {
                        const geom = activeGrab.mesh.geometry as THREE.BufferGeometry;
                        if (geom.attributes.position) {
                            const pullAmount = pullVector.length();
                            
                            // Mutate position attribute directly
                            const posAttr = geom.attributes.position;
                            const idxA = activeGrab.face.a;
                            const idxB = activeGrab.face.b;
                            const idxC = activeGrab.face.c;
                            
                            const vA = new THREE.Vector3().fromBufferAttribute(posAttr, idxA);
                            const vB = new THREE.Vector3().fromBufferAttribute(posAttr, idxB);
                            const vC = new THREE.Vector3().fromBufferAttribute(posAttr, idxC);
                            
                            vA.add(pullVector);
                            vB.add(pullVector);
                            vC.add(pullVector);
                            
                            posAttr.setXYZ(idxA, vA.x, vA.y, vA.z);
                            posAttr.setXYZ(idxB, vB.x, vB.y, vB.z);
                            posAttr.setXYZ(idxC, vC.x, vC.y, vC.z);
                            
                            posAttr.needsUpdate = true;
                            // Optionally recompute normals if visually noticeable
                            // geom.computeVertexNormals();
                        }
                    }
                    
                    activeGrab.lastScreen.set(touch.clientX, touch.clientY);
                } else if (activeGrab.type === 'kinetic') {
                    const now = performance.now();
                    const dt = Math.max(1, now - activeGrab.lastTime);
                    const dx = touch.clientX - activeGrab.lastScreen.x;
                    const dy = touch.clientY - activeGrab.lastScreen.y;
                    
                    activeGrab.currentScreen = new THREE.Vector2(touch.clientX, touch.clientY);
                    
                    const vx = dx / dt;
                    const vy = dy / dt; 
                    const speed = Math.sqrt(vx*vx + vy*vy);
                    
                    const slapSensitivity = usePhysicsStore.getState().slapSensitivity;
                    
                    if (activeTouches.size === 1) {
                        if (speed > 2.5) {
                            // High Velocity Slap Detection
                            const impulseMultiplier = Math.min(speed * 0.5 * slapSensitivity * 50.0, 100.0);
                            const worldImpulse = new THREE.Vector3(vx, -vy, 0).multiplyScalar(impulseMultiplier);
                            usePhysicsStore.getState().applySlap(activeGrab.hitPoint, worldImpulse);
                            
                            // Send neurological latency signal
                            neuroRouter.sendSignal('NOCICEPTIVE', speed * 0.1, activeGrab.hitPoint);
                            
                            // Procedural Acoustic Synthesis & Ripple Shader Trigger
                            proceduralAudio.playImpact(speed, 0.5, false);
                            usePhysicsStore.getState().addRippleImpact([activeGrab.hitPoint.x, activeGrab.hitPoint.y, activeGrab.hitPoint.z], speed * 0.5);
                        } else {
                            // Slow Drag -> Squeeze/Stretch/Grab Tissue (Continuous pull)
                            const pullStrength = 20.0 * slapSensitivity;
                            const worldPull = new THREE.Vector3(vx, -vy, 0).multiplyScalar(pullStrength * dt);
                            usePhysicsStore.getState().applySlap(activeGrab.hitPoint, worldPull);
                        }
                        
                        // Dynamically trace hits during continuous swipe or drag
                        touchVector.x = (touch.clientX / window.innerWidth) * 2 - 1;
                        touchVector.y = -(touch.clientY / window.innerHeight) * 2 + 1;
                        raycaster.setFromCamera(touchVector, camera);
                        const hits = raycaster.intersectObjects(scene.children, true);
                        if (hits.length > 0) {
                            let hitCylinder = false;
                            let rObj: THREE.Object3D | null = hits[0].object;
                            while (rObj && rObj.parent) {
                                if (rObj.userData && rObj.userData.isCylinder) { hitCylinder = true; break; }
                                rObj = rObj.parent;
                            }
                            if (!hitCylinder) {
                                activeGrab.hitPoint.copy(hits[0].point);
                            }
                        }
                    }
                    
                    activeGrab.lastScreen.set(touch.clientX, touch.clientY);
                    activeGrab.lastTime = now;
                }
            }
    };

    const handleTouchEnd = (event: PointerEvent) => {
        const touch = event;
        const activeGrab = activeTouches.get(touch.pointerId);
        
        if (activeGrab) {
            if (activeGrab.type === 'drag' && activeGrab.mesh.userData && activeGrab.mesh.userData.cylinderId) {
                const id = activeGrab.mesh.userData.cylinderId;
                const pos = activeGrab.mesh.position;
                usePhysicsStore.getState().updateCylinderTransform(id, { position: [pos.x, pos.y, pos.z] });
            }
            activeTouches.delete(touch.pointerId);
        }
        
        // Update drag state
        usePhysicsStore.setState({ isDragging: activeTouches.size > 0 });
    };

    canvas.addEventListener("pointerdown", handleTouchStart);
    canvas.addEventListener("pointermove", handleTouchMove);
    canvas.addEventListener("pointerup", handleTouchEnd);
    canvas.addEventListener("pointercancel", handleTouchEnd);

    return () => {
        canvas.removeEventListener("pointerdown", handleTouchStart);
        canvas.removeEventListener("pointermove", handleTouchMove);
        canvas.removeEventListener("pointerup", handleTouchEnd);
        canvas.removeEventListener("pointercancel", handleTouchEnd);
    };
  }, [gl, camera, scene]);

  return (
    <group position={[0, -2, 0]}>
      {funnelsData.map(f => {
         const finalUrl = f.url || activeFunnelUrl;
         const isFbx = f.isFbx ?? activeFunnelModel?.toLowerCase().endsWith('.fbx') ?? false;
         return (
         <group key={f.id} position={f.position} rotation={f.rotation || [0,0,0]} scale={f.scale || [1,1,1]}>
             {finalUrl ? (
                 <ErrorBoundary fallback={<SoftFunnel cylinderRef={{ current: null } as unknown as React.RefObject<THREE.Group>} />}>
                     <React.Suspense fallback={<SoftFunnel cylinderRef={{ current: null } as unknown as React.RefObject<THREE.Group>} />}>
                         <CustomModelPlayer id={f.id} url={finalUrl} isFbx={isFbx} groupRef={{ current: null } as unknown as React.RefObject<THREE.Group>} />
                     </React.Suspense>
                 </ErrorBoundary>
             ) : (
                 <SoftFunnel cylinderRef={{ current: null } as unknown as React.RefObject<THREE.Group>} />
             )}
         </group>
         );
      })}

      {cylindersData.map(c => {
         const finalUrl = c.url || activeCylinderUrl || customModelUrl;
         const isFbx = c.isFbx ?? activeCylinderModel?.toLowerCase().endsWith('.fbx') ?? false;
         return (
         <group key={c.id} position={c.position} rotation={c.rotation || [0,0,0]} scale={c.scale || [1,1,1]} userData={{ cylinderId: c.id }}>
             {c.isProcedural ? (
                 <ErrorBoundary fallback={<HardCylinder />}>
                     <ProceduralCylinderWithTexture c={c} />
                 </ErrorBoundary>
             ) : finalUrl ? (
                 <ErrorBoundary fallback={<HardCylinder />}>
                     <React.Suspense fallback={<HardCylinder />}>
                         <CustomModelPlayer id={c.id} url={finalUrl} isFbx={isFbx} groupRef={{ current: null } as unknown as React.RefObject<THREE.Group>} isCylinder={true} />
                     </React.Suspense>
                 </ErrorBoundary>
             ) : (
                 <HardCylinder />
             )}
         </group>
         );
      })}
      
      {/* Extracted Deformable World SDF Surface */}
      <DeformableEnvironment />
      
      {/* Environmental Fog / Breath Condensation */}
      <AtmosphericController />

      <gridHelper args={[50, 50, '#111', '#111']} position={[0, -0.99, 0]} />
      <ContactShadows position={[0, -0.98, 0]} opacity={0.6} scale={15} blur={1.5} far={4} />
    </group>
  );
}
