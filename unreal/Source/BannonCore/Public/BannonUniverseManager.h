// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonUniverseManager.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonUniverseManager : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonUniverseManager();

	// TV Rating Algorithm calculating budget shifts
	UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
	void CalculateTVRating(float MatchQuality, int32 NearFalls, bool bBloodDrawn);

	// Dynamic Match Card Booking based on rivalry graphs
	UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
	void AutoBookMatchCard();

	// Title Belt Lineage Tracking (immutable ledger)
	UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
	void RegisterTitleChange(class ACharacter* NewChampion, FName TitleID);
};
