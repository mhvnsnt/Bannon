#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCrowdWeaponHandoff.generated.h"

UCLASS()
class BANNONCORE_API UBannonCrowdWeaponHandoff : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void EvaluateFanHandoff(float CrowdHeatMatrix, float DistanceToBarricade, UPARAM(ref) bool& bWillOfferWeapon, UPARAM(ref) FString& OutWeaponClass);
};
