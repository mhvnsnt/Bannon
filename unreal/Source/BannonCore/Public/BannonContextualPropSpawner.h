#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonContextualPropSpawner.generated.h"

UCLASS()
class BANNONCORE_API UBannonContextualPropSpawner : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void DeterminePropSpawnTable(const FString& EnvironmentZone, UPARAM(ref) TArray<FString>& OutPropSpawnList);
};
