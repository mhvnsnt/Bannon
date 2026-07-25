// AI ORIENTATION BLOCK v114
#include "BannonMeshCompositor.h"
#include "Components/SkeletalMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"

UBannonMeshCompositor::UBannonMeshCompositor() {
    PrimaryComponentTick.bCanEverTick = false;
    ActiveAttireLayers.SetNum(60); 
}

void UBannonMeshCompositor::ApplyAttireLayer(int32 ZIndex, USkeletalMeshComponent* AttireMesh, const FString& MaterialType, const TArray<FString>& HexColors) {
    if (ZIndex < 0 || ZIndex >= 60 || !AttireMesh) return;
    
    ActiveAttireLayers[ZIndex] = AttireMesh;
    
    for (int32 i = 0; i < AttireMesh->GetNumMaterials(); ++i) {
        UMaterialInstanceDynamic* DMI = AttireMesh->CreateAndSetMaterialInstanceDynamic(i);
        if (DMI && HexColors.Num() > 0) {
            FColor BaseColor = FColor::FromHex(HexColors[0]);
            DMI->SetVectorParameterValue(TEXT("BaseColor"), FLinearColor(BaseColor));
            
            if (MaterialType == TEXT("Gloss")) {
                DMI->SetScalarParameterValue(TEXT("Roughness"), 0.1f);
                DMI->SetScalarParameterValue(TEXT("Metallic"), 0.0f);
            } else if (MaterialType == TEXT("Leather")) {
                DMI->SetScalarParameterValue(TEXT("Roughness"), 0.7f);
                DMI->SetScalarParameterValue(TEXT("Metallic"), 0.0f);
            } else if (MaterialType == TEXT("Metallic")) {
                DMI->SetScalarParameterValue(TEXT("Roughness"), 0.2f);
                DMI->SetScalarParameterValue(TEXT("Metallic"), 1.0f);
            }
        }
    }
}

void UBannonMeshCompositor::ApplyBodyArtLayer(int32 ZIndex, const FVector2D& Translation, const FVector2D& Scale, float Rotation, float Opacity, UTexture2D* DecalTexture) {
    if (ZIndex < 0 || ZIndex >= 40 || !DecalTexture) return;
}

void UBannonMeshCompositor::EnforceJoltAntiClipping(USkeletalMeshComponent* OuterLayer, USkeletalMeshComponent* InnerLayer) {
    if (!OuterLayer || !InnerLayer) return;
    OuterLayer->SetCollisionResponseToChannel(ECC_PhysicsBody, ECR_Block);
    InnerLayer->SetCollisionResponseToChannel(ECC_PhysicsBody, ECR_Block);
}
