// Copyright BANNON.

#include "BannonDesperationIK.h"
#include "GameFramework/Character.h"

UBannonDesperationIK::UBannonDesperationIK()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UBannonDesperationIK::ReachForRopeBreak(ACharacter* Defender)
{
	if (!Defender) return;
	
	// Query the Ring environment for the nearest Rope Spline Component.
	// Set an FBIK effector target for the Defender's free hand.
	// The hand organically stretches outward based on stamina remaining.
}

void UBannonDesperationIK::TriggerProceduralTapOut(ACharacter* Defender, float PressureThreshold)
{
	if (!Defender) return;
	
	if (PressureThreshold > 95.0f) {
		// Drive the hand bone using a sinusoidal physics impulse into the Z-floor (the mat)
		// Rather than a canned tap animation, this makes it look frantic and physically grounded.
	}
}
