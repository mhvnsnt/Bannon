#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDynamicMatchBooking.generated.h"

UCLASS()
class BANNONCORE_API UBannonDynamicMatchBooking : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void GeneratePPVMainEvent(const TMap<FString, float>& RivalryIntensityMatrix, UPARAM(ref) FString& OutWrestlerA, UPARAM(ref) FString& OutWrestlerB, UPARAM(ref) FString& OutStipulation);
};
