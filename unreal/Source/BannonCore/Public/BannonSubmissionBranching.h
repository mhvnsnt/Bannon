#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonSubmissionBranching.generated.h"

UCLASS()
class BANNONCORE_API UBannonSubmissionBranching : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Grappling")
    void EvaluateSubmissionTransition(float AttackerStamina, float DefenderResistance, UPARAM(ref) FString& CurrentHold, UPARAM(ref) FString& OutNextHold);
};
