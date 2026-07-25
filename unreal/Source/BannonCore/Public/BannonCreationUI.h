// AI ORIENTATION BLOCK v114
#pragma once
#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "BannonCreationUI.generated.h"

UCLASS()
class BANNONCORE_API UBannonCreationUI : public UUserWidget {
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void SetIdentity(const FString& SuperstarName, const FString& EntranceName);

    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void AllocateAttributes(float HP, float Speed, float DamageModifier);
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void CommitCreationToDisk();

private:
    FString CurrentSuperstarName;
    FString CurrentEntranceName;
    float AssignedHP;
    float AssignedSpeed;
    float AssignedDamage;
};
