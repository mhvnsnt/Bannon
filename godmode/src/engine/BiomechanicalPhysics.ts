import { ContinuousWorldModel } from "./ContinuousWorldModel";

/**
 * BiomechanicalPhysics Grid
 * Executes active ragdolls, Full Body Inverse Kinematics (FBIK), and Finite Element Method (FEM) fracture physics.
 */

// Represents a 3D vector for calculations
export class Vector3 {
    constructor(public x: number, public y: number, public z: number) {}

    add(v: Vector3): Vector3 { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v: Vector3): Vector3 { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    mul(scalar: number): Vector3 { return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar); }
    dot(v: Vector3): number { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v: Vector3): Vector3 {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
}

/**
 * Proportional Derivative Motor Controller
 * Actively fights gravity to maintain balance, replacing static localized weight.
 */
export class PDController {
    constructor(
        public kp: number, // Proportional stiffness
        public kd: number  // Damping factor
    ) {}

    /**
     * Calculates the torque required to reach the target angle.
     * τ = Kp(θ_target - θ_current) - Kd(ω_current)
     */
    computeTorque(targetAngle: number, currentAngle: number, currentAngularVelocity: number): number {
        const error = targetAngle - currentAngle;
        const pTerm = this.kp * error;
        const dTerm = this.kd * currentAngularVelocity;
        return pTerm - dTerm;
    }
}

/**
 * Bone / Cartilage structural integrity via Finite Element Method (FEM) approximation
 */
export class FiniteElementNode {
    // Mechanical Material Constants
    public yieldPoint: number;
    public stiffnessMatrixK: number;
    public currentlyFractured: boolean = false;

    constructor(stiffness: number, yieldThreshold: number) {
        this.stiffnessMatrixK = stiffness;
        this.yieldPoint = yieldThreshold;
    }

    /**
     * Strain Energy U = (1/2) * (F^2 / K)
     */
    calculateStructuralFatigue(appliedKineticForce: number): boolean {
        if (this.currentlyFractured) return true;

        const displacement = appliedKineticForce / this.stiffnessMatrixK;
        const strainEnergy = 0.5 * this.stiffnessMatrixK * Math.pow(displacement, 2);

        if (strainEnergy > this.yieldPoint) {
            this.currentlyFractured = true;
            console.log(`[BIOMECHANICAL EVENT]: Structural Integrity Yield Point Breached. Fracture initiated.`);
        }
        
        return this.currentlyFractured;
    }
}

/**
 * Full Body Inverse Kinematics
 * Utilizing Jacobian Pseudo-Inverse representation for grapple holds
 */
export class FBIKEngine {
    /**
     * Computes necessary angular alignment to grapple onto an opponent.
     */
    static calculateJacobianTranspose(
        targetDisplacement: Vector3,
        currentRotationParams: Vector3,
        jacobianStateMatrix: [[number, number, number], [number, number, number], [number, number, number]]
    ): Vector3 {
        // J^T * Δx (Approximated iterative step for pseudo-inverse behavior)
        const dtThetaX = jacobianStateMatrix[0][0] * targetDisplacement.x + jacobianStateMatrix[1][0] * targetDisplacement.y + jacobianStateMatrix[2][0] * targetDisplacement.z;
        const dtThetaY = jacobianStateMatrix[0][1] * targetDisplacement.x + jacobianStateMatrix[1][1] * targetDisplacement.y + jacobianStateMatrix[2][1] * targetDisplacement.z;
        const dtThetaZ = jacobianStateMatrix[0][2] * targetDisplacement.x + jacobianStateMatrix[1][2] * targetDisplacement.y + jacobianStateMatrix[2][2] * targetDisplacement.z;
        
        return new Vector3(dtThetaX, dtThetaY, dtThetaZ);
    }
}

/**
 * The unified physical compiler for active ragdolls in visceral combat.
 */
export class BiomechanicalCombatGrid {
    private continuousModel: ContinuousWorldModel;

    constructor() {
        this.continuousModel = new ContinuousWorldModel();
    }

    public simulateStrikeImpact(
        mass: number, 
        linearVelocity: number, 
        angularVelocity: number, 
        momentOfInertia: number,
        targetBoneNode: FiniteElementNode
    ): { kineticEnergy: number, fractured: boolean } {
        // E_k = (1/2)*m*v^2 + (1/2)*I*ω^2
        const translationalEnergy = 0.5 * mass * Math.pow(linearVelocity, 2);
        const rotationalEnergy = 0.5 * momentOfInertia * Math.pow(angularVelocity, 2);
        const totalKineticEnergy = translationalEnergy + rotationalEnergy;
        
        // Output structural fracture event via FEM
        const isFractured = targetBoneNode.calculateStructuralFatigue(totalKineticEnergy);

        return {
            kineticEnergy: totalKineticEnergy,
            fractured: isFractured
        };
    }
}
