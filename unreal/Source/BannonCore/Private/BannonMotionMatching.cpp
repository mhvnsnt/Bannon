// Copyright BANNON.

#include "BannonMotionMatching.h"

UBannonMotionMatching::UBannonMotionMatching()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UBannonMotionMatching::UpdateMotionTrajectory(FVector DesiredVelocity, float DeltaTime)
{
	// Hooks into UE5.4 Native Motion Matching dataset queries
}
