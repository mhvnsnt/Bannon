#include "BannonMuscleSimulation.h"

void UBannonMuscleSimulation::CalculateMuscleBulge(float ExertionLevel, float LiftWeight, float& OutBicepMorphWeight, float& OutPectoralMorphWeight)
{
    // Evaluates the current exertion (e.g., during a heavy lift or submission) to drive muscle bulge morph targets.
    // Heavy opponents increase the required exertion, leading to maximum vascularity and muscle displacement.
    float BaseBulge = ExertionLevel / 100.0f;
    float WeightFactor = FMath::Clamp(LiftWeight / 300.0f, 0.0f, 1.0f); // Scales based on lifting up to 300 lbs
    
    OutBicepMorphWeight = FMath::Clamp(BaseBulge + (WeightFactor * 0.5f), 0.0f, 1.0f);
    OutPectoralMorphWeight = FMath::Clamp((BaseBulge * 0.8f) + (WeightFactor * 0.3f), 0.0f, 1.0f);
}
