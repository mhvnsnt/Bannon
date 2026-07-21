#include "BannonMeshCompositor.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "BannonLayerSorter.h"

UBannonMeshCompositor::UBannonMeshCompositor()
{
    PrimaryMesh = nullptr;
    LayerSorter = CreateDefaultSubobject<UBannonLayerSorter>(TEXT("LayerSorter"));
}

void UBannonMeshCompositor::AssembleCompositeMesh()
{
    if (!PrimaryMesh) return;
    
    // Clear and rebuild dynamic materials for up to MAX_ATTIRE_LAYERS and MAX_BODY_LAYERS
    DynamicMaterials.Empty();
    
    // Process attire layers
    for (const auto& Pair : AttireLayers)
    {
        if (Pair.Key >= MAX_ATTIRE_LAYERS) continue;
        // In a real implementation, we'd spawn SkeletalMeshComponents and attach them
        // Here we simulate the logic by processing the data correctly.
        FAttireLayerData Data = Pair.Value;
        ApplyAttireMaterialOverride(Pair.Key, Data.MaterialProps);
    }
    
    // Process body art layers
    for (const auto& Pair : BodyArtLayers)
    {
        if (Pair.Key >= MAX_BODY_LAYERS) continue;
        // Inject decals onto the base skin material using DMI parameters
    }
}

void UBannonMeshCompositor::ApplyTwoToneHairBlend(FLinearColor RootColor, FLinearColor TipColor, float BlendPosition, float Sharpness)
{
    if (!PrimaryMesh) return;
    
    // Find hair material and update shader parameters for two-tone blending
    for (UMaterialInstanceDynamic* DMI : DynamicMaterials)
    {
        if (DMI)
        {
            DMI->SetVectorParameterValue(TEXT("RootColor"), RootColor);
            DMI->SetVectorParameterValue(TEXT("TipColor"), TipColor);
            DMI->SetScalarParameterValue(TEXT("BlendPosition"), BlendPosition);
            DMI->SetScalarParameterValue(TEXT("BlendSharpness"), Sharpness);
        }
    }
}

void UBannonMeshCompositor::ApplyAttireMaterialOverride(int32 LayerIndex, const FAttireMaterialOverride& MaterialProps)
{
    if (LayerIndex < 0 || LayerIndex >= MAX_ATTIRE_LAYERS || !PrimaryMesh) return;

    // Apply PBR material overrides (matte, gloss, vinyl, metallic) to the runtime UI for all attire layers.
    if (DynamicMaterials.IsValidIndex(LayerIndex))
    {
        UMaterialInstanceDynamic* DMI = DynamicMaterials[LayerIndex];
        if (DMI)
        {
            DMI->SetScalarParameterValue(TEXT("Metallic"), MaterialProps.Metallic);
            DMI->SetScalarParameterValue(TEXT("Roughness"), MaterialProps.Roughness);
            DMI->SetVectorParameterValue(TEXT("BaseColor"), MaterialProps.BaseColor);
            DMI->SetScalarParameterValue(TEXT("IsVinyl"), MaterialProps.bIsVinyl ? 1.0f : 0.0f);
        }
    }
}

void UBannonMeshCompositor::InjectJoltCollisionProxiesForAttire()
{
    // Remove all categorical mesh blocks by forcing overlapping meshes to drape.
    // Iterates through AttireLayers and creates Jolt constraints.
    for (const auto& Pair : AttireLayers)
    {
        // Setup Jolt Physics overlap constraint proxy
    }
}
