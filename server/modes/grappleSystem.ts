import { LimbHealth } from '../hitboxLogic';

export type TieUpState = 'neutral' | 'advantage_p1' | 'advantage_p2' | 'break';

export interface TieUpContext {
    p1ArmHealthAverage: number;
    p2ArmHealthAverage: number;
    p1Stamina: number;
    p2Stamina: number;
    state: TieUpState;
}

export const calculateTieUpAdvantage = (
    p1Health: LimbHealth, p1Stamina: number,
    p2Health: LimbHealth, p2Stamina: number
): TieUpContext => {
    // Average arm health is crucial for lock-ups and tie-ups
    const p1ArmHealthAverage = (p1Health.leftArm + p1Health.rightArm) / 2;
    const p2ArmHealthAverage = (p2Health.leftArm + p2Health.rightArm) / 2;

    // Weight stamina (40%) and arm health (60%) for grapple leverage score
    const p1Score = (p1ArmHealthAverage * 0.6) + (p1Stamina * 0.4);
    const p2Score = (p2ArmHealthAverage * 0.6) + (p2Stamina * 0.4);

    let state: TieUpState = 'neutral';
    
    // 15 point differential needed to dominate a collar-and-elbow tie-up natively
    if (p1Score > p2Score + 15) {
        state = 'advantage_p1';
    } else if (p2Score > p1Score + 15) {
        state = 'advantage_p2';
    }

    return {
        p1ArmHealthAverage,
        p2ArmHealthAverage,
        p1Stamina,
        p2Stamina,
        state
    };
};

export const resolveTestOfStrength = (
    context: TieUpContext, 
    p1InputForce: number, // 0.0 to 1.0 based on analog pressure
    p2InputForce: number
) => {
    // Input force is scaled dynamically by the current arm health
    const p1Effort = p1InputForce * (context.p1ArmHealthAverage / 100);
    const p2Effort = p2InputForce * (context.p2ArmHealthAverage / 100);

    if (p1Effort > p2Effort + 0.2) return 'p1_wins';
    if (p2Effort > p1Effort + 0.2) return 'p2_wins';
    return 'stalemate';
};
