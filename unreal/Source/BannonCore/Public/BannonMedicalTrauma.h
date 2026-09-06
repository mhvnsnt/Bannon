#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMedicalTrauma.generated.h"

UENUM(BlueprintType)
enum class EBannonLimb : uint8 { Head, Torso, LeftArm, RightArm, LeftLeg, RightLeg };

UCLASS()
class BANNONCORE_API UBannonMedicalTrauma : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void ApplyTargetedTrauma(EBannonLimb TargetLimb, float DamageAmount, UPARAM(ref) float& LacerationLevel, UPARAM(ref) bool& bIsDislocated);

    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void CalculateFirstBlood(float CurrentLaceration, UPARAM(ref) bool& bMatchTerminated);
};
