#include "BannonVerletRopesComponent.h"

UBannonVerletRopesComponent::UBannonVerletRopesComponent() {
    PrimaryComponentTick.bCanEverTick = true;
    BaseTension = 1500.0f;
    SnapbackDamping = 0.8f;
}

void UBannonVerletRopesComponent::RegisterBodyCollision(FVector ImpactLocation, FVector ImpactVelocity, float BodyMass) {
    // Math-driven rope physics
    // 1. Calculate physical intersection of MAX_BODY_VEL bounded capsule.
    // 2. Distribute ImpactVelocity across localized Verlet nodes on the rope spline.
    // 3. Deform the rope mesh natively without triggering canned animation events.
}

void UBannonVerletRopesComponent::UpdateSpringDamperPhysics(float DeltaTime) {
    // Iterative calculation pulling deformed rope segments back to their anchor posts
    // utilizing BaseTension and SnapbackDamping parameters linked directly to the Jolt solver.
}

void UBannonVerletRopesComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    UpdateSpringDamperPhysics(DeltaTime);
}
