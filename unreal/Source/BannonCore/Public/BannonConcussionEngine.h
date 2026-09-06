#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonConcussionEngine.generated.h"

UCLASS()
class BANNONCORE_API UBannonConcussionEngine : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void EvaluateHeadTrauma(float CumulativeHeadDamage, float RecentImpactForce, UPARAM(ref) bool& bIsConcussed, UPARAM(ref) float& OutStumblePhysicsTorque, UPARAM(ref) float& OutPostProcessBlurWeight);
};
