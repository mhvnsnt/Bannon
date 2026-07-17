import { LimbHealth } from '../hitboxLogic';

export type RagdollState = 'animated' | 'partial_ragdoll' | 'full_ragdoll' | 'recovery';

export interface PhysicsImpact {
    forceVector: { x: number, y: number, z: number };
    impactMagnitude: number;
    hitLimb: keyof LimbHealth;
}

export interface RagdollContext {
    entityId: string;
    currentState: RagdollState;
    centerOfMassOffset: number; // Deviation from stable stance (0.0 = perfect balance, 1.0 = falling)
    angularVelocity: number;
    stamina: number;
    concussionFactor: number;
}

export const processPhysicsImpact = (
    context: RagdollContext,
    impact: PhysicsImpact,
    defenderMass: number
): RagdollContext => {
    // 1. Calculate the destabilization based on force vs. mass
    // A heavier defender resists force better
    const forceRatio = impact.impactMagnitude / defenderMass;
    
    // If stamina is low, the body offers less resistance
    const fatigueMultiplier = 1.0 + ((100 - context.stamina) / 100);
    
    // Add raw force to the center of mass disruption
    let newComOffset = context.centerOfMassOffset + (forceRatio * fatigueMultiplier * 0.1);
    
    // If hit in the head, add severe angular velocity (spin/daze)
    let newAngularVel = context.angularVelocity;
    let newConcussion = context.concussionFactor;
    
    if (impact.hitLimb === 'head') {
        newAngularVel += forceRatio * 0.5;
        newConcussion += forceRatio * 0.2;
    } else if (impact.hitLimb === 'leftLeg' || impact.hitLimb === 'rightLeg') {
        // Leg hits severely disrupt center of mass
        newComOffset += forceRatio * 0.3;
    }

    let newState = context.currentState;

    // 2. State Machine Transitions based on Euphoria-style balance matrix
    if (newComOffset > 0.8 || newConcussion > 0.7) {
        // Complete structural collapse -> Full Ragdoll
        newState = 'full_ragdoll';
    } else if (newComOffset > 0.4) {
        // Staggering, IK trying to catch balance -> Partial Ragdoll (Physical Animation)
        newState = 'partial_ragdoll';
    }

    return {
        ...context,
        currentState: newState,
        centerOfMassOffset: Math.min(newComOffset, 1.0),
        angularVelocity: Math.min(newAngularVel, 1.0),
        concussionFactor: Math.min(newConcussion, 1.0)
    };
};

export const processRecoveryTick = (context: RagdollContext): RagdollContext => {
    // Attempt to recover balance if stamina permits
    if (context.currentState === 'full_ragdoll') {
        // Needs high stamina to initiate get-up
        if (context.stamina > 30 && context.concussionFactor < 0.5) {
            return { ...context, currentState: 'recovery' };
        }
        return context;
    }

    if (context.currentState === 'partial_ragdoll' || context.currentState === 'recovery') {
        // Slowly regain center of mass
        const recoveryRate = (context.stamina / 100) * 0.05;
        const newComOffset = Math.max(0, context.centerOfMassOffset - recoveryRate);
        const newConcussion = Math.max(0, context.concussionFactor - 0.01);
        
        let newState = context.currentState;
        if (newComOffset < 0.1 && newConcussion < 0.1) {
            newState = 'animated'; // Fully recovered to animation state
        }

        return {
            ...context,
            currentState: newState,
            centerOfMassOffset: newComOffset,
            concussionFactor: newConcussion,
            angularVelocity: Math.max(0, context.angularVelocity - 0.1)
        };
    }

    return context;
};
