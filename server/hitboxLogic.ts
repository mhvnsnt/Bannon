export interface LimbHealth {
    head: number;
    torso: number;
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
}

export const initialLimbHealth = (): LimbHealth => ({
    head: 100,
    torso: 100,
    leftArm: 100,
    rightArm: 100,
    leftLeg: 100,
    rightLeg: 100
});

export const calculateIKPenaltyFromLimbs = (health: LimbHealth): number => {
    // 0 = no penalty, 1.0 = maximum limp/penalty
    let penalty = 0;
    if (health.leftLeg < 50) penalty += 0.2;
    if (health.leftLeg < 20) penalty += 0.3;
    if (health.rightLeg < 50) penalty += 0.2;
    if (health.rightLeg < 20) penalty += 0.3;
    return Math.min(penalty, 1.0);
};
