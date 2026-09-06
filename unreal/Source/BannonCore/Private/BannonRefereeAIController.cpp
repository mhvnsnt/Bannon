#include "BannonRefereeAIController.h"
#include "GameFramework/Character.h"
#include "NavigationSystem.h"

ABannonRefereeAIController::ABannonRefereeAIController() {
}

void ABannonRefereeAIController::InitiatePinCountSequence(AActor* DefendingFighter, UPrimitiveComponent* RingMatCollider) {
    if (!DefendingFighter) return;
    
    // 1. Dynamic Pathfinding around active Jolt ragdolls to prevent clipping.
    FVector TargetLocation = DefendingFighter->GetActorLocation(); // Ideally offset by a safe radius
    MoveToLocation(TargetLocation, 50.0f); // Radius tolerance

    // 2. Delegate execution of the physical snap upon reaching destination
    ExecuteIKSnapAndCount(DefendingFighter, RingMatCollider);
}

void ABannonRefereeAIController::ExecuteIKSnapAndCount(AActor* DefendingFighter, UPrimitiveComponent* RingMatCollider) {
    ACharacter* RefPawn = Cast<ACharacter>(GetPawn());
    if (!RefPawn) return;

    // Lock referee root motion immediately
    RefPawn->DisableInput(nullptr);

    // Trigger UBannonGrappleIKBridge override: 
    // Snap referee wrists dynamically to the RingMatCollider using IK, syncing visual count with UBannonMatchStateLogic
}
