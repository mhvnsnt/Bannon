#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonFactionMatrix.generated.h"

UCLASS()
class BANNONCORE_API UBannonFactionMatrix : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Factions")
    void CalculateBetrayalProbability(float AllyGreedStat, float AllyLoyaltyStat, float PlayerMomentum, UPARAM(ref) bool& bWillBetray);

    UFUNCTION(BlueprintCallable, Category="Bannon|Factions")
    void TriggerBackstageRunIn(const FString& PlayerID, const TMap<FString, float>& RelationshipMatrix, UPARAM(ref) FString& OutRunInCharacterID, UPARAM(ref) bool& bIsFriendly);
};
