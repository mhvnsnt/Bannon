#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDynamicBleeding.generated.h"

UCLASS()
class BANNONCORE_API UBannonDynamicBleeding : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void ProcessBloodTransfer(float BleedingSeverity, bool bIsGrappling, float ImpactForce, UPARAM(ref) float& OutCanvasPoolDecalSize, UPARAM(ref) float& OutOpponentBloodTransferAmount);
};
