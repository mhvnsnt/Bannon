#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAlignmentShift.generated.h"

UCLASS()
class BANNONCORE_API UBannonAlignmentShift : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void ProcessAlignmentAction(bool bUsedWeapon, bool bAttackedRef, float CurrentAlignment, UPARAM(ref) float& NewAlignment, UPARAM(ref) bool& bTurnOccurred);
};
