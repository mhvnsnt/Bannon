#include "BannonImprovisedWeaponAffordance.h"

void UBannonImprovisedWeaponAffordance::EvaluateWeaponPhysics(float ObjectMass, bool bIsSharp, FString& OutSwingAnimationState, float& OutDamageMultiplier, bool& bCanBeThrown)
{
    // Scans the environment for items and applies universal swing/throw physics.
    
    if (ObjectMass > 20.0f)
    {
        OutSwingAnimationState = TEXT("HeavySwing"); // Requires both hands, slow windup (e.g. Steel Steps)
        OutDamageMultiplier = 2.5f;
        bCanBeThrown = false; // Too heavy to throw across the ring
    }
    else if (bIsSharp)
    {
        OutSwingAnimationState = TEXT("StabThrash"); // Sharp items (e.g. broken glass, barbed wire)
        OutDamageMultiplier = 1.8f; // Causes lacerations
        bCanBeThrown = true;
    }
    else
    {
        OutSwingAnimationState = TEXT("LightSwing"); // Mops, Kendo Sticks, Traffic Cones
        OutDamageMultiplier = 1.2f;
        bCanBeThrown = true; // Can be hurled at opponents
    }
}
