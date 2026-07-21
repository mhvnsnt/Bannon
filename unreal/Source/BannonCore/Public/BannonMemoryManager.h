#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMemoryManager.generated.h"

UCLASS()
class BANNONCORE_API UBannonMemoryManager : public UObject
{
	GENERATED_BODY()

public:
    UBannonMemoryManager();

    // Breaking the image limit: stream 2D assets locally without bloated DB indexing
    UFUNCTION(BlueprintCallable, Category = "Bannon|Memory")
    void StreamDynamicTexture(const FString& AbsoluteLocalPath, FName AssignedSlot);

    // Bypassing 20-slot custom TitanTron limits: read raw .mp4 or .webm
    UFUNCTION(BlueprintCallable, Category = "Bannon|Memory")
    void IngestCustomTitanTron(const FString& VideoLocalPath);
};
