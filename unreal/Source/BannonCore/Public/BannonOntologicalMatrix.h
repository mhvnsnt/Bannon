// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonOntologicalMatrix.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonOntologicalMatrix : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonOntologicalMatrix();

	// The Ontological Tree of Life Core (tying attributes to cosmic alignments)
	UFUNCTION(BlueprintCallable, Category="Bannon|Career")
	void ApplyCosmicAlignmentShift(float SpiritualEnergy, float Vengeance);

	// Morale-Driven Defections calculation
	UFUNCTION(BlueprintCallable, Category="Bannon|Career")
	bool CheckDefectionProbability(float CurrentMorale, int32 DaysOffTV);
};
