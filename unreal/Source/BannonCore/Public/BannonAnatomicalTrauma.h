#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAnatomicalTrauma.generated.h"

USTRUCT(BlueprintType)
struct FBannonTraumaState {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float MaxPoiseCeiling; // Degrades with concussive trauma

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float MaxHP; // Degrades if surgery is ignored (baseline 10000)

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<FName, float> JointStressLog; // e.g., "LeftKnee": 85.0f

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bChemicalEnhancementActive; // Pushes limits but risks catastrophic failure
};

UCLASS()
class BANNONCORE_API UBannonAnatomicalTrauma : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|Medical")
    void ApplyConcussiveTrauma(UPARAM(ref) FBannonTraumaState& Trauma, float ImpactForce);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Medical")
    void EvaluateCatastrophicFailure(UPARAM(ref) FBannonTraumaState& Trauma, FName StressedJoint);
};
