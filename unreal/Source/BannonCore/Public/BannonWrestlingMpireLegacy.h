#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonWrestlingMpireLegacy.generated.h"

UCLASS()
class BANNONCORE_API UBannonWrestlingMpireLegacy : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void TransferRagdollMomentum(FVector AttackerVelocity, float MassRatio, UPARAM(ref) FVector& DefenderLaunchVector);

    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void EvaluateMpireDismembermentRisk(float WeaponImpactForce, UPARAM(ref) bool& bTriggerExtremeDamage);
};
