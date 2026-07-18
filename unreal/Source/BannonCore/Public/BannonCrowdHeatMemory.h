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
    float HeatValue;
};

UCLASS()
class BANNONCORE_API UBannonCrowdHeatMemory : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void RegisterBetrayalOrHeroic(const FString& WrestlerID, const FString& TargetID, bool bIsBetrayal, UPARAM(ref) TMap<FString, float>& GlobalHeatMatrix);

    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void CalculateEntranceReaction(const FString& WrestlerID, const TMap<FString, float>& GlobalHeatMatrix, UPARAM(ref) float& OutCrowdVolume, UPARAM(ref) FString& OutReactionType);
};
