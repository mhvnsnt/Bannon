#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAdrenalineMasking.generated.h"

UCLASS()
class BANNONCORE_API UBannonAdrenalineMasking : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void ProcessHulkingUp(float CurrentMomentum, bool bHasLimbDamage, UPARAM(ref) bool& bIgnoreLimpIK);
};
