#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonWeightClassPhysics.generated.h"

UENUM(BlueprintType)
enum class EBannonWeightClass : uint8
{
    Cruiserweight,
    LightHeavyweight,
    Heavyweight,
    SuperHeavyweight
};

UCLASS()
class BANNONCORE_API UBannonWeightClassPhysics : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    bool EvaluateLiftConstraint(EBannonWeightClass LifterClass, EBannonWeightClass TargetClass, float LifterDrive);

    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    float CalculateRingImplosionRisk(EBannonWeightClass EntityA, EBannonWeightClass EntityB, float FallVelocity);
};
