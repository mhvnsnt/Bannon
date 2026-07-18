#include "BannonPhysicsDiagnostics.h"

void UBannonPhysicsDiagnostics::CalculateDebugMetrics(float Mass, const FVector& Velocity, const FVector& AngularVelocity, float& OutKineticEnergy, float& OutTotalTorque)
{
    // Exposes raw physics variables to the HUD for real-time debugging of active ragdoll states
    OutKineticEnergy = 0.5f * Mass * Velocity.SizeSquared();
    OutTotalTorque = AngularVelocity.Size() * Mass; // Simplified torque mapping for debug overlay
}
