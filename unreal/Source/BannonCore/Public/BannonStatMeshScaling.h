#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonStatMeshScaling.generated.h"

UCLASS()
class BANNONCORE_API UBannonStatMeshScaling : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void CalculateBoneScaleFromStats(float StrengthStat, float AgilityStat, UPARAM(ref) FVector& TorsoScale, UPARAM(ref) FVector& LimbScale);
};
