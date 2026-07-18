#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMultiThreatAI.generated.h"

UCLASS()
class BANNONCORE_API UBannonMultiThreatAI : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    int32 DeterminePrimaryTargetIndex(const TArray<float>& ThreatHealths, const TArray<float>& ThreatDistances);
};
