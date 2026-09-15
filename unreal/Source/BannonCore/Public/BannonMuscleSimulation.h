#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMuscleSimulation.generated.h"

UCLASS()
class BANNONCORE_API UBannonMuscleSimulation : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
    void CalculateMuscleBulge(float ExertionLevel, float LiftWeight, UPARAM(ref) float& OutBicepMorphWeight, UPARAM(ref) float& OutPectoralMorphWeight);
};
