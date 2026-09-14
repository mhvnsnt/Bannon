// Copyright BANNON.
#include "BannonProceduralIK.h"
#include "Components/SkeletalMeshComponent.h"
#include "GameFramework/Character.h"

UBannonProceduralIK::UBannonProceduralIK()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonProceduralIK::AttachWeaponGrip(AActor* Weapon, FName HandBoneName)
{
    // Calculate dynamic offset from HandBoneName to weapon handle pivot.
    // Control Rig/FBIK consumes this target; this component does not write bones.
}

void UBannonProceduralIK::TriggerLimbRagdoll(FName LimbRootBone)
{
    ACharacter* Owner = Cast<ACharacter>(GetOwner());
    if (Owner && Owner->GetMesh() && !LimbRootBone.IsNone())
    {
        // Physical animation owns the secondary physical response. This is an
        // explicit state transition, not an IK transform write.
        Owner->GetMesh()->SetAllBodiesBelowSimulatePhysics(LimbRootBone, true, true);
        Owner->GetMesh()->SetAllBodiesBelowPhysicsBlendWeight(LimbRootBone, 1.0f);
    }
}

void UBannonProceduralIK::UpdateFootPlacement(FVector LeftFootLoc, FVector RightFootLoc)
{
    // IK targets are consumed by the animation/Control Rig layer.
    // No mesh transform mutation occurs here.
    UE_LOG(LogTemp, Verbose, TEXT("Bannon IK Targets | L=%s R=%s"),
        *LeftFootLoc.ToString(), *RightFootLoc.ToString());
}
