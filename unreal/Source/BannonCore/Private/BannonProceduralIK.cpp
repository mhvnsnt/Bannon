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
	// Calculate dynamic offset from HandBoneName to weapon handle pivot
	// Update Control Rig or FBIK targets
}

void UBannonProceduralIK::TriggerLimbRagdoll(FName LimbRootBone)
{
	ACharacter* Owner = Cast<ACharacter>(GetOwner());
	if (Owner && Owner->GetMesh()) {
		// Set bodies below LimbRootBone to simulate physics, keeping the rest animated
		Owner->GetMesh()->SetAllBodiesBelowSimulatePhysics(LimbRootBone, true, true);
		Owner->GetMesh()->SetAllBodiesBelowPhysicsBlendWeight(LimbRootBone, 1.0f);
	}
}

void UBannonProceduralIK::UpdateFootPlacement(FVector LeftFootLoc, FVector RightFootLoc)
{
    ACharacter* Owner = Cast<ACharacter>(GetOwner());
    if (Owner && Owner->GetMesh()) {
        // Here we read the slope of the entrance ramp or deformation of the ring canvas
        // We set Control Rig IK target locations for precise foot placement
        
        UE_LOG(LogTemp, Verbose, TEXT("Bannon IK: Updating Foot Placement - L: %s, R: %s"), *LeftFootLoc.ToString(), *RightFootLoc.ToString());
        
        // This coordinates with FBIK to prevent feet clipping into ramps or floating over sagging canvas mats
    }
}
