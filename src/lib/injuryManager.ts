export const InjuryManager = {
  applyInjury: (bodyPart: string, severity: number) => {
    // Logic to update injury persistence record
    console.log(`Applying ${severity} injury to ${bodyPart}`);
    return { bodyPart, severity };
  },
  
  calculateLocomotionImpact: (injuries: Record<string, number>) => {
    // Reduce speed based on leg injuries
    let speedPenalty = 0;
    if (injuries['leg']) {
        speedPenalty = injuries['leg'] * 0.2;
    }
    return speedPenalty;
  }
};
