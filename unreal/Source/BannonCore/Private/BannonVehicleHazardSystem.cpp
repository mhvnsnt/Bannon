#include "BannonVehicleHazardSystem.h"

void UBannonVehicleHazardSystem::ProcessVehicularImpact(float VehicleMass, float VehicleSpeed, const FVector& ImpactNormal, float& OutDamageApplied, FVector& OutRagdollLaunchVector, bool& bIsCriticalCondition)
{
    // MDickie-style parking lot hazards. Getting hit by a roaming vehicle applies massive blunt force trauma.
    
    // Force = mass * velocity. We scale it down slightly for game logic.
    float ImpactForce = (VehicleMass * VehicleSpeed) / 1000.0f;
    
    OutDamageApplied = ImpactForce * 0.5f; // Direct drain to health/stamina

    // Launch the wrestler into the air based on the speed and angle of the car
    OutRagdollLaunchVector = ImpactNormal * (ImpactForce * 10.0f);
    OutRagdollLaunchVector.Z += (VehicleSpeed * 5.0f); // Upward lift off the hood

    // Speeds over 40mph instantly critically injure the wrestler, potentially ending the match or career segment.
    bIsCriticalCondition = (VehicleSpeed > 40.0f); 
}
