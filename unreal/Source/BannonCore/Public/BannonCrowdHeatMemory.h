#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCrowdHeatMemory.generated.h"

USTRUCT(BlueprintType)
struct FCrowdMemoryEvent
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Universe")
    FString EventDescription;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Universe")
    float HeatImpact; // Positive for Face pop, Negative for Heel heat

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Universe")
    int32 WeeksAgo;
};

UCLASS()
class BANNONCORE_API UBannonCrowdHeatMemory : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void RegisterBetrayalEvent(const FString& WrestlerID, const FString& VictimID, UPARAM(ref) TArray<FCrowdMemoryEvent>& EventHistory);

    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void CalculateCurrentAudienceAlignment(UPARAM(ref) TArray<FCrowdMemoryEvent>& EventHistory, UPARAM(ref) float& OutCurrentHeatMatrix, UPARAM(ref) FString& OutCrowdReactionType);
};
