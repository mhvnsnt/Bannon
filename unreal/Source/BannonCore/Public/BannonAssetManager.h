#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMDickieAssetRegistry.h"
#include "BannonAssetManager.generated.h"

UCLASS()
class BANNONCORE_API UBannonAssetManager : public UObject
{
    GENERATED_BODY()

public:
    UBannonAssetManager();

    UPROPERTY(Transient)
    UBannonMDickieAssetRegistry* MDickieRegistry;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Assets")
    void InitializeAssetDecrypter();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Assets")
    bool LoadMDickieAsset(const FString& AssetID, UObject*& OutAsset);
};
