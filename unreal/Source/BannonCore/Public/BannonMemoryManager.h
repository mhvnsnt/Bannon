// AI ORIENTATION BLOCK v114
#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "BannonMemoryManager.generated.h"

class UTexture2D;

UCLASS()
class BANNONCORE_API UBannonMemoryManager : public UGameInstanceSubsystem {
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|Memory")
    UTexture2D* LoadTextureFromDiskAsync(const FString& ImagePath);
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|Memory")
    void PurgeTextureFromVRAM(UTexture2D* Texture);
};
