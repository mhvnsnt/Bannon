#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonTitleLineage.generated.h"

USTRUCT(BlueprintType)
struct FTitleReignRecord
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Universe")
    FString ChampionID;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Universe")
    int32 DaysHeld;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Universe")
    int32 Defenses;
};

UCLASS()
class BANNONCORE_API UBannonTitleLineage : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void UpdateTitleLineage(const FString& BeltID, const FString& NewChampionID, UPARAM(ref) TMap<FString, FTitleReignRecord>& CurrentChampions, UPARAM(ref) TArray<FTitleReignRecord>& HistoricalLedger);
};
