#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonWeaponDegradation.generated.h"

UCLASS()
class BANNONCORE_API UBannonWeaponDegradation : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Weapons")
    float StructuralIntegrity; // Starts at 100.0f

    UFUNCTION(BlueprintCallable, Category="Bannon|Weapons")
    void ProcessWeaponImpact(float ImpactForce, UPARAM(ref) bool& bWeaponDestroyed);
};
