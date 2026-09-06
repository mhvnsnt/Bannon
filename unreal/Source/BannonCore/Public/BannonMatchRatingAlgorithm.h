#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMatchRatingAlgorithm.generated.h"

UCLASS()
class BANNONCORE_API UBannonMatchRatingAlgorithm : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Systems")
    float CalculateTVRating(int32 NearFalls, int32 HighImpactMoves, int32 BloodVolume, bool bIsChampionshipMatch, float CrowdHeat);
};
