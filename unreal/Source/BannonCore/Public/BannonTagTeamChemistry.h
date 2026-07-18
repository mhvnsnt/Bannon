#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonTagTeamChemistry.generated.h"

UCLASS()
class BANNONCORE_API UBannonTagTeamChemistry : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|TagTeam")
    float Cohesion; // 0.0 to 1.0 (Impacts double-team success rate)

    UFUNCTION(BlueprintCallable, Category="Bannon|TagTeam")
    void ProcessHotTag(float IncomingPartnerDrive, UPARAM(ref) float& OutMomentumSpike);

    UFUNCTION(BlueprintCallable, Category="Bannon|TagTeam")
    void EvaluateMiscommunication(float CurrentCohesion);
};
