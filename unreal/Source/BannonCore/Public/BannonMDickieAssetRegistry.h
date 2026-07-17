#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "BannonMDickieAssetRegistry.generated.h"

USTRUCT(BlueprintType)
struct FMDickieAssetEntry {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString AssetID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString AssetName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString AssetType;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString DriveFolder;
};

UCLASS()
class BANNONCORE_API UBannonMDickieAssetRegistry : public UDataAsset {
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="MDickie Assets")
    TArray<FMDickieAssetEntry> EncryptedAssets;

    void InitializeDecryptedRegistry();
};
