#include "BannonSnapMovePhysics.h"
#include "GameFramework/Actor.h"
#include "BannonRagdollComponent.h"

UBannonSnapMovePhysics::UBannonSnapMovePhysics()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonSnapMovePhysics::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonSnapMovePhysics::ExecuteSnapMove(AActor* Attacker, AActor* Defender, FName MoveType)
{
    if (!Attacker || !Defender) return;

    // For moves like Stunner, Cutter, RKO, DDT that don't have a carry phase
    // We instantly apply the physics impulse rather than transitioning to a hold state
    
    // 1. Immediately turn Defender into partial or full ragdoll
    UBannonRagdollComponent* RagdollComp = Defender->FindComponentByClass<UBannonRagdollComponent>();
    if (RagdollComp)
    {
        RagdollComp->EnableActiveRagdoll(true);
    }

    // 2. Apply combined downward impulse based on Attacker's mass + gravity
    ApplyDownwardImpulse(Defender, 1.5f); // 1.5x multiplier for snap velocity
}

void UBannonSnapMovePhysics::TriggerInstantConstraint(AActor* Attacker, AActor* Defender, FName TargetBone)
{
    // Implementation for instantly locking attacker's IK effector to defender's bone
    // e.g., Attacker's right hand to Defender's neck for RKO
}

void UBannonSnapMovePhysics::ApplyDownwardImpulse(AActor* Defender, float ForceMultiplier)
{
    // Apply immediate -Z impulse to drive the defender's root/head into the mat
}
