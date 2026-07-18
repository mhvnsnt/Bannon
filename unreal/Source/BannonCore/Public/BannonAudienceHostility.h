#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAudienceHostility.generated.h"

UCLASS()
class BANNONCORE_API UBannonAudienceHostility : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void CalculateTrashThrowProbability(float CharacterAlignment, float CrowdHeat, UPARAM(ref) bool& bWillThrowWeapon);
};
