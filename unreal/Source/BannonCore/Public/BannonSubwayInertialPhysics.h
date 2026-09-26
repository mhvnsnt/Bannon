#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonSubwayInertialPhysics.generated.h"

UCLASS()
class BANNONCORE_API UBannonSubwayInertialPhysics : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void CalculateInertialImpact(const FVector& TrainVelocity, const FVector& BaseStrikeImpulse, bool bIsTrainBraking, UPARAM(ref) FVector& OutFinalImpulse);
};
