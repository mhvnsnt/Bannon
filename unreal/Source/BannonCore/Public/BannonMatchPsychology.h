#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMatchPsychology.generated.h"

UCLASS()
class BANNONCORE_API UBannonMatchPsychology : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Psychology")
    void CalculateMomentumShift(float DamageDealt, bool bWasSignatureMove, UPARAM(ref) float& CurrentMomentum, UPARAM(ref) bool& bIsOnFire);
};
