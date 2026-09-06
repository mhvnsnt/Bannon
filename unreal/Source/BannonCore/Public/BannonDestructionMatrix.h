// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDestructionMatrix.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDestructionMatrix : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonDestructionMatrix();

	// Procedural Object Shattering (threshold checks for tables/barricades)
	UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
	bool EvaluateBreakThreshold(AActor* Prop, float ImpactForce);

	// Ring Implosion Mechanics (super-heavyweight superplex downward impulse check)
	UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
	void CheckRingImplosion(float CombinedMass, float FallHeight);
};
