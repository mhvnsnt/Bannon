// AI ORIENTATION BLOCK v114
#include "BannonSaveSystem.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "HAL/PlatformFileManager.h"

void UBannonSaveSystem::Initialize(FSubsystemCollectionBase& Collection) {
    Super::Initialize(Collection);
}

FString UBannonSaveSystem::SaveCharacterToDisk(const FString& CharacterJsonPayload) {
    FString SlotId = FString::Printf(TEXT("caw_%lld.json"), FDateTime::Now().ToUnixTimestamp());
    FString SaveDirectory = FPaths::ProjectSavedDir() / TEXT("Characters");
    
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    if (!PlatformFile.DirectoryExists(*SaveDirectory)) {
        PlatformFile.CreateDirectoryTree(*SaveDirectory);
    }
    
    FString FullPath = SaveDirectory / SlotId;
    if (FFileHelper::SaveStringToFile(CharacterJsonPayload, *FullPath, FFileHelper::EEncodingOptions::ForceUTF8)) {
        return SlotId;
    }
    
    return TEXT("");
}

FString UBannonSaveSystem::LoadCharacterFromDisk(const FString& SlotId) {
    FString FullPath = FPaths::ProjectSavedDir() / TEXT("Characters") / SlotId;
    FString JsonContent;
    if (FFileHelper::LoadFileToString(JsonContent, *FullPath)) {
        return JsonContent;
    }
    return TEXT("");
}

TArray<FString> UBannonSaveSystem::GetAllCharacterSlots() {
    FString SaveDirectory = FPaths::ProjectSavedDir() / TEXT("Characters");
    TArray<FString> FoundFiles;
    
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    PlatformFile.FindFiles(FoundFiles, *SaveDirectory, TEXT(".json"));
    
    for (int32 i = 0; i < FoundFiles.Num(); ++i) {
        FoundFiles[i] = FPaths::GetCleanFilename(FoundFiles[i]);
    }
    
    return FoundFiles;
}
