#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPromoInterview.generated.h"

UCLASS()
class BANNONCORE_API UBannonPromoInterview : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void GenerateAmbushInterviewPrompt(const FString& WrestlerName, const FString& CurrentRival, float AngerLevel, UPARAM(ref) FString& OutLLMPrompt);
};
