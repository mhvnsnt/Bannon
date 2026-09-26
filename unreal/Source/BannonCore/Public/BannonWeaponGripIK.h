#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonWeaponGripIK.generated.h"

UCLASS()
class BANNONCORE_API UBannonWeaponGripIK : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Weapons")
    void CalculateProceduralGrip(const FVector& ObjectCenter, const FVector& ObjectBounds, bool bIsDualWielding, UPARAM(ref) FTransform& OutLeftHandIK, UPARAM(ref) FTransform& OutRightHandIK);
};
