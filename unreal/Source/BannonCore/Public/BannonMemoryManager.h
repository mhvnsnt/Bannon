#pragma once
#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMemoryManager.generated.h"

UCLASS()
class BANNONCORE_API UBannonMemoryManager : public UObject {
    GENERATED_BODY()
public:
    UBannonMemoryManager();

    // Stream native .mp4 / .webm dynamically without stuttering
    UFUNCTION(BlueprintCallable, Category = "Bannon|Media")
    void StreamTitanTronMedia(const FString& MediaPath, class UTexture2D* TargetTexture);

    // Preload custom assets to prevent hitching during matches
    UFUNCTION(BlueprintCallable, Category = "Bannon|Media")
    void PreloadCAWAssetsAsync(const FString& CAWSavePath);
};
