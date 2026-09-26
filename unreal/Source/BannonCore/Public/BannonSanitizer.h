#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonSanitizer.generated.h"

class UBannonModLoader;

UCLASS()
class BANNONCORE_API UBannonSanitizer : public UObject
{
    GENERATED_BODY()

public:
    UBannonSanitizer();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Sanitizer")
    void PrePhysicsTickScan(float DeltaTime);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Sanitizer")
    void SetModLoaderRef(UBannonModLoader* InModLoader);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Sanitizer")
    bool ValidateKineticVector(FVector InVector);

private:
    UPROPERTY()
    UBannonModLoader* ModLoaderRef;

    const float MAX_BODY_VEL = 3.8f;

    void TriggerMemoryRollback(const FString& FaultContext);
    void BroadcastCriticalFault(const FString& Address, const FString& Variable, const FString& StackTrace);
};
