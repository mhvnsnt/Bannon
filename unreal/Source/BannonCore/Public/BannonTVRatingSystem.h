#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonTVRatingSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonTVRatingSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void CalculateMatchRating(int32 UniquePhysicsEvents, int32 NearFalls, bool bFirstBloodSpilled, UPARAM(ref) float& OutStarRating);
};
