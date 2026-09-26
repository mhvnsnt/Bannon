#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMDickieBackstage.generated.h"

UCLASS()
class BANNONCORE_API UBannonMDickieBackstage : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void InitializeBackstageRoaming(UPARAM(ref) FString& CurrentLevel);

    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void SpawnContextualProps(UPARAM(ref) TArray<FString>& SpawnPoints);

    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void TriggerRandomEncounter(const FString& PlayerCharacter, UPARAM(ref) FString& OpponentCharacter);
};
