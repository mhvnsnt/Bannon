#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonClientPrediction.generated.h"

UCLASS()
class BANNONCORE_API UBannonClientPrediction : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
    void PredictStrikeImpact(float NetworkPingMs, bool bIsStrikeConnectingLocally, UPARAM(ref) bool& bPlayPredictiveHitReaction);
};
