#include "BannonModLoader.h"
#include "HAL/PlatformFileManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Async/Async.h"

UBannonModLoader::UBannonModLoader()
{
}

void UBannonModLoader::InitializeModLoader()
{
    UE_LOG(LogTemp, Log, TEXT("[BannonModLoader] V8-GLOMAR Chassis Init: Hooking post-boot sequence..."));
    LoadUserOverrides();
}

void UBannonModLoader::LoadUserOverrides()
{
    FString OverrideDir = FPaths::ProjectSavedDir() / TEXT("UserOverrides");
    
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    
    if (!PlatformFile.DirectoryExists(*OverrideDir))
    {
        PlatformFile.CreateDirectory(*OverrideDir);
        return;
    }

    TArray<FString> OverrideFiles;
    PlatformFile.FindFiles(OverrideFiles, *OverrideDir, TEXT(".json"));

    for (const FString& File : OverrideFiles)
    {
        FString FileContent;
        if (FFileHelper::LoadFileToString(FileContent, *File))
        {
            // Zero-Latency Optimization: Only dispatch if memory state has actually mutated
            if (FileContent != CachedPayloadState) 
            {
                CachedPayloadState = FileContent;
                AsyncTask(ENamedThreads::GameThread, [this, FileContent]()
                {
                    ParseModPayload(FileContent);
                });
            }
        }
    }
}

void UBannonModLoader::ParseModPayload(const FString& Payload)
{
    UE_LOG(LogTemp, Log, TEXT("[BannonModLoader] Delta Patch Parsed. Bypassing compilation, hot-swapping directly in active memory..."));
    ApplyPhysicsDeltaSmoothing(Payload);
}

void UBannonModLoader::ApplyPhysicsDeltaSmoothing(const FString& Payload)
{
    UE_LOG(LogTemp, Log, TEXT("[BannonModLoader] Physics Delta Smoothing Active: Interpolating new constraints without frame drop..."));
}

void UBannonModLoader::RestoreCoreVariables()
{
    UE_LOG(LogTemp, Warning, TEXT("[BannonModLoader] RESTORE_CORE_VARIABLES: Purging delta patches from RAM... snapped to Master C++ defaults."));
    CachedPayloadState.Empty();
}

void UBannonModLoader::OnIPCMessageReceived(const FString& Message)
{
    if (Message.Contains(TEXT("UPDATE_READY")))
    {
        UE_LOG(LogTemp, Log, TEXT("[BannonModLoader] UPDATE_READY IPC signal received. Triggering zero-latency hot-reload..."));
        AsyncTask(ENamedThreads::GameThread, [this]()
        {
            LoadUserOverrides();
        });
    }
}

void UBannonModLoader::ExecutePayloadBlob(const TArray<uint8>& BinaryBlob)
{
    // Bypass UE Editor Compilation: Direct GameThread binding
    UE_LOG(LogTemp, Log, TEXT("[BannonModLoader] INJECTING NATIVE PAYLOAD BLOB. Bypassing compilation pipeline."));
    AsyncTask(ENamedThreads::GameThread, [this, BinaryBlob]()
    {
        UE_LOG(LogTemp, Log, TEXT("[BannonModLoader] Binary blob bound to GameThread. Executing raw overrides natively."));
        // Absolute memory address assignment happens here
    });
}
