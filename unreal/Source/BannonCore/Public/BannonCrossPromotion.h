#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCrossPromotion.generated.h"

UCLASS()
class BANNONCORE_API UBannonCrossPromotion : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|CrossPromotion")
    void EvaluateTitleHostage(const FString& ChampionID, int32 ContractWeeksLeft);

    UFUNCTION(BlueprintCallable, Category="Bannon|CrossPromotion")
    void TriggerInvasionAngle(const FString& InvadingFactionID);
};
