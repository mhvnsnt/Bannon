// Copyright BANNON.

#include "BannonDynamicRope.h"
#include "GameFramework/Character.h"
// #include "CableComponent.h" // Requires CableComponent plugin

UBannonDynamicRope::UBannonDynamicRope()
{
	PrimaryComponentTick.bCanEverTick = true;
	RopeCable = nullptr;
}

void UBannonDynamicRope::BeginPlay()
{
	Super::BeginPlay();
	// Initialize RopeCable reference here
}

void UBannonDynamicRope::ApplyRopeTension(ACharacter* InteractingCharacter, FVector HitLocation)
{
	if (!InteractingCharacter) return;
	// Calculate tension force = k * dx (Hooke's Law) and apply it to the character and rope
}

FVector UBannonDynamicRope::CalculateReboundVelocity(FVector IncomingVelocity, float RopeTensionScalar)
{
	// Reverse the velocity vector against the rope normal and multiply by tension elasticity
	return -IncomingVelocity * RopeTensionScalar;
}
