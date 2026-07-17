// Copyright BANNON.

#include "BannonALSMovementComponent.h"

UBannonALSMovementComponent::UBannonALSMovementComponent()
{
}

void UBannonALSMovementComponent::SetLocomotionState(FName NewState)
{
	// Bind to UE5 ALS-R state machines
}

void UBannonALSMovementComponent::TriggerGetUpAnimation()
{
	// Blend from ragdoll physics data into the nearest get-up animation root motion
}
