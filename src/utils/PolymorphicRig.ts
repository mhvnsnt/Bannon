import * as THREE from 'three';

export class FABRIKSolver {
    public bones: THREE.Bone[] = [];
    public target: THREE.Vector3 = new THREE.Vector3();
    public tolerance: number = 0.01;
    public maxIterations: number = 10;
    private distances: number[] = [];

    constructor(bones: THREE.Bone[]) {
        this.bones = bones;
        this.calculateDistances();
    }

    private calculateDistances() {
        this.distances = [];
        for (let i = 0; i < this.bones.length - 1; i++) {
            const b1 = this.bones[i];
            const b2 = this.bones[i + 1];
            // Compute the distance between bones in their local coordinates
            this.distances.push(b1.position.distanceTo(b2.position));
        }
    }

    /**
     * Solves the kinematic chain towards a target coordinate using the FABRIK algorithm
     */
    public solve(targetPosition: THREE.Vector3) {
        if (this.bones.length < 2) return;

        // Save starting root position in world space
        const rootPos = this.bones[0].position.clone();
        const totalLength = this.distances.reduce((a, b) => a + b, 0);
        const targetDist = rootPos.distanceTo(targetPosition);

        // If target is out of reach, stretch the chain directly towards target
        if (targetDist > totalLength) {
            for (let i = 0; i < this.bones.length - 1; i++) {
                const b1 = this.bones[i];
                const b2 = this.bones[i + 1];
                const dir = new THREE.Vector3().subVectors(targetPosition, b1.position).normalize();
                b2.position.copy(b1.position).addScaledVector(dir, this.distances[i]);
            }
            return;
        }

        // Iteratively reach backwards and forwards
        const positions: THREE.Vector3[] = this.bones.map(b => b.position.clone());

        for (let iter = 0; iter < this.maxIterations; iter++) {
            const tipPos = positions[positions.length - 1];
            if (tipPos.distanceTo(targetPosition) < this.tolerance) {
                break;
            }

            // Forward Pass: set tip to target and work backwards
            positions[positions.length - 1].copy(targetPosition);
            for (let i = positions.length - 2; i >= 0; i--) {
                const dir = new THREE.Vector3().subVectors(positions[i], positions[i + 1]).normalize();
                positions[i].copy(positions[i + 1]).addScaledVector(dir, this.distances[i]);
            }

            // Backward Pass: set root to original and work forwards
            positions[0].copy(rootPos);
            for (let i = 0; i < positions.length - 1; i++) {
                const dir = new THREE.Vector3().subVectors(positions[i + 1], positions[i]).normalize();
                positions[i + 1].copy(positions[i]).addScaledVector(dir, this.distances[i]);
            }
        }

        // Write positions back to bones
        for (let i = 0; i < this.bones.length; i++) {
            this.bones[i].position.copy(positions[i]);
        }
    }
}

export class PolymorphicRig {
    // Common bone name mappings to our standard
    private static boneDictionary: Record<string, string[]> = {
        'Hips': ['Hips', 'pelvis', 'root', 'mixamorig:Hips'],
        'Spine': ['Spine', 'spine01', 'mixamorig:Spine'],
        'Chest': ['Chest', 'spine02', 'mixamorig:Spine1'],
        'Neck': ['Neck', 'neck01', 'mixamorig:Neck'],
        'Head': ['Head', 'head', 'mixamorig:Head'],
        'LeftShoulder': ['LeftShoulder', 'clavicle_l', 'mixamorig:LeftShoulder'],
        'LeftArm': ['LeftArm', 'upperarm_l', 'mixamorig:LeftArm'],
        'LeftForeArm': ['LeftForeArm', 'lowerarm_l', 'mixamorig:LeftForeArm'],
        'LeftHand': ['LeftHand', 'hand_l', 'mixamorig:LeftHand'],
        'RightShoulder': ['RightShoulder', 'clavicle_r', 'mixamorig:RightShoulder'],
        'RightArm': ['RightArm', 'upperarm_r', 'mixamorig:RightArm'],
        'RightForeArm': ['RightForeArm', 'lowerarm_r', 'mixamorig:RightForeArm'],
        'RightHand': ['RightHand', 'hand_r', 'mixamorig:RightHand'],
        'LeftUpLeg': ['LeftUpLeg', 'thigh_l', 'mixamorig:LeftUpLeg'],
        'LeftLeg': ['LeftLeg', 'calf_l', 'mixamorig:LeftLeg'],
        'LeftFoot': ['LeftFoot', 'foot_l', 'mixamorig:LeftFoot'],
        'RightUpLeg': ['RightUpLeg', 'thigh_r', 'mixamorig:RightUpLeg'],
        'RightLeg': ['RightLeg', 'calf_r', 'mixamorig:RightLeg'],
        'RightFoot': ['RightFoot', 'foot_r', 'mixamorig:RightFoot'],
    };

