// Copyright BANNON.

#include "BannonPhysicalAnimation.h"

UBannonPhysicalAnimation::UBannonPhysicalAnimation()
{
}

void UBannonPhysicalAnimation::ApplyHitReaction(FName BoneName, FVector StrikeVelocity, float MassRatio)
{
	// Calculate procedural hit reaction blending based on UE5 Physical Animation Component
	// Applying StrikeVelocity * MassRatio to the specific BoneName
}
