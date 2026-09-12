#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonSeamlessEnvironmentStreaming.generated.h"

UCLASS()
class BANNONCORE_API UBannonSeamlessEnvironmentStreaming : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void EvaluateStreamingZone(const FVector& PlayerLocation, const TMap<FString, FBox>& ZoneBounds, UPARAM(ref) TArray<FString>& OutLevelsToLoad, UPARAM(ref) TArray<FString>& OutLevelsToUnload);
};
