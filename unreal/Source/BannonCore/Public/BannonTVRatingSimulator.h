#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonTVRatingSimulator.generated.h"

UCLASS()
class BANNONCORE_API UBannonTVRatingSimulator : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void CalculateMatchRating(int32 UniqueMovesUsed, bool bBloodDrawn, int32 TotalNearFalls, UPARAM(ref) float& OutMatchRating);

    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void ProcessShowRating(float AverageMatchRating, float BaseBudget, UPARAM(ref) float& OutNewBudget);
};
