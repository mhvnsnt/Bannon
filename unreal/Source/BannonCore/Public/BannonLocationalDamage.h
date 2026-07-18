#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonLocationalDamage.generated.h"

USTRUCT(BlueprintType)
struct FBannonLimbState {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Integrity; // 100.0 down to 0.0

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bIsFractured;
};

UCLASS()
class BANNONCORE_API UBannonLocationalDamage : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Damage")
    TMap<FName, FBannonLimbState> LimbStates;

    UFUNCTION(BlueprintCallable, Category="Bannon|Damage")
    void InitializeLimbs();

    UFUNCTION(BlueprintCallable, Category="Bannon|Damage")
    void ApplyLocalizedDamage(FName BoneName, float DamageAmount);

    UFUNCTION(BlueprintCallable, Category="Bannon|Damage")
    float GetMobilityPenalty();
};
