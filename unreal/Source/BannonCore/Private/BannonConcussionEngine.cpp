#include "BannonConcussionEngine.h"

void UBannonConcussionEngine::EvaluateHeadTrauma(float CumulativeHeadDamage, float RecentImpactForce, bool& bIsConcussed, float& OutStumblePhysicsTorque, float& OutPostProcessBlurWeight)
{
    // Heavy head trauma induces a physics-wobble and blurred screen effect
    if (CumulativeHeadDamage > 75.0f || RecentImpactForce > 800.0f)
    {
        bIsConcussed = true;
        
        // Applies a procedural rotational wobble to the spinal bone constraints
        OutStumblePhysicsTorque = (CumulativeHeadDamage * 2.0f) + (RecentImpactForce * 0.1f);
        
        // Blurs the player's camera (if they are controlling the concussed character)
        OutPostProcessBlurWeight = FMath::Clamp((CumulativeHeadDamage - 75.0f) / 25.0f, 0.2f, 1.0f); 
    }
    else
    {
        bIsConcussed = false;
        OutStumblePhysicsTorque = 0.0f;
        OutPostProcessBlurWeight = 0.0f;
    }
}
