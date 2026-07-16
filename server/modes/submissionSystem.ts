import { LimbHealth } from '../hitboxLogic';

export type SubmissionState = 'locked_in' | 'struggling' | 'escaping' | 'tap_out' | 'rope_break';

export interface SubmissionContext {
    attackerId: string;
    defenderId: string;
    targetLimb: keyof LimbHealth;
    attackerStamina: number;
    defenderLimbHealth: number;
    defenderStamina: number;
    distanceToRopes: number; // 0.0 to 1.0 (1.0 = middle of ring, 0.0 = touching ropes)
    currentState: SubmissionState;
    pressureGauge: number; // 0.0 to 100.0 (100 = tap out)
}

export const initSubmission = (
    attackerId: string, defenderId: string, 
    targetLimb: keyof LimbHealth,
    attackerStamina: number,
    defenderHealth: LimbHealth, defenderStamina: number,
    distanceToRopes: number
): SubmissionContext => {
    return {
        attackerId,
        defenderId,
        targetLimb,
        attackerStamina,
        defenderLimbHealth: defenderHealth[targetLimb],
        defenderStamina,
        distanceToRopes,
        currentState: 'locked_in',
        pressureGauge: 50 // Starts in the middle
    };
};

export const processSubmissionTick = (
    context: SubmissionContext,
    attackerInput: number, // Pressure applied
    defenderInput: number  // Resistance applied
): SubmissionContext => {
    // If defender is near ropes, trigger rope break sequence
    if (context.distanceToRopes <= 0.1) {
        return { ...context, currentState: 'rope_break' };
    }

    // Attacker's effectiveness relies on their stamina
    const attackerForce = attackerInput * (context.attackerStamina / 100);
    
    // Defender's effectiveness relies on the health of the trapped limb and their remaining stamina
    const limbFactor = context.defenderLimbHealth / 100;
    const defenderResistance = defenderInput * ((context.defenderStamina * 0.5 + limbFactor * 50) / 100);

    // Calculate pressure delta
    const delta = (attackerForce - defenderResistance) * 5.0; // Multiplier for gauge speed
    
    let newPressure = Math.max(0, Math.min(100, context.pressureGauge + delta));
    let newState: SubmissionState = 'struggling';

    if (newPressure >= 100) {
        newState = 'tap_out';
    } else if (newPressure <= 0) {
        newState = 'escaping';
    }

    return {
        ...context,
        pressureGauge: newPressure,
        currentState: newState
    };
};
