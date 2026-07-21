#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "BannonCharacterBuilder.h"
#include "BannonCreationUI.generated.h"

UCLASS()
class BANNONCORE_API UBannonCreationUI : public UUserWidget
{
	GENERATED_BODY()

public:
	// Phase 1: Personal Information (Meta-Data & Engine Constants)
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase1")
	void SetIdentity(const FString& SuperstarName, const FString& EntranceName, const FName& CommentaryAudioFlag);

	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase1")
	void SetPresentationSigns(int32 SignIndex, const FString& SignAssetPath);

	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase1")
	void AllocateAttributes(float HitPoints, float Speed, float DamageModifier);

	// Phase 2: Advanced Anatomy & Morphing (Physics-Linked Deformation)
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase2")
	void UpdateFaceMorph(FName Region, float Depth, float Width, float Angle, float Height);

	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase2")
	void UpdateBodyMorph(FName Region, float ScaleX, float ScaleY, float ScaleZ);

	// Phase 3: Hair & Dye (Shader UI)
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase3")
	void UpdateHairDye(FName HairRegion, FLinearColor BaseColor, FLinearColor TipColor, float BlendPosition, float BlendSharpness);

	// Phase 4: Body Art & Decals (40-Layer Pool)
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase4")
	void ApplyBodyArt(int32 LayerIndex, const FString& DecalAsset, FVector2D Translation, FVector2D Scale, float Rotation, float Opacity);

	// Phase 5: Attire Construction Hub (60-Layer Pool)
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase5")
	void ApplyAttirePart(int32 LayerIndex, FName Category, const FString& MeshAsset, const FString& MaterialOverride, TArray<FLinearColor> ChannelColors);

	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase5")
	void ReorderAttireLayer(int32 CurrentIndex, int32 NewIndex);

	// Phase 6: Serialization & Finalization
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase6")
	void SelectMenuPose(FName PoseID);

	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI|Phase6")
	void FinalizeAndSave(const FString& CustomSavePath);

protected:
	UPROPERTY(BlueprintReadOnly, Category = "Bannon|CreationUI")
	UBannonCharacterBuilder* ActiveBuilder;
};
