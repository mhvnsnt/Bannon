// Copyright BANNON.

#include "BannonPropSpawner.h"
#include "Engine/World.h"

ABannonPropSpawner::ABannonPropSpawner()
{
	PrimaryActorTick.bCanEverTick = false;
}

AActor* ABannonPropSpawner::SpawnContextualProp(FName PropType, FTransform SpawnTransform)
{
	// Load the relevant physics prop from the registry and spawn it
	// (e.g. Table, Ladder, Chair, Monitor, Mop)
	return nullptr;
}

void ABannonPropSpawner::TriggerPropDestruction(AActor* Prop, FVector ImpactForce)
{
	if (!Prop) return;
	// Apply Chaos destruction field / force to trigger shattering of the object
}
