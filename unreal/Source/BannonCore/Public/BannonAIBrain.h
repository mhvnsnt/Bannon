#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAIBrain.generated.h"

UCLASS()
class BANNONCORE_API UBannonAIBrain : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|AI")
    float Cowardice; // 0.0 to 1.0

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|AI")
    float Aggression; // 0.0 to 1.0

    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateDesperation(float CurrentHP, float Stamina);

    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    bool ScanForWeapons(float DistanceToNearestWeapon);
};
