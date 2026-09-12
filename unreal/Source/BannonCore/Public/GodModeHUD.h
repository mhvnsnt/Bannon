#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "GodModeHUD.generated.h"

UCLASS()
class BANNONCORE_API AGodModeHUD : public AHUD
{
    GENERATED_BODY()

public:
    AGodModeHUD();

protected:
    virtual void BeginPlay() override;

public:
    virtual void DrawHUD() override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|CreatorHUD")
    void InitializeCreatorHUD();

    UFUNCTION(BlueprintCallable, Category = "Bannon|CreatorHUD")
    void UpdateLogStream(const FString& LogEntry, bool bIsCritical);

    UFUNCTION(BlueprintCallable, Category = "Bannon|CreatorHUD")
    void TriggerManualOverride(const FString& TargetError);

    UFUNCTION(BlueprintCallable, Category = "Bannon|CreatorHUD")
    void UpdateInterpolationTracking(float DmgScale, float MaxBodyVel, float PoiseState);

private:
    bool bIsGodModeAuthenticated;
    TArray<FString> LogBuffer;
    
    float CurrentDmgScale;
    float CurrentMaxBodyVel;
    float CurrentPoiseState;
    
    void CheckAuthentication();
};
