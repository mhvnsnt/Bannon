#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMatchCardBooking.generated.h"

UCLASS()
class BANNONCORE_API UBannonMatchCardBooking : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void GenerateMainEvent(const TArray<FString>& ActiveRivalries, float PPVImportance, UPARAM(ref) FString& OutMainEventMatchup);
};
