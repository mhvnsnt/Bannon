#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCardPositioning.generated.h"

UENUM(BlueprintType)
enum class EBannonRosterTier : uint8
{
    Jobber,
    LowerMid,
    Midcard,
    UpperMid,
    MainEventer,
    Legend
};

UCLASS()
class BANNONCORE_API UBannonCardPositioning : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Hierarchy")
    float GetPoiseMultiplierForTier(EBannonRosterTier Tier);

    UFUNCTION(BlueprintCallable, Category="Bannon|Hierarchy")
    void ProcessTheRub(EBannonRosterTier WinnerTier, EBannonRosterTier LoserTier, UPARAM(ref) float& WinnerHeat, UPARAM(ref) float& LoserMorale);
};
