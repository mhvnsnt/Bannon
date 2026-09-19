#include "BannonRingImplosion.h"

void UBannonRingImplosion::EvaluateSuperplexCollapse(float AttackerMass, float DefenderMass, float DropHeight, bool& bTriggerRingImplosion, float& OutStructuralDamage)
{
    // Cinematic environmental physics limit break.
    // If two super-heavyweights execute a top-rope superplex, the kinetic downward impulse collapses the entire ring frame.
    
    // Kinetic Energy approximation (m1 + m2) * h
    float TotalMass = AttackerMass + DefenderMass;
    OutStructuralDamage = TotalMass * DropHeight;

    // Threshold: Two 300+ lb wrestlers (600 total) falling from the top rope (approx 250 units).
    // 600 * 250 = 150,000 threshold.
    if (OutStructuralDamage > 150000.0f)
    {
        bTriggerRingImplosion = true;
    }
    else
    {
        bTriggerRingImplosion = false;
    }
}
