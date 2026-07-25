// AI ORIENTATION BLOCK v114
#include "BannonMemoryManager.h"
#include "Engine/Texture2D.h"
#include "ImageUtils.h"
#include "Misc/FileHelper.h"

UTexture2D* UBannonMemoryManager::LoadTextureFromDiskAsync(const FString& ImagePath) {
    TArray<uint8> RawFileData;
    if (FFileHelper::LoadFileToArray(RawFileData, *ImagePath)) {
        UTexture2D* LoadedTexture = FImageUtils::ImportBufferAsTexture2D(RawFileData);
        if (LoadedTexture) {
            LoadedTexture->UpdateResource();
            return LoadedTexture;
        }
    }
    return nullptr;
}

void UBannonMemoryManager::PurgeTextureFromVRAM(UTexture2D* Texture) {
    if (Texture) {
        Texture->ConditionalBeginDestroy();
    }
}
