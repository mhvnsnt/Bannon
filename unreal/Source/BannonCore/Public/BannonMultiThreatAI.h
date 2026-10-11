#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMultiThreatAI.generated.h"

USTRUCT(BlueprintType)
struct FThreatData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category="Bannon|AI")
    FString WrestlerID;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|AI")
    float Health;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|AI")
    float Distance;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|AI")
    bool bIsCurrentlyAttacking;
};

UCLASS()
class BANNONCORE_API UBannonMultiThreatAI : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateHighestThreat(const TArray<FThreatData>& ActiveThreats, UPARAM(ref) FString& OutPrimaryTargetID);
};
