#include "BannonVehicleInteraction.h"

void UBannonVehicleInteraction::CalculateVehicleImpact(float VehicleVelocity, float TargetMass, float& OutDamage, FVector& OutLaunchVector)
{
    // MDickie sandbox vehicles (motorcycles, wheelchairs, skateboards)
    // Running over an opponent applies blunt force trauma and a massive launch vector
    OutDamage = VehicleVelocity * 0.5f;
    
    float MassRatio = 100.0f / (TargetMass > 1.0f ? TargetMass : 1.0f);
    OutLaunchVector = FVector(0, 0, 1) * (VehicleVelocity * MassRatio * 10.0f);
}
