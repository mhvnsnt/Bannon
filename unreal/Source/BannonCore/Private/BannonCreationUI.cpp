#include "BannonCreationUI.h"
#include "BannonSaveSystem.h"

// Phase 1
void UBannonCreationUI::SetIdentity(const FString& SuperstarName, const FString& EntranceName, const FName& CommentaryAudioFlag)
{
    if (ActiveBuilder)
    {
        ActiveBuilder->SuperstarName = SuperstarName;
        ActiveBuilder->EntranceName = EntranceName;
        ActiveBuilder->CommentaryAudioFlag = CommentaryAudioFlag;
    }
}

void UBannonCreationUI::SetPresentationSigns(int32 SignIndex, const FString& SignAssetPath)
{
    if (ActiveBuilder && ActiveBuilder->MeshCompositor)
    {
        ActiveBuilder->MeshCompositor->SignAssets.Add(SignIndex, SignAssetPath);
    }
}

void UBannonCreationUI::AllocateAttributes(float HitPoints, float Speed, float DamageModifier)
{
    if (ActiveBuilder)
    {
        ActiveBuilder->MaxHitPoints = FMath::Clamp(HitPoints, 0.0f, 10000.0f);
        ActiveBuilder->VelocityLimit = FMath::Clamp(Speed, 0.0f, 3.8f);
        ActiveBuilder->DamageScale = FMath::Clamp(DamageModifier, 0.0f, 8.0f);
        ActiveBuilder->ApplyMorphAndSyncPhysics(); // Synchronize Jolt boundaries
    }
}

// Phase 2
void UBannonCreationUI::UpdateFaceMorph(FName Region, float Depth, float Width, float Angle, float Height)
{
    if (ActiveBuilder)
    {
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_Depth"), *Region.ToString()), Depth);
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_Width"), *Region.ToString()), Width);
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_Angle"), *Region.ToString()), Angle);
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_Height"), *Region.ToString()), Height);
        ActiveBuilder->ApplyMorphAndSyncPhysics();
    }
}

void UBannonCreationUI::UpdateBodyMorph(FName Region, float ScaleX, float ScaleY, float ScaleZ)
{
    if (ActiveBuilder)
    {
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_ScaleX"), *Region.ToString()), ScaleX);
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_ScaleY"), *Region.ToString()), ScaleY);
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_ScaleZ"), *Region.ToString()), ScaleZ);
        ActiveBuilder->ApplyMorphAndSyncPhysics(); 
    }
}

// Phase 3
void UBannonCreationUI::UpdateHairDye(FName HairRegion, FLinearColor BaseColor, FLinearColor TipColor, float BlendPosition, float BlendSharpness)
{
    if (ActiveBuilder && ActiveBuilder->MeshCompositor)
    {
        ActiveBuilder->MeshCompositor->ApplyTwoToneHairBlend(BaseColor, TipColor, BlendPosition, BlendSharpness);
    }
}

// Phase 4
void UBannonCreationUI::ApplyBodyArt(int32 LayerIndex, const FString& DecalAsset, FVector2D Translation, FVector2D Scale, float Rotation, float Opacity)
{
    if (ActiveBuilder && ActiveBuilder->MeshCompositor)
    {
        FBodyArtDecal Decal;
        Decal.AssetPath = DecalAsset;
        Decal.Translation = Translation;
        Decal.Scale = Scale;
        Decal.Rotation = Rotation;
        Decal.Opacity = Opacity;
        ActiveBuilder->MeshCompositor->BodyArtLayers.Add(LayerIndex, Decal);
    }
}

// Phase 5
void UBannonCreationUI::ApplyAttirePart(int32 LayerIndex, FName Category, const FString& MeshAsset, const FString& MaterialOverride, TArray<FLinearColor> ChannelColors)
{
    if (ActiveBuilder && ActiveBuilder->MeshCompositor)
    {
        FAttireLayerData LayerData;
        LayerData.Category = Category;
        LayerData.MeshAssetPath = MeshAsset;
        LayerData.ChannelColors = ChannelColors;
        
        FAttireMaterialOverride MatProps;
        MatProps.bIsVinyl = (MaterialOverride == TEXT("Vinyl"));
        MatProps.Metallic = (MaterialOverride == TEXT("Metallic") || MaterialOverride == TEXT("Leather")) ? 1.0f : 0.0f;
        MatProps.Roughness = (MaterialOverride == TEXT("Matte")) ? 1.0f : (MaterialOverride == TEXT("Gloss") ? 0.1f : 0.5f);
        LayerData.MaterialProps = MatProps;
        
        ActiveBuilder->MeshCompositor->AttireLayers.Add(LayerIndex, LayerData);
        ActiveBuilder->MeshCompositor->ApplyAttireMaterialOverride(LayerIndex, MatProps);
    }
}

void UBannonCreationUI::ReorderAttireLayer(int32 CurrentIndex, int32 NewIndex)
{
    if (ActiveBuilder && ActiveBuilder->MeshCompositor)
    {
        if (ActiveBuilder->MeshCompositor->AttireLayers.Contains(CurrentIndex))
        {
            FAttireLayerData Temp = ActiveBuilder->MeshCompositor->AttireLayers[CurrentIndex];
            ActiveBuilder->MeshCompositor->AttireLayers.Remove(CurrentIndex);
            ActiveBuilder->MeshCompositor->AttireLayers.Add(NewIndex, Temp);
        }
    }
}

// Phase 6
void UBannonCreationUI::SelectMenuPose(FName PoseID)
{
    if (ActiveBuilder)
    {
        ActiveBuilder->SelectedMenuPose = PoseID;
    }
}

void UBannonCreationUI::FinalizeAndSave(const FString& CustomSavePath)
{
    if (ActiveBuilder)
    {
        UBannonSaveSystem::SaveCustomSuperstarDynamic(CustomSavePath, ActiveBuilder);
    }
}
