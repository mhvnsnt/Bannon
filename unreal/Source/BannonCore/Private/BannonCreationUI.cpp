#include "BannonCreationUI.h"
#include "BannonSaveSystem.h"

// Phase 1
void UBannonCreationUI::SetIdentity(const FString& SuperstarName, const FString& EntranceName, const FName& CommentaryAudioFlag)
{
    // Configure name metadata
}

void UBannonCreationUI::SetPresentationSigns(int32 SignIndex, const FString& SignAssetPath)
{
    // Assign crowd sign asset
}

void UBannonCreationUI::AllocateAttributes(float HitPoints, float Speed, float DamageModifier)
{
    // Enforce limits
    HitPoints = FMath::Clamp(HitPoints, 0.0f, 10000.0f);
    Speed = FMath::Clamp(Speed, 0.0f, 3.8f);
    DamageModifier = FMath::Clamp(DamageModifier, 0.0f, 8.0f);
    // Push these to ActiveBuilder for Poise capacity configuration
}

// Phase 2
void UBannonCreationUI::UpdateFaceMorph(FName Region, float Depth, float Width, float Angle, float Height)
{
    if (ActiveBuilder)
    {
        // Push multi-axis morph values
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_Depth"), *Region.ToString()), Depth);
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_Width"), *Region.ToString()), Width);
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_Angle"), *Region.ToString()), Angle);
        ActiveBuilder->MorphTargets.Add(*FString::Printf(TEXT("%s_Height"), *Region.ToString()), Height);
        ActiveBuilder->ApplyMorphAndSyncPhysics(); // Automatically adjusts Jolt Hitboxes
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
        // Add to 40-layer pool
    }
}

// Phase 5
void UBannonCreationUI::ApplyAttirePart(int32 LayerIndex, FName Category, const FString& MeshAsset, const FString& MaterialOverride, TArray<FLinearColor> ChannelColors)
{
    if (ActiveBuilder && ActiveBuilder->MeshCompositor)
    {
        FAttireMaterialOverride MatProps;
        MatProps.bIsVinyl = (MaterialOverride == "Vinyl");
        // Decode other properties
        ActiveBuilder->MeshCompositor->ApplyAttireMaterialOverride(LayerIndex, MatProps);
    }
}

void UBannonCreationUI::ReorderAttireLayer(int32 CurrentIndex, int32 NewIndex)
{
    // Sort array for Z-index display without Jolt collision conflicts
}

// Phase 6
void UBannonCreationUI::SelectMenuPose(FName PoseID)
{
    // Trigger static mesh loop preview
}

void UBannonCreationUI::FinalizeAndSave(const FString& CustomSavePath)
{
    if (ActiveBuilder)
    {
        UBannonSaveSystem::SaveCustomSuperstarDynamic(CustomSavePath, ActiveBuilder);
    }
}
