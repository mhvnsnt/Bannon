#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonWeightCuttingSimulation.generated.h"

UCLASS()
class BANNONCORE_API UBannonWeightCuttingSimulation : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Career")
    void ProcessWeeklyDietAndTraining(float TargetWeight, float CurrentWeight, int32 CaloricIntake, int32 TrainingIntensity, UPARAM(ref) float& OutNewWeight, UPARAM(ref) float& OutStaminaPenalty);
};
