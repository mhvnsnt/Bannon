#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPersistentScarring.generated.h"

UCLASS()
class BANNONCORE_API UBannonPersistentScarring : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void ApplyPermanentScar(const FString& BoneName, float DamageDepth, UPARAM(ref) TArray<FString>& OutPersistentScars);
};
