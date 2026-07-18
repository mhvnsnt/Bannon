#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonFurnitureStacking.generated.h"

UCLASS()
class BANNONCORE_API UBannonFurnitureStacking : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void EvaluateStackStability(int32 StackedObjectCount, float CombinedMass, UPARAM(ref) bool& bWillCollapse);
};
