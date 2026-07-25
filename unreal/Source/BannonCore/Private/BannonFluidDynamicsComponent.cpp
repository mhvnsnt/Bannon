#include "BannonFluidDynamicsComponent.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"

UBannonFluidDynamicsComponent::UBannonFluidDynamicsComponent() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonFluidDynamicsComponent::EvaluateBloodSplatter(float ImpactForce, float BoneFatigue, FVector SwingVelocity, FVector ImpactLocation) {
    // High-momentum impact on a severely damaged bone
    if (ImpactForce > 6.0f && BoneFatigue > 75.0f) {
        UWorld* World = GetWorld();
        if (!World) return;

        // Generate a directional raycast based on swing velocity
        FVector TraceEnd = ImpactLocation + (SwingVelocity.GetSafeNormal() * 300.0f); // 3m spray range
        FHitResult HitResult;
        FCollisionQueryParams QueryParams;
        QueryParams.AddIgnoredActor(GetOwner());

        if (World->LineTraceSingleByChannel(HitResult, ImpactLocation, TraceEnd, ECC_Visibility, QueryParams)) {
            // Spawn a deferred decal natively onto the RingMatCollider or surrounding meshes exactly at intersection
            // Logic is completely decoupled from canned animation events.
        }
    }
}
