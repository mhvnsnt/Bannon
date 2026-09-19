#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPayloadRouter.generated.h"

class UBannonModLoader;

UCLASS()
class BANNONCORE_API UBannonPayloadRouter : public UObject
{
    GENERATED_BODY()

public:
    UBannonPayloadRouter();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Security")
    void SetModLoaderRef(UBannonModLoader* InModLoader);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Security")
    void RouteIncomingPayload(const FString& PayloadString, const TArray<uint8>& BinaryBlob, const FString& ModHash);

private:
    UPROPERTY()
    UBannonModLoader* ModLoaderRef;

    bool ValidateGodModeKey(const FString& PayloadString);
    bool ScanForSandboxViolations(const FString& PayloadString);
    void ExecuteSandboxedPayload(const FString& PayloadString);
    void TriggerSandboxViolation(const FString& ModHash, const FString& Reason);
};
