#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonModLoader.generated.h"

UCLASS()
class BANNONCORE_API UBannonModLoader : public UObject
{
    GENERATED_BODY()

public:
    UBannonModLoader();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Mods")
    void InitializeModLoader();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Mods")
    void LoadUserOverrides();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Mods")
    void RestoreCoreVariables();

    UFUNCTION(BlueprintCallable, Category = "Bannon|IPC")
    void OnIPCMessageReceived(const FString& Message);

private:
    void ParseModPayload(const FString& Payload);
    void ApplyPhysicsDeltaSmoothing(const FString& Payload);
};