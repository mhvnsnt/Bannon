#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCourtSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonCourtSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void FileInjuryLawsuit(float DefendantSalary, float PlaintiffInjurySeverity, UPARAM(ref) bool& bCaseWon, UPARAM(ref) float& OutSettlementAmount);

    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void EvaluateWrongfulTermination(bool bHasCreativeControl, int32 RemainingContractWeeks, UPARAM(ref) float& OutSeverancePackage);
};
