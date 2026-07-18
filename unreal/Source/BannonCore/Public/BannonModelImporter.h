#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonModelImporter.generated.h"

UCLASS()
class BANNONCORE_API UBannonModelImporter : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void DecryptAndPortLegacyModel(const FString& LegacyFormatPath, UPARAM(ref) FString& OutUnrealAssetPath);

	// Wires decrypted low-poly model meshes directly to active Character skeletal blueprints
	UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
	bool WireMeshToCharacterBlueprint(class ACharacter* Character, const FString& DecryptedMeshPath);

	// Upgrades low-poly legacy texture mappings to Lumen-compatible subsurface scattering dynamic materials
	UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
	bool ApplyLumenMaterialToMesh(class USkeletalMeshComponent* SkeletalMesh, const FString& TexturePath);
};
