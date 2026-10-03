#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonTagTeamChemistry.generated.h"

UCLASS()
class BANNONCORE_API UBannonTagTeamChemistry : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Meta")
    void UpdateTeamChemistry(int32 MatchesWrestledTogether, bool bWonMatch, UPARAM(ref) float& InOutChemistryStat, UPARAM(ref) bool& bUnlocksTandemFinishers);
};
