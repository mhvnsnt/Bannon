#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCrowdGeneration.generated.h"

UCLASS()
class BANNONCORE_API UBannonCrowdGeneration : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void GenerateInstancedCrowd(int32 TargetCapacity, int32 TicketSales, UPARAM(ref) int32& OutSpawnedInstances, UPARAM(ref) float& OutDensityPercentage);
};
