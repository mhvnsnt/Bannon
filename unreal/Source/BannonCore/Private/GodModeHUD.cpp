#include "GodModeHUD.h"
#include "Misc/EnvironmentVariables.h"
#include "Engine/Canvas.h"
#include "Engine/Font.h"
#include "Async/Async.h"

AGodModeHUD::AGodModeHUD()
{
    bIsGodModeAuthenticated = false;
    CurrentDmgScale = 1.0f;
    CurrentMaxBodyVel = 3.8f;
    CurrentPoiseState = 100.0f;
}

void AGodModeHUD::BeginPlay()
{
    Super::BeginPlay();
    CheckAuthentication();
}

void AGodModeHUD::CheckAuthentication()
{
    FString GodModeKey = FPlatformMisc::GetEnvironmentVariable(TEXT("GOD_MODE_KEY"));
    if (GodModeKey == TEXT("BANNON_CREATOR_ROOT"))
    {
        bIsGodModeAuthenticated = true;
        InitializeCreatorHUD();
    }
    else
    {
        bIsGodModeAuthenticated = false;
    }
}

void AGodModeHUD::InitializeCreatorHUD()
{
    UE_LOG(LogTemp, Log, TEXT("[GodModeHUD] Authentication Confirmed. Initializing Native Slate/UMG Creator HUD..."));
}

void AGodModeHUD::UpdateLogStream(const FString& LogEntry, bool bIsCritical)
{
    if (!bIsGodModeAuthenticated) return;
    
    AsyncTask(ENamedThreads::GameThread, [this, LogEntry, bIsCritical]()
    {
        LogBuffer.Add(LogEntry);
        if (LogBuffer.Num() > 50)
        {
            LogBuffer.RemoveAt(0);
        }
    });
}

void AGodModeHUD::TriggerManualOverride(const FString& TargetError)
{
    if (!bIsGodModeAuthenticated) return;
    
    UE_LOG(LogTemp, Warning, TEXT("[GodModeHUD] Manual Override Triggered for: %s. Pinging IPC for L.I.O.N.T.A.M.E.R. rewrite..."), *TargetError);
    // Ping IPC bridge
}

void AGodModeHUD::UpdateInterpolationTracking(float DmgScale, float MaxBodyVel, float PoiseState)
{
    CurrentDmgScale = DmgScale;
    CurrentMaxBodyVel = MaxBodyVel;
    CurrentPoiseState = PoiseState;
}

void AGodModeHUD::DrawHUD()
{
    Super::DrawHUD();
    
    if (!bIsGodModeAuthenticated) return;
    
    // Simple canvas drawing for HUD telemetry
    if (Canvas)
    {
        FVector2D TextPos(10.0f, 10.0f);
        Canvas->DrawText(GEngine->GetMediumFont(), TEXT("[GOD MODE HUD ACTIVE]"), TextPos.X, TextPos.Y, 1.0f, 1.0f, FFontRenderInfo());
        
        TextPos.Y += 20.0f;
        FString Telemetry = FString::Printf(TEXT("DMG_SCALE: %.2f | MAX_BODY_VEL: %.2f | POISE: %.2f"), CurrentDmgScale, CurrentMaxBodyVel, CurrentPoiseState);
        Canvas->DrawText(GEngine->GetSmallFont(), Telemetry, TextPos.X, TextPos.Y, 1.0f, 1.0f, FFontRenderInfo());
    }
}
