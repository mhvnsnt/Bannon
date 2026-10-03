// Copyright BANNON.

#include "BannonGrappleGrip.h"
#include "Components/SkeletalMeshComponent.h"

UBannonGrappleGrip::UBannonGrappleGrip()
{
	PrimaryComponentTick.bCanEverTick = false;
	bIsGripping = false;
	CurrentTarget = nullptr;
}

void UBannonGrappleGrip::BeginPlay()
{
	Super::BeginPlay();
}

bool UBannonGrappleGrip::GripNearest(USkeletalMeshComponent* TargetMesh, FVector HandPos)
{
	if (!TargetMesh) return false;
	
	// Create a Physics Constraint dynamically connecting HandPos to TargetMesh
	CurrentTarget = TargetMesh;
	bIsGripping = true;
	return true;
}

void UBannonGrappleGrip::ReleaseGrip()
{
	bIsGripping = false;
	CurrentTarget = nullptr;
	// Break the active Physics Constraint
}

bool UBannonGrappleGrip::IsGripping() const
{
	return bIsGripping;
}
