#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAIWeaponScavenger.generated.h"

UCLASS()
class BANNONCORE_API UBannonAIWeaponScavenger : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void ScanForOptimalWeapon(const FVector& AILocation, const TArray<FVector>& AvailableWeaponLocations, const TArray<float>& WeaponDamageRatings, UPARAM(ref) FVector& OutTargetWeaponLocation, UPARAM(ref) bool& bFoundWeapon);
};
