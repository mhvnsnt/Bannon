#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonProstheticSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonProstheticSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void AttachProstheticLimb(const FString& AmputatedBone, UPARAM(ref) FString& OutProstheticMesh, UPARAM(ref) float& OutAgilityPenalty, UPARAM(ref) float& OutStrikeDamageBonus);
};
