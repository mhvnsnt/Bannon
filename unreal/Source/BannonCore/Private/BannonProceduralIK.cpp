// Copyright BANNON.
#include "BannonProceduralIK.h"
#include "Components/SkeletalMeshComponent.h"
#include "GameFramework/Character.h"
#include "BannonPoseAuthorityComponent.h"

UBannonProceduralIK::UBannonProceduralIK()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonProceduralIK::AttachWeaponGrip(AActor* Weapon, FName HandBoneName)
{
    // Control Rig/FBIK consumes the target; this component never writes bones.
}

void UBannonProceduralIK::TriggerLimbRagdoll(FName LimbRootBone)
{
    ACharacter* Owner = Cast<ACharacter>(GetOwner());
    if (!Owner || !Owner->GetMesh() || LimbRootBone.IsNone()) return;

    if (UBannonPoseAuthorityComponent* Authority =
        Owner->FindComponentByClass<UBannonPoseAuthorityComponent>())
    {
        // Physical response is an explicit owner transition. If another system
        // owns the limb this frame, refuse instead of silently fighting it.
        if (!Authority->ClaimBone(LimbRootBone, EBannonPoseOwner::Physical))
            return;
    }

    Owner->GetMesh()->SetAllBodiesBelowSimulatePhysics(LimbRootBone, true, true);
    Owner->GetMesh()->SetAllBodiesBelowPhysicsBlendWeight(LimbRootBone, 1.0f);
}

void UBannonProceduralIK::UpdateFootPlacement(FVector LeftFootLoc, FVector RightFootLoc)
{
    UE_LOG(LogTemp, Verbose, TEXT("Bannon IK Targets | L=%s R=%s"),
        *LeftFootLoc.ToString(), *RightFootLoc.ToString());
}
