#include "BannonGlassBreach.h"

UBannonGlassBreach::UBannonGlassBreach()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonGlassBreach::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonGlassBreach::TriggerGlassBreach(AActor* Victim, FVector ImpactVelocity)
{
    if (!Victim) return;

    // Trigger Chaos fracture geometry switch
    UE_LOG(LogTemp, Warning, TEXT("Bannon Environment: GLASS BREACH! Velocity: %s"), *ImpactVelocity.ToString());

    // Calculate shard severity based on speed of entry
    float Severity = ImpactVelocity.Size() * 0.05f;
    ApplyLacerationDamage(Victim, Severity);
}

void UBannonGlassBreach::ApplyLacerationDamage(AActor* Victim, float ShardSeverity)
{
    // Apply procedural cuts/decals to the victim's mesh
    UE_LOG(LogTemp, Warning, TEXT("Bannon Medical: Applying %f laceration damage due to glass shards!"), ShardSeverity);
}
