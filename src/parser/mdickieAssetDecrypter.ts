import * as fs from 'fs';
import * as path from 'path';

export class MDickieAssetDecrypter {
    public static decryptAndIntegrateAssets(manifestPath: string, publicDir: string, privateDir: string) {
        if (!fs.existsSync(manifestPath)) {
            console.error(`Manifest not found at ${manifestPath}`);
            return;
        }
        
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        let headerContent = `#pragma once\n\n#include "CoreMinimal.h"\n#include "Engine/DataAsset.h"\n#include "BannonMDickieAssetRegistry.generated.h"\n\n`;
        headerContent += `USTRUCT(BlueprintType)\nstruct FMDickieAssetEntry {\n    GENERATED_BODY()\n\n`;
        headerContent += `    UPROPERTY(EditAnywhere, BlueprintReadWrite)\n    FString AssetID;\n\n`;
        headerContent += `    UPROPERTY(EditAnywhere, BlueprintReadWrite)\n    FString AssetName;\n\n`;
        headerContent += `    UPROPERTY(EditAnywhere, BlueprintReadWrite)\n    FString AssetType;\n\n`;
        headerContent += `    UPROPERTY(EditAnywhere, BlueprintReadWrite)\n    FString DriveFolder;\n};\n\n`;

        headerContent += `UCLASS()\nclass BANNONCORE_API UBannonMDickieAssetRegistry : public UDataAsset {\n    GENERATED_BODY()\n\npublic:\n`;
        headerContent += `    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="MDickie Assets")\n    TArray<FMDickieAssetEntry> EncryptedAssets;\n\n`;
        headerContent += `    void InitializeDecryptedRegistry();\n};\n`;
        
        let cppContent = `#include "BannonMDickieAssetRegistry.h"\n\nvoid UBannonMDickieAssetRegistry::InitializeDecryptedRegistry() {\n    // Decryption loop for MDickie legacy assets\n    EncryptedAssets.Empty();\n\n`;
        
        for (const file of manifest.files) {
            cppContent += `    FMDickieAssetEntry Entry_${file.id};\n`;
            cppContent += `    Entry_${file.id}.AssetID = TEXT("${file.id}");\n`;
            cppContent += `    Entry_${file.id}.AssetName = TEXT("${file.name}");\n`;
            cppContent += `    Entry_${file.id}.AssetType = TEXT("${file.type}");\n`;
            cppContent += `    Entry_${file.id}.DriveFolder = TEXT("${file.driveFolder}");\n`;
            cppContent += `    EncryptedAssets.Add(Entry_${file.id});\n\n`;
        }
        cppContent += `}\n`;
        
        fs.writeFileSync(path.join(publicDir, 'BannonMDickieAssetRegistry.h'), headerContent);
        fs.writeFileSync(path.join(privateDir, 'BannonMDickieAssetRegistry.cpp'), cppContent);
        
        console.log(`Successfully generated UBannonMDickieAssetRegistry C++ headers and implementation from MDickie decrypter.`);
    }
}
