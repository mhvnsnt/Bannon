#include "BannonRopePhysicsSimulationVerlet.h"

UBannonRopePhysicsSimulationVerlet::UBannonRopePhysicsSimulationVerlet()
{
    PrimaryComponentTick.bCanEverTick = false;
    RopeSnapBackForceMultiplier = 1.2f;
}

void UBannonRopePhysicsSimulationVerlet::CalculateRopeTension(float BodyMass, float ImpactVelocity)
{
    float TensionForce = BodyMass * ImpactVelocity * RopeSnapBackForceMultiplier;
    UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Rope tension calculated %f. Applying Verlet snap-back force."), TensionForce);
}
