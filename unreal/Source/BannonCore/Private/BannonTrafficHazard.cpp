#include "BannonTrafficHazard.h"

void UBannonTrafficHazard::ProcessVehicleCollision(float VehicleSpeed, float VehicleMass, float& TargetHealth, bool& bTriggerRagdoll)
{
    // Recreates the chaotic MDickie roaming vehicle hazard.
    // If a wrestler wanders into the parking lot traffic grid and is struck:
    float Force = VehicleSpeed * VehicleMass;
    
    if (Force > 1000.0f)
    {
        TargetHealth -= (Force * 0.05f);
        bTriggerRagdoll = true;
        // The wrestler is thrown based on the vector of the vehicle
    }
}
