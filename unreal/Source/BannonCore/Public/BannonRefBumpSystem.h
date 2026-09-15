#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonRefBumpSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonRefBumpSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void ProcessRefereeImpact(float ImpactForce, UPARAM(ref) bool& bIsRefKnockedOut, UPARAM(ref) float& OutLawlessDurationTimer);
};
