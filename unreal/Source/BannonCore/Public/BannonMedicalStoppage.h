#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMedicalStoppage.generated.h"

UCLASS()
class BANNONCORE_API UBannonMedicalStoppage : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void CheckStoppageConditions(float BloodVolumeLost, float CriticalJointDamage, UPARAM(ref) bool& bMatchStopped, UPARAM(ref) FString& OutStoppageReason);
};
