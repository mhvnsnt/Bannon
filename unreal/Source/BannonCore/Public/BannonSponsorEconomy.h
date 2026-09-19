#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonSponsorEconomy.generated.h"

UCLASS()
class BANNONCORE_API UBannonSponsorEconomy : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Meta")
    void CalculateWeeklyMerchRevenue(float CrowdHeat, int32 TitlesHeld, float BasePopularity, UPARAM(ref) float& OutWeeklyRevenue);
};
