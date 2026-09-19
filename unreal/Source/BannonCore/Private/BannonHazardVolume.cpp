// Copyright BANNON.

#include "BannonHazardVolume.h"
#include "GameFramework/Character.h"

ABannonHazardVolume::ABannonHazardVolume()
{
	PrimaryActorTick.bCanEverTick = false;
}

void ABannonHazardVolume::TriggerHazard(ACharacter* Victim)
{
	if (!Victim) return;
	
	if (HazardType == "Electrical") {
		// Spawn sparks, apply severe localized damage, and force rigid ragdoll tensing
	} else if (HazardType == "Traffic") {
		// Apply massive blunt force trauma impulse
	}
}
