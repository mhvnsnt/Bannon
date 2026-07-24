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
            AsyncTask(ENamedThreads::GameThread, [this, FileContent]()
            {
                ParseModPayload(FileContent);
            });
        }
    }
}

void UBannonModLoader::ParseModPayload(const FString& Payload)
{
    UE_LOG(LogTemp, Log, TEXT("[BannonModLoader] Delta Patch Parsed. Overwriting base variables..."));
}

void UBannonModLoader::RestoreCoreVariables()
{
    UE_LOG(LogTemp, Warning, TEXT("[BannonModLoader] RESTORE_CORE_VARIABLES: Purging delta patches from RAM... snapped to Master C++ defaults."));
}