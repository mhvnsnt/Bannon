#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonHospitalRehabSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonHospitalRehabSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void ProcessRehabilitation(float InjurySeverity, float GodWithinHealingPoints, bool bIsRushingRecovery, UPARAM(ref) int32& OutWeeksToRecover, UPARAM(ref) float& OutPermanentStatPenalty);
};
