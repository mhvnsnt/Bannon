// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonCreationSaveProfile.h"
#include "BannonCreationManager.generated.h"

UCLASS()
class BANNONENGINE_API UBannonCreationManager : public UObject
{
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Creation")
    void LoadProfile(FName ProfileID);
    
    UFUNCTION(BlueprintCallable, Category="Bannon|Creation")
    void SaveProfile(const FCreationSaveProfile& Profile);
};
