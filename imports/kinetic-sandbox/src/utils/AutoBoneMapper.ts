import * as THREE from 'three';

// Model Agnostic Bone Auto-Understanding & Hookup
// Scans an arbitrary skeleton (DAZ Genesis, Mixamo, VRoid, Custom) and assigns physiological constraints

export interface PhysiologicalBoneProfile {
    semanticClass: 'BONE' | 'FAT' | 'MUSCLE' | 'CARTILAGE' | 'FASCIA' | 'UNKNOWN';
    mass: number;
    stiffness: number;
    damping: number;
    plasticityLimit: number;
    hyperElasticity: number;
    poissonRatio: number; // Volume preservation factor (0.5 for incompressible liquid/fat)
}

export class AutoBoneMapper {
    private static readonly ALIASES = {
        FAT: ['breast', 'pec', 'glute', 'butt', 'belly', 'fat', 'thigh', 'calf', 'cheek', 'jowl'],
        MUSCLE: ['bicep', 'tricep', 'deltoid', 'abdom', 'quad', 'hamstring', 'tongue', 'lip'],
        CARTILAGE: ['ear', 'nose', 'nostril'],
        BONE: ['spine', 'head', 'neck', 'shoulder', 'clavicle', 'pelvis', 'hip', 'femur', 'tibia', 'foot', 'arm', 'hand', 'finger']
    };

    public static mapSkeleton(skeleton: THREE.Skeleton) {
        skeleton.bones.forEach(bone => {
            const name = bone.name.toLowerCase();
            const profile = this.analyzeBoneSemantic(name);
            
            // Inject calculated physiological constraints securely into userData
            bone.userData.semanticClass = profile.semanticClass;
            bone.userData.mass = profile.mass;
            bone.userData.stiffness = profile.stiffness;
            bone.userData.damping = profile.damping;
            bone.userData.plasticityLimit = profile.plasticityLimit;
            bone.userData.hyperElasticity = profile.hyperElasticity;
            bone.userData.poissonRatio = profile.poissonRatio;
            
            // Initialize physics state containers
            bone.userData.springOffset = new THREE.Vector3();
            bone.userData.springVelocity = new THREE.Vector3();
            bone.userData.rotOffset = new THREE.Vector3();
            bone.userData.rotVelocity = new THREE.Vector3();
            bone.userData.plasticYield = new THREE.Vector3(); // Permanent deformation
        });
        
        console.log(`[AutoBoneMapper] Successfully parsed ${skeleton.bones.length} bones and established physiological bounds.`);
    }

    private static analyzeBoneSemantic(name: string): PhysiologicalBoneProfile {
        // Evaluate substrings against known universal rigs
        
        // 1. Soft Tissue / FAT
        let isFat = this.ALIASES.FAT.some(alias => name.includes(alias));
        if (isFat) {
            return {
                semanticClass: 'FAT',
                mass: 0.8, // Heavy, high inertia
                stiffness: 80.0, // Loose
                damping: 4.0, // Low damping, oscillates wildly
                plasticityLimit: 0.6, // Yields easily under stress
                hyperElasticity: 0.8, // Can stretch significantly
                poissonRatio: 0.49 // Nearly perfectly incompressible fluid volume
            };
        }

        // 2. MUSCLE / TENSION
        let isMuscle = this.ALIASES.MUSCLE.some(alias => name.includes(alias));
        if (isMuscle) {
            return {
                semanticClass: 'MUSCLE',
                mass: 1.2, // Dense
                stiffness: 300.0, // Tight, powerful
                damping: 15.0, // High damping, snaps back fast
                plasticityLimit: 0.8, // Tears harder
                hyperElasticity: 0.3, // Doesn't stretch as far as fat
                poissonRatio: 0.4 // Expands outward laterally when flexed
            };
        }
        
        // 3. CARTILAGE 
        let isCartilage = this.ALIASES.CARTILAGE.some(alias => name.includes(alias));
        if (isCartilage) {
            return {
                semanticClass: 'CARTILAGE',
                mass: 0.2, // Light
                stiffness: 400.0, // Rigid flex
                damping: 20.0, 
                plasticityLimit: 0.9, // Snaps instead of yielding
                hyperElasticity: 0.1,
                poissonRatio: 0.2
            };
        }

        // 4. SKELETAL BONE (Kinematic anchors usually)
        let isBone = this.ALIASES.BONE.some(alias => name.includes(alias));
        if (isBone) {
            return {
                semanticClass: 'BONE',
                mass: 2.0, 
                stiffness: 1000.0, // Does not jiggle easily
                damping: 50.0,
                plasticityLimit: 1.0, 
                hyperElasticity: 0.01,
                poissonRatio: 0.1
            };
        }

        // 5. UNKNOWN / FASCIA (Default connective tissue)
        return {
            semanticClass: 'FASCIA',
            mass: 0.5,
            stiffness: 150.0,
            damping: 8.0,
            plasticityLimit: 0.5,
            hyperElasticity: 0.5,
            poissonRatio: 0.35
        };
    }
}
