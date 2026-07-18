#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonWeaponScavengingAI.generated.h"

UCLASS()
class BANNONCORE_API UBannonWeaponScavengingAI : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateWeaponSearch(float AggressionStat, bool bIsNoDQ, const TArray<FVector>& NearbyWeaponLocations, const FVector& AILocation, UPARAM(ref) bool& bShouldScavenge, UPARAM(ref) FVector& OutTargetWeaponLocation);
};
