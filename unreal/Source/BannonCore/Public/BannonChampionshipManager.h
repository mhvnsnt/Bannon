#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonChampionshipManager.generated.h"

USTRUCT(BlueprintType)
struct FTitleHistory
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Titles")
    FString TitleName;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Titles")
    FString CurrentChampion;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Titles")
    int32 DaysHeld;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Titles")
    bool bIsSanctioned;
};

UCLASS()
class BANNONCORE_API UBannonChampionshipManager : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Titles")
    void TransferTitle(const FString& NewChampion, bool bIsScrewjob, UPARAM(ref) FTitleHistory& TitleData);
};
