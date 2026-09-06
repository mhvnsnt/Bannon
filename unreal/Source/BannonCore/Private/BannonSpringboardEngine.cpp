#include "BannonSpringboardEngine.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "BannonVerletRopesComponent.h"

UBannonSpringboardEngine::UBannonSpringboardEngine() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonSpringboardEngine::EvaluateRopeIntersection(UBannonVerletRopesComponent* RopeSystem, FVector CapsuleVelocity) {
    if (!RopeSystem) return;

    ACharacter* Owner = Cast<ACharacter>(GetOwner());
    if (!Owner || !Owner->GetCharacterMovement()) return;

    // 1. Verify capsule intersection with the Verlet Rope nodes on the bounding plane.
    
    // 2. Extract synthetic snap-back tension dynamically from the RopeSystem.
    float SnapbackTension = 1500.0f; // Native query placeholder

    // 3. Invert the capsule's velocity vector and multiply it by the rope's tension float.
    // This violently launches the actor back into the ring purely via math.
    FVector LaunchVector = -CapsuleVelocity.GetSafeNormal() * (CapsuleVelocity.Size() + (SnapbackTension * 0.4f));
    LaunchVector.Z += 600.0f; // Add vertical springboard arc
    
    // 4. Catapult the actor into the Jolt simulation. Bypasses all canned springboard animations.
    Owner->GetCharacterMovement()->Launch(LaunchVector);
}
