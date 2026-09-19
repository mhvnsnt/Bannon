#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCrowdPhysics.generated.h"

UCLASS()
class BANNONCORE_API UBannonCrowdPhysics : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Crowd")
    float RegionalHeatModifier; // Buffs Face/Heel based on geography

    UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
    void TriggerDebrisHazard(float MatchVolatility);

    UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
    void EvaluateBarricadeSurge(float ImpactForce, FVector ImpactLocation);

    UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
    float CalculateTractionPenalty(); // Lowers traction if debris is in the ring
};
