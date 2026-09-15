#include "BannonMassDrivenCollisionHulls.h"

UBannonMassDrivenCollisionHulls::UBannonMassDrivenCollisionHulls()
{
    PrimaryComponentTick.bCanEverTick = false;
}

float UBannonMassDrivenCollisionHulls::CalculateStrikeImpactForce(float AttackerMass, float DefenderMass, FVector LimbVelocity)
{
    float MassRatio = AttackerMass / DefenderMass;
    float Force = MassRatio * LimbVelocity.Size();
    UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Mass-driven collision hull strike force: %f"), Force);
    return Force;
}
