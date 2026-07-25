#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonProceduralCityBlock.generated.h"

UCLASS()
class BANNONCORE_API UBannonProceduralCityBlock : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void GenerateCityGrid(float MapSize, int32 DensitySeed, UPARAM(ref) TArray<FVector>& BuildingLocations);
};
