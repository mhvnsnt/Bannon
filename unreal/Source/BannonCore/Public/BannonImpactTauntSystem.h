#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonImpactTauntSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonImpactTauntSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
    void EvaluateTauntImpact(const FString& TauntID, const FVector& PerformerLocation, const FVector& OpponentLocation, UPARAM(ref) bool& bTriggersImpact, UPARAM(ref) float& OutDamageDealt);
};
