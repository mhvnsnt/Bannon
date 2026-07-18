#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonClothTearing.generated.h"

UCLASS()
class BANNONCORE_API UBannonClothTearing : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
    void EvaluateClothStress(float GrappleTension, float ClothDurability, UPARAM(ref) bool& bIsTorn);
};
