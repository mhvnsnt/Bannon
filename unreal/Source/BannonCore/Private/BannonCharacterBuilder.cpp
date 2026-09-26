// AI ORIENTATION BLOCK v114
#include "BannonCharacterBuilder.h"
#include "Components/SkeletalMeshComponent.h"
#include "BannonCharacter.h"
#include "BannonPhysicsLaws.h"
#include "Materials/MaterialInstanceDynamic.h"

UBannonCharacterBuilder::UBannonCharacterBuilder() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonCharacterBuilder::UpdateMorphAnatomy(FName Region, float Depth, float Width, float Angle, float Height, USkeletalMeshComponent* TargetMesh) {
    if (!TargetMesh) return;
    FString Prefix = Region.ToString() + TEXT("_");
    TargetMesh->SetMorphTarget(*(Prefix + TEXT("Depth")), Depth);
    TargetMesh->SetMorphTarget(*(Prefix + TEXT("Width")), Width);
    TargetMesh->SetMorphTarget(*(Prefix + TEXT("Angle")), Angle);
    TargetMesh->SetMorphTarget(*(Prefix + TEXT("Height")), Height);
}

void UBannonCharacterBuilder::RecalculatePoise(float TorsoVolume, float NeckVolume, ABannonCharacter* TargetCharacter) {
    if (!TargetCharacter) return;
    float DynamicPoise = bannon::PhysicsLaws::RecalcPoiseFromMorph(TorsoVolume, NeckVolume);
    TargetCharacter->Poise.max = DynamicPoise;
    TargetCharacter->Poise.current = DynamicPoise;
}

void UBannonCharacterBuilder::ApplyTwoToneDye(USkeletalMeshComponent* HairMesh, const FString& BaseHex, const FString& TipHex, float BlendPos, float BlendSharpness) {
    if (!HairMesh) return;
    for (int32 i = 0; i < HairMesh->GetNumMaterials(); ++i) {
        UMaterialInstanceDynamic* DMI = HairMesh->CreateAndSetMaterialInstanceDynamic(i);
        if (DMI) {
            DMI->SetVectorParameterValue(TEXT("BaseColor"), FLinearColor(FColor::FromHex(BaseHex)));
            DMI->SetVectorParameterValue(TEXT("TipColor"), FLinearColor(FColor::FromHex(TipHex)));
            DMI->SetScalarParameterValue(TEXT("BlendPosition"), BlendPos);
            DMI->SetScalarParameterValue(TEXT("BlendSharpness"), BlendSharpness);
        }
    }
}
