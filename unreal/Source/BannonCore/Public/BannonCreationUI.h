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
	// Phase 1: Entry & Baseline Initialization
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI")
	void InitializeNewCustomSuperstar(FName BaseTemplate, FName Archetype, float WeightClass);

	// Phase 2 & 3: Appearance & Anatomy
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI")
	void UpdateMorphSlider(FName BoneName, float Value);

	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI")
	void UpdateHairTwoTone(FLinearColor RootColor, FLinearColor TipColor, float BlendPosition, float Sharpness);

	// Phase 4: Attire & Material Layering
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI")
	void ApplyAttireLayer(int32 LayerIndex, FName AttirePieceID, FAttireMaterialOverride MaterialOverride);

	// Phase 5: Finalize
	UFUNCTION(BlueprintCallable, Category = "Bannon|CreationUI")
	void FinalizeAndSave(int32 SaveSlot, const FString& SuperstarName);

protected:
	UPROPERTY(BlueprintReadOnly, Category = "Bannon|CreationUI")
	UBannonCharacterBuilder* ActiveBuilder;
};
