#include "BannonCreationUI.h"
#include "BannonSaveSystem.h"

void UBannonCreationUI::InitializeNewCustomSuperstar(FName BaseTemplate, FName Archetype, float WeightClass)
{
	ActiveBuilder = NewObject<UBannonCharacterBuilder>(this);
	// Set base poise capacity and stamina based on Archetype and WeightClass
}

void UBannonCreationUI::UpdateMorphSlider(FName BoneName, float Value)
{
	if (ActiveBuilder)
	{
		ActiveBuilder->MorphTargets.Add(BoneName, Value);
		ActiveBuilder->ApplyMorphAndSyncPhysics();
	}
}

void UBannonCreationUI::UpdateHairTwoTone(FLinearColor RootColor, FLinearColor TipColor, float BlendPosition, float Sharpness)
{
	if (ActiveBuilder && ActiveBuilder->MeshCompositor)
	{
		ActiveBuilder->MeshCompositor->ApplyTwoToneHairBlend(RootColor, TipColor, BlendPosition, Sharpness);
	}
}

void UBannonCreationUI::ApplyAttireLayer(int32 LayerIndex, FName AttirePieceID, FAttireMaterialOverride MaterialOverride)
{
	if (ActiveBuilder && ActiveBuilder->MeshCompositor)
	{
		ActiveBuilder->MeshCompositor->ApplyAttireMaterialOverride(LayerIndex, MaterialOverride);
	}
}

void UBannonCreationUI::FinalizeAndSave(int32 SaveSlot, const FString& SuperstarName)
{
	if (ActiveBuilder)
	{
		UBannonSaveSystem::SaveCustomSuperstar(SaveSlot, SuperstarName, ActiveBuilder);
	}
}
