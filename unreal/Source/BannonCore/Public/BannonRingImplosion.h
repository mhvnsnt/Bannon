#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonRingImplosion.generated.h"

UCLASS()
class BANNONCORE_API UBannonRingImplosion : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void EvaluateSuperplexCollapse(float AttackerMass, float DefenderMass, float DropHeight, UPARAM(ref) bool& bTriggerRingImplosion, UPARAM(ref) float& OutStructuralDamage);
};
