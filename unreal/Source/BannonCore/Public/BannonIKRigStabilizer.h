#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonIKRigStabilizer.generated.h"

UCLASS()
class BANNONCORE_API UBannonIKRigStabilizer : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Rigging")
    void CalculateIKFloorOffset(float ActualFloorZ, float FootBoneZ, UPARAM(ref) float& IKOffsetZ);

    UFUNCTION(BlueprintCallable, Category="Bannon|Rigging")
    void SmoothShoulderTwist(float CurrentTwistAngle, UPARAM(ref) float& CorrectedTwistAngle);
};
