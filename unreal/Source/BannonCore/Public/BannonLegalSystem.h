#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonLegalSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonLegalSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void ProcessBackstageAssault(float VictimDamage, bool bSecurityPresent, UPARAM(ref) bool& bIsArrested, UPARAM(ref) int32& JailSentencedWeeks);
};
