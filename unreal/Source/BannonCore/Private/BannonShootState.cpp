#include "BannonShootState.h"
#include "Components/SkeletalMeshComponent.h"

void UBannonShootState::TriggerShootState(USkeletalMeshComponent* WrestlerMesh)
{
    // Transition entity into non-cooperative mode
    SetJointCompliance(WrestlerMesh, 0.0f);
}

void UBannonShootState::SetJointCompliance(USkeletalMeshComponent* WrestlerMesh, float ComplianceLevel)
{
    if (WrestlerMesh)
    {
        // Drive stiffness/damping down to 0, making the ragdoll dead weight
        // This forces the attacker to rely purely on raw physics force to lift/move the entity
    }
}

bool UBannonShootState::EvaluateSandbagProbability(float Morale, float BossApproval)
{
    // If both are critically low, the wrestler stops cooperating with the match script
    return (Morale < 0.2f && BossApproval < 0.2f);
}