    /**
     * Map a custom skeleton to standard bone names based on heuristic matching
     */
    public static mapBones(skeleton: THREE.Skeleton): Record<string, THREE.Bone> {
        const mapped: Record<string, THREE.Bone> = {};
        
        skeleton.bones.forEach(bone => {
            for (const [standardName, aliases] of Object.entries(this.boneDictionary)) {
                if (aliases.some(alias => bone.name.toLowerCase().includes(alias.toLowerCase()))) {
                    mapped[standardName] = bone;
                    break;
                }
            }
        });

        console.log(`[PolymorphicRig] Mapped ${Object.keys(mapped).length} bones from custom GLB.`);
        return mapped;
    }

    /**
     * Re-link standard joint structures of any arbitrary GLB model skeleton 
     * to native FABRIK IK chain solvers (e.g., LeftArm, RightArm, LeftLeg, RightLeg)
     */
    public static relinkToIKIndices(mappedBones: Record<string, THREE.Bone>): Record<string, FABRIKSolver> {
        const solvers: Record<string, FABRIKSolver> = {};

        // 1. Setup Left Arm IK Chain
        const leftArmChain: THREE.Bone[] = [];
        if (mappedBones['LeftShoulder']) leftArmChain.push(mappedBones['LeftShoulder']);
        if (mappedBones['LeftArm']) leftArmChain.push(mappedBones['LeftArm']);
        if (mappedBones['LeftForeArm']) leftArmChain.push(mappedBones['LeftForeArm']);
        if (mappedBones['LeftHand']) leftArmChain.push(mappedBones['LeftHand']);

        if (leftArmChain.length >= 2) {
            solvers['leftArm'] = new FABRIKSolver(leftArmChain);
        }

        // 2. Setup Right Arm IK Chain
        const rightArmChain: THREE.Bone[] = [];
        if (mappedBones['RightShoulder']) rightArmChain.push(mappedBones['RightShoulder']);
        if (mappedBones['RightArm']) rightArmChain.push(mappedBones['RightArm']);
        if (mappedBones['RightForeArm']) rightArmChain.push(mappedBones['RightForeArm']);
        if (mappedBones['RightHand']) rightArmChain.push(mappedBones['RightHand']);

        if (rightArmChain.length >= 2) {
            solvers['rightArm'] = new FABRIKSolver(rightArmChain);
        }

        // 3. Setup Left Leg IK Chain
        const leftLegChain: THREE.Bone[] = [];
        if (mappedBones['LeftUpLeg']) leftLegChain.push(mappedBones['LeftUpLeg']);
        if (mappedBones['LeftLeg']) leftLegChain.push(mappedBones['LeftLeg']);
        if (mappedBones['LeftFoot']) leftLegChain.push(mappedBones['LeftFoot']);

        if (leftLegChain.length >= 2) {
            solvers['leftLeg'] = new FABRIKSolver(leftLegChain);
        }

        // 4. Setup Right Leg IK Chain
        const rightLegChain: THREE.Bone[] = [];
        if (mappedBones['RightUpLeg']) rightLegChain.push(mappedBones['RightUpLeg']);
        if (mappedBones['RightLeg']) rightLegChain.push(mappedBones['RightLeg']);
        if (mappedBones['RightFoot']) rightLegChain.push(mappedBones['RightFoot']);

        if (rightLegChain.length >= 2) {
            solvers['rightLeg'] = new FABRIKSolver(rightLegChain);
        }

        console.log(`[PolymorphicRig] Generated ${Object.keys(solvers).length} native FABRIK IK solvers for skeleton.`);
        return solvers;
    }

    /**
     * Autonomously scale and translate the root node so the model fits a standard spatial footprint
     */
    public static normalizeScale(scene: THREE.Object3D, targetHeight: number = 4.5): void {
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        
        const currentHeight = size.y;
        if (currentHeight === 0) return;

        const scaleMultiplier = targetHeight / currentHeight;
        
        scene.scale.setScalar(scaleMultiplier);
        
        // Recalculate box after scaling to find new offset
        box.setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        
        // Offset so bottom of feet is at Y=0 and object is centered on X/Z
        scene.position.y -= box.min.y;
        scene.position.x -= center.x;
        scene.position.z -= center.z;

        console.log(`[PolymorphicRig] Normalized scale. Multiplier: ${scaleMultiplier.toFixed(2)}. Translating to origin.`);
    }
}
