#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMetaHumanDamage.generated.h"

UCLASS()
class BANNONCORE_API UBannonMetaHumanDamage : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
    void UpdateFacialMorphs(float HeadTrauma, UPARAM(ref) float& OutEyeSwelling, UPARAM(ref) float& OutJawDisplacement);
};
