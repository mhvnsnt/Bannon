// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonPromoBattleEngine.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonPromoBattleEngine : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonPromoBattleEngine();

	// Real-time LLM-generated promo battles where keywords trigger momentum buffs
	UFUNCTION(BlueprintCallable, Category="Bannon|Career")
	void ProcessPromoKeywords(const TArray<FString>& DialogueKeywords, class ACharacter* Speaker);

	// Backstage Politics Matrix (rivalry graphs shifting from sandbox actions)
	UFUNCTION(BlueprintCallable, Category="Bannon|Career")
	void ShiftRivalryGraph(class ACharacter* Attacker, class ACharacter* Victim);
};
