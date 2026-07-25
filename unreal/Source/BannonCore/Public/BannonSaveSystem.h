// AI ORIENTATION BLOCK v114
#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "BannonSaveSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonSaveSystem : public UGameInstanceSubsystem {
    GENERATED_BODY()
public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|SaveSystem")
    FString SaveCharacterToDisk(const FString& CharacterJsonPayload);

    UFUNCTION(BlueprintCallable, Category = "Bannon|SaveSystem")
    FString LoadCharacterFromDisk(const FString& SlotId);
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|SaveSystem")
    TArray<FString> GetAllCharacterSlots();
};
