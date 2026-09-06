#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonImprovisedWeaponAffordance.generated.h"

UCLASS()
class BANNONCORE_API UBannonImprovisedWeaponAffordance : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Weapons")
    void EvaluateWeaponPhysics(float ObjectMass, bool bIsSharp, UPARAM(ref) FString& OutSwingAnimationState, UPARAM(ref) float& OutDamageMultiplier, UPARAM(ref) bool& bCanBeThrown);
};
