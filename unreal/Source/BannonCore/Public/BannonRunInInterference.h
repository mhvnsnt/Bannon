#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonRunInInterference.generated.h"

UCLASS()
class BANNONCORE_API UBannonRunInInterference : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void CalculateInterferenceProbability(float MatchHeat, bool bRefIsDown, float FactionLoyalty, UPARAM(ref) bool& bWillInterfere);
};
