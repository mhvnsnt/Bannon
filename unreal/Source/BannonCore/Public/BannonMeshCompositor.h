#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
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

UCLASS()
class BANNONCORE_API UBannonMeshCompositor : public UObject
{
    GENERATED_BODY()

public:
    UBannonMeshCompositor();

    // Constant Memory Pool limits for AAA layering
    static constexpr int32 MAX_ATTIRE_LAYERS = 60;
    static constexpr int32 MAX_BODY_LAYERS = 40;

    // Isolate body/head morphs from attire to prevent Z-fighting
    UFUNCTION(BlueprintCallable, Category = "Bannon|Creation")
    void AssembleCompositeMesh();

    // Inject two-tone gradient blending for hair/facial hair
    UFUNCTION(BlueprintCallable, Category = "Bannon|Creation")
    void ApplyTwoToneHairBlend(FLinearColor RootColor, FLinearColor TipColor, float BlendPosition, float Sharpness);

    // Apply PBR material overrides
    UFUNCTION(BlueprintCallable, Category = "Bannon|Creation")
    void ApplyAttireMaterialOverride(int32 LayerIndex, const FAttireMaterialOverride& MaterialProps);
};
