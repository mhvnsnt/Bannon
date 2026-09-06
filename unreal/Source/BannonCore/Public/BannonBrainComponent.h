// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonBrainComponent.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonBrainComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonBrainComponent();

	// Neural Network Opponent AI (Learns player tendencies e.g. reversal timing)
	UFUNCTION(BlueprintCallable, Category="Bannon|AI")
	void AdaptToPlayerPattern(FName ActionType, float TimingDelta);

	// Cowardice vs. Aggression Matrix 
	UFUNCTION(BlueprintCallable, Category="Bannon|AI")
	void CalculateAggressionShift(float Health, float Stamina);

	// Multi-Threat Prioritization for 4-way matches
	UFUNCTION(BlueprintCallable, Category="Bannon|AI")
	class ACharacter* EvaluateBiggestThreat(const TArray<class ACharacter*>& Opponents);
};
