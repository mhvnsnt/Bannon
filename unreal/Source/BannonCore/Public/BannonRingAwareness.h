#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonRingAwareness.generated.h"

UENUM(BlueprintType)
enum class EBannonTacticalZone : uint8
{
    RingCenter,
    Ropes,
    Turnbuckle,
    Apron,
    Ringside,
    CrowdArea
};

UCLASS()
class BANNONCORE_API UBannonRingAwareness : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    EBannonTacticalZone EvaluateTacticalZone(FVector EntityLocation, FVector RingCenterLocation);

    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void CalculateRopeBreakPriority(float DistanceToRope, float SubmissionPressure, UPARAM(ref) bool& bAttemptRopeBreak);
};
