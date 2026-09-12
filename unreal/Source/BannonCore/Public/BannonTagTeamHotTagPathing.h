#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonTagTeamHotTagPathing.generated.h"

UCLASS()
class BANNONCORE_API UBannonTagTeamHotTagPathing : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateHotTagNeed(float ActiveHealth, float PartnerHealth, float DistanceToCorner, UPARAM(ref) bool& bShouldCrawlToTag);
};
