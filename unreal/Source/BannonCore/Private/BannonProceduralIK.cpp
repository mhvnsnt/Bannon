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
