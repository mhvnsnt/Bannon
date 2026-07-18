#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonTitleLineage.generated.h"

UCLASS()
class BANNONCORE_API UBannonTitleLineage : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void TransferChampionship(const FString& NewChampion, const FString& OldChampion, int32 MatchDay, UPARAM(ref) TMap<FString, int32>& TitleHistory);
};
