#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonFederationDraft.generated.h"

UCLASS()
class BANNONCORE_API UBannonFederationDraft : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void EvaluateDraftPick(const TArray<FString>& AvailableRoster, float FederationBudget, UPARAM(ref) FString& OutSelectedWrestler);
};
