#include "BannonWeightClassPhysics.h"

bool UBannonWeightClassPhysics::EvaluateLiftConstraint(EBannonWeightClass LifterClass, EBannonWeightClass TargetClass, float LifterDrive)
{
    // A Cruiserweight cannot lift a SuperHeavyweight unless they have maxed out their Drive meter
    int32 WeightDelta = (int32)TargetClass - (int32)LifterClass;
    
    if (WeightDelta >= 2)
    {
        return LifterDrive >= 95.0f; // Requires immense momentum (Drive) to bypass physical limits
    }
    
    return true; // Standard lift permitted
}

float UBannonWeightClassPhysics::CalculateRingImplosionRisk(EBannonWeightClass EntityA, EBannonWeightClass EntityB, float FallVelocity)
{
    // If two SuperHeavyweights take a high-velocity bump (e.g. Superplex), check for ring collapse
    if (EntityA == EBannonWeightClass::SuperHeavyweight && EntityB == EBannonWeightClass::SuperHeavyweight)
    {
        if (FallVelocity > 1000.0f)
        {
            return 1.0f; // 100% chance of ring implosion
        }
    }
    return 0.0f;
}
