#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonBackstagePoliticsMatrix.generated.h"

UCLASS()
class BANNONCORE_API UBannonBackstagePoliticsMatrix : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Meta")
    void RegisterBackstageAltercation(const FString& AttackerID, const FString& VictimID, float DamageDealt, UPARAM(ref) TMap<FString, float>& RivalryMatrix);
};
