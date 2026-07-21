#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "Components/SkeletalMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "BannonMeshCompositor.generated.h"

// Define material properties for AAA attire layering
USTRUCT(BlueprintType)
struct FAttireMaterialOverride
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    float Metallic;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    float Roughness;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FLinearColor BaseColor;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    bool bIsVinyl;
};

USTRUCT(BlueprintType)
struct FBodyArtDecal
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FString AssetPath;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FVector2D Translation;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FVector2D Scale;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    float Rotation;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    float Opacity;
};

USTRUCT(BlueprintType)
struct FAttireLayerData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FName Category;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FString MeshAssetPath;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    TArray<FLinearColor> ChannelColors;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FAttireMaterialOverride MaterialProps;
};

UCLASS()
class BANNONCORE_API UBannonMeshCompositor : public UObject
{
    GENERATED_BODY()

public:
    UBannonMeshCompositor();

    // Constant Memory Pool limits for AAA layering
    static constexpr int32 MAX_ATTIRE_LAYERS = 60;
    static constexpr int32 MAX_BODY_LAYERS = 40;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    TMap<int32, FString> SignAssets;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    TMap<int32, FBodyArtDecal> BodyArtLayers;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    TMap<int32, FAttireLayerData> AttireLayers;
    
    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    USkeletalMeshComponent* PrimaryMesh;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    TArray<UMaterialInstanceDynamic*> DynamicMaterials;

    // Isolate body/head morphs from attire to prevent Z-fighting
    UFUNCTION(BlueprintCallable, Category = "Bannon|Creation")
    void AssembleCompositeMesh();

    // Inject two-tone gradient blending for hair/facial hair
    UFUNCTION(BlueprintCallable, Category = "Bannon|Creation")
    void ApplyTwoToneHairBlend(FLinearColor RootColor, FLinearColor TipColor, float BlendPosition, float Sharpness);

    // Apply PBR material overrides
    UFUNCTION(BlueprintCallable, Category = "Bannon|Creation")
    void ApplyAttireMaterialOverride(int32 LayerIndex, const FAttireMaterialOverride& MaterialProps);

    // Anti-Clipping & Unrestricted Layering via Jolt collision proxies
    UFUNCTION(BlueprintCallable, Category = "Bannon|Creation")
    void InjectJoltCollisionProxiesForAttire();
};
