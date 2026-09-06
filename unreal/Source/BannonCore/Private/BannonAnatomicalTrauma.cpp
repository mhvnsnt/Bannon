#include "BannonAnatomicalTrauma.h"

void UBannonAnatomicalTrauma::ApplyConcussiveTrauma(FBannonTraumaState& Trauma, float ImpactForce)
{
    if (ImpactForce > 20000.0f) // High impact
    {
        Trauma.MaxPoiseCeiling -= (ImpactForce * 0.0001f);
        if (Trauma.MaxPoiseCeiling < 0.0f) Trauma.MaxPoiseCeiling = 0.0f;
    }
}

void UBannonAnatomicalTrauma::EvaluateCatastrophicFailure(FBannonTraumaState& Trauma, FName StressedJoint)
{
    if (!Trauma.JointStressLog.Contains(StressedJoint))
    {
        Trauma.JointStressLog.Add(StressedJoint, 0.0f);
    }
    
    // Chemical enhancement increases the risk of catastrophic failure (e.g. tearing a quad while running)
    float FailureThreshold = Trauma.bChemicalEnhancementActive ? 75.0f : 95.0f;
    
    if (Trauma.JointStressLog[StressedJoint] > FailureThreshold)
    {
        // Trigger catastrophic failure logic (zero out poise, force ref stoppage)
    }
}
