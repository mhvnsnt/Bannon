// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BannonPropSpawner.generated.h"

UCLASS(ClassGroup=(Bannon))
class BANNONCORE_API ABannonPropSpawner : public AActor
{
	GENERATED_BODY()

public:
	ABannonPropSpawner();

	// Dynamically load interactive props (tables, ladders, chairs) into any physics grid
	UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
	AActor* SpawnContextualProp(FName PropType, FTransform SpawnTransform);

	// Pre-fractured Chaos physics meshes for tables/barricades breaking
	UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
	void TriggerPropDestruction(AActor* Prop, FVector ImpactForce);
};
