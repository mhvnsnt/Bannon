#pragma once

#include "CoreMinimal.h"
#include "BannonFullRosterManifest.h"
#include "UObject/NoExportTypes.h"
#include "BannonExtendedRoster.generated.h"

UCLASS()
class BANNONCORE_API UBannonExtendedRoster : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Roster")
    void LoadExtendedCharacters(UPARAM(ref) TArray<FBookCharacterProfile>& OutRoster);
};
