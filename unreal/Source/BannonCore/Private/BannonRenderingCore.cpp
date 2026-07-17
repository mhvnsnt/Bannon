// Copyright BANNON.

#include "BannonRenderingCore.h"

UBannonRenderingCore::UBannonRenderingCore()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UBannonRenderingCore::UpdateSweatAccumulation(float MatchDurationMinutes, float ExertionLevel)
{
	// Skin rendering changes specularity based on fatigue levels.
	// As sweat increases, we also slightly lower grapple success rates (friction drop).
	float SweatMultiplier = MatchDurationMinutes * ExertionLevel * 0.1f;
	// Update dynamic material parameter "SweatAmount"
}

void UBannonRenderingCore::TriggerMuscleFlex(float StrengthOutput)
{
	// E.g. during a powerbomb lift, apply procedural expansion to pectoral/bicep masses
	// Drive AnimDynamics alpha or KawaiiPhysics stiffness.
}
