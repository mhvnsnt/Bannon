#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonRefRetaliation.generated.h"

UCLASS()
class BANNONCORE_API UBannonRefRetaliation : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void EvaluateRefTolerance(int32 TimesAttacked, float CurrentPatience, UPARAM(ref) bool& bWillFightBack);
};
