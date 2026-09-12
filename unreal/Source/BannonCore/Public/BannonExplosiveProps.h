#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonExplosiveProps.generated.h"

UCLASS()
class BANNONCORE_API UBannonExplosiveProps : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void CalculateExplosionImpulse(float BaseDamage, float DistanceFromCenter, UPARAM(ref) float& OutPhysicsImpulse, UPARAM(ref) bool& bIsDismembermentRisk);
};
