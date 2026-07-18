// Copyright BANNON.

#include "BannonFBIKComponent.h"

UBannonFBIKComponent::UBannonFBIKComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UBannonFBIKComponent::UpdateFootPlacement(FVector LeftFootTarget, FVector RightFootTarget)
{
	// Hooks up FBIK for foot placement on ring ropes and turnbuckles
}

void UBannonFBIKComponent::UpdateGrappleHandPlacement(FVector TargetBonePosition)
{
	// FBIK logic for grappling hand placement on varying opponent sizes
}
