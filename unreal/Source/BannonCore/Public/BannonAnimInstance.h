#pragma once

#include "CoreMinimal.h"
#include "Animation/AnimInstance.h"
#include "BannonAnimInstance.generated.h"

UCLASS()
class BANNONCORE_API UBannonAnimInstance : public UAnimInstance
{
    GENERATED_BODY()

public:
    UBannonAnimInstance();

    virtual void NativeUpdateAnimation(float DeltaSeconds) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Animation")
    void RecalculateBlendWeights(float NewPoiseState);

protected:
    UPROPERTY(BlueprintReadOnly, Category = "Bannon|Animation")
    float ActivePoise;

    UPROPERTY(BlueprintReadOnly, Category = "Bannon|Animation")
    float CrumpleBlendWeight;

    UPROPERTY(BlueprintReadOnly, Category = "Bannon|Animation")
    float IKBlendWeight;

    UPROPERTY(BlueprintReadOnly, Category = "Bannon|Animation")
    bool bIsCrumpled;

    const float POISE_CRUMPLE_THRESHOLD = 20.0f;
};
